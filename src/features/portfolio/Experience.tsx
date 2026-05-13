'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from '@/lib/gsap';

const EXPERIENCES = [
  {
    company: "PassGate Technology",
    role: "Senior Backend Architect",
    period: "2022 — PRESENT",
    description: "Leading the architectural design of high-throughput real-time processing systems. Implementing Domain-Driven Design (DDD) and microservices orchestration.",
    achievements: [
      "Optimized data ingestion pipeline, reducing latency by 45%",
      "Engineered a scalable multi-tenant authentication protocol",
      "Mentored junior engineers on high-performance Go practices"
    ],
    tech: ["Golang", "Kubernetes", "Redis", "PostgreSQL"]
  },
  {
    company: "Neural Dynamics",
    role: "Fullstack Engineer",
    period: "2020 — 2022",
    description: "Developed AI-integrated dashboard systems with real-time data visualization. Focused on seamless bridge between complex backend logic and fluid frontend UX.",
    achievements: [
      "Built a custom WebGL-based visualization engine for big data",
      "Streamlined CI/CD workflows, improving deployment frequency by 3x",
      "Integrated OpenAI models for predictive user analytics"
    ],
    tech: ["Next.js", "Node.js", "Python", "Docker"]
  },
  {
    company: "Cyber Core Systems",
    role: "Software Developer",
    period: "2018 — 2020",
    description: "Focused on core systems development and database optimization for enterprise-scale ERP solutions.",
    achievements: [
      "Refactored legacy monolithic systems into modular services",
      "Reduced SQL query execution time by 60% through advanced indexing",
      "Participated in the design of internal API documentation standards"
    ],
    tech: ["Java", "Spring Boot", "MySQL", "AWS"]
  }
];

export const Experience = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    // Standard Scramble for Phase Label
    const phaseLabel = document.querySelector(".phase-label-05");
    const fullText = "[ PHASE_05 // THE_JOURNEY ]";
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

    // Reveal for entries
    gsap.from(".exp-entry", {
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 60%",
      },
      x: -30,
      opacity: 0,
      duration: 1.2,
      stagger: 0.3,
      ease: "power3.out"
    });

    // Titles Parallax
    gsap.to(".exp-title-1", {
      x: -100,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      }
    });
    gsap.to(".exp-title-2", {
      x: 100,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      }
    });
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      id="experience"
      className="relative py-40 bg-background overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-[1px] bg-[var(--separator-gray)] opacity-30" />
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:100px_100px]" />

      <div className="mx-auto max-w-[1400px] px-10 relative z-10">
        {/* Unified Header */}
        <div className="mb-40 text-left">
          <div className="flex items-center gap-4 mb-8 w-full">
            <div className="flex items-center font-mono text-accent">
              <span className="text-[12px] tracking-[0.6em] uppercase phase-label-05 font-bold">
                [ INITIALIZING_RECORDS ]
              </span>
              <span className="text-[12px] animate-pulse">_</span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-accent/50 to-transparent" />
          </div>

          <h2 className="text-6xl md:text-8xl lg:text-9xl font-black italic uppercase text-foreground tracking-tighter leading-[0.8] overflow-visible">
            <span className="inline-block exp-title-1">PROFESSIONAL</span> <br />
            <span className="inline-block exp-title-2 text-transparent" style={{ WebkitTextStroke: "1px var(--text-stroke)" }}>JOURNEY.</span>
          </h2>
        </div>
        <div className="flex flex-col gap-32">
          {EXPERIENCES.map((exp, i) => (
            <div key={i} className="exp-entry grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-20 relative">
              <div className="md:col-span-3 flex flex-col items-start">
                <span className="text-2xl font-black italic text-accent mb-4 tracking-tighter">{exp.period}</span>
              </div>
              <div className="md:col-span-9">
                <div className="mb-8">
                  <h3 className="text-4xl md:text-5xl font-black italic text-foreground uppercase tracking-tighter mb-2 leading-none">
                    {exp.role}
                  </h3>
                  <span className="text-lg font-mono text-foreground/40 uppercase tracking-widest">{exp.company}</span>
                </div>

                <p className="text-xl font-light text-foreground/50 mb-10 leading-relaxed max-w-3xl border-l border-border pl-10">
                  {exp.description}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Achievements */}
                  <div className="flex flex-col gap-4">
                    <span className="text-[9px] font-mono text-accent/60 uppercase tracking-[0.3em] mb-2 font-bold">Core_Achievements //</span>
                    <ul className="space-y-4">
                      {exp.achievements.map((item, idx) => (
                        <li key={idx} className="flex gap-4 items-start group">
                          <span className="text-accent font-mono text-[10px] mt-1 group-hover:translate-x-1 transition-transform">▸</span>
                          <span className="text-sm font-mono text-foreground/40 group-hover:text-foreground transition-colors uppercase leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tech HUD */}
                  <div className="flex flex-col gap-4">
                    <span className="text-[9px] font-mono text-accent/60 uppercase tracking-[0.3em] mb-2 font-bold">Deployed_Stack //</span>
                    <div className="flex flex-wrap gap-2">
                      {exp.tech.map(t => (
                        <span key={t} className="px-3 py-1 border border-border bg-card text-[9px] font-mono text-foreground/40 uppercase tracking-widest">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="mt-8 p-4 border border-border bg-card rounded-sm">
                      <div className="text-[8px] font-mono text-foreground/30 uppercase tracking-widest">
                        Security: VERIFIED // <br />
                        Status: ARCHIVED_SUCCESS
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
