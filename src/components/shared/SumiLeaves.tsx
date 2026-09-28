'use client';

import { useRef, useEffect, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from '@/lib/gsap';
import { watchVisibility } from '@/lib/visibility';

interface SumiLeavesProps {
  containerRef: React.RefObject<HTMLElement | null>;
  count?: number;
  /** Mask-tint fill color for the leaves. Defaults to a dark sumi-ink tone —
   * pass the 3D model's pink (#F87878) only where the model itself is
   * actually visible (Hero's swap mode "on"); anywhere the model is hidden
   * behind the veil (or in sections that have nothing to do with it, like
   * Philosophy), pink leaves would read as an unexplained color with no
   * source on screen. */
  color?: string;
  /** When set, each leaf carries a second, hidden layer in this color that
   * crossfades in whenever the cursor comes near it — the same "cursor
   * reveals the model's true pink" idea as Hero's text/emblem mask, applied
   * to these scattered, independently-animated particles (a real CSS mask
   * synced to Hero's own torn cursor hole isn't practical here since each
   * leaf's screen position comes from its own GSAP-driven transform, not a
   * fixed layout box — a proximity-based crossfade reads the same to the
   * eye at this scale). */
  revealColor?: string;
}

export const SumiLeaves = ({ containerRef, count = 15, color = '#161412', revealColor }: SumiLeavesProps) => {
  const [mounted, setMounted] = useState(false);
  const localRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Crossfade each leaf's reveal (pink) layer in as the cursor comes near —
  // one gsap.quickTo opacity setter per leaf, cached so this is a plain
  // interpolated tween rather than raw style writes fighting GSAP.
  useEffect(() => {
    if (!mounted || !revealColor || !containerRef.current) return;
    const container = containerRef.current;
    const root = localRef.current;
    if (!root) return;

    const RADIUS = 160;
    const reveals = Array.from(root.querySelectorAll<HTMLElement>('.sumi-leaf-reveal'));
    const setters = reveals.map((el) => gsap.quickTo(el, 'opacity', { duration: 0.35, ease: 'power2.out' }));

    let rafId = 0;
    let pointer: { x: number; y: number } | null = null;

    const apply = () => {
      rafId = 0;
      reveals.forEach((el, i) => {
        if (!pointer) {
          setters[i](0);
          return;
        }
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.hypot(pointer.x - cx, pointer.y - cy);
        setters[i](dist < RADIUS ? 1 : 0);
      });
    };

    const schedule = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(apply);
    };

    const onMove = (e: MouseEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
      schedule();
    };
    const onLeave = () => {
      pointer = null;
      schedule();
    };

    container.addEventListener('mousemove', onMove);
    container.addEventListener('mouseleave', onLeave);
    return () => {
      container.removeEventListener('mousemove', onMove);
      container.removeEventListener('mouseleave', onLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [mounted, revealColor, containerRef]);

  useGSAP(() => {
    if (!mounted || !containerRef.current) return;

    const leaves = gsap.utils.toArray('.sumi-leaf-item', localRef.current);
    const h = containerRef.current.clientHeight || 900;
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    // Each leaf's current drift tween, so the whole set can be paused while
    // the host section is offscreen — otherwise 12 (Hero) + 15 (Philosophy)
    // infinite 3D-transform tweens restyle the page every frame of the visit.
    const drift = new Map<unknown, gsap.core.Tween>();
    let paused = false;

    const animateLeaf = (el: any, isInitial = false) => {
      const startY = isInitial
        ? gsap.getProperty(el, "y") as number
        : gsap.utils.random(80, h - 120);

      if (!isInitial) {
        gsap.set(el, {
          x: -80,
          y: startY,
          rotation: "random(0, 360)",
          rotationX: "random(0, 360)",
          rotationY: "random(0, 360)",
          scale: "random(0.65, 1.4)",
        });
      }

      const tween = gsap.to(el, {
        x: w + 100,
        y: `+=${gsap.utils.random(-220, 220)}`,
        rotation: "+=random(360, 900)",
        rotationX: "+=random(180, 540)",
        rotationY: "+=random(180, 540)",
        duration: gsap.utils.random(14, 22),
        ease: "none",
        onComplete: () => animateLeaf(el, false),
      });
      if (paused) tween.pause();
      drift.set(el, tween);
    };

    leaves.forEach((leaf: any) => {
      // 1. Initial random scatter across the full width of the screen on load
      gsap.set(leaf, {
        x: `random(0, ${w})`,
        y: `random(80, ${h - 120})`,
        rotation: "random(0, 360)",
        rotationX: "random(0, 360)",
        rotationY: "random(0, 360)",
        scale: "random(0.65, 1.4)",
      });

      // 2. Start wind drift immediately
      animateLeaf(leaf, true);

      // 3. Dynamic scrolling reaction (sways with scroll speed wind)
      gsap.to(leaf, {
        yPercent: -45,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.6,
        }
      });
    });

    const unwatch = watchVisibility(containerRef.current, (visible) => {
      paused = !visible;
      drift.forEach((tween) => (visible ? tween.resume() : tween.pause()));
    });
    return unwatch;
  }, { dependencies: [mounted, containerRef], scope: localRef });

  if (!mounted) return null;

  return (
    <div ref={localRef} className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-10 select-none">
      {Array.from({ length: count }).map((_, idx) => {
        const leafNum = (idx % 5) + 1;
        return (
          <div
            key={idx}
            className="sumi-leaf-item absolute w-10 h-10 md:w-14 md:h-14 pointer-events-none"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Tinted via mask (not filter) so the fill is an exact solid
                color regardless of the source PNG's own colors — the mask
                only borrows its alpha shape. */}
            <span
              role="img"
              aria-label={`Sumi Leaf ${leafNum}`}
              className="block w-full h-full pointer-events-none select-none opacity-60 transition-all duration-700"
              style={{
                backgroundColor: color,
                WebkitMask: `url(/images/leaf-${leafNum}.png) center / contain no-repeat`,
                mask: `url(/images/leaf-${leafNum}.png) center / contain no-repeat`,
              }}
            />
            {revealColor && (
              <span
                aria-hidden="true"
                className="sumi-leaf-reveal absolute inset-0 block w-full h-full pointer-events-none select-none"
                style={{
                  opacity: 0,
                  backgroundColor: revealColor,
                  WebkitMask: `url(/images/leaf-${leafNum}.png) center / contain no-repeat`,
                  mask: `url(/images/leaf-${leafNum}.png) center / contain no-repeat`,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
