'use client';

import { ReactLenis, LenisRef } from 'lenis/react';
import { ReactNode, useEffect, useRef } from 'react';
import { ScrollTrigger } from '@/lib/gsap';

interface SmoothScrollProps {
  children: ReactNode;
}

export const SmoothScroll = ({ children }: SmoothScrollProps) => {
  const lenisRef = useRef<LenisRef>(null);

  // Forward Lenis's scroll events to GSAP's ScrollTrigger. ScrollTrigger
  // listens for native browser scroll events, and Lenis's own RAF loop keeps
  // driving those fine for real wheel/touch input — but a programmatic
  // `lenis.scrollTo()` call (see `About.tsx`'s `goToRing`) doesn't reliably
  // forward as native scroll events, so ScrollTrigger silently stops
  // updating for scroll it didn't cause itself. This listener is purely
  // additive — Lenis's own RAF loop is untouched.
  useEffect(() => {
    const lenis = lenisRef.current?.lenis;
    if (!lenis) return;
    lenis.on('scroll', ScrollTrigger.update);
    return () => lenis.off('scroll', ScrollTrigger.update);
  }, []);

  return (
    <ReactLenis root ref={lenisRef} options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
};

