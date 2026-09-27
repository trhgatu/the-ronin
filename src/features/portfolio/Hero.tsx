'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from '@/lib/gsap';
import Image from 'next/image';
import { SumiLeaves } from '@/components/shared/SumiLeaves';
import { HeroFluidReveal } from '@/components/shared/HeroFluidReveal';
import { CURSOR_MASK_SIZE, CURSOR_MASK_URLS, useTornCursorMask } from '@/hooks/useTornCursorMask';

export const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const [mounted, setMounted] = useState(false);
  const [entranceReady, setEntranceReady] = useState(false);
  // Swap mode: off (default) hides the 3D model behind a veil; on shows it
  // plainly all the time. Either way, the cursor mask below (text -> black,
  // emblem -> invert(1)) stays active — swapping only toggles the veil.
  const [swapMode, setSwapMode] = useState(false);

  // Tells HeroScene's water ripple post-effect (mounted once at the layout
  // root, outside this component's tree) whether it's live — see
  // WaterRippleController in HeroScene.tsx. Navbar also listens to this one
  // to keep its own Eye/EyeOff icon in sync with a mode that actually lives
  // here, not there.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('hero-swap-mode', { detail: swapMode }));
  }, [swapMode]);

  // An earlier attempt at this — overriding the global --background CSS
  // variable on document.documentElement while swap mode is on — actually
  // recolored every OTHER section's bg-background too (they all read the
  // same global variable, and GlobalCanvas is a fixed, page-wide layer, so
  // the override wasn't scoped to Hero at all: scrolling into About while
  // swap mode was on tinted About parchment as well, which read as "the 3D
  // model is leaking into the next section" even though nothing was
  // actually transparent there). The right place to control the tone
  // behind the 3D tree is the WebGL scene's own background color — see
  // SceneBackgroundController in HeroScene.tsx, which listens for this same
  // 'hero-swap-mode' event and sets `scene.background` directly, leaving
  // every DOM element's --background alone.

  const toggleSwapMode = (cx: number, cy: number) => {
    const onCovered = () => {
      setSwapMode((v) => !v);
      // React swaps the mode's colors the instant setSwapMode runs, while
      // the ink still fully covers the screen — so without this, the
      // headline and photo would just silently snap to the new look
      // underneath the ink, with only the background actually animating.
      // Re-playing the same wipe/blur reveal used on first load (see the
      // entrance useGSAP above), timed to land alongside the ink's own
      // 150ms-pause-then-0.8s dissolve below, is what makes the text feel
      // like it's transitioning too instead of just getting swapped out.
      gsap.timeline()
        .set('.hero-kicker-inner', { yPercent: 110 })
        .set('.hero-title-inner', { y: 44, opacity: 0, filter: 'blur(22px)', scale: 0.9 })
        .set('.hero-art-reveal', { opacity: 0, scale: 0.97 })
        .to('.hero-art-reveal', { opacity: 1, scale: 1, duration: 0.9, ease: 'power3.out' }, 0.05)
        .to('.hero-kicker-inner', { yPercent: 0, duration: 0.6, ease: 'power3.out' }, 0.15)
        .to('.hero-title-inner', {
          y: 0,
          opacity: 1,
          filter: 'blur(0px)',
          scale: 1,
          duration: 0.9,
          stagger: 0.15,
          ease: 'power2.out',
        }, 0.2);
    };

    // Reuse the site's OGL ink-wash transition (previously the dark/light
    // theme swap's animation) — the same wipe now swaps this Hero-local mode
    // instead of a global theme.
    window.dispatchEvent(new CustomEvent('trigger-ink-transition', {
      detail: { cx, cy, preset: 'sweep', onCovered },
    }));
  };

  // The toggle button itself now lives in Navbar (grouped with its other
  // controls instead of floating alone over Hero) — a plain window event
  // carries the click over, along with the button's own screen position so
  // the ink wipe still originates from wherever it actually is.
  useEffect(() => {
    const onRequestToggle = (e: Event) => {
      const { cx, cy } = (e as CustomEvent<{ cx: number; cy: number }>).detail;
      toggleSwapMode(cx, cy);
    };
    window.addEventListener('request-hero-swap-toggle', onRequestToggle);
    return () => window.removeEventListener('request-hero-swap-toggle', onRequestToggle);
     
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    if (typeof window === 'undefined') return;

    // The entrance timeline below must not play while the Preloader overlay is
    // covering the screen, or the whole reveal happens invisibly behind it.
    if (sessionStorage.getItem('preloader-seen') === 'true') {
      setEntranceReady(true);
      return;
    }

    const onPreloaderComplete = () => setEntranceReady(true);
    window.addEventListener('preloader-complete', onPreloaderComplete);
    return () => window.removeEventListener('preloader-complete', onPreloaderComplete);
  }, []);

  // Pre-hide the reveal targets as soon as we mount (regardless of entranceReady) so
  // content stays hidden behind the Preloader instead of flashing fully visible before
  // the entrance timeline below snaps it back to its "from" state.
  useGSAP(() => {
    if (!mounted || !containerRef.current) return;
    gsap.set('.hero-reveal-top', { y: -30, opacity: 0 });
    gsap.set('.hero-kicker-inner', { yPercent: 110 });
    // A vertical mask-slide (the kicker's own reveal) scales its travel
    // distance with the element's pixel height — fine for an 11px kicker,
    // but this line is now a clamp(3.2rem,9.5vw,8.5rem) title, and the same
    // technique on it either barely moves (relative to its own huge height,
    // 110% is enormous) or reads as a slow, heavy slide. A heavy blur+lift
    // condensing into focus (each line — already one word each, "SAMURAI" /
    // "DISCIPLINE." — its own reveal unit) reads as a word materializing out
    // of a haze rather than a wipe uncovering it.
    gsap.set('.hero-title-inner', { y: 44, opacity: 0, filter: 'blur(22px)', scale: 0.9 });
    gsap.set('.hero-art-reveal', { y: 30, opacity: 0, scale: 0.96 });
  }, { dependencies: [mounted], scope: containerRef });

  useGSAP(() => {
    if (!entranceReady || !containerRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    tl.fromTo('.hero-reveal-top', {
        y: -30,
        opacity: 0,
      }, {
        y: 0,
        opacity: 1,
        duration: 1.4,
        stagger: 0.15,
        delay: 0.1,
      })
      .fromTo('.hero-art-reveal', {
        y: 30,
        opacity: 0,
        scale: 0.96,
      }, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 1.6,
        ease: 'power3.out',
      }, '-=1.1')
      .fromTo('.hero-kicker-inner', {
        yPercent: 110,
      }, {
        yPercent: 0,
        duration: 0.9,
        ease: 'power4.out',
      }, '-=1.0')
      .fromTo('.hero-title-inner', {
        y: 44,
        opacity: 0,
        filter: 'blur(22px)',
        scale: 0.9,
      }, {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        scale: 1,
        duration: 1.2,
        stagger: 0.18,
        ease: 'power2.out',
      }, '-=0.3');

    // Parallax fade for typography on scroll
    gsap.to('.hero-fade-out', {
      opacity: 0,
      y: -50,
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      }
    });

  }, { dependencies: [entranceReady], scope: containerRef });

  // A very slow, quiet breathing scale on the emblem once it has landed —
  // just enough life that the hero doesn't sit perfectly static.
  useGSAP(() => {
    if (!entranceReady || !artRef.current) return;
    const tween = gsap.to(artRef.current, {
      scale: 1.015,
      duration: 5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: 1.6,
    });
    return () => { tween.kill(); };
  }, { dependencies: [entranceReady], scope: containerRef });

  // A real CSS mask over an inverted duplicate of the same content (black
  // text, invert(1) emblem) stacked exactly on top of the normal
  // white/untouched base layer. Only the torn hole (CURSOR_MASK_URLS above)
  // around the cursor shows the duplicate through — which is what reads as
  // the white text "turning black" and the emblem inverting right under the
  // pointer, on both text and image at once. mask-size/-repeat are set once
  // (see the style prop below); this effect touches mask-position every
  // frame and, as the cursor covers enough distance, swaps mask-image to the
  // next torn variant — two plain CSS property writes, no flicker.
  //
  // Not mix-blend-mode: a mix-blend-mode:difference cursor was tried first,
  // reusing the site's existing CustomCursor follower (a plain <div>, so it
  // isn't subject to the earlier finding that a <canvas> backdrop doesn't
  // blend correctly) — but it still couldn't reach the hero's text, because
  // that text sits inside its own `z-10` wrapper, which is its own stacking
  // context; a fixed, root-level cursor element can only blend against
  // content in ITS OWN stacking context, not down into a nested one. Alpha
  // masking has no such restriction (it only ever affects the masked
  // element's own painted output), so it's the reliable option here.
  useTornCursorMask(containerRef, maskRef, entranceReady && !swapMode);

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative w-full min-h-screen flex items-center overflow-hidden select-none py-28 lg:py-0"
      style={
        swapMode
          // Pulled toward the same warm, muted "film stock" as the default
          // mode's near-black — bright white + candy pink read as a
          // completely different site once toggled; a dustier parchment
          // background and a faded, ink-wash rose (instead of a saturated
          // coral) keep both modes in one shared color family.
          ? ({ "--background": "#d9d2c2", "--foreground": "#171310" } as React.CSSProperties)
          : ({ "--background": "#050505", "--foreground": "#ffffff" } as React.CSSProperties)
      }
    >
      {mounted && !swapMode && <HeroFluidReveal containerRef={containerRef} className="pointer-events-none absolute inset-0 z-0 h-full w-full" />}
      {/* Swap mode drops the opaque veil entirely, so the 3D tree sits
          right behind the headline at full detail/contrast — busy enough
          against the light HDRI backdrop that the (now-black, see the
          section style above) text lost its footing. A plain backdrop blur
          softens the tree into a bokeh-like backdrop without hiding it,
          the same trick a shallow depth-of-field photo uses to keep text
          legible over a background subject. Sits above the model (z-0) and
          below the leaves/copy (z-10) so only the model blurs. */}
      {swapMode && <div className="pointer-events-none absolute inset-0 z-3 backdrop-blur-[1.5px]" aria-hidden="true" />}

      {/* In swap mode the 3D tree is fully visible, so its leaves match it
          fully pink. In the default veiled mode the leaves stay ink-toned by
          default — but SumiLeaves' own default (#161412) assumes a light
          backdrop (it's tuned for Philosophy's light section); against
          Hero's near-black veil (#050505) that's nearly zero contrast and
          the leaves effectively vanish until revealed, so Hero passes an
          explicit pale parchment tone instead. revealColor still flashes the
          model's true pink wherever the cursor's torn hole passes near one,
          consistent with how it reveals the text/emblem. */}
      <SumiLeaves
        containerRef={containerRef}
        count={12}
        color={swapMode ? '#b5645c' : '#d9d4c7'}
        revealColor={swapMode ? undefined : '#b5645c'}
      />

      <div className="mx-auto max-w-[1100px] px-6 md:px-10 w-full relative z-10">
        {/* BASE layer — always fully visible: white text, untouched emblem. */}
        <div className="flex flex-col items-center text-center relative w-full hero-fade-out">

          {/* Stacked (name, then role) instead of both crammed onto one
              wrapped row — at the old 9-10px, side by side, this read as a
              barely-legible byline. Bigger and given its own two-line
              rhythm, it now carries actual hierarchy: a clear name line,
              a dimmer role line under it. */}
          <div className="hero-reveal-top mb-10 flex flex-col items-center gap-2.5">
            <span className="font-mono text-[13px] font-bold uppercase tracking-[0.4em] text-foreground/80 md:text-sm">
              Tran Hoang Anh Tu
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-foreground/40 md:text-xs">
              Software Architect × Creative Developer
            </span>
          </div>

          {/* Centered cinematic still, vignetted on all four corners (not a
              full-bleed banner — pulled back in and shrunk so it reads as a
              floating photograph rather than a wallpaper strip). The alpha
              mask fades on the photo itself (not a solid-color scrim painted
              over it) so it blends correctly against whatever is actually
              behind it — the default mode's flat veil, but also swap mode's
              live, non-flat blurred 3D tree, which a hardcoded
              var(--background) scrim just sat on top of as a visible box. */}
          <div className="hero-art-reveal mb-4 w-full max-w-[860px] sm:mb-6">
            <div
              ref={artRef}
              className="relative w-full aspect-[1426/307] overflow-hidden will-change-transform"
              style={{
                // A single radial-gradient mask scales its ellipse from the
                // box's own width/height percentages — on a letterbox-wide
                // box like this one, that stretches the ellipse so far
                // horizontally that the left/right edges never actually
                // fade. Two independent linear fades (one per axis),
                // intersected, vignette all four edges regardless of aspect
                // ratio.
                maskImage:
                  'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                WebkitMaskImage:
                  'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                maskComposite: 'intersect',
                WebkitMaskComposite: 'source-in',
              }}
            >
              <Image
                src="/images/musashi_x_trhgatu.png"
                alt="Musashi × Tu — Niten Ichi-ryu crest"
                fill
                sizes="(max-width: 640px) 90vw, 860px"
                className="object-cover"
                priority
                loading="eager"
              />
            </div>
          </div>

          {/* Pushed up much closer to the image than the old even rhythm —
              a cinematic title card's text sits right off the still, not a
              separate block below it. Size contrast between the two lines
              (a small wide-tracked kicker vs. a large dominant title) reads
              as a clearer hierarchy than two same-size lines that only
              differed by italic. */}
          <h1 ref={headlineRef} className="max-w-6xl text-foreground">
            <span className="block w-fit mx-auto overflow-hidden">
              <span className="hero-kicker-inner block font-mono text-sm font-semibold uppercase tracking-[0.5em] text-foreground/55 sm:text-base">
                ARCHITECTED WITH
              </span>
            </span>
            {/* Two separate elements (not one string left to line-wrap) so
                the blur/lift reveal below can stagger between them — one
                giant two-line block condensing into focus as a single unit
                read as abrupt given its size; a beat between line one and
                line two makes the reveal feel paced/deliberate instead of
                instant. */}
            <span className="mt-2 block w-fit mx-auto pb-2 sm:mt-3">
              <span className="hero-title-inner block font-serif text-[clamp(3.2rem,9.5vw,8.5rem)] font-light italic leading-[0.92] tracking-[-0.02em]">
                SAMURAI
              </span>
              <span className="hero-title-inner block font-serif text-[clamp(3.2rem,9.5vw,8.5rem)] font-light italic leading-[0.92] tracking-[-0.02em]">
                DISCIPLINE.
              </span>
            </span>
          </h1>
        </div>
      </div>

      {/* MASK OVERLAY — an inverted duplicate (black text, invert(1) emblem)
          revealed only inside a soft circle that follows the cursor via a
          real CSS mask. Sized to the FULL hero (not just the ~1100px text
          column above) so the cursor stays reactive across the whole width —
          this used to be scoped to that narrow column, which was masked by
          the veil's own full-width reveal in the default mode, but became an
          obviously "dead" zone once swap mode removes the veil and the 3D
          tree spans edge to edge. Its own inner content re-applies the same
          max-w-[1100px] centering so it still lines up with the base layer
          above. Default mode only — swap mode drops the veil/reveal
          metaphor entirely in favor of the "magnetic" word-pull effect on
          the base h1 above, so this stays unmounted (not just hidden) while
          swapMode is on, which also means it can't get stuck showing a
          stale hole from before the toggle. Deliberately does NOT reuse the
          hero-reveal-top / hero-title-inner / hero-art-reveal marker classes
          the entrance timeline targets — sharing them made the GSAP selector
          match twice as many elements and the title's slide-in got stuck
          mid-animation. A plain opacity fade tied to entranceReady is enough
          since this layer is only ever glimpsed through the small
          cursor-sized hole anyway. */}
      {!swapMode && (
        <div
          ref={maskRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
          style={{
            opacity: entranceReady ? 1 : 0,
            transition: 'opacity 1s ease 1.6s',
            maskImage: CURSOR_MASK_URLS[0],
            WebkitMaskImage: CURSOR_MASK_URLS[0],
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskSize: `${CURSOR_MASK_SIZE}px ${CURSOR_MASK_SIZE}px`,
            WebkitMaskSize: `${CURSOR_MASK_SIZE}px ${CURSOR_MASK_SIZE}px`,
          } as React.CSSProperties}
        >
          <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center px-6 text-center md:px-10">
            <div className="mb-10 flex flex-col items-center gap-2.5">
              <span className="font-mono text-[13px] font-bold uppercase tracking-[0.4em] text-black md:text-sm">
                Tran Hoang Anh Tu
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-black/70 md:text-xs">
                Software Architect × Creative Developer
              </span>
            </div>
            <div className="mb-4 w-full max-w-[860px] sm:mb-6">
              <div
                className="relative w-full aspect-[1426/307] overflow-hidden"
                style={{
                  filter: 'invert(1)',
                  maskImage:
                    'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                  WebkitMaskImage:
                    'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                  maskComposite: 'intersect',
                  WebkitMaskComposite: 'source-in',
                }}
              >
                <Image
                  src="/images/musashi_x_trhgatu.png"
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="(max-width: 640px) 90vw, 860px"
                  className="object-cover"
                />
              </div>
            </div>

            <h1 className="max-w-6xl text-black">
              <span className="block w-fit mx-auto font-mono text-sm font-semibold uppercase tracking-[0.5em] text-black/55 sm:text-base">
                ARCHITECTED WITH
              </span>
              <span className="mt-2 block w-fit mx-auto pb-2 font-serif text-[clamp(3.2rem,9.5vw,8.5rem)] font-light italic leading-[0.92] tracking-[-0.02em] text-black/70 sm:mt-3">
                SAMURAI DISCIPLINE.
              </span>
            </h1>
          </div>
        </div>
      )}
    </section>
  );
};
