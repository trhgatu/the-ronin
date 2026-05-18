'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from '@/lib/gsap';
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from 'framer-motion';

const EXPERIENCES = [
  {
    company: "8eyond Infinite",
    role: "Founder | The Alchemist",
    period: "2025 — PRESENT",
    description: "Forging 'Vertical Infinity' through the alchemy of code. Establishing architectural paradigms that defy obsolescence, transmuting raw logic into immortal digital legacies.",
    achievements: [
      "Architecting production-grade, multi-stack core ecosystems (Go, NestJS, Next.js, Angular)",
      "Distilling system chaos into elegant Clean Architecture, DDD, and Event-Driven cosmos",
      "Engineering advanced starter templates and CLI tools to transcend conventional development limits"
    ],
    techBooks: [
      {
        id: "earth",
        kanji: "地",
        title: "The Book of Earth",
        subtitle: "Foundations & Core Platforms",
        items: ["Go", "TypeScript", "JavaScript", "NestJS", "Next.js", "Angular", "React Native", "Turborepo"]
      },
      {
        id: "water",
        kanji: "水",
        title: "The Book of Water",
        subtitle: "Fluid Dynamics & Visual Mastery",
        items: ["Three.js", "OGL", "Canvas", "8eyond UI"]
      },
      {
        id: "fire",
        kanji: "火",
        title: "The Book of Fire",
        subtitle: "Scaling, Monitoring & Infra Forge",
        items: ["Docker", "K8s", "Grafana", "Prometheus"]
      },
      {
        id: "wind",
        kanji: "風",
        title: "The Book of Wind",
        subtitle: "Empire Styling & Community Starters",
        items: ["Advanced Starters", "8eyond CLI"]
      },
      {
        id: "void",
        kanji: "空",
        title: "The Book of Void",
        subtitle: "Obsolescence-Defying Paradigms",
        items: ["Clean Architecture", "Domain-Driven Design", "Event-Driven Architecture"]
      }
    ],
    kanji: "錬"
  },
  {
    company: "CyberSkill",
    role: "Fullstack Developer (formerly Frontend Intern)",
    period: "2024 — 2025",
    description: "Began as a Frontend Developer Intern, rapidly advancing to a Fullstack Developer. Engineered high-impact client interfaces and optimized robust data architectures across multiple active production projects.",
    achievements: [
      "Engineered 'Colvemat' hybrid mobile platform utilizing Ionic and Angular for seamless cross-platform performance",
      "Architected the backend for 'NextPro' e-commerce solution, leveraging Django to drive flexible and scalable product structures",
      "Built 'DPD' (Day Past Due) financial tracking backend using NestJS and GraphQL for rapid, highly-efficient data querying"
    ],
    tech: ["Ionic", "Angular", "NestJS", "GraphQL", "Django"],
    kanji: "昇"
  },
  {
    company: "HUIT (HCMC University of Industry and Trade)",
    role: "Information Systems Student",
    period: "2020 — 2024",
    description: "Studied Information Technology with a specialization in Information Systems. Developed foundational software engineering instincts, learning to map complex real-world business flows into clean technical blueprints.",
    achievements: [
      "Mastered core object-oriented software engineering foundations across C#, Java, and Web standard (HTML/CSS/JS) paradigms",
      "Designed advanced data architectures utilizing relational databases (Microsoft SQL) and modern NoSQL models (MongoDB, Neo4j Graph DB)",
      "Acquired business analysis (BA) mastery, mapping enterprise workflows and system flows into comprehensive UML schemas"
    ],
    tech: ["C#", "Java", "MSSQL", "MongoDB", "Neo4j", "System Analysis"],
    kanji: "基" // Ki - Foundation / Base
  }
];

export const Experience = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeBook, setActiveBook] = useState('earth');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useGSAP(() => {
    if (!containerRef.current) return;

    // Title reveal
    gsap.from(".exp-reveal-top", {
      y: -20,
      opacity: 0,
      duration: 1.2,
      stagger: 0.15,
      ease: "power3.out",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 80%",
      }
    });

    // Titles Parallax
    gsap.to(".exp-title-1", {
      x: 30,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      }
    });
    gsap.to(".exp-title-2", {
      x: -30,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      }
    });

    // Reveal for entries (Ink dropping effect)
    gsap.from(".exp-entry", {
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 50%",
      },
      y: 50,
      opacity: 0,
      filter: "blur(10px)",
      duration: 1.5,
      stagger: 0.4,
      ease: "power2.out"
    });

    // Parallax for Kanji watermarks
    gsap.utils.toArray<HTMLElement>(".kanji-watermark").forEach((el) => {
      gsap.to(el, {
        y: -100,
        scrollTrigger: {
          trigger: el.parentElement,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5
        }
      });
    });

  }, { scope: containerRef });

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  return (
    <section
      ref={containerRef}
      id="experience"
      className="relative py-28 md:py-48 bg-background overflow-hidden"
    >
      {/* Torn Edge Transition Separator */}
      <div
        className="absolute top-0 left-0 w-full h-[3px] bg-foreground/15 opacity-60"
        style={{ filter: "url(#line-torn-filter)" }}
      />

      {/* Subtle Japanese Washi Paper Background Texture */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />

      {/* SVG filter definition for horizontal line tearing */}
      <svg className="absolute w-0 h-0 invisible" aria-hidden="true">
        <defs>
          <filter id="line-torn-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className="mx-auto max-w-[1400px] px-6 md:px-10 relative z-10">
        <div className="mb-32 md:mb-52 text-left">
          <div className="flex items-center gap-4 mb-8 w-full exp-reveal-top">
            <div className="flex items-center font-mono text-foreground/75">
              <span className="text-[10px] md:text-[12px] tracking-[0.5em] uppercase font-bold">
                [ CHAPTER V : THE BATTLES ]
              </span>
            </div>
            <div className="h-[2px] flex-1 bg-foreground/15" style={{ filter: "url(#line-torn-filter)" }} />
          </div>

          <h2 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-light uppercase text-foreground tracking-tighter leading-[0.85] lg:leading-[0.8] overflow-visible exp-reveal-top whitespace-nowrap">
            <span className="inline-block exp-title-1 whitespace-nowrap">PATH OF THE</span> <br />
            <span className="inline-block exp-title-2 text-transparent ml-[5%] md:ml-[15%] whitespace-nowrap" style={{ WebkitTextStroke: isDark ? "1.5px rgba(255,255,255,0.7)" : "1.5px rgba(0,0,0,0.7)" }}>WANDERER.</span>
          </h2>
        </div>

        <div className="flex flex-col gap-24 md:gap-40">
          {EXPERIENCES.map((exp, i) => (
            <div key={i} className="exp-entry grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-20 relative">

              {/* Giant Kanji Watermark */}
              <div
                className="kanji-watermark absolute right-[-5%] md:right-[10%] top-[-20%] font-serif font-black text-[200px] md:text-[300px] select-none pointer-events-none text-foreground leading-none z-0"
                style={{ opacity: 0.02, filter: "url(#line-torn-filter)" }}
              >
                {exp.kanji}
              </div>

              {/* Timeline Period */}
              <div className="md:col-span-3 flex flex-col items-start z-10">
                <span className="text-xl md:text-2xl font-serif font-light text-foreground/80 mb-4 md:mb-0 tracking-tight flex items-center gap-4">
                  <span className="w-8 h-[2px] bg-foreground/30" style={{ filter: "url(#line-torn-filter)" }} />
                  {exp.period}
                </span>
              </div>

              {/* Experience Details */}
              <div className="md:col-span-9 z-10 relative">
                <div className="mb-8 md:mb-12">
                  <h3 className="text-4xl md:text-6xl font-serif font-light text-foreground uppercase tracking-tighter mb-4 leading-tight md:leading-none">
                    {exp.role}
                  </h3>
                  <span className="text-sm md:text-base font-mono font-bold text-foreground/60 uppercase tracking-[0.3em]">{exp.company}</span>
                </div>

                <p className="text-lg md:text-2xl font-serif font-light text-foreground/70 mb-12 md:mb-16 leading-relaxed max-w-3xl relative pl-6 md:pl-10">
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-foreground/20" style={{ filter: "url(#line-torn-filter)" }} />
                  {exp.description}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
                  {/* Achievements */}
                  <div className="flex flex-col gap-6 lg:col-span-7">
                    <span className="text-[10px] font-mono text-foreground/50 uppercase tracking-[0.4em] mb-2 font-bold">Chronicles of Battle //</span>
                    <ul className="space-y-4 md:space-y-6">
                      {exp.achievements.map((item, idx) => (
                        <li key={idx} className="flex gap-4 items-start group">
                          <span className="text-foreground/40 font-serif text-sm mt-1 group-hover:translate-x-2 transition-transform duration-500">一</span>
                          <span className="text-sm md:text-base font-serif font-light text-foreground/60 group-hover:text-foreground transition-colors duration-500 leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col gap-6 lg:col-span-5 w-full">
                    <span className="text-[10px] font-mono text-foreground/50 uppercase tracking-[0.4em] mb-2 font-bold">Arsenal & Weapons //</span>
                    {exp.techBooks ? (
                      <div className="flex flex-col gap-6 w-full">
                        <div className="grid grid-cols-5 gap-1 pb-3 relative">
                          {exp.techBooks.map((book) => {
                            const isSelected = activeBook === book.id;
                            return (
                              <button
                                key={book.id}
                                onClick={() => setActiveBook(book.id)}
                                className="flex flex-col items-center gap-1 py-2 transition-all duration-300 relative group pointer-events-auto cursor-pointer"
                              >
                                <span
                                  className={`
                                    font-serif text-2xl transition-all duration-300
                                    ${isSelected
                                      ? "text-[#8b0000] font-bold scale-110"
                                      : "text-foreground/30 group-hover:text-foreground/75 group-hover:scale-105"
                                    }
                                  `}
                                >
                                  {book.kanji}
                                </span>
                                <span
                                  className={`
                                    text-[7.5px] font-mono tracking-widest uppercase transition-colors duration-300
                                    ${isSelected
                                      ? "text-[#8b0000] font-black"
                                      : "text-foreground/35 group-hover:text-foreground/60"
                                    }
                                  `}
                                >
                                  {book.id}
                                </span>

                                {isSelected && (
                                  <motion.div
                                    layoutId="activeBookUnderline"
                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#8b0000]"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    style={{ filter: "url(#line-torn-filter)" }}
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <div className="min-h-[100px]">
                          <AnimatePresence mode="wait">
                            {exp.techBooks.map((book) => {
                              if (book.id !== activeBook) return null;
                              return (
                                <motion.div
                                  key={book.id}
                                  initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                  exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                                  transition={{ duration: 0.35, ease: "easeOut" }}
                                  className="flex flex-col gap-3 w-full"
                                >
                                  <div className="flex flex-col">
                                    <span className="text-[11px] font-serif font-black text-foreground uppercase tracking-[0.2em]">{book.title}</span>
                                    <span className="text-[9px] font-serif text-foreground/40 italic tracking-wider mt-0.5">{book.subtitle}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {book.items.map((t) => (
                                      <span key={t} className="px-3 py-1.5 border border-foreground/15 bg-background text-[9px] font-mono text-foreground/60 uppercase tracking-widest relative overflow-hidden group select-none">
                                        <span className="absolute inset-0 bg-foreground scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out z-0" style={{ filter: "url(#line-torn-filter)" }} />
                                        <span className="relative z-10 group-hover:text-background transition-colors duration-500">{t}</span>
                                      </span>
                                    ))}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {exp.tech?.map(t => (
                          <span key={t} className="px-4 py-2 border border-foreground/15 bg-background text-[10px] font-mono text-foreground/60 uppercase tracking-widest relative overflow-hidden group">
                            <span className="absolute inset-0 bg-foreground scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out z-0" style={{ filter: "url(#line-torn-filter)" }} />
                            <span className="relative z-10 group-hover:text-background transition-colors duration-500">{t}</span>
                          </span>
                        ))}
                      </div>
                    )}
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


