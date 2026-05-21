'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from '@/lib/gsap';
import { useTheme } from "next-themes";
import Image from 'next/image';
import { soundManager } from '@/lib/sound';

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
    image: "/images/musashi-3.jpg"
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
    image: "/images/musashi-2.jpg"
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
    image: "/images/water.jpg"
  }
];

const FootprintSVG = ({ isLeft, className }: { isLeft: boolean; className?: string }) => (
  <svg
    viewBox="0 0 100 180"
    className={`${className} ${isLeft ? "scale-x-[-1]" : ""}`}
    style={{ filter: "url(#footprint-ink-bleed)" }}
  >
    {/* 1. Solid Background Mask in page background color at 100% opacity */}
    <g className="text-background" fill="currentColor">
      <path d="M 50,155 C 38,155 30,140 30,122 C 30,105 38,98 42,88 C 45,78 38,65 33,48 C 30,38 33,26 50,26 C 67,26 70,38 67,48 C 62,65 55,78 58,88 C 62,98 70,105 70,122 C 70,140 62,155 50,155 Z" />
      <ellipse cx="48" cy="14" rx="9" ry="12" />
      <ellipse cx="66" cy="18" rx="6.5" ry="9" />
      <ellipse cx="79" cy="27" rx="5.5" ry="8" />
      <ellipse cx="88" cy="40" rx="4.5" ry="7.5" />
      <ellipse cx="93" cy="54" rx="3.5" ry="6.5" />
    </g>

    {/* 2. Translucent Foreground Ink Stamp on top */}
    <g className="text-foreground opacity-[0.55] dark:opacity-[0.28]" fill="currentColor">
      <path d="M 50,155 C 38,155 30,140 30,122 C 30,105 38,98 42,88 C 45,78 38,65 33,48 C 30,38 33,26 50,26 C 67,26 70,38 67,48 C 62,65 55,78 58,88 C 62,98 70,105 70,122 C 70,140 62,155 50,155 Z" />
      <ellipse cx="48" cy="14" rx="9" ry="12" />
      <ellipse cx="66" cy="18" rx="6.5" ry="9" />
      <ellipse cx="79" cy="27" rx="5.5" ry="8" />
      <ellipse cx="88" cy="40" rx="4.5" ry="7.5" />
      <ellipse cx="93" cy="54" rx="3.5" ry="6.5" />
    </g>
  </svg>
);

export const Experience = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeBook, setActiveBook] = useState('earth');

  useEffect(() => {
    setMounted(true);
  }, []);

  useGSAP(() => {
    if (!mounted || !containerRef.current) return;

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

    // Synchronized title parallax with ease: "none" matching Philosophy
    gsap.to(".exp-title-1", {
      x: -30,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
    gsap.to(".exp-title-2", {
      x: 30,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });

    EXPERIENCES.forEach((_, i) => {
      gsap.fromTo(`.footprint-stamp-${i}`,
        {
          opacity: 0,
          scale: 1.7,
        },
        {
          opacity: 1,
          scale: 1.0,
          duration: 1.1,
          ease: "back.out(2)",
          scrollTrigger: {
            trigger: `.exp-entry-${i}`,
            start: "top 62%",
            once: true,
            onEnter: () => {
              soundManager?.playFootstep();
            }
          }
        }
      );
    });

  }, { scope: containerRef, dependencies: [mounted] });

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  return (
    <section
      ref={containerRef}
      id="experience"
      className="relative py-28 md:py-48 bg-background overflow-hidden"
    >
      <div
        className="absolute top-0 left-0 w-full h-[3px] bg-foreground/15 opacity-60"
        style={{ filter: "url(#line-torn-filter)" }}
      />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat z-0" />
      <svg className="absolute w-0 h-0 invisible" aria-hidden="true">
        <defs>
          <filter id="line-torn-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="hanko-torn-filter-exp" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.16" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="footprint-ink-bleed" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" result="displaced" />
            <feGaussianBlur in="displaced" stdDeviation="1.5" result="blurred" />
            <feMerge>
              <feMergeNode in="blurred" />
              <feMergeNode in="displaced" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <div className="mx-auto max-w-[1400px] px-6 md:px-10 relative z-10">
        <div className="mb-24 md:mb-40 text-left relative">

          <div className="flex items-center gap-4 mb-8 w-full exp-reveal-top">
            <div className="flex items-center font-mono text-foreground/75">
              <span className="text-[10px] md:text-[12px] tracking-[0.5em] uppercase font-bold">
                [ CHAPTER V : THE WATER PATH ]
              </span>
            </div>
          </div>

          <h2 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-light uppercase text-foreground tracking-tighter leading-[0.85] lg:leading-[0.8] overflow-visible exp-reveal-top whitespace-nowrap">
            <span className="inline-block exp-title-1 whitespace-nowrap">PATH OF THE</span> <br />
            <span className="inline-block exp-title-2 text-transparent ml-[5%] md:ml-[15%] whitespace-nowrap" style={{ WebkitTextStroke: isDark ? "1.5px rgba(255,255,255,0.7)" : "1.5px rgba(0,0,0,0.7)" }}>WANDERER.</span>
          </h2>
          <p className="mt-8 font-caveat text-2xl sm:text-3xl md:text-4xl text-foreground/60 tracking-wide font-normal max-w-2xl exp-reveal-top">
            &quot;A journey of a thousand leagues begins beneath one&apos;s feet.&quot;
          </p>
        </div>

        <div className="flex flex-col gap-24 md:gap-28 relative">
          <div className="absolute left-6 top-4 bottom-4 w-[1px] bg-foreground/15 md:hidden z-0" style={{ filter: "url(#line-torn-filter)" }} />
          <div className="absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-[1px] bg-foreground/20 hidden md:block z-0" style={{ filter: "url(#line-torn-filter)" }} />

          {EXPERIENCES.map((exp, i) => {
            const isEven = i % 2 === 0;
            return (
              <div
                key={i}
                className={`exp-entry-${i} grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-4 relative pt-16 md:pt-0`}
              >
                <div className="absolute left-6 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-8 md:w-24 flex items-start justify-center z-10 pointer-events-none">
                  <div className={`footprint-stamp-${i} opacity-0 text-foreground`}>
                    <FootprintSVG isLeft={i % 2 === 0} className="w-8 h-14 md:w-16 md:h-28 mt-4 transition-opacity duration-500" />
                  </div>
                </div>
                {isEven ? (
                  <>
                    <div className="md:col-span-5 flex flex-col items-start md:items-end justify-start z-10 md:pr-16 pl-14 md:pl-0 pt-4">
                      <span className="text-xl md:text-2xl font-serif font-light text-foreground/80 tracking-tight flex items-center md:flex-row-reverse gap-4">
                        <span className="w-8 h-[2px] bg-foreground/30 hidden md:block" style={{ filter: "url(#line-torn-filter)" }} />
                        {exp.period}
                        {i === 0 && (
                          <span className="font-caveat text-xl md:text-2xl text-red-600/70 lowercase tracking-normal pl-2 md:pl-0 md:pr-2">
                            * current domain
                          </span>
                        )}
                      </span>
                      <div className="mt-8 md:mt-16 w-[260px] md:w-[380px] lg:w-[460px] aspect-[2/3] opacity-[0.85] mix-blend-multiply dark:mix-blend-screen dark:opacity-[0.55] overflow-hidden exp-reveal-top relative">
                        <Image
                          src={exp.image}
                          alt="Zen Decor"
                          width={1000}
                          height={1500}
                          className="h-full w-full object-cover grayscale contrast-[1.2] pointer-events-auto"
                          style={{
                            maskImage: "linear-gradient(to bottom, black 75%, transparent 100%), linear-gradient(to left, black 75%, transparent 100%)",
                            WebkitMaskImage: "linear-gradient(to bottom, black 75%, transparent 100%), linear-gradient(to left, black 75%, transparent 100%)",
                            maskComposite: "intersect",
                            WebkitMaskComposite: "source-in"
                          }}
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2 hidden md:block" />
                    <div className={`md:col-span-5 z-10 pl-14 md:pl-0 exp-card-reveal-${i}`}>
                      <div className="mb-6 md:mb-8">
                        <h3 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-foreground uppercase tracking-tighter mb-2 leading-tight">
                          {exp.role}
                        </h3>
                        <span className="text-[10px] md:text-xs font-mono font-bold text-foreground/60 uppercase tracking-[0.3em] block">
                          {exp.company}
                        </span>
                      </div>

                      <p className="text-base md:text-lg font-serif font-light text-foreground/75 mb-10 md:mb-12 leading-relaxed relative pl-6">
                        <span className={`absolute left-0 top-1 bottom-1 w-[2.5px] ${i === 0 ? "bg-red-700/40" : "bg-foreground/20"}`} style={{ filter: "url(#line-torn-filter)" }} />
                        {exp.description}
                      </p>

                      <div className="flex flex-col gap-8">
                        <div className="flex flex-col gap-4">
                          <span className="text-[9px] font-mono text-foreground/45 uppercase tracking-[0.4em] font-bold">Chronicles of Battle //</span>
                          <ul className="space-y-4">
                            {exp.achievements.map((item, idx) => (
                              <li key={idx} className="flex gap-4 items-start group">
                                <span className="text-foreground/30 font-serif text-sm mt-0.5 group-hover:translate-x-1 transition-transform duration-500">一</span>
                                <span className="text-xs md:text-sm font-serif font-light text-foreground/60 group-hover:text-foreground transition-colors duration-500 leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex flex-col gap-4 w-full">
                          <span className="text-[9px] font-mono text-foreground/45 uppercase tracking-[0.4em] font-bold">Arsenal & Weapons //</span>
                          {exp.techBooks ? (
                            <div className="flex flex-col gap-4 w-full">
                              <div className="grid grid-cols-5 gap-1 pb-2 border-b border-foreground/10 relative">
                                {exp.techBooks.map((book) => {
                                  const isSelected = activeBook === book.id;
                                  return (
                                    <button
                                      key={book.id}
                                      onClick={() => {
                                        setActiveBook(book.id);
                                        soundManager?.playBookOpen();
                                      }}
                                      className="flex flex-col items-center gap-1 py-1.5 transition-all duration-300 relative group pointer-events-auto cursor-pointer"
                                    >
                                      <span className={`font-serif text-xl transition-all duration-300 ${isSelected ? "text-[#8b0000] font-bold scale-110" : "text-foreground/30 group-hover:text-foreground/75"}`}>
                                        {book.kanji}
                                      </span>
                                      <span className={`text-[7px] font-mono tracking-widest uppercase transition-colors duration-300 ${isSelected ? "text-[#8b0000] font-black" : "text-foreground/35"}`}>
                                        {book.id}
                                      </span>

                                      {isSelected && (
                                        <div
                                          className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#8b0000] animate-in slide-in-from-bottom-1 fade-in duration-300"
                                          style={{ filter: "url(#line-torn-filter)" }}
                                        />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="min-h-[90px]">
                                {exp.techBooks.map((book) => {
                                  if (book.id !== activeBook) return null;
                                  return (
                                    <div
                                      key={book.id}
                                      className="flex flex-col gap-2.5 w-full animate-in fade-in zoom-in-[0.98] duration-500 ease-out fill-mode-both"
                                    >
                                      <div className="flex flex-col">
                                        <span className="text-[10px] font-serif font-black text-foreground uppercase tracking-[0.2em]">{book.title}</span>
                                        <span className="text-[8px] font-serif text-foreground/40 italic tracking-wider mt-0.5">{book.subtitle}</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {book.items.map((t) => (
                                          <span key={t} className="px-2 py-1 border border-foreground/15 bg-background text-[8px] font-mono text-foreground/50 uppercase tracking-widest relative overflow-hidden group select-none">
                                            <span className="absolute inset-0 bg-foreground scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out z-0" style={{ filter: "url(#line-torn-filter)" }} />
                                            <span className="relative z-10 group-hover:text-background transition-colors duration-500">{t}</span>
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {exp.tech?.map(t => (
                                <span key={t} className="px-3 py-1.5 border border-foreground/15 bg-background text-[8px] font-mono text-foreground/50 uppercase tracking-widest relative overflow-hidden group select-none">
                                  <span className="absolute inset-0 bg-foreground scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out z-0" style={{ filter: "url(#line-torn-filter)" }} />
                                  <span className="relative z-10 group-hover:text-background transition-colors duration-500">{t}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`md:col-span-5 z-10 order-2 md:order-1 pl-14 md:pl-0 md:pr-12 md:text-right exp-card-reveal-${i}`}>
                      <div className="mb-6 md:mb-8">
                        <h3 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-foreground uppercase tracking-tighter mb-2 leading-tight">
                          {exp.role}
                        </h3>
                        <span className="text-[10px] md:text-xs font-mono font-bold text-foreground/60 uppercase tracking-[0.3em] block">
                          {exp.company}
                        </span>
                      </div>

                      <p className="text-base md:text-lg font-serif font-light text-foreground/75 mb-10 md:mb-12 leading-relaxed relative pl-6">
                        <span className="absolute left-0 top-1 bottom-1 w-[2.5px] bg-foreground/20" style={{ filter: "url(#line-torn-filter)" }} />
                        {exp.description}
                      </p>

                      <div className="flex flex-col gap-8">
                        <div className="flex flex-col gap-4">
                          <span className="text-[9px] font-mono text-foreground/45 uppercase tracking-[0.4em] font-bold">Chronicles of Battle //</span>
                          <ul className="space-y-4">
                            {exp.achievements.map((item, idx) => (
                              <li key={idx} className="flex gap-4 items-start group">
                                <span className="text-foreground/30 font-serif text-sm mt-0.5 group-hover:translate-x-1 transition-transform duration-500">一</span>
                                <span className="text-xs md:text-sm font-serif font-light text-foreground/60 group-hover:text-foreground transition-colors duration-500 leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex flex-col gap-4 w-full">
                          <span className="text-[9px] font-mono text-foreground/45 uppercase tracking-[0.4em] font-bold">Arsenal & Weapons //</span>
                          {exp.techBooks ? (
                            <div className="flex flex-col gap-4 w-full">
                              <div className="grid grid-cols-5 gap-1 pb-2 border-b border-foreground/10 relative">
                                {exp.techBooks.map((book) => {
                                  const isSelected = activeBook === book.id;
                                  return (
                                    <button
                                      key={book.id}
                                      onClick={() => setActiveBook(book.id)}
                                      className="flex flex-col items-center gap-1 py-1.5 transition-all duration-300 relative group pointer-events-auto cursor-pointer"
                                    >
                                      <span className={`font-serif text-xl transition-all duration-300 ${isSelected ? "text-[#8b0000] font-bold scale-110" : "text-foreground/30 group-hover:text-foreground/75"}`}>
                                        {book.kanji}
                                      </span>
                                      <span className={`text-[7px] font-mono tracking-widest uppercase transition-colors duration-300 ${isSelected ? "text-[#8b0000] font-black" : "text-foreground/35"}`}>
                                        {book.id}
                                      </span>

                                      {isSelected && (
                                        <div
                                          className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#8b0000] animate-in slide-in-from-bottom-1 fade-in duration-300"
                                          style={{ filter: "url(#line-torn-filter)" }}
                                        />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="min-h-[90px]">
                                {exp.techBooks.map((book) => {
                                  if (book.id !== activeBook) return null;
                                  return (
                                    <div
                                      key={book.id}
                                      className="flex flex-col gap-2.5 w-full animate-in fade-in zoom-in-[0.98] duration-500 ease-out fill-mode-both"
                                    >
                                      <div className="flex flex-col">
                                        <span className="text-[10px] font-serif font-black text-foreground uppercase tracking-[0.2em]">{book.title}</span>
                                        <span className="text-[8px] font-serif text-foreground/40 italic tracking-wider mt-0.5">{book.subtitle}</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {book.items.map((t) => (
                                          <span key={t} className="px-2 py-1 border border-foreground/15 bg-background text-[8px] font-mono text-foreground/50 uppercase tracking-widest relative overflow-hidden group select-none">
                                            <span className="absolute inset-0 bg-foreground scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out z-0" style={{ filter: "url(#line-torn-filter)" }} />
                                            <span className="relative z-10 group-hover:text-background transition-colors duration-500">{t}</span>
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {exp.tech?.map(t => (
                                <span key={t} className="px-3 py-1.5 border border-foreground/15 bg-background text-[8px] font-mono text-foreground/50 uppercase tracking-widest relative overflow-hidden group select-none">
                                  <span className="absolute inset-0 bg-foreground scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out z-0" style={{ filter: "url(#line-torn-filter)" }} />
                                  <span className="relative z-10 group-hover:text-background transition-colors duration-500">{t}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 hidden md:block order-2" />

                    <div className="md:col-span-5 flex flex-col items-start justify-start z-10 md:pl-16 pl-14 md:pl-0 pt-4 order-1 md:order-3">
                      <span className="text-xl md:text-2xl font-serif font-light text-foreground/80 tracking-tight flex items-center gap-4">
                        <span className="w-8 h-[2px] bg-foreground/30 hidden md:block" style={{ filter: "url(#line-torn-filter)" }} />
                        {exp.period}
                      </span>

                      <div className="mt-8 md:mt-16 w-[260px] md:w-[380px] lg:w-[460px] opacity-[0.85] mix-blend-multiply dark:mix-blend-screen dark:opacity-[0.55] overflow-hidden exp-reveal-top relative">
                        <Image
                          src={exp.image}
                          alt="Zen Decor"
                          width={460}
                          height={690}
                          className="w-full h-full object-cover grayscale contrast-[1.2] pointer-events-auto"
                          style={{
                            height: "auto",
                            maskImage: "linear-gradient(to bottom, black 75%, transparent 100%), linear-gradient(to right, black 75%, transparent 100%)",
                            WebkitMaskImage: "linear-gradient(to bottom, black 75%, transparent 100%), linear-gradient(to right, black 75%, transparent 100%)",
                            maskComposite: "intersect",
                            WebkitMaskComposite: "source-in"
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
