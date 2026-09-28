'use client';

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap, { ScrollTrigger } from "@/lib/gsap";
import { PortraitMorph } from "@/components/shared/PortraitMorph";
import { watchVisibility } from "@/lib/visibility";

// Reuses the same 5 leaf silhouettes SumiLeaves scatters through Hero (and
// Philosophy) — a quiet, continuous rain of leaves falling through the
// entire About section for as long as it's mounted, each one looping from
// just above the section to just below it and restarting, re-randomizing
// its scale/speed/opacity each pass so some read as falling close by
// (bigger, faster, more opaque) and others far behind (smaller, slower,
// fainter).
const LANDING_LEAVES = [
  { leaf: 2, left: '4%' },
  { leaf: 4, left: '14%' },
  { leaf: 1, left: '24%' },
  { leaf: 5, left: '34%' },
  { leaf: 3, left: '44%' },
  { leaf: 2, left: '54%' },
  { leaf: 4, left: '64%' },
  { leaf: 1, left: '74%' },
  { leaf: 5, left: '84%' },
  { leaf: 3, left: '94%' },
];

// Word-by-word reveal (opacity/y/blur/scale, tight stagger) — the same
// per-word treatment Hero's own quote reveals use, just triggered by
// scrolling into view once instead of a scroll-scrubbed pinned sequence,
// and kept flowing as normal inline running text (not the quote's stacked,
// centered block) so it reads like ordinary paragraph copy that happens to
// arrive one word at a time.
const AnimatedWords = ({ text, className }: { text: string; className?: string }) => {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((word, idx) => (
        <span
          key={idx}
          className="about-word inline-block will-change-transform mr-[0.3em] last:mr-0"
        >
          {word}
        </span>
      ))}
    </span>
  );
};

// The Origins statement mixes plain running text with two emphasized
// phrases — split by hand (rather than programmatically, which would lose
// which words carry the highlight styling) so every word, highlighted or
// not, is its own reveal unit and the two phrases animate in lockstep with
// the rest of the sentence instead of arriving as a single fixed block.
const ORIGINS_STATEMENT: { text: string; highlight?: boolean }[] = [
  { text: 'I' }, { text: 'build' }, { text: 'at' }, { text: 'the' }, { text: 'intersection' }, { text: 'of' },
  { text: 'creative', highlight: true }, { text: 'intuition', highlight: true }, { text: 'and' },
  { text: 'disciplined', highlight: true }, { text: 'engineering', highlight: true }, { text: '—' },
  { text: 'where' }, { text: 'understanding' }, { text: 'a' }, { text: 'system' }, { text: 'matters' },
  { text: 'as' }, { text: 'much' }, { text: 'as' }, { text: 'shaping' }, { text: 'an' }, { text: 'interface' },
  { text: 'people' }, { text: 'actually' }, { text: 'enjoy.' },
];

export const About = () => {
  const frameRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Header + Origins entrance: a word-by-word blur/lift dissolve (see
  // ".about-title-word", ".about-word" below) for the headline and the
  // Origins copy, a mask-slide for the kicker, plain fade-up for the
  // portrait, all staggered together as About's header actually scrolls
  // into view. Everything is pre-hidden immediately on mount so nothing
  // flashes at full opacity before the ScrollTrigger below fires.
  useGSAP(() => {
    if (!sectionRef.current) return;

    gsap.set('.about-kicker-inner', { yPercent: 110 });
    // Bigger lift/blur/scale than the body-copy words below — a headline at
    // display size reads best with a more dramatic condense-into-focus.
    gsap.set('.about-title-word', { y: 44, opacity: 0, filter: 'blur(22px)', scale: 0.9 });
    gsap.set('.about-fade-in', { y: 24, opacity: 0 });
    gsap.set('.about-portrait-reveal', { y: 24, opacity: 0, scale: 0.97 });
    // Per-word reveal for the Origins copy — regular-weight running text at
    // body size, not a giant outline headline, so blur here softens each
    // word's edges the way it's meant to instead of dissolving into a
    // smear (see the note above on why the title reveal avoids it). A
    // heavier blur/lift and a slower per-word duration+stagger than the
    // first pass — at 10px blur / 0.7s duration / 0.025 stagger, 60-odd
    // words all mostly finish before the eye can register any one of them
    // dissolving into focus, so it just reads as a single fast fade sweeping
    // across the paragraph instead of individual words condensing out of a
    // blur, the "ảo" (hazy, dreamlike) quality the reference has.
    gsap.set('.about-word', { y: 32, opacity: 0, filter: 'blur(16px)', scale: 0.92 });

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 75%',
      once: true,
      onEnter: () => {
        gsap.timeline({ defaults: { ease: 'power4.out' } })
          .to('.about-kicker-inner', { yPercent: 0, duration: 0.9, ease: 'power4.out' })
          .to('.about-title-word', {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            scale: 1,
            duration: 1.2,
            stagger: 0.1,
            ease: 'power2.out',
          }, '-=0.6')
          .to('.about-portrait-reveal', {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1.1,
            ease: 'power3.out',
          }, '-=0.7')
          .to('.about-fade-in', {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.12,
            ease: 'power3.out',
          }, '-=0.9')
          .to('.about-word', {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            scale: 1,
            duration: 1,
            stagger: 0.04,
            ease: 'power2.out',
          }, '-=0.7');
      },
    });
  }, { scope: sectionRef });

  // "Held photograph" cursor-tilt: a subtle 3D tilt that follows the pointer
  // while hovering the portrait frame, easing back to rest on mouse-leave.
  // Desktop only.
  useEffect(() => {
    const el = frameRef.current;
    if (!el || typeof window === 'undefined' || !window.matchMedia('(min-width: 1024px)').matches) return;

    let rect: DOMRect | null = null;
    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const loop = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      el.style.transform = `perspective(1000px) rotateY(${currentX}deg) rotateX(${currentY}deg)`;
      if (Math.abs(targetX - currentX) > 0.01 || Math.abs(targetY - currentY) > 0.01) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = 0;
      }
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(loop); };

    const onEnter = () => { rect = el.getBoundingClientRect(); };
    const onMove = (e: MouseEvent) => {
      if (!rect) rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = px * 10;
      targetY = -py * 10;
      schedule();
    };
    const onLeave = () => {
      rect = null;
      targetX = 0;
      targetY = 0;
      schedule();
    };

    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Landing leaves: a continuous rain, not a one-shot arrival — each leaf
  // falls from just above the zone to just below it, then immediately
  // restarts from the top with fresh randomized depth (scale/speed/
  // opacity), so the rain never stops as long as the zone is in view. Real
  // time, not scroll-scrubbed: a single ScrollTrigger just starts the loops
  // (staggered) the moment About's top actually enters the viewport.
  useEffect(() => {
    const section = document.getElementById('about');
    const zone = document.querySelector<HTMLElement>('.about-landing-zone');
    if (!section || !zone) return;

    const leaves = gsap.utils.toArray<HTMLElement>('.about-landing-leaf', section);
    // One live tween per leaf (the old array grew by one every loop, forever),
    // paused while About is offscreen.
    const fallTweens = new Map<HTMLElement, gsap.core.Tween>();
    let killed = false;
    let paused = false;

    // Hidden immediately on mount — otherwise each leaf sits at its
    // unstyled default (full opacity, resting at the section's top edge)
    // until the trigger fires below.
    gsap.set(leaves, { y: -80, opacity: 0 });

    const runCycle = (el: HTMLElement, startY?: number) => {
      if (killed) return;
      const zoneHeight = zone.clientHeight || 700;
      const spinDir = Math.random() < 0.5 ? -1 : 1;
      // depth < 1 reads as "further back" (smaller, fainter, slower);
      // depth > 1 reads as "closer" (bigger, more opaque, faster) — the
      // same leaf draws a different depth every time it loops.
      const depth = gsap.utils.random(0.55, 1.5, 0.05);
      const remaining = zoneHeight + 80 - (startY ?? -80);
      const duration = (remaining / (zoneHeight + 160)) * gsap.utils.random(14, 22) / depth;

      gsap.set(el, {
        y: startY ?? -80,
        x: gsap.utils.random(-20, 20),
        scale: depth,
        opacity: gsap.utils.random(0.25, 0.55) * depth,
        rotation: gsap.utils.random(0, 360),
      });

      const tween = gsap.to(el, {
        y: zoneHeight + 80,
        x: `+=${gsap.utils.random(-70, 70)}`,
        rotation: `+=${gsap.utils.random(180, 480) * spinDir}`,
        duration,
        ease: 'none',
        onComplete: () => runCycle(el),
      });
      if (paused) tween.pause();
      fallTweens.set(el, tween);
    };

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        const zoneHeight = zone.clientHeight || 700;
        leaves.forEach((el) => {
          // Scatter each leaf's very first drop at a random point already
          // mid-fall through the (now much taller) section, so the rain
          // reads as already filling the whole height instead of only
          // starting from the top and needing a while to spread out.
          runCycle(el, gsap.utils.random(-80, zoneHeight + 80));
        });
      },
    });

    const unwatch = watchVisibility(section, (visible) => {
      paused = !visible;
      fallTweens.forEach((tween) => (visible ? tween.resume() : tween.pause()));
    });

    return () => {
      killed = true;
      unwatch();
      trigger.kill();
      fallTweens.forEach((tw) => tw.kill());
    };
  }, []);

  return (
    <section id="about" ref={sectionRef} className="relative bg-background z-20 overflow-hidden">
      {/* Landing leaves — see the effect above. Absolutely positioned across
          the section's full height (not the page-wide max-w column below)
          so they read as raining through the section itself, not into any
          one piece of its content. */}
      <div className="about-landing-zone pointer-events-none absolute inset-0 z-0 select-none" aria-hidden="true">
        {LANDING_LEAVES.map((item, idx) => (
          <div
            key={idx}
            className="about-landing-leaf absolute top-0 h-10 w-10 md:h-12 md:w-12"
            style={{ left: item.left }}
          >
            <span
              className="block h-full w-full"
              style={{
                backgroundColor: '#161412',
                WebkitMask: `url(/images/leaf-${item.leaf}.png) center / contain no-repeat`,
                mask: `url(/images/leaf-${item.leaf}.png) center / contain no-repeat`,
              }}
            />
          </div>
        ))}
      </div>

      <div className="relative mx-auto max-w-[1400px] px-6 md:px-10 py-32 md:py-48">
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <span className="block overflow-hidden">
            <span className="about-kicker-inner block font-mono text-[10px] tracking-[0.3em] text-foreground/50 uppercase font-bold sm:text-xs sm:tracking-[0.5em]">
              [ Chapter I : The Ronin Architect ]
            </span>
          </span>
          <div className="h-px flex-1 bg-foreground/10" />
        </div>

        {/* Same word-by-word blur/lift dissolve as the Origins copy below —
            each word its own reveal unit rather than one clip-path wipe
            across the whole two-line block, which is what actually gives it
            the hazy, condensing-out-of-focus "ảo" quality (a clip-path wipe
            paired with `filter: blur()` on one giant element is also what
            produced the earlier blurred-patch glitch — per-word, un-clipped
            blur doesn't have that problem). */}
        <h2 className="font-serif font-light text-foreground uppercase tracking-tight leading-[0.9] text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl">
          <span className="block">
            {['TRAN', 'HOANG'].map((word, idx) => (
              <span key={idx} className="about-title-word inline-block will-change-transform mr-[0.15em] last:mr-0">
                {word}
              </span>
            ))}
          </span>
          <span className="block text-transparent" style={{ WebkitTextStroke: "1.5px var(--foreground)" }}>
            {['ANH', 'TU.'].map((word, idx) => (
              <span key={idx} className="about-title-word inline-block will-change-transform mr-[0.15em] last:mr-0">
                {word}
              </span>
            ))}
          </span>
        </h2>
        <p className="about-fade-in font-caveat text-2xl md:text-3xl lg:text-4xl text-foreground/60 lowercase mt-4">
          the ronin architect — the way of the sword &amp; code
        </p>

        {/* Portrait + Origins — text column widened from 7/12 to 8/12 (and
            the portrait's own max-width trimmed slightly) now that the
            Origins statement reads at display size instead of body-copy
            size; at the old 7/12 it was wrapping onto an extra, cramped
            line. */}
        <div className="mt-24 md:mt-32 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-start">
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start" style={{ perspective: '1000px' }}>
            <div
              ref={frameRef}
              className="about-portrait-reveal relative w-full max-w-[380px] md:max-w-[420px] aspect-[4/5] will-change-transform"
            >
              <div
                className="relative w-full h-full overflow-hidden"
                style={{
                  maskImage:
                    'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
                  WebkitMaskImage:
                    'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
                  maskComposite: 'intersect',
                  WebkitMaskComposite: 'source-in',
                }}
              >
                <PortraitMorph
                  srcA="/avatar.jpg"
                  srcB="/avatar.jpg"
                  alt="trhgatu Portrait"
                  className="w-full h-full object-cover object-top grayscale contrast-125"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-8 text-foreground/90">
            <span className="about-fade-in font-mono text-xs tracking-[0.5em] text-foreground/50 uppercase font-bold block mb-2">
              [ Origins ]
            </span>
            <p className="text-3xl md:text-4xl lg:text-5xl font-light leading-[1.15] tracking-tight">
              {ORIGINS_STATEMENT.map((w, idx) => (
                <span
                  key={idx}
                  className={`about-word inline-block will-change-transform mr-[0.22em] last:mr-0${
                    w.highlight ? ' text-foreground font-semibold underline decoration-foreground/30 underline-offset-4' : ''
                  }`}
                >
                  {w.text}
                </span>
              ))}
            </p>
            <p className="text-base md:text-lg text-foreground/50 leading-relaxed font-light max-w-2xl">
              <AnimatedWords text="This is the quiet craft I practice. Look around — and if it resonates, let's build the next system together." />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
