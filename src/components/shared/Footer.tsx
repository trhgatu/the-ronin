'use client';

import { useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import gsap, { ScrollTrigger } from '@/lib/gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export const Footer = () => {
  const containerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useGSAP(
    () => {
      if (!contentRef.current || !containerRef.current) return;

      // Parallax Curtain Reveal — smoothly reveals the footer as Contact lifts off it
      gsap.fromTo(
        contentRef.current,
        { yPercent: -35, opacity: 0.7 },
        {
          yPercent: 0,
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top bottom',
            end: 'bottom bottom',
            scrub: true,
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <footer
      ref={containerRef}
      className="relative z-10 h-[380px] sm:h-[440px] md:h-[480px] w-full bg-[#090909] text-white overflow-hidden select-none"
    >
      <div
        ref={contentRef}
        className="relative z-10 h-full w-full max-w-[1400px] mx-auto flex flex-col justify-between px-6 md:px-12 py-10 md:py-14"
      >
        {/* Top subtle bar */}
        <div className="flex justify-between items-center text-[11px] font-mono tracking-[0.25em] uppercase text-white/40 border-b border-white/10 pb-4">
          <span>PORTFOLIO ARCHIVE</span>
          <span>SAIGON, VIETNAM</span>
        </div>

        {/* Monumental Sculptural Centerpiece */}
        <div className="py-2 text-center my-auto">
          <div className="font-serif text-[clamp(4.5rem,18vw,16rem)] font-light italic leading-none tracking-[-0.04em] text-white/20 hover:text-white/35 transition-colors duration-700 cursor-default select-none">
            TRHGATU.
          </div>
        </div>

        {/* Bottom Bar & Return Trigger */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-5 border-t border-white/10 text-[11px] font-mono tracking-[0.25em] uppercase text-white/45">
          <p>© {currentYear} TRAN HOANG ANH TU · ALL RIGHTS RESERVED.</p>

          <button
            onClick={scrollToTop}
            className="group flex items-center gap-2 text-white/60 hover:text-white transition-colors cursor-pointer select-none"
          >
            <span>BACK TO TOP</span>
            <span className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-white/70 group-hover:border-white/60 group-hover:text-white group-hover:-translate-y-0.5 transition-all duration-300">
              <ArrowUp size={11} />
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
};
