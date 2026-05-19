'use client';

import { useRef, useState, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "@/lib/gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useTheme } from "next-themes";
import { PortraitMorph } from "@/components/shared/PortraitMorph";

gsap.registerPlugin(ScrollTrigger);

interface Project {
  id: string;
  daiji: string;
  title: string;
  blade: string;
  description: string;
  image: string;
  tags: string[];
  protocol: string;
  year: string;
}

const PROJECTS: Project[] = [
  {
    id: '01',
    daiji: '壹',
    title: 'Nexus Data Engine',
    blade: 'THE NODACHI [大太刀]',
    description: 'A high-throughput distributed data processing engine built with Rust and WebAssembly, forged to slice through massive real-time data streams.',
    image: '/projects/ai-platform.png',
    tags: ['Rust', 'Wasm', 'K8s'],
    protocol: 'DISTRIBUTED_CORE_V1',
    year: '2024'
  },
  {
    id: '02',
    daiji: '貳',
    title: 'Aether Design System',
    blade: 'THE KATANA [刀]',
    description: 'An enterprise-scale design system focused on sharp layout precision and high-fidelity, fluid micro-interactions.',
    image: '/projects/ecommerce.png',
    tags: ['Next.js', 'GSAP', 'Three.js'],
    protocol: 'VISUAL_SYSTEM_ALPHA',
    year: '2023'
  },
  {
    id: '03',
    daiji: '參',
    title: 'Sentience Analytics',
    blade: 'THE WAKIZASHI [脇差]',
    description: 'Full-stack AI-driven analytics dashboard with real-time 3D visualizations, swift and responsive like a companion blade.',
    image: '/projects/crypto.png',
    tags: ['React', 'Fiber', 'Python'],
    protocol: 'SENTIENT_LOGIC_HUB',
    year: '2024'
  },
  {
    id: '04',
    daiji: '肆',
    title: 'Void Protocol',
    blade: 'THE TANTO [短刀]',
    description: 'High-performance cryptographic communication layer for the decentralized era, concealed, compact, and structurally unbreakable.',
    image: '/projects/ai-platform.png',
    tags: ['Go', 'Solidity', 'Wasm'],
    protocol: 'CRYPT_LAYER_OMEGA',
    year: '2022'
  },
];

const ProjectCard = ({ project, index, isDark }: { project: Project, index: number, isDark: boolean }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const watermarkRef = useRef<HTMLSpanElement>(null);
  const backingPaperRef = useRef<HTMLDivElement>(null);
  const photoScreenRef = useRef<HTMLDivElement>(null);
  const isEven = index % 2 === 0;

  useGSAP(() => {
    if (!imageRef.current) return;

    gsap.to(imageRef.current, {
      y: "12%",
      ease: "none",
      scrollTrigger: {
        trigger: cardRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });

    if (textRef.current) {
      gsap.fromTo(textRef.current,
        { y: isEven ? 40 : -40 },
        {
          y: isEven ? -40 : 40,
          ease: "none",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        }
      );
    }

    if (watermarkRef.current) {
      gsap.to(watermarkRef.current, {
        y: isEven ? -50 : 50,
        ease: "none",
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
    }

    if (backingPaperRef.current) {
      gsap.to(backingPaperRef.current, {
        y: isEven ? -22 : 22,
        rotate: isEven ? -5.5 : -1,
        ease: "none",
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
    }

    if (photoScreenRef.current) {
      gsap.to(photoScreenRef.current, {
        y: isEven ? 16 : -16,
        rotate: isEven ? 3 : -0.5,
        ease: "none",
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
    }

    gsap.from(`.project-reveal-${index}`, {
      y: 50,
      opacity: 0,
      duration: 1.4,
      stagger: 0.15,
      ease: "power3.out",
      scrollTrigger: {
        trigger: cardRef.current,
        start: "top 75%",
      }
    });
  }, { scope: cardRef });

  return (
    <div
      ref={cardRef}
      className={`relative w-full flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 md:gap-16 lg:gap-24 mb-32 md:mb-48 items-center`}
    >
      <span
        ref={watermarkRef}
        className={`absolute text-[22vw] lg:text-[26vw] font-serif font-black text-foreground select-none pointer-events-none leading-none z-0 opacity-[0.012] ${isEven ? 'right-[5%] lg:right-[8%]' : 'left-[5%] lg:left-[8%]'}`}
        style={{ filter: "url(#line-torn-filter)" }}
      >
        {project.daiji}
      </span>
      <div className="flex-1 group cursor-none w-full z-10 relative flex justify-center items-center">
        <div className="relative w-full max-w-[480px] aspect-[16/10] rotate-[1.5deg] group-hover:rotate-[0.5deg] transition-all duration-700 avatar-frame">
          <div className="absolute top-[-12px] left-[-12px] w-[20px] h-[1px] bg-foreground/20 pointer-events-none" />
          <div className="absolute top-[-12px] left-[-12px] w-[1px] h-[20px] bg-foreground/20 pointer-events-none" />
          <div className="absolute bottom-[-12px] right-[-12px] w-[20px] h-[1px] bg-foreground/20 pointer-events-none" />
          <div className="absolute bottom-[-12px] right-[-12px] w-[1px] h-[20px] bg-foreground/20 pointer-events-none" />
          <div
            ref={backingPaperRef}
            className="absolute inset-0 bg-foreground/5 border border-foreground/15 rotate-[-2.5deg] transition-all duration-700 group-hover:rotate-[-4deg] group-hover:bg-foreground/[0.08] pointer-events-none"
            style={{ filter: "url(#line-torn-filter)" }}
          />
          <div ref={photoScreenRef} className="absolute inset-0 bg-background/20 backdrop-blur-sm rotate-[1.5deg] transition-all duration-700 group-hover:rotate-[0.5deg] overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.25)] group-hover:shadow-[0_0_40px_rgba(239,68,68,0.25),0_12px_32px_rgba(0,0,0,0.25)] border border-transparent group-hover:border-orange-500/20">
            <div className="relative w-full h-full overflow-hidden bg-card">
              <div ref={imageRef} className="absolute -left-[5%] -right-[5%] w-[110%] h-[130%] -top-[15%]">
                <PortraitMorph
                  srcA={project.image}
                  srcB={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover object-center scale-105 group-hover:scale-100 transition-all duration-1000 grayscale contrast-[1.25] opacity-80 group-hover:opacity-100 group-hover:contrast-[1.38] group-hover:grayscale-0"
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent opacity-60 pointer-events-none" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none z-30 transition-opacity duration-200 overflow-hidden">
                <div className="absolute top-[-50%] left-[-50%] w-[35%] h-[200%] bg-gradient-to-r from-transparent via-white/80 to-transparent rotate-[35deg] translate-x-[-150%] group-hover:translate-x-[500%] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />
              </div>
            </div>
          </div>
          <div
            className="absolute inset-0 rotate-[1.5deg] transition-all duration-700 group-hover:rotate-[0.5deg] pointer-events-none z-20"
          >
            <div
              className="absolute inset-[-20px] border-[44px] border-background"
              style={{ filter: "url(#project-torn-mask)" }}
            />
            <div
              className="absolute inset-[16px] border border-foreground/20"
              style={{ filter: "url(#project-torn-mask)" }}
            />
            <div className="absolute inset-[10px] border border-foreground/[0.03] rotate-[-1deg]" />
          </div>
        </div>
      </div>
      <div ref={textRef} className="flex-1 flex flex-col justify-center z-10 w-full px-2 md:px-0 relative">
        <div className={`flex items-center gap-4 mb-4 md:mb-5 mt-4 lg:mt-0 project-reveal-${index} project-reveal-tag`}>
          <span className="text-[10px] font-mono text-foreground/50 uppercase tracking-widest font-bold">
            {project.blade} {'//'} {project.year}
          </span>
          <div className="h-[2px] w-8 md:w-12 bg-foreground/15" style={{ filter: "url(#line-torn-filter)" }} />
        </div>

        <h3 className={`text-3xl md:text-4xl lg:text-5xl font-serif font-light text-foreground uppercase tracking-tight mb-4 md:mb-6 leading-tight project-reveal-${index}`}>
          {project.title}
        </h3>

        <p className={`text-sm md:text-base font-light text-foreground/45 leading-relaxed mb-6 md:mb-8 max-w-xl project-reveal-${index}`}>
          {project.description}
        </p>

        <div className={`flex flex-wrap gap-2 md:gap-3 mb-8 md:mb-10 project-reveal-${index}`}>
          {project.tags.map((tag: string) => (
            <span
              key={tag}
              className="px-2.5 py-1 border border-foreground/15 text-[9px] font-mono text-foreground/50 uppercase tracking-widest bg-foreground/[0.02]"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className={`pt-6 border-t border-foreground/10 flex flex-col gap-2 relative project-reveal-${index}`}>
          <div className="absolute top-0 left-0 w-full h-[1px] bg-foreground/10" style={{ filter: "url(#line-torn-filter)" }} />
          <span className="text-[9px] font-mono text-foreground/40 uppercase tracking-widest">METALLURGY: {project.protocol}</span>
          <span className="text-[9px] font-mono text-foreground/40 uppercase tracking-widest">VERIFICATION: FORGED_STABLE</span>
        </div>
      </div>
    </div>
  );
};

export const Artifacts = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  useEffect(() => {
    setMounted(true);
  }, []);

  useGSAP(() => {
    if (!sectionRef.current) return;

    gsap.from(".artifacts-reveal-top", {
      y: -20,
      opacity: 0,
      duration: 1.2,
      stagger: 0.15,
      ease: "power3.out",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 80%",
      }
    });

    // Synchronized title parallax with ease: "none" matching Philosophy
    gsap.to(".artifacts-title-1", {
      x: -30,
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
    gsap.to(".artifacts-title-2", {
      x: 30,
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });

    // Header ink image Parallax scroll (moves downwards slowly)
    gsap.to(".artifacts-header-img", {
      y: 80,
      ease: "none",
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
      className="relative py-28 md:py-44 bg-background overflow-hidden select-none"
    >
      <svg className="absolute w-0 h-0 invisible" aria-hidden="true">
        <defs>
          <filter id="line-torn-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="project-torn-mask" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="18" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <div
        className="artifacts-header-img absolute right-[4%] md:right-[6%] top-[3%] md:top-[3%] w-48 sm:w-[260px] md:w-[380px] lg:w-[460px] aspect-[3/4] pointer-events-none z-0 opacity-[0.85] mix-blend-multiply dark:mix-blend-screen dark:opacity-[0.55] transition-opacity duration-700"
        style={{ filter: isDark ? "invert(1) grayscale(1)" : "invert(0) grayscale(0)" }}
      >
        <Image
          src="/images/be-calm-stay-in-control.jpg"
          alt="Be Calm Stay In Control Art"
          fill
          className="object-contain grayscale contrast-[1.15]"
          style={{
            maskImage: "linear-gradient(to bottom, black 60%, transparent 100%), linear-gradient(to right, black 40%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%), linear-gradient(to right, black 40%, transparent 100%)",
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in"
          }}
          priority
        />
      </div>

      <div className="mx-auto max-w-[1400px] px-6 md:px-10 relative z-10">
        <div className="mb-24 md:mb-40 text-left">
          <div className="flex items-center gap-4 mb-8 w-full artifacts-reveal-top">
            <div className="flex items-center font-mono text-foreground/75">
              <span className="text-[10px] md:text-[12px] tracking-[0.5em] uppercase font-bold">
                [ CHAPTER II : CREATIONS ]
              </span>
            </div>
          </div>

          <h2 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-light uppercase text-foreground tracking-tighter leading-[0.85] lg:leading-[0.8] overflow-visible artifacts-reveal-top">
            <span className="inline-block artifacts-title-1">FORGED</span> <br />
            <span className="inline-block artifacts-title-2 text-transparent" style={{ WebkitTextStroke: isDark ? "1.5px rgba(255,255,255,0.7)" : "1.5px rgba(0,0,0,0.7)" }}>BLADES.</span>
          </h2>

          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start justify-between mt-10 md:mt-12 artifacts-reveal-top">
            <p className="text-xl md:text-3xl font-light text-foreground/45 max-w-2xl leading-tight tracking-tight">
              A grand exhibition of <span className="text-foreground font-semibold underline decoration-foreground/30 underline-offset-4">architectural manifestations</span>. Each creation is a forged blade, balanced between high-precision logic and silent aesthetics.
            </p>
          </div>
        </div>
        <div className="flex flex-col">
          {PROJECTS.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} isDark={isDark} />
          ))}
        </div>
      </div>
    </section>
  );
};


