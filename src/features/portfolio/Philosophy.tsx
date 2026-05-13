'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from '@/lib/gsap';

export const Philosophy = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLQuoteElement>(null);

  useGSAP(() => {
    if (!containerRef.current || !quoteRef.current) return;

    // Standard Scramble for Phase Label
    const phaseLabel = document.querySelector(".phase-label-03");
    const fullText = "[ PHASE_03 // THE_MANIFEST ]";
    const scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789[]//_!@#$%^&*";

    gsap.to({}, {
      duration: 3,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 80%",
        once: true
      },
      onUpdate: function () {
        const progress = this.progress();
        const currentLength = Math.floor(progress * fullText.length);
        const revealedText = fullText.slice(0, currentLength);
        if (phaseLabel) {
          phaseLabel.textContent = progress < 1
            ? revealedText + scrambleChars[Math.floor(Math.random() * scrambleChars.length)]
            : fullText;
        }
      }
    });

    // Parallax for standard titles
    gsap.to(".phil-title-1", {
      x: -100,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
    gsap.to(".phil-title-2", {
      x: 100,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });

    // Clean Character Reveal
    const text = quoteRef.current.innerText;
    quoteRef.current.innerHTML = text.split(" ").map(word => 
        `<span class="inline-block whitespace-nowrap">
            ${word.split("").map(char => `<span class="phil-char opacity-10 transition-colors duration-500">${char}</span>`).join("")}
        </span>`
    ).join(" ");

    gsap.to(".phil-char", {
      scrollTrigger: {
        trigger: quoteRef.current,
        start: "top 80%",
        end: "bottom 60%",
        scrub: 0.5,
      },
      opacity: 1,
      color: "var(--foreground)",
      stagger: 0.01,
    });

  }, { scope: containerRef });

  return (
    <section 
      ref={containerRef}
      id="philosophy"
      className="relative py-60 bg-background overflow-hidden flex flex-col justify-center"
    >
      <div className="absolute top-0 left-0 w-full h-[1px] bg-[var(--separator-gray)] opacity-30" />
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:80px_80px]" />

      <div className="relative z-10 mx-auto max-w-[1400px] px-10 w-full">
        {/* Unified Header Structure */}
        <div className="mb-40 text-left">
           <div className="flex items-center gap-4 mb-8 w-full">
              <div className="flex items-center font-mono text-accent">
                <span className="text-[12px] tracking-[0.6em] uppercase phase-label-03 font-bold">
                  [ INITIALIZING_MANIFEST ]
                </span>
                <span className="text-[12px] animate-pulse">_</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-accent/50 to-transparent" />
           </div>
           
            <h2 className="text-6xl md:text-8xl lg:text-9xl font-black italic uppercase text-foreground tracking-tighter leading-[0.8] overflow-visible">
               <span className="inline-block phil-title-1">THE</span> <br /> 
               <span className="inline-block phil-title-2 text-transparent" style={{ WebkitTextStroke: "1px var(--text-stroke)" }}>PHILOSOPHY.</span>
            </h2>
        </div>

        <div className="flex flex-col md:flex-row gap-20 items-start justify-between">
          <div className="max-w-5xl">
            <blockquote 
                ref={quoteRef}
                className="text-4xl md:text-6xl lg:text-7xl font-extralight italic text-foreground leading-[1.1] tracking-tight border-l-2 border-accent/20 pl-12 md:pl-20"
            >
              I build not for show, but for soul. Code is a language of thought, a medium of expression, and a bridge to connect universes.
            </blockquote>
          </div>

          <div className="flex flex-col items-end gap-6 text-right self-end mt-12 md:mt-0 opacity-40">
            <div className="flex items-center gap-4">
               <span className="text-[12px] font-mono text-foreground/40 uppercase tracking-[0.6em]">trhgatu // architect</span>
               <div className="h-px w-20 bg-border" />
            </div>
            <div className="text-[9px] font-mono text-foreground/30 uppercase tracking-[0.4em] max-w-[250px] leading-relaxed">
              Authorized Manifestation // 
              Systemic Intentionality // 
              Digital Alchemy
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-24 left-24 w-12 h-12 border-t border-l border-border" />
      <div className="absolute bottom-24 right-24 w-12 h-12 border-b border-r border-border" />
    </section>
  );
};
