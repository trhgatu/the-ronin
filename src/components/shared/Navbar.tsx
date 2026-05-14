'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import gsap from "@/lib/gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const navItems = [
  { label: "FOUNDATION", href: "#hero", id: "hero" },
  { label: "THE ARCHITECT", href: "#about", id: "about" },
  { label: "ARTIFACTS", href: "#artifacts", id: "artifacts" },
  { label: "TECH STACK", href: "#essence", id: "essence" },
  { label: "PHILOSOPHY", href: "#philosophy", id: "philosophy" },
  { label: "JOURNEY", href: "#experience", id: "experience" },
  { label: "CONTACT", href: "#contact", id: "contact" },
];

import { ThemeToggle } from "./ThemeToggle";
import { Menu, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";

export const Navbar = () => {
  const [activeSection, setActiveSection] = useState("hero");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    navItems.forEach((item) => {
      ScrollTrigger.create({
        trigger: item.href,
        start: "top 40%",
        end: "bottom 40%",
        onEnter: () => setActiveSection(item.id),
        onEnterBack: () => setActiveSection(item.id),
      });
    });
  }, []);

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-6 md:top-8 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-fit px-6">
      <div className="flex items-center gap-2 p-1 bg-background/50 border border-foreground/5 backdrop-blur-2xl rounded-full pointer-events-auto shadow-2xl ring-1 ring-inset ring-foreground/5 h-12">
        {/* Logo Section */}
        <div className="flex items-center gap-2 pl-4 pr-4 md:pr-6 h-full relative group">
          <span className="text-[10px] font-black italic tracking-[0.2em] text-foreground/80">TRHGATU</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 h-full">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative h-full px-5 flex items-center group transition-all duration-300 outline-none"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.href);
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-active-bg"
                    className="absolute inset-y-1.5 inset-x-1 bg-foreground/10 rounded-full z-0"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30
                    }}
                  />
                )}

                <span className={`relative z-10 text-[10px] font-bold tracking-[0.25em] uppercase whitespace-nowrap transition-colors duration-300 ${isActive ? 'text-foreground' : 'text-foreground/50 group-hover:text-foreground'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Toggle */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-foreground/5 transition-colors text-foreground/70"
        >
          {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>

        <div className="w-px h-4 bg-foreground/10 mx-2" />
        <div className="pr-2 flex items-center">
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 w-[calc(100vw-3rem)] max-w-sm bg-background/80 border border-foreground/5 backdrop-blur-3xl rounded-3xl p-6 shadow-3xl lg:hidden overflow-hidden"
          >
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
            
            <div className="relative z-10 flex flex-col gap-2">
              <div className="text-[9px] font-mono text-accent/60 uppercase tracking-[0.4em] mb-4 pl-4 font-bold">Protocols //</div>
              {navItems.map((item, idx) => {
                const isActive = activeSection === item.id;
                return (
                  <motion.button
                    key={item.href}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleNavClick(item.href)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive ? 'bg-foreground/5' : 'hover:bg-foreground/[0.02]'}`}
                  >
                    <span className={`text-[10px] font-mono ${isActive ? 'text-accent' : 'text-foreground/20'}`}>0{idx + 1}</span>
                    <span className={`text-xs font-bold tracking-[0.2em] uppercase ${isActive ? 'text-foreground' : 'text-foreground/40 group-hover:text-foreground'}`}>
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.div 
                        layoutId="mobile-active-indicator"
                        className="ml-auto w-1 h-1 bg-accent rounded-full shadow-[0_0_8px_var(--accent)]" 
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-foreground/5 flex justify-between items-center px-4">
              <div className="text-[8px] font-mono text-foreground/20 uppercase tracking-widest">
                System_Node: v.1.0.4
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
