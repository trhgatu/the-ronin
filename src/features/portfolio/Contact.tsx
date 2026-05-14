'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from '@/lib/gsap';
import { motion } from 'framer-motion';

export const Contact = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    // Standard Scramble for Phase Label
    const phaseLabel = document.querySelector(".phase-label-06");
    const fullText = "[ PHASE_06 // THE_CONNECTION ]";
    const scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789[]//_!@#$%^&*";
    
    gsap.to({}, {
      duration: 3,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 80%",
        once: true
      },
      onUpdate: function() {
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

    // Standard Parallax for Contact Title
    gsap.to(".contact-title-1", {
      x: -30,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      }
    });
    gsap.to(".contact-title-2", {
      x: 30,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      }
    });

    // Reveal only for content below title
    gsap.from('.contact-content-reveal', {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 60%',
      },
      y: 40,
      opacity: 0,
      duration: 1.5,
      ease: 'expo.out',
    });
  }, { scope: containerRef });

  return (
    <section 
      id="contact"
      ref={containerRef}
      className="py-24 md:py-40 lg:py-60 relative overflow-hidden bg-background"
    >
      <div className="absolute top-0 left-0 w-full h-[1px] bg-[var(--separator-gray)] opacity-30" />
      
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 w-full">
        <div className="mb-16 md:mb-24">
           <div className="flex items-center gap-4 mb-8 w-full">
              <div className="flex items-center font-mono text-accent">
                <span className="text-[10px] md:text-[12px] tracking-[0.4em] md:tracking-[0.6em] uppercase phase-label-06 font-bold">
                  [ ESTABLISHING_CONNECTION ]
                </span>
                <span className="text-[12px] animate-pulse">_</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-accent/50 to-transparent" />
           </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start lg:items-end justify-between">
          <div className="max-w-3xl text-left">
            <h2 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black italic uppercase leading-[0.85] lg:leading-[0.8] tracking-tighter mb-8 md:mb-12 text-foreground">
              <span className="inline-block contact-title-1">BUILD</span> <br />
              <span className="inline-block contact-title-2 text-transparent" style={{ WebkitTextStroke: "1px var(--text-stroke)" }}>THE FUTURE.</span>
            </h2>
            <div className="contact-content-reveal">
              <p className="text-xl md:text-2xl lg:text-3xl font-light text-foreground/40 leading-tight tracking-tight max-w-2xl border-l border-accent/20 pl-6 md:pl-0 md:border-none italic lg:not-italic">
                Architecture is about more than just code. It&apos;s about building solutions that last. 
                Let&apos;s collaborate on your next <span className="text-accent italic">high-performance legacy</span>.
              </p>
            </div>
          </div>

          <div className="contact-content-reveal flex flex-col items-start lg:items-end gap-8 md:gap-12 w-full lg:w-auto">
            <div className="text-[8px] md:text-[9px] font-mono text-foreground/20 max-w-[250px] text-left lg:text-right leading-relaxed uppercase tracking-[0.2em] md:tracking-widest">
              Network Protocol // <br className="hidden md:block" />
              Sector: 06_THE_CONNECTION // <br className="hidden md:block" />
              Status: AVAILABLE_FOR_PROJECTS
            </div>
            
            <a 
              href="mailto:trhgatu.dev@gmail.com"
              className="w-full sm:w-auto group relative px-8 md:px-16 py-6 md:py-8 overflow-hidden border border-border rounded-sm transition-all hover:border-accent flex items-center justify-center text-center"
            >
              <span className="relative z-10 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-foreground group-hover:text-background transition-colors">
                SEND_ENCRYPTED_MESSAGE
              </span>
              <motion.div 
                whileHover={{ y: 0 }}
                initial={{ y: "100%" }}
                className="absolute inset-0 bg-accent z-0"
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
