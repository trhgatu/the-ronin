'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "@/lib/gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, X } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const navItems = [
  { label: "Prologue", href: "#hero", id: "hero", roman: "序" },
  { label: "The Architect", href: "#about", id: "about", roman: "I" },
  { label: "Artifacts", href: "#artifacts", id: "artifacts", roman: "II" },
  { label: "The Armory", href: "#stack", id: "stack", roman: "III" },
  { label: "The Void", href: "#philosophy", id: "philosophy", roman: "IV" },
  { label: "The Battles", href: "#experience", id: "experience", roman: "V" },
  { label: "The Summons", href: "#contact", id: "contact", roman: "VI" },
];

export const Navbar = () => {
  const [activeSection, setActiveSection] = useState("hero");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Bulletproof Active Section Tracking using precise bounding box calculations
  useEffect(() => {
    const updateActiveSection = () => {
      let activeId = "hero";
      let minDistance = Infinity;
      const viewportCenter = window.innerHeight / 2;

      navItems.forEach((item) => {
        const el = document.querySelector(item.href);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
            activeId = item.id;
            minDistance = -1;
          } else if (minDistance !== -1) {
            const elCenter = rect.top + rect.height / 2;
            const distance = Math.abs(elCenter - viewportCenter);
            if (distance < minDistance) {
              minDistance = distance;
              activeId = item.id;
            }
          }
        }
      });

      setActiveSection(activeId);
    };

    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection, { passive: true });

    // Force updates on mount to counter any slow font/image layout shifts
    updateActiveSection();
    const timeouts = [100, 500, 1000, 2000].map(ms => setTimeout(updateActiveSection, ms));

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
      timeouts.forEach(clearTimeout);
    };
  }, []);

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!mounted) return null;

  return (
    <>
      {/* 1. Global Branding & Top Bar Controls (Left/Right corners) */}
      <header className="fixed top-8 left-6 md:left-10 right-6 md:right-10 z-[9999] pointer-events-none flex justify-between items-start">
        {/* Top-Left Branding (Premium Hanko Stamp Logo) */}
        <a 
          href="#hero"
          onClick={(e) => { e.preventDefault(); handleNavClick("#hero"); }}
          className="flex items-center gap-4 pointer-events-auto group cursor-pointer outline-none"
        >
          {/* Hanko-style Logo Mark */}
          <div className="w-10 h-10 border border-foreground/20 flex items-center justify-center relative overflow-hidden transition-colors duration-500 bg-background/50 backdrop-blur-sm group-hover:border-foreground/60 shadow-sm">
            <span className="font-serif text-lg font-black text-foreground relative z-10 transition-colors duration-500 translate-y-[-1px] group-hover:scale-110">
              侍
            </span>
          </div>
          {/* Logo Type */}
          <div className="flex flex-col mt-0.5">
            <span className="font-serif text-[13px] md:text-[14px] tracking-[0.35em] font-black text-foreground uppercase leading-none">
              TRHGATU
            </span>
            <span className="font-mono text-[9px] md:text-[10px] tracking-[0.25em] text-foreground/50 uppercase mt-1.5 font-bold">
              Software Architect
            </span>
          </div>
        </a>

        {/* Top-Right Toggle & Mobile menu trigger */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <ThemeToggle />

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden w-10 h-10 border border-foreground/20 flex items-center justify-center hover:border-foreground/50 transition-colors duration-500 bg-background/50 backdrop-blur-sm text-foreground/70 hover:text-foreground outline-none"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={16} strokeWidth={1.5} /> : <Menu size={16} strokeWidth={1.5} />}
          </button>
        </div>
      </header>

      {/* 2. Desktop Premium Floating Typography Navigation (Left Side) */}
      <nav className="fixed left-6 md:left-10 top-1/2 -translate-y-1/2 z-[9998] hidden lg:flex flex-col items-start gap-5 pointer-events-auto select-none">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`
                group flex items-center font-serif text-[11px] tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer
                ${isActive
                  ? "text-foreground font-black translate-x-[4px]"
                  : "text-foreground/40 hover:text-foreground hover:translate-x-[2px]"
                }
              `}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.href);
              }}
            >
              {isActive && (
                <motion.span
                  layoutId="navActiveIndicatorDash"
                  className="w-3 h-[1.5px] bg-foreground mr-3"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <div className="flex items-center transition-all duration-300">
                <span className="font-bold">{item.roman}</span>
                <span className={`
                  font-serif font-light tracking-[0.3em] transition-all duration-300 origin-left whitespace-nowrap
                  ${isActive
                    ? "opacity-100 max-w-[200px] ml-2 inline-block"
                    : "opacity-0 max-w-0 scale-x-90 overflow-hidden inline-block group-hover:opacity-60 group-hover:max-w-[200px] group-hover:scale-x-100 group-hover:ml-2"
                  }
                `}>
                  一 {item.label}
                </span>
              </div>
            </a>
          );
        })}
      </nav>

      {/* 3. Mobile Full-Screen Scroll Timeline Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9990] bg-background/95 backdrop-blur-3xl lg:hidden flex flex-col justify-center px-8 md:px-16 overflow-hidden"
          >
            {/* Grain Noise Overlay */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />

            <div className="relative w-full max-w-sm mx-auto flex flex-col gap-6 select-none pl-6 border-l border-foreground/5">
              {navItems.map((item, idx) => {
                const isActive = activeSection === item.id;
                return (
                  <motion.button
                    key={item.href}
                    initial={{ x: -15, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -15, opacity: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => handleNavClick(item.href)}
                    className="flex items-center gap-3 text-left group w-full outline-none"
                  >
                    <span className={`text-[10px] font-serif tracking-[0.3em] transition-all duration-300 ${isActive ? 'text-foreground font-bold' : 'text-foreground/40'}`}>
                      {item.roman} 一
                    </span>
                    <span className={`text-xl sm:text-2xl font-serif font-light tracking-[0.2em] uppercase transition-all duration-300
                      ${isActive ? 'text-foreground font-black pl-2' : 'text-foreground/40 hover:text-foreground'}
                    `}>
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
            <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center border-t border-foreground/15 pt-5 text-[10px] font-serif text-foreground/40 uppercase tracking-widest">
              <span>NITEN ICHI-RYŪ</span>
              <span>THE WAY OF THE RONIN</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};


