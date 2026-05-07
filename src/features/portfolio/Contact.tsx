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
      x: -100,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      }
    });
    gsap.to(".contact-title-2", {
      x: 100,
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
      className="py-60 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      
      <div className="mx-auto max-w-[1400px] px-10 w-full">
        <div className="mb-24">
           <div className="flex items-center gap-4 mb-8 w-full">
              <div className="flex items-center font-mono text-accent">
                <span className="text-[12px] tracking-[0.6em] uppercase phase-label-06 font-bold">
                  [ ESTABLISHING_CONNECTION ]
                </span>
                <span className="text-[12px] animate-pulse">_</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-accent/50 to-transparent" />
           </div>
        </div>

        <div className="flex flex-col md:flex-row gap-20 items-end justify-between">
          <div className="max-w-3xl">
            <h2 className="text-6xl md:text-8xl lg:text-9xl font-black italic uppercase leading-[0.8] tracking-tighter mb-12">
              <span className="inline-block contact-title-1">BUILD</span> <br />
              <span className="inline-block contact-title-2 text-transparent" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.15)" }}>THE FUTURE.</span>
            </h2>
            <div className="contact-content-reveal">
              <p className="text-xl md:text-3xl font-light text-white/40 leading-tight tracking-tight">
                Architecture is about more than just code. It&apos;s about building solutions that last. 
                Let&apos;s collaborate on your next <span className="text-accent italic">high-performance legacy</span>.
              </p>
            </div>
          </div>

          <div className="contact-reveal flex flex-col items-end gap-12">
            <div className="text-[8px] font-mono text-white/20 max-w-[200px] text-right leading-relaxed uppercase tracking-widest">
              Network Protocol // 
              Sector: 06_THE_CONNECTION // 
              Status: AVAILABLE_FOR_PROJECTS
            </div>
            
            <a 
              href="mailto:trhgatu.dev@gmail.com"
              className="group relative px-16 py-8 overflow-hidden border border-white/10 rounded-sm transition-all hover:border-accent"
            >
              <span className="relative z-10 text-xs font-black uppercase tracking-[0.5em] text-white group-hover:text-black transition-colors">
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
