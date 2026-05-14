'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from '@/lib/gsap';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { ShaderFlow } from '@/components/shared/ShaderFlow';
import { PortraitMorph } from '@/components/shared/PortraitMorph';

const HUDCorner = ({ className }: { className: string }) => (
  <div className={`absolute w-4 h-4 border-accent/40 ${className}`} />
);

export const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const avatarImageRef = useRef<HTMLDivElement>(null);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    tl.from('.hero-reveal', {
      y: 40,
      opacity: 0,
      duration: 1.2,
      stagger: 0.1,
      delay: 0.5,
    })
      .from('.avatar-frame', {
        scale: 0.95,
        opacity: 0,
        duration: 1.5,
      }, '-=1');

    gsap.fromTo(".avatar-scan-line",
      { top: "-5%", opacity: 0 },
      {
        top: "105%",
        opacity: 1,
        duration: 1.5,
        delay: 1.5,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.to(".avatar-scan-line", { opacity: 0, duration: 0.5 });
        }
      }
    );

    const phaseLabel = document.querySelector(".phase-label-01");
    const fullText = "[ PHASE_01 // THE_MANIFEST ]";
    const scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789[]//_!@#$%^&*";

    gsap.to({}, {
      duration: 3,
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
  }, { scope: containerRef });

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-background pt-32 pb-20 lg:py-0"
    >
      {/* Background Technical Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 w-full h-[1px] bg-accent/20 shadow-[0_0_15px_rgba(251,191,36,0.2)] z-10"
        />
      </div>

      <div className="mx-auto max-w-[1400px] w-full px-6 md:px-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="flex items-center gap-4 mb-8 md:mb-10 hero-reveal w-full">
              <div className="flex items-center font-mono text-accent">
                <span className="text-[10px] md:text-[12px] tracking-[0.4em] md:tracking-[0.6em] uppercase phase-label-01 font-bold">
                  [ INITIALIZING ]
                </span>
                <span className="text-[12px] animate-pulse">_</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-accent/50 to-transparent" />
            </div>

            <div className="hero-reveal mb-8 md:mb-12 text-center lg:text-left">
              <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black italic uppercase leading-[0.85] lg:leading-[0.8] tracking-tighter text-foreground mb-4">
                <motion.div
                  initial={{ x: -30, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ duration: 1.2, ease: "circOut" }}
                >
                  TRHGATU
                </motion.div>
              </h1>
              <motion.div
                initial={{ x: 30, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 1.2, ease: "circOut", delay: 0.2 }}
                className="flex items-center justify-center lg:justify-start gap-4 md:gap-6"
              >
                <div className="h-px w-12 md:w-20 bg-accent/40" />
                <span 
                  className="text-xl md:text-2xl lg:text-4xl font-extralight uppercase tracking-[0.2em] md:tracking-[0.3em] text-foreground/60 italic"
                >
                  Software Architect
                </span>
              </motion.div>
            </div>

            <div className="hero-reveal max-w-xl mx-auto lg:mx-0">
              <p className="text-xl md:text-3xl lg:text-5xl font-extralight text-foreground leading-[1.2] lg:leading-[1.1] tracking-tight mb-8 md:mb-12 border-l-2 border-accent pl-6 md:pl-12 italic text-left">
                &quot;Just a soul writing code <br />
                the way painters write light.&quot;
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-10">
                <button className="w-full sm:w-auto group relative px-10 py-4 overflow-hidden border border-border bg-foreground/[0.02] hover:border-accent/40 transition-all">
                  <span className="relative z-10 text-[10px] font-bold uppercase tracking-[0.3em] text-foreground">
                    Begin Sequence
                  </span>
                  <motion.div
                    whileHover={{ y: 0 }}
                    initial={{ y: "100%" }}
                    className="absolute inset-0 bg-accent/10 z-0"
                  />
                </button>
                <div className="text-[9px] font-mono text-foreground/40 uppercase tracking-widest text-center sm:text-left">
                  Protocol: 01_THE_MANIFEST <br className="hidden sm:block" />
                  Status: Operational
                </div>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "circOut", delay: 0.5 }}
            className="lg:col-span-5 flex justify-center lg:justify-end order-1 lg:order-2"
          >
            <div className="relative w-full max-w-[280px] sm:max-w-[350px] md:max-w-[400px] lg:max-w-[450px] aspect-square group">
              {/* Minimalist Frame */}
              <div className="relative w-full h-full p-2 border border-foreground/10 bg-background/20 backdrop-blur-sm rounded-full overflow-hidden transition-all duration-700 group-hover:border-accent/30 group-hover:shadow-[0_0_40px_rgba(251,191,36,0.05)]">

                {/* Image Container with Top Alignment */}
                <div className="relative w-full h-full rounded-full overflow-hidden border border-foreground/5 z-10 bg-card">
                  <PortraitMorph
                    srcA="/avatar.jpg"
                    srcB="/avatar.jpg"
                    alt="trhgatu"
                    className="w-full h-full object-cover object-top scale-105 group-hover:scale-100 transition-transform duration-1000"
                  />

                  {/* Subtle Scanline Overlay */}
                  <div className="avatar-scan-line absolute left-0 w-full h-[1px] bg-accent/30 shadow-[0_0_15px_rgba(251,191,36,0.3)] z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Minimal Focus Markers */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-foreground/20 rounded-tl-xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-foreground/20 rounded-br-xl pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 md:gap-3 opacity-20">
        <div className="w-[1px] h-8 md:h-12 bg-accent/50" />
        <span className="text-[7px] uppercase tracking-[0.6em] font-bold">Scroll</span>
      </div>
    </section>
  );
};
