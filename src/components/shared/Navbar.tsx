'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import gsap from "@/lib/gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const navItems = [
  { label: "FOUNDATION", href: "#hero", id: "hero" },
  { label: "TECH STACK", href: "#essence", id: "essence" },
  { label: "PHILOSOPHY", href: "#philosophy", id: "philosophy" },
  { label: "ARTIFACTS", href: "#artifacts", id: "artifacts" },
  { label: "JOURNEY", href: "#experience", id: "experience" },
  { label: "CONTACT", href: "#contact", id: "contact" },
];

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
      <div className="flex items-center gap-6 p-2 bg-black/40 border border-white/5 backdrop-blur-2xl rounded-full pointer-events-auto shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        {/* Logo Section */}
        <div className="flex items-center gap-2 px-4 border-r border-white/10 pr-6">
          <div className="w-4 h-4 border border-accent rotate-45 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-accent" />
          </div>
          <span className="text-[11px] font-black italic tracking-[0.2em] text-white">TRHGATU</span>
        </div>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative px-5 py-2.5 group transition-all duration-300 outline-none"
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
                    className="absolute inset-0 bg-white/10 rounded-full z-0"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30
                    }}
                  />
                )}

                <span className={`relative z-10 text-[9px] md:text-[10px] font-bold tracking-[0.25em] uppercase whitespace-nowrap transition-colors duration-300 ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-white'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
