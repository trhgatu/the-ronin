'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from '@/lib/gsap';
import { motion } from 'framer-motion';
import Image from 'next/image';

const HUDCorner = ({ className }: { className: string }) => (
  <div className={`absolute w-4 h-4 border-accent/40 ${className}`} />
);

export const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const avatarImageRef = useRef<HTMLDivElement>(null);

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
    if (avatarImageRef.current) {
      gsap.fromTo(avatarImageRef.current,
        { filter: "grayscale(100%) contrast(1.2)", opacity: 0.6 },
        {
          filter: "grayscale(0%) contrast(1)",
          opacity: 1,
          duration: 2,
          delay: 1.5,
          ease: "power2.inOut"
        }
      );
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
    }

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

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[#020202]"
    >
      {/* Background Technical Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Subtle Dot Grid */}
        <div className="absolute inset-0 opacity-[0.1] bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:40px_40px]" />

        {/* Global Scanning Line (User's logic refined) */}
        <motion.div
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 w-full h-[1px] bg-accent/20 shadow-[0_0_15px_rgba(251,191,36,0.2)] z-10"
        />

        {/* Ambient Aura behind content */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] mix-blend-screen" />

        {/* Floating UI Metadata */}
        <div className="absolute top-12 left-12 font-mono text-[7px] text-zinc-800 flex flex-col gap-1 uppercase tracking-widest">
          <span>Lat: 10.762622</span>
          <span>Long: 106.660172</span>
          <span>System_Time: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="absolute bottom-12 right-12 font-mono text-[7px] text-zinc-800 uppercase tracking-widest">
          Architect_Core_v4.2.0
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] w-full px-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-4 mb-10 hero-reveal w-full">
              <div className="flex items-center font-mono text-accent">
                <span className="text-[12px] tracking-[0.6em] uppercase phase-label-01 font-bold">
                  [ INITIALIZING ]
                </span>
                <span className="text-[12px] animate-pulse">_</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-accent/50 to-transparent" />
            </div>

            <h1 className="hero-reveal text-6xl md:text-8xl lg:text-9xl font-black italic uppercase leading-[0.8] tracking-tighter text-white mb-12">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 1 }}
              >
                TRHGATU
              </motion.div>
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 1 }}
              >
                <span
                  className="text-transparent"
                  style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)" }}
                >
                  ARCHITECT.
                </span>
              </motion.div>
            </h1>

            <div className="hero-reveal max-w-xl">
              <p className="text-2xl md:text-4xl lg:text-5xl font-extralight text-white leading-[1.1] tracking-tight mb-12 border-l-2 border-accent pl-12 italic">
                &quot;Just a soul writing code <br />
                the way painters write light.&quot;
              </p>

              <div className="flex items-center gap-10">
                <button className="group relative px-10 py-4 overflow-hidden border border-white/5 bg-white/[0.02] hover:border-accent/40 transition-all">
                  <span className="relative z-10 text-[10px] font-bold uppercase tracking-[0.3em] text-white">
                    Begin Sequence
                  </span>
                  <motion.div
                    whileHover={{ y: 0 }}
                    initial={{ y: "100%" }}
                    className="absolute inset-0 bg-accent/10 z-0"
                  />
                </button>
                <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest hidden md:block">
                  Protocol: 01_THE_MANIFEST <br />
                  Status: Operational
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div
              className="avatar-frame relative w-72 h-96 md:w-80 md:h-[480px] group cursor-none"
            >
              <HUDCorner className="top-0 left-0 border-t-2 border-l-2" />
              <HUDCorner className="top-0 right-0 border-t-2 border-r-2" />
              <HUDCorner className="bottom-0 left-0 border-b-2 border-l-2" />
              <HUDCorner className="bottom-0 right-0 border-b-2 border-r-2" />

              <div className="absolute inset-4 overflow-hidden border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-zinc-900">
                <div ref={avatarImageRef} className="relative w-full h-full">
                  <Image
                    src="https://github.com/user-attachments/assets/201b43e7-6b0e-4daf-96f9-4918a5491a1d"
                    alt="trhgatu"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>

                {/* Synced thin laser scanline for avatar */}
                <div className="avatar-scan-line absolute left-0 w-full h-[1px] bg-accent shadow-[0_0_15px_#fbbf24] z-20 pointer-events-none" />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                <div className="absolute bottom-6 left-6 font-mono text-[8px] text-accent/60 opacity-0 group-hover:opacity-100 transition-opacity">
                  ARCHITECT_ID: 1103_TRHGATU <br />
                  SCANNING_SYSTEM_STATE...
                </div>
              </div>

              <div className="absolute -right-8 top-1/4 h-20 w-[1px] bg-accent/20 hidden md:block" />
              <div className="absolute -left-8 bottom-1/4 h-20 w-[1px] bg-accent/20 hidden md:block" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-20">
        <div className="w-[1px] h-12 bg-accent/50" />
        <span className="text-[7px] uppercase tracking-[0.6em] font-bold">Scroll</span>
      </div>
    </section>
  );
};
