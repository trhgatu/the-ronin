'use client';

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "@/lib/gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  protocol: string;
  year: string;
}

const PROJECTS: Project[] = [
  {
    id: '01',
    title: 'Nexus Data Engine',
    description: 'A high-throughput distributed data processing engine built with Rust and WebAssembly.',
    image: '/projects/ai-platform.png',
    tags: ['Rust', 'Wasm', 'K8s'],
    protocol: 'DISTRIBUTED_CORE_V1',
    year: '2024'
  },
  {
    id: '02',
    title: 'Aether Design System',
    description: 'An enterprise-scale design system focused on high-fidelity micro-interactions.',
    image: '/projects/ecommerce.png',
    tags: ['Next.js', 'GSAP', 'Three.js'],
    protocol: 'VISUAL_SYSTEM_ALPHA',
    year: '2023'
  },
  {
    id: '03',
    title: 'Sentience Analytics',
    description: 'Full-stack AI-driven analytics dashboard with real-time 3D visualizations.',
    image: '/projects/crypto.png',
    tags: ['React', 'Fiber', 'Python'],
    protocol: 'SENTIENT_LOGIC_HUB',
    year: '2024'
  },
  {
    id: '04',
    title: 'Void Protocol',
    description: 'High-performance cryptographic communication layer for the decentralized era.',
    image: '/projects/ai-platform.png',
    tags: ['Go', 'Solidity', 'Wasm'],
    protocol: 'CRYPT_LAYER_OMEGA',
    year: '2022'
  },
];

const ProjectCard = ({ project, index }: { project: Project, index: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const isEven = index % 2 === 0;

  useGSAP(() => {
    if (!imageRef.current) return;

    gsap.to(imageRef.current, {
      y: "15%",
      ease: "none",
      scrollTrigger: {
        trigger: cardRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });

    gsap.from(`.project-info-${index}`, {
      y: 40,
      opacity: 0,
      duration: 1.2,
      scrollTrigger: {
        trigger: cardRef.current,
        start: "top 70%",
      }
    });
  }, { scope: cardRef });

  return (
    <div
      ref={cardRef}
      className={`relative w-full flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 md:gap-16 lg:gap-24 mb-32 md:mb-60`}
    >
      <span className={`absolute -top-10 md:-top-20 ${isEven ? '-left-4 md:-left-10' : '-right-4 md:-right-10'} text-[20vw] lg:text-[15vw] font-black italic text-foreground/[0.03] pointer-events-none select-none`}>
        {project.id}
      </span>

      <div className="flex-1 group cursor-none order-1">
        <div className="relative aspect-[16/10] overflow-hidden border border-border group-hover:border-accent/40 transition-all duration-700 bg-card shadow-2xl">
          <div ref={imageRef} className="absolute inset-0 h-[130%] -top-[15%]">
            <Image
              src={project.image}
              alt={project.title}
              fill
              className="object-cover grayscale-[40%] group-hover:grayscale-0 transition-all duration-1000 opacity-70 group-hover:opacity-100"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60" />

          <div className="absolute inset-0 bg-[linear-gradient(transparent,rgba(251,191,36,0.03),transparent)] bg-[size:100%_4px] animate-scanline pointer-events-none opacity-0 group-hover:opacity-100" />
        </div>
      </div>

      <div className={`flex-1 flex flex-col justify-center project-info-${index} order-2 px-2 md:px-0`}>
        <div className="flex items-center gap-4 mb-4 md:mb-6 mt-6 lg:mt-0">
          <span className="text-[9px] md:text-[10px] font-mono text-accent uppercase tracking-widest italic">
            {`Artifact_${project.id} // ${project.year}`}
          </span>
          <div className="h-px w-8 md:w-12 bg-accent/30" />
        </div>

        <h3 className="text-3xl md:text-5xl lg:text-6xl font-black italic text-foreground uppercase tracking-tighter mb-4 md:mb-8 leading-tight lg:leading-none">
          {project.title}
        </h3>

        <p className="text-base md:text-lg lg:text-xl font-light text-foreground/40 leading-relaxed mb-6 md:mb-10 max-w-xl">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2 md:gap-3 mb-8 md:mb-10">
          {project.tags.map((tag: string) => (
            <span key={tag} className="px-2 md:px-3 py-1 border border-border text-[8px] md:text-[9px] font-mono text-foreground/40 uppercase tracking-widest bg-card">
              {tag}
            </span>
          ))}
        </div>

        <div className="pt-6 md:pt-8 border-t border-border flex flex-col gap-2">
          <span className="text-[8px] md:text-[9px] font-mono text-foreground/30 uppercase tracking-widest">Protocol: {project.protocol}</span>
          <span className="text-[8px] md:text-[9px] font-mono text-foreground/30 uppercase tracking-widest">Verification: STABLE_V2</span>
        </div>
      </div>
    </div>
  );
};

export const Artifacts = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current) return;

    // Standard Scramble for Phase Label
    const phaseLabel = document.querySelector(".phase-label-04");
    const fullText = "[ PHASE_04 // THE_ARTIFACTS ]";
    const scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789[]//_!@#$%^&*";

    gsap.to({}, {
      duration: 3,
      scrollTrigger: {
        trigger: sectionRef.current,
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

    // Titles Parallax
    gsap.to(".artifacts-title-1", {
      x: -50, // Reduced from -100 for better mobile safety
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      }
    });
    gsap.to(".artifacts-title-2", {
      x: 50, // Reduced from 100
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      }
    });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="artifacts"
      className="relative py-24 md:py-40 bg-background overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-[1px] bg-[var(--separator-gray)] opacity-30" />
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:60px_60px] md:bg-[size:100px_100px]" />

      <div className="mx-auto max-w-[1400px] px-6 md:px-10 relative z-10">
        {/* Unified Header */}
        <div className="mb-24 md:mb-60 text-left">
          <div className="flex items-center gap-4 mb-8 w-full">
            <div className="flex items-center font-mono text-accent">
              <span className="text-[10px] md:text-[12px] tracking-[0.4em] md:tracking-[0.6em] uppercase phase-label-04 font-bold">
                [ INITIALIZING_ARCHIVE ]
              </span>
              <span className="text-[12px] animate-pulse">_</span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-accent/50 to-transparent" />
          </div>

          <h2 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black italic uppercase text-foreground tracking-tighter leading-[0.85] lg:leading-[0.8] overflow-visible">
            <span className="inline-block artifacts-title-1">SELECTED</span> <br />
            <span className="inline-block artifacts-title-2 text-transparent" style={{ WebkitTextStroke: "1px var(--text-stroke)" }}>ARTIFACTS.</span>
          </h2>

          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start justify-between mt-12 md:mt-16">
            <p className="text-xl md:text-3xl font-light text-foreground/40 max-w-2xl leading-tight tracking-tight">
              A curated collection of <span className="text-accent italic">digital manifestations</span>. Each artifact represents a specific convergence of logic, aesthetics, and architectural intent.
            </p>
            <div className="text-[8px] font-mono text-foreground/30 max-w-[200px] leading-relaxed opacity-50 uppercase border-l border-border pl-6 hidden sm:block">
              Protocol: 04_THE_ARTIFACTS //
              Status: VERIFIED //
              Archive: SECURE
              <br /><br />
              Custodian: trhgatu
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          {PROJECTS.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};
