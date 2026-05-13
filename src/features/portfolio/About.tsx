'use client';

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const stats = [
  { label: "Designation", value: "Senior Technical Architect" },
  { label: "Base_Location", value: "Ho Chi Minh City, VN" },
  { label: "Core_Directive", value: "Functional Aesthetics" },
  { label: "System_Status", value: "Open for Innovation" },
  { label: "Build_Stability", value: "Production-Grade" },
];

export const About = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [100, 0, 0, -100]);

  return (
    <section
      ref={containerRef}
      id="about"
      className="relative py-40 md:py-60 bg-background overflow-hidden"
    >
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-[var(--separator-gray)] opacity-30" />
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(var(--foreground)_1px,transparent_1px)] bg-[size:30px_30px]" />

      <motion.div 
        style={{ opacity, y }}
        className="mx-auto max-w-[1400px] px-10 relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-start">
          
          {/* Left Column: Title & Stats */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center font-mono text-accent">
                <span className="text-[12px] tracking-[0.6em] uppercase font-bold">[ DATA_PROFILE ]</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-accent/50 to-transparent" />
            </div>

            <h2 className="text-6xl md:text-8xl font-black italic uppercase text-foreground tracking-tighter leading-[0.8] mb-16">
              THE <br />
              <span className="text-transparent" style={{ WebkitTextStroke: "1px var(--text-stroke)" }}>ARCHITECT.</span>
            </h2>

            <div className="space-y-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="group border-b border-foreground/5 pb-4 transition-colors hover:border-accent/40">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest">{stat.label}</span>
                    <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Narrative */}
          <div className="lg:col-span-7 lg:pt-32">
            <div className="relative">
              <div className="absolute -left-10 top-0 bottom-0 w-px bg-gradient-to-b from-accent/50 via-accent/5 to-transparent hidden lg:block" />
              
              <div className="space-y-8 max-w-2xl">
                <p className="text-2xl md:text-3xl font-light text-foreground/80 leading-snug tracking-tight">
                  I specialize in crafting digital ecosystems where <span className="text-foreground font-medium underline decoration-accent/40 underline-offset-8">high-performance engineering</span> meets intentional design. 
                </p>
                
                <p className="text-lg md:text-xl text-foreground/40 leading-relaxed font-light">
                  With a background rooted in architectural precision, I approach software not just as code, but as a structure that must be resilient, scalable, and visually compelling. My mission is to bridge the gap between complex backend logic and seamless frontend experiences.
                </p>

                <div className="pt-8 grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono text-accent uppercase tracking-widest">Philosophy</div>
                    <div className="text-sm text-foreground/60 leading-relaxed font-light">Simple is not easy. It is the result of deep complexity refined to its purest form.</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono text-accent uppercase tracking-widest">Methodology</div>
                    <div className="text-sm text-foreground/60 leading-relaxed font-light">Modular, iterative, and always driven by the end-user's sensory experience.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </section>
  );
};
