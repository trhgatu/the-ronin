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

export const Navbar = () => {
  const [activeSection, setActiveSection] = useState("hero");

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

  return (
    <header className="fixed top-8 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-fit px-6">
      <div className="flex items-center gap-2 p-1 bg-background/50 border border-foreground/5 backdrop-blur-2xl rounded-full pointer-events-auto shadow-2xl ring-1 ring-inset ring-foreground/5 h-12">
        <div className="flex items-center gap-2 pl-4 pr-6 h-full relative group">
          <span className="text-[10px] font-black italic tracking-[0.2em] text-foreground/80">TRHGATU</span>
        </div>

        <nav className="flex items-center gap-1 h-full">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative h-full px-5 flex items-center group transition-all duration-300 outline-none"
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.querySelector(item.href);
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                {/* Slidable Background */}
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

                <span className={`relative z-10 text-[9px] md:text-[10px] font-bold tracking-[0.25em] uppercase whitespace-nowrap transition-colors duration-300 ${isActive ? 'text-foreground' : 'text-foreground/50 group-hover:text-foreground'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="w-px h-4 bg-foreground/10 mx-2" />
        <div className="pr-2 flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
