'use client';

import React, { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useVelocity,
  useAnimationFrame,
  useMotionValue
} from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "@/lib/gsap";

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

const TECH_LANGS = ["TypeScript", "JavaScript", "Golang"];
const TECH_VISUALS = ["React", "NextJS", "Angular", "HTML", "CSS", "Sass", "Tailwind", "Vite", "GSAP", "ThreeJS"];
const TECH_FOUNDATION = ["NodeJS", "Express", "NestJS", "MongoDB", "MySQL", "PostgreSQL", "Prisma", "Redis", "Firebase", "GraphQL", "Supabase"];
const TECH_WORKSHOP = ["Git", "Github", "Docker", "Kubernetes", "Grafana", "Figma", "Postman", "VScode", "Vercel"];

const TechCard = ({ name }: { name: string }) => {
  return (
    <div className="flex-shrink-0 w-72 h-20 mx-4 relative overflow-hidden border border-foreground/5 bg-foreground/[0.01] rounded-[2px] p-5 group hover:border-accent/20 transition-all duration-700 flex items-center justify-between backdrop-blur-xl cursor-none">
      <style jsx>{`
        @keyframes resonance {
          0%, 100% { height: 30%; }
          50% { height: 100%; }
        }
        .resonance-bar {
          animation: resonance 1.2s infinite ease-in-out;
          animation-play-state: paused;
        }
        .group:hover .resonance-bar {
          animation-play-state: running;
        }
      `}</style>

      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />

      <div className="relative z-10 flex items-center gap-6">
        <div className="w-12 h-12 relative">
          <Image
            src={`https://skillicons.dev/icons?i=${name.toLowerCase()}`}
            alt={name}
            width={48}
            height={48}
            className="transition-all duration-700 scale-100 group-hover:scale-110"
            unoptimized
          />
        </div>
        <div>
          <h3 className="text-lg font-black text-foreground uppercase tracking-tighter group-hover:text-accent transition-all duration-500 relative inline-block">
            {name}
            <span className="absolute inset-0 text-accent/10 group-hover:translate-x-[1px] transition-transform pointer-events-none">{name}</span>
          </h3>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-end gap-1 h-6">
        <div className="flex items-end gap-1 h-full">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="resonance-bar w-1 bg-foreground/5 group-hover:bg-accent/40 transition-colors"
              style={{
                height: `${i * 20}%`,
                animationDelay: `${i * 0.15}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const DataLine = ({ text }: { text: string }) => (
  <div className="flex-shrink-0 mx-8 text-[8px] font-mono text-foreground/5 uppercase tracking-[0.8em] whitespace-nowrap italic transition-colors duration-700 py-2">
    {text} {" // "} {text} {" // "} {text}
  </div>
);

interface MarqueeProps {
  children: React.ReactNode;
  baseVelocity: number;
}

const KineticMarquee = ({ children, baseVelocity = 1 }: MarqueeProps) => {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], { clamp: false });
  const x = useTransform(baseX, (v) => `${wrap(-25, -50, v)}%`);

  useAnimationFrame((t, delta) => {
    let moveBy = baseVelocity * (delta / 1000);
    const vFactor = velocityFactor.get();
    moveBy += moveBy * vFactor;
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="flex overflow-hidden whitespace-nowrap flex-nowrap py-2 border-y border-border [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
      <motion.div className="flex whitespace-nowrap flex-nowrap items-center" style={{ x }}>
        {children}{children}{children}{children}
      </motion.div>
    </div>
  );
};

export const Stack = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    gsap.to(".tech-title-1", {
      x: -50,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
    gsap.to(".tech-title-2", {
      x: 50,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });

    const phaseLabel = document.querySelector(".phase-label-02");
    const fullText = "[ PHASE_02 // THE_ELEMENTS ]";
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
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      id="essence"
      className="relative py-80 bg-background overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-[1px] bg-[var(--separator-gray)] opacity-30" />
      <div className="absolute inset-0 -rotate-6 scale-150 pointer-events-none">
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,var(--foreground),transparent_1px),linear-gradient(to_bottom,var(--foreground),transparent_1px)] bg-[size:40px_40px] opacity-15"
          style={{ maskImage: 'radial-gradient(circle at center, black, transparent 90%)', WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 90%)' }}
        />
      </div>

      <div className="relative z-20">
        <div className="mx-auto max-w-[1400px] px-10 mb-40 text-left">
          <div className="flex items-center gap-4 mb-8 w-full">
            <div className="flex items-center font-mono text-accent">
              <span className="text-[12px] tracking-[0.6em] uppercase phase-label-02 font-bold">
              </span>
              <span className="text-[12px] animate-pulse">_</span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-accent/50 to-transparent" />
          </div>

          <h2 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-[-0.08em] text-foreground uppercase italic leading-[0.8] overflow-visible">
            <span className="inline-block tech-title-1">THE ENGINE OF</span> <br />
            <span className="inline-block tech-title-2 text-transparent ml-[10%] md:ml-[20%]" style={{ WebkitTextStroke: "1px var(--text-stroke)" }}>
              CREATION.
            </span>
          </h2>

          <div className="flex flex-col md:flex-row gap-12 items-start justify-between mt-12">
            <p className="text-xl md:text-3xl font-light text-foreground/40 max-w-2xl leading-tight tracking-tight">
              A precise distillation of modern primitives. Harnessing the <span className="text-accent italic">purest elements</span> of logic to build resilient digital systems.
            </p>
          </div>
        </div>
        <div className="relative -rotate-6 scale-110 md:scale-110 py-10">
          <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background via-background/80 to-transparent z-20 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background via-background/80 to-transparent z-20 pointer-events-none" />

          <div className="flex flex-col gap-2 relative z-10">
            <KineticMarquee baseVelocity={-0.6}>
              {TECH_LANGS.map((t) => <TechCard key={t} name={t} />)}
            </KineticMarquee>

            <KineticMarquee baseVelocity={1.2}>
              <DataLine text="SYNCHRONIZING_CORE_NODES_ACTIVE_PROTOCOL_ESTABLISHED_CONNECTION" />
            </KineticMarquee>

            <KineticMarquee baseVelocity={-0.4}>
              {TECH_VISUALS.map((t) => <TechCard key={t} name={t} />)}
            </KineticMarquee>

            <KineticMarquee baseVelocity={0.8}>
              <DataLine text="DECENTRALIZED_STRUCTURE_VERIFIED_ENCRYPTION_STABLE_FLUX_LOG" />
            </KineticMarquee>

            <KineticMarquee baseVelocity={-0.8}>
              {TECH_FOUNDATION.map((t) => <TechCard key={t} name={t} />)}
            </KineticMarquee>

            <KineticMarquee baseVelocity={1.5}>
              <DataLine text="SYSTEM_DIAGNOSTICS_COMPLETED_SUCCESS_VOLTAGE_NOMINAL_SYNC" />
            </KineticMarquee>

            <KineticMarquee baseVelocity={-0.5}>
              {TECH_WORKSHOP.map((t) => <TechCard key={t} name={t} />)}
            </KineticMarquee>
          </div>
        </div>
      </div>
    </section>
  );
};
