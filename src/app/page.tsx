'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from '@/lib/gsap';
import { Hero } from "@/features/portfolio/Hero";
import { About } from "@/features/portfolio/About";
import { Artifacts } from "@/features/portfolio/Artifacts";
import { Stack } from "@/features/portfolio/Stack";
import { Philosophy } from "@/features/portfolio/Philosophy";
import { Experience } from "@/features/portfolio/Experience";
import { Contact } from "@/features/portfolio/Contact";
import { Footer } from "@/components/shared/Footer";

export default function Home() {
  const mainRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!mainRef.current) return;

    // Target all direct sections and footer (excluding Hero)
    const targets = gsap.utils.toArray<HTMLElement>("main > section, main > footer");
    const activeTargets = targets.filter(el => el.id !== 'hero');

    activeTargets.forEach((target) => {
      gsap.fromTo(target,
        {
          opacity: 0,
          y: 70,
          filter: "blur(10px)",
        },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.4,
          ease: "power3.out",
          scrollTrigger: {
            trigger: target,
            start: "top 85%",
            toggleActions: "play none none none",
          }
        }
      );
    });
  }, { scope: mainRef, dependencies: [] });

  return (
    <main ref={mainRef} className="relative flex min-h-screen flex-col">
      <Hero />
      <About />
      <Artifacts />
      <Stack />
      <Philosophy />
      <Experience />
      <Contact />
      <Footer />
    </main>
  );
}

