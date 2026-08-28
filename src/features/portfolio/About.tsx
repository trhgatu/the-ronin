'use client';

import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap, { ScrollTrigger } from "@/lib/gsap";
import { PortraitMorph } from "@/components/shared/PortraitMorph";
import { useTheme } from "next-themes";
import { soundManager } from "@/lib/sound";

const fiveRings: { book: string; kanji: string; discipline: string; description: string }[] = [
  {
    book: "EARTH [地]",
    kanji: "地",
    discipline: "Structural Foundation",
    description: "Bulletproof system design, database resilience, and deep core backbones that stand like solid rock.",
  },
  {
    book: "WATER [水]",
    kanji: "水",
    discipline: "Fluid Interaction",
    description: "Adaptive motion dynamics, seamless responsiveness, and user experiences that flow like pristine liquid.",
  },
  {
    book: "FIRE [火]",
    kanji: "火",
    discipline: "Performance & Combat",
    description: "High-concurrency engineering, extreme low-latency tuning, and aggressive runtime optimizations under heavy stress.",
  },
  {
    book: "WIND [風]",
    kanji: "風",
    discipline: "Mastery of Style",
    description: "Uncompromising clean code, global standards, and modular code structures refined through years of strategy.",
  },
  {
    book: "THE VOID [空]",
    kanji: "空",
    discipline: "Creative Emptiness",
    description: "The ultimate peak. Removing all useless complexity, writing only what is of use, achieving absolute digital Zen.",
  }
];

// These are movements WITHIN Chapter I (About) — not chapters themselves.
// "Chapter" is a section-level label site-wide (Hero = Chapter 0, About =
// Chapter I, Artifacts = Chapter II, ...); reusing it in here would collide
// with that numbering (e.g. a second "Chapter II" that isn't Artifacts).
const acts = ["The Architect", "Origins", "Five Rings", "Philosophy"];

// Per-act waypoints for the portrait frame (x/y/scale only — `rotate` stays
// owned by the ring-personality logic so the two never fight over the same
// transform property). Continuously interpolated so the frame morphs across
// the whole runway instead of snapping at act boundaries.
const frameWaypoints: { x: number; y: number; scale: number }[] = [
  { x: 0, y: -10, scale: 1.0 },   // The Architect — centered hero pose
  { x: 14, y: 14, scale: 0.9 },   // Origins — recedes as bio text takes focus
  { x: -10, y: -18, scale: 0.82 }, // Five Rings — steps back for the emakimono
  { x: 0, y: -26, scale: 1.06 },  // Philosophy — grows again for the close
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const About = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const kanjiRef = useRef<HTMLDivElement>(null);
  const kanjiGlowRef = useRef<HTMLDivElement>(null);
  const actRailFillRef = useRef<HTMLDivElement>(null);
  const actRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [activeAct, setActiveAct] = React.useState(0);
  // Ambient backdrop kanji — driven by how far the user has scrolled through
  // the WHOLE pinned stage (title -> bio -> emakimono -> philosophy), cycling
  // through the Five Rings' characters as a mood/progress cue. "道" (the Way)
  // is the resting/idle character before the stage engages.
  const [scrollKanji, setScrollKanji] = React.useState("道");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  // Section-level fade in/out at its own top/bottom edges.
  useGSAP(() => {
    if (!mounted || !contentRef.current) return;
    gsap.fromTo(contentRef.current,
      { opacity: 0 },
      {
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top bottom',
          end: 'top 60%',
          scrub: true,
        },
      }
    );
    gsap.fromTo(contentRef.current,
      { opacity: 1 },
      {
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'bottom 40%',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  }, { dependencies: [mounted], scope: containerRef });

  // The stage: a tall scroll "runway" (desktop only) whose progress picks the
  // active act (0-3) and cycles the ambient backdrop kanji. Uses native CSS
  // `position: sticky` for the stage itself rather than GSAP's pin — every
  // earlier pin attempt in this section hit real bugs (a site-wide reveal
  // animation in `page.tsx` leaves a resting `transform`/`filter` on every
  // <section>, which per spec becomes the containing block for `position:
  // fixed` descendants and silently breaks GSAP's fixed-position pin; plus
  // scroll-anchoring conflicts and stale start/end measurement). `sticky`
  // sidesteps all of that — no JS measurement, no containing-block edge cases.
  useGSAP(() => {
    if (!mounted || !wrapperRef.current) return;

    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', () => {
      const trigger = ScrollTrigger.create({
        trigger: wrapperRef.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const rawAct = self.progress * acts.length; // 0..4, continuous
          const actIdx = Math.min(acts.length - 1, Math.floor(rawAct));
          setActiveAct(actIdx);
          const kanjiIdx = Math.min(fiveRings.length - 1, Math.floor(self.progress * fiveRings.length));
          setScrollKanji(fiveRings[kanjiIdx].kanji);

          // Portrait frame: x/y/scale morph smoothly across the 4 acts via
          // the waypoint table (plain scroll-linked parallax, same axis as
          // everything else on this page). `rotate` is left alone here — it's
          // exclusively owned by the ring-change effect below.
          const floorAct = Math.min(acts.length - 1, Math.floor(rawAct));
          const ceilAct = Math.min(acts.length - 1, floorAct + 1);
          const actFrac = rawAct - floorAct;
          const wpA = frameWaypoints[floorAct];
          const wpB = frameWaypoints[ceilAct];
          if (frameRef.current) {
            gsap.set(frameRef.current, {
              x: lerp(wpA.x, wpB.x, actFrac),
              y: lerp(wpA.y, wpB.y, actFrac),
              scale: lerp(wpA.scale, wpB.scale, actFrac),
            });
          }

          // Two-plane parallax: the blurred back layer drifts further than the
          // crisp front layer, so the backdrop reads as having real depth
          // instead of one flat watermark.
          if (kanjiGlowRef.current) gsap.set(kanjiGlowRef.current, { x: -48 * self.progress, y: 24 * self.progress });
          if (kanjiRef.current) gsap.set(kanjiRef.current, { x: -16 * self.progress, y: 8 * self.progress });
          if (actRailFillRef.current) gsap.set(actRailFillRef.current, { scaleX: self.progress });
        },
        onLeaveBack: () => {
          setActiveAct(0);
          setScrollKanji("道");
          if (frameRef.current) {
            const wp = frameWaypoints[0];
            gsap.set(frameRef.current, { x: wp.x, y: wp.y, scale: wp.scale, rotate: -3 });
          }
          if (kanjiGlowRef.current) gsap.set(kanjiGlowRef.current, { x: 0, y: 0 });
          if (kanjiRef.current) gsap.set(kanjiRef.current, { x: 0, y: 0 });
          if (actRailFillRef.current) gsap.set(actRailFillRef.current, { scaleX: 0 });
        },
      });

      return () => trigger.kill();
    });

    return () => mm.revert();
  }, { dependencies: [mounted], scope: containerRef });

  // Crossfade the act panels whenever the scroll-driven active act changes.
  // Desktop only — on mobile the acts render stacked in normal flow (no
  // `lg:absolute`/`lg:opacity-0`), so they must never get an inline opacity
  // here or they'd be hidden regardless of breakpoint (`activeAct` never
  // advances past 0 on mobile since the driving ScrollTrigger is `lg:`-gated).
  useGSAP(() => {
    if (typeof window === 'undefined' || !window.matchMedia('(min-width: 1024px)').matches) return;
    actRefs.current.forEach((el, idx) => {
      if (!el) return;
      if (idx === activeAct) {
        el.style.pointerEvents = 'auto';
        gsap.to(el, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
      } else {
        // Inactive acts are only invisible (opacity: 0), not removed from
        // layout — without `pointer-events: none` they still stack on top of
        // (or intercept clicks meant for) the active act underneath, e.g. the
        // Philosophy panel silently swallowing clicks on the Five Rings tabs.
        el.style.pointerEvents = 'none';
        gsap.to(el, { opacity: 0, y: idx < activeAct ? -16 : 16, duration: 0.4, ease: 'power3.out' });
      }
    });
  }, { dependencies: [activeAct], scope: containerRef });

  // "Held photograph" cursor-tilt: a subtle 3D tilt that follows the pointer
  // while hovering the avatar frame, easing back to rest on mouse-leave.
  // Desktop only. Composes cleanly with the click-driven `rotate` (rotationZ)
  // and scroll-driven `y` elsewhere — GSAP tracks rotationX/rotationY/rotationZ
  // /x/y/scale as independent transform components, so none of these tweens
  // overwrite each other.
  useGSAP(() => {
    const el = frameRef.current;
    if (!mounted || !el || typeof window === 'undefined' || !window.matchMedia('(min-width: 1024px)').matches) return;

    // Cache the rect once on enter rather than re-reading it on every
    // mousemove: re-measuring mid-tween mixes a moving target (the frame is
    // itself being rotated/translated by this and other tweens) into the
    // input, which reads as erratic jitter instead of a smooth follow.
    let rect: DOMRect | null = null;
    const onEnter = () => {
      rect = el.getBoundingClientRect();
    };
    const onMove = (e: MouseEvent) => {
      if (!rect) rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(el, { rotationY: px * 14, rotationX: -py * 14, duration: 0.6, ease: 'power2.out' });
    };
    const onLeave = () => {
      rect = null;
      gsap.to(el, { rotationY: 0, rotationX: 0, duration: 0.7, ease: 'power3.out' });
    };

    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, { dependencies: [mounted], scope: containerRef });

  return (
    // The emakimono panel's height changes slightly between rings (different
    // description lengths). Chromium's CSS scroll anchoring then "helpfully"
    // shifts the page scroll to compensate — which fights sticky/scroll-linked
    // layout and reads as the page jumping on every click. `overflow-anchor:
    // none` avoids that.
    <section
      ref={containerRef}
      id="about"
      className="relative py-32 md:py-48 bg-background select-none z-20"
      style={{ overflowAnchor: 'none' }}
    >
      {/* Majestic Double-Layered Jagged Torn Paper & Ink Brushstroke Section Transition */}
      {/* Thick Jagged Hand-Torn Paper Sheet (Blends into Section 2 and masks the bottom of Hero) */}
      <div
        className="absolute top-[-30px] left-0 w-full h-[60px] bg-background z-20 pointer-events-none"
        style={{ filter: "url(#about-torn-filter)" }}
      />

      {/* Rough Ink Brushstroke running exactly along the jagged paper tear */}
      <div
        className="absolute top-[-2px] left-0 w-full h-[3px] bg-foreground/20 z-30 pointer-events-none"
        style={{ filter: "url(#about-torn-filter)" }}
      />

      {/* SVG filter definition for torn paper edge inside About - self-contained and bulletproof */}
      <svg className="absolute w-0 h-0 invisible" aria-hidden="true">
        <defs>
          {/* Main frame filter for thick torn papers */}
          <filter id="about-torn-filter" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="22" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          {/* Line filter for thin ink-brushed horizontal lines */}
          <filter id="line-torn-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          {/* Hanko seal filter for slight ink bleed/distress */}
          <filter id="hanko-torn-filter" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.16" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Giant Zen Calligraphy Kanji: a scroll-progress "mood clock" — cycles
          through the Five Rings' characters as the user scrolls through the
          whole staged sequence, independent of which ring panel is open.
          Two planes (a large blurred glow behind a crisper mark in front),
          drifting at different rates on scroll, read as real depth rather
          than one flat watermark. */}
      <div
        ref={kanjiGlowRef}
        className="absolute right-[-2%] bottom-[-2%] font-serif font-black text-[440px] sm:text-[620px] select-none pointer-events-none text-foreground leading-none z-0"
        style={{ opacity: 0.03, filter: "blur(24px)" }}
      >
        {scrollKanji}
      </div>
      <div
        ref={kanjiRef}
        className="absolute right-[3%] bottom-[3%] font-serif font-black text-[320px] sm:text-[480px] select-none pointer-events-none text-foreground leading-none z-0"
        style={{ opacity: 0.06, filter: "url(#about-torn-filter)" }}
      >
        {scrollKanji}
      </div>

      <div ref={contentRef} className="relative z-10">
        {/* Tall scroll runway (desktop only) — 4 acts x 100vh. On mobile this
            collapses to auto height and every act just renders stacked in
            normal flow below (no sticky, no crossfade, no scroll-jacking). */}
        <div ref={wrapperRef} className="lg:h-[400vh]">
          <div className="lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden flex items-center">
            <div className="mx-auto max-w-[1400px] px-6 md:px-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-center py-16 lg:py-0">

              {/* Left Column: The Massive, Jagged Character Art Panel — a
                  constant backdrop across every act. */}
              <div className="lg:col-span-5 flex flex-col items-center lg:items-start z-10 relative" style={{ perspective: '1000px' }}>
                <div
                  ref={frameRef}
                  className="relative w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] aspect-[4/5] group avatar-frame shadow-[0_16px_48px_rgba(0,0,0,0.3)] border border-foreground/10 p-2.5 bg-foreground"
                  style={{ rotate: '-3deg' }}
                >
                  <div
                    className="absolute inset-0 bg-foreground/5 border border-foreground/15 rotate-[4deg] transition-all duration-700 group-hover:rotate-[5deg] group-hover:bg-foreground/[0.08] pointer-events-none"
                    style={{ filter: "url(#about-torn-filter)" }}
                  />

                  {/* Layer 2: Main photo screen */}
                  <div className="absolute inset-0 bg-foreground rotate-[-2deg] transition-all duration-700 group-hover:rotate-[-0.5deg] overflow-hidden">
                    <div className="relative w-full h-full overflow-hidden bg-card">
                      <PortraitMorph
                        srcA="/avatar.jpg"
                        srcB="/avatar.jpg"
                        alt="trhgatu Portrait"
                        className="w-full h-full object-cover object-top scale-105 group-hover:scale-100 transition-transform duration-1000 grayscale contrast-125"
                      />
                    </div>
                  </div>

                  {/* Layer 3: Torn Border Overlay (Physical washi edges) */}
                  <div
                    className="absolute inset-0 rotate-[-2deg] transition-all duration-700 group-hover:rotate-[-0.5deg] pointer-events-none z-20"
                  >
                    {/* Background frame mask */}
                    <div
                      className="absolute inset-[-12px] border-[24px] border-foreground"
                      style={{ filter: "url(#about-torn-filter)" }}
                    />

                    {/* Drawn inner torn border */}
                    <div
                      className="absolute inset-[10px] border border-foreground/25"
                      style={{ filter: "url(#about-torn-filter)" }}
                    />
                    <div className="absolute inset-[6px] border border-foreground/[0.04] rotate-[1.5deg]" />
                  </div>
                </div>

                {/* Traditional Red Ink Hanko Seal (印) — kept as a small signature
                    mark under the avatar; the STANCE/STRATEGY/ORIGIN metadata
                    that used to sit beside it was redundant with the acts. */}
                <div className="mt-8 w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] flex justify-center">
                  <div
                    className="relative group/seal cursor-pointer select-none"
                    onMouseEnter={() => soundManager?.playStampThud()}
                  >
                    {/* Outer glowing ink distress ring */}
                    <div className="absolute inset-[-4px] border border-red-600/30 rounded-sm scale-95 group-hover/seal:scale-105 transition-all duration-700 opacity-60 pointer-events-none" style={{ filter: "url(#hanko-torn-filter)" }} />

                    {/* Main Stamp */}
                    <div
                      className="w-14 h-14 border-2 border-red-600 flex items-center justify-center font-serif text-[20px] font-black text-red-600 tracking-tighter transition-all duration-500 group-hover/seal:rotate-[6deg] group-hover/seal:scale-105"
                      style={{
                        filter: "url(#hanko-torn-filter)",
                        backgroundColor: "rgba(220, 38, 38, 0.03)",
                        boxShadow: "inset 0 0 10px rgba(220, 38, 38, 0.1)"
                      }}
                    >
                      <span className="rotate-[-3deg] select-none uppercase font-bold text-center leading-none text-red-600">
                        英<br />秀
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: the four acts. Desktop: absolutely stacked and
                  crossfaded per `activeAct`. Mobile: normal stacked flow. */}
              <div className="lg:col-span-7 space-y-24 lg:space-y-0">

                {/* Act indicator — a single ink-brush stroke that "paints"
                    further as the user scrolls through the stage, instead of
                    a generic progress bar. Desktop only, purely orienting. */}
                <div className="hidden lg:block mb-12">
                  <div
                    className="relative h-[5px] rounded-full bg-foreground/10 overflow-hidden"
                    style={{ filter: "url(#about-torn-filter)" }}
                  >
                    <div
                      ref={actRailFillRef}
                      className="absolute inset-y-0 left-0 w-full bg-foreground rounded-full"
                      style={{ transform: "scaleX(0)", transformOrigin: "left" }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    {acts.map((label, idx) => (
                      <span
                        key={label}
                        className={`font-mono text-[9px] tracking-widest uppercase transition-colors duration-300 ${activeAct === idx ? "text-foreground" : "text-foreground/30"}`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="relative lg:min-h-[360px]">

                  {/* Act 0: Title Block */}
                  <div ref={(el) => { actRefs.current[0] = el; }} className="lg:absolute lg:inset-0 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[9px] tracking-[0.5em] text-foreground/50 uppercase font-bold">[ CHAPTER I : THE RONIN ARCHITECT ]</span>
                      <div className="h-[1px] flex-1 bg-foreground/10" style={{ filter: "url(#line-torn-filter)" }} />
                    </div>

                    <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-serif font-light text-foreground uppercase tracking-tight leading-[0.9]">
                      TRAN HOANG <br />
                      <span
                        className="text-transparent"
                        style={{ WebkitTextStroke: isDark ? "1.5px rgba(255,255,255,0.7)" : "1.5px rgba(0,0,0,0.7)" }}
                      >
                        ANH TU.
                      </span>
                    </h2>
                    <p className="font-caveat text-2xl md:text-3xl lg:text-4xl text-foreground/60 tracking-normal lowercase">
                      the ronin architect — the way of the sword & code
                    </p>
                  </div>

                  {/* Act 1: Bio */}
                  <div ref={(el) => { actRefs.current[1] = el; }} className="lg:absolute lg:inset-0 lg:opacity-0 lg:pointer-events-none space-y-6 text-foreground/90">
                    <span className="font-mono text-[9px] lg:text-xs tracking-[0.5em] text-foreground/50 uppercase font-bold block mb-4">[ ORIGINS ]</span>
                    <p className="text-xl md:text-2xl lg:text-4xl xl:text-5xl font-light leading-snug tracking-tight">
                      I master the two swords of digital craftsmanship: wielding <span className="text-foreground font-semibold underline decoration-foreground/30 underline-offset-4">robust, battle-tested engineering</span> and <span className="text-foreground font-semibold underline decoration-foreground/30 underline-offset-4">razor-sharp Zen aesthetics</span> in perfect, fluid unison.
                    </p>

                    <p className="text-xs md:text-sm lg:text-lg text-foreground/50 leading-relaxed font-light max-w-2xl">
                      Inspired by the discipline of Musashi&apos;s Niten Ichi-ryū, I treat software architecture as a lifelong martial strategy. A digital system must be built resilient to extreme conditions, structurally elegant, and present a quiet, distraction-free interface. My mission is to bridge complex systems with high-fidelity sensory experiences.
                    </p>
                  </div>

                  {/* Act 2: The Gorintō (五輪塔) — the five-element pagoda
                      "Go Rin No Sho" takes its name from: Earth (cube),
                      Water, Fire, Wind, Void — the five rings themselves are
                      the kanji, no icon shapes standing in for them. Purely
                      click-driven — no scroll tie-in, no travel. */}
                  <div ref={(el) => { actRefs.current[2] = el; }} className="lg:absolute lg:inset-0 lg:opacity-0 lg:pointer-events-none">
                    <span className="font-mono text-[9px] lg:text-xs tracking-[0.5em] text-foreground/50 uppercase font-bold block mb-4 lg:mb-5">Go Rin No Sho — The Five Rings of Software Mastery</span>

                    {/* All five, always on the page — no click, no state. Each
                        ring is its own kanji + title + description, read top
                        to bottom like a colophon rather than browsed one at a
                        time. Spacing lives only on each row's own padding
                        (not also on the wrapper) so five rows plus the label
                        fit inside the sticky viewport without clipping. */}
                    <div>
                      {fiveRings.map((ring, idx) => (
                        <div
                          key={ring.kanji}
                          className="flex items-baseline gap-4 lg:gap-5 py-2.5 lg:py-3 border-b border-foreground/10 last:border-0"
                        >
                          <span
                            className="font-serif leading-none text-foreground text-[24px] lg:text-[32px] shrink-0"
                            style={{ filter: "url(#hanko-torn-filter)" }}
                          >
                            {ring.kanji}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-baseline gap-2 lg:gap-3 flex-wrap">
                              <span className="font-mono text-[9px] lg:text-xs font-bold text-foreground/40">0{idx + 1}</span>
                              <span className="font-serif text-sm lg:text-lg font-semibold tracking-wide text-foreground">{ring.book}</span>
                              <span className="font-mono text-[8px] lg:text-[10px] text-foreground/40 uppercase tracking-widest">{ring.discipline}</span>
                            </div>
                            <p className="text-xs lg:text-sm text-foreground/50 mt-1 leading-snug font-light max-w-xl">
                              {ring.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Act 3: Philosophy & Methodology */}
                  <div ref={(el) => { actRefs.current[3] = el; }} className="lg:absolute lg:inset-0 lg:opacity-0 lg:pointer-events-none">
                    <div className="space-y-4 lg:space-y-8 max-w-3xl">
                      <span className="font-mono text-[9px] lg:text-xs tracking-[0.5em] text-foreground/50 uppercase font-bold block">[ PHILOSOPHY ]</span>
                      <div className="font-caveat text-2xl sm:text-3xl lg:text-5xl xl:text-6xl text-foreground/80 leading-snug italic">
                        &quot;Do nothing which is of no use.&quot; — Miyamoto Musashi (Go Rin No Sho)
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
