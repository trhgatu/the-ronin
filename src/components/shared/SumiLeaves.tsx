'use client';

import { useRef, useEffect, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from '@/lib/gsap';
import { useTheme } from 'next-themes';

interface SumiLeavesProps {
  containerRef: React.RefObject<HTMLElement | null>;
  count?: number;
}

export const SumiLeaves = ({ containerRef, count = 15 }: SumiLeavesProps) => {
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const localRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  useGSAP(() => {
    if (!mounted || !containerRef.current) return;

    const leaves = gsap.utils.toArray('.sumi-leaf-item', localRef.current);
    const h = containerRef.current.clientHeight || 900;
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;

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

      gsap.to(el, {
        x: w + 100,
        y: `+=${gsap.utils.random(-220, 220)}`,
        rotation: "+=random(360, 900)",
        rotationX: "+=random(180, 540)",
        rotationY: "+=random(180, 540)",
        duration: gsap.utils.random(14, 22),
        ease: "none",
        onComplete: () => animateLeaf(el, false),
      });
    };

    leaves.forEach((leaf: any) => {
      // 1. Initial random scatter across the full width of the screen on load
      gsap.set(leaf, {
        x: `random(0, ${w})`,
        y: `random(80, ${h} - 120)`,
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
            style={{
              transformStyle: "preserve-3d",
              filter: isDark
                ? "grayscale(1) brightness(0) invert(1)"
                : "grayscale(1) brightness(0.2)"
            }}
          >
            <img
              src={`/images/leaf-${leafNum}.png`}
              alt={`Sumi Leaf ${leafNum}`}
              className="w-full h-full object-contain pointer-events-none select-none opacity-40 dark:opacity-55 transition-all duration-700"
            />
          </div>
        );
      })}
    </div>
  );
};
