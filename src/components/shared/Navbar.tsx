'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "@/lib/gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SoundToggle } from "./SoundToggle";
import { Menu, X, Eye, EyeOff } from "lucide-react";

import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

const navItems = [
  { label: "Prologue", href: "#hero", id: "hero", roman: "序" },
  { label: "The Architect", href: "#about", id: "about", roman: "I" },
  { label: "Artifacts", href: "#artifacts", id: "artifacts", roman: "II" },
  { label: "The Void", href: "#philosophy", id: "philosophy", roman: "III" },
  { label: "The Battles", href: "#experience", id: "experience", roman: "IV" },
  { label: "The Summons", href: "#contact", id: "contact", roman: "V" },
];

export const Navbar = () => {
  const [activeSection, setActiveSection] = useState("hero");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Hero owns this mode (it drives its own veil/3D-model visuals); Navbar
  // just mirrors it to know which icon to show, the same way HeroScene's
  // water ripple effect mirrors it — see the 'hero-swap-mode' listener
  // below and Hero.tsx's matching dispatch.
  const [heroSwapMode, setHeroSwapMode] = useState(false);
  // Any other section that locally darkens its own background (Artifacts'
  // scroll-into-black, see its own ScrollTrigger) dispatches this the same
  // way Hero dispatches 'hero-swap-mode' — a plain window event, since a
  // section's local CSS variable override can't reach this header (a DOM
  // sibling, not a descendant).
  const [darkSection, setDarkSection] = useState(false);
  const [heroUnderHeader, setHeroUnderHeader] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    const onSwapMode = (e: Event) => {
      setHeroSwapMode((e as CustomEvent<boolean>).detail);
    };
    window.addEventListener('hero-swap-mode', onSwapMode);
    return () => window.removeEventListener('hero-swap-mode', onSwapMode);
  }, []);

  useEffect(() => {
    const onDarkSection = (e: Event) => {
      setDarkSection((e as CustomEvent<boolean>).detail);
    };
    window.addEventListener('dark-section', onDarkSection);
    // Catch up on an announcement made before this effect subscribed (see
    // announceDarkSection in Artifacts.tsx).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDarkSection(document.documentElement.dataset.darkSection === 'true');
    return () => window.removeEventListener('dark-section', onDarkSection);
  }, []);

  const requestHeroSwapToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    window.dispatchEvent(new CustomEvent('request-hero-swap-toggle', {
      detail: { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 },
    }));
  };

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
      // activeSection flips to "about" while Hero's dark tail is still behind
      // the header, so the scrim's tone can't key off it alone. About's torn
      // paper edge (drawn in Hero) covers Hero's last ~64px, so Hero's own
      // tone is behind the wordmark (~y 40) only until bottom reaches ~104.
      const hero = document.getElementById("hero");
      setHeroUnderHeader(hero ? hero.getBoundingClientRect().bottom > 104 : false);
    };

    // Coalesced to one layout read per frame — scroll can fire several times
    // a frame, and each run measures every section.
    let rafId = 0;
    const scheduleUpdate = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        updateActiveSection();
      });
    };

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });

    // Force updates on mount to counter any slow font/image layout shifts
    updateActiveSection();
    const timeouts = [100, 500, 1000, 2000].map(ms => setTimeout(updateActiveSection, ms));

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      cancelAnimationFrame(rafId);
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
  // White text is only correct for Hero's own *dark, veiled* look. Swap mode
  // flips Hero to a light background (heroSwapMode, mirrored from Hero via
  // the same 'hero-swap-mode' event used for the Eye/EyeOff icon below) —
  // isHero alone doesn't know about that, so it kept forcing white text
  // over a now-light section.
  // Keyed off Hero still being behind the header rather than activeSection:
  // the latter flips to "about" (dark text) while Hero's black tail still
  // fills the header area, and the wordmark vanished into it. Artifacts is
  // left to its own 'dark-section' events — it opens and closes on white
  // paper, so forcing white text for the whole section hid the wordmark.
  const showWhiteText = (heroUnderHeader ? !heroSwapMode : darkSection) && !isMobileMenuOpen;

  return (
    <>
      {/* The menu overlay below now opens on every breakpoint (it used to be
          mobile-only), and it's a light backdrop — so a header still forced
          to isHero's white text (right for the dark Hero section behind it)
          goes near-illegible floating on top of it. Once the menu is open,
          the header's own color should follow that light overlay instead. */}
      <header className={`fixed inset-x-0 top-0 z-[9999] px-5 py-5 transition-colors duration-500 md:px-8 ${showWhiteText ? "text-white" : "text-foreground"}`}>
        {/* The header has no bar of its own, so section copy scrolling up
            under it collided with the wordmark. A soft paper-toned scrim
            fades that copy out before it reaches the header, without adding
            a visible bar. Off over dark backgrounds (Hero, the Artifacts
            stage): nothing scrolls under the header there, and mid-tear a
            dark scrim painted a grey band over the still-white paper. */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 -z-10 h-28 transition-opacity duration-500 ${heroUnderHeader || showWhiteText || isMobileMenuOpen ? "opacity-0" : "opacity-100"}`}
          style={{
            background: "linear-gradient(to bottom, rgba(253,253,253,1) 0%, rgba(253,253,253,0.85) 55%, rgba(253,253,253,0) 100%)",
          }}
        />
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <Link
            href="#hero"
            onClick={(e) => { e.preventDefault(); handleNavClick("#hero"); }}
            className="outline-none"
          >
            <span className="font-serif text-2xl font-bold tracking-[-0.04em] text-current md:text-[28px]">THATU.</span>
          </Link>

          <div className="flex items-center gap-2">
            <SoundToggle />
            {/* Hero's veil/3D-model swap — grouped here with the rest of the
                header's controls instead of floating alone over Hero (see
                Hero.tsx's request-hero-swap-toggle listener). */}
            {/* text-foreground here (rather than inheriting the header's own
                isHero-driven white/dark color) would resolve to the SITE-WIDE
                --foreground — Hero's own local override of that variable
                doesn't reach this header, since it's a sibling in the DOM,
                not a descendant, so custom-property cascade never crosses
                that boundary. Leaving color unset lets these buttons inherit
                whatever the header actually resolved to; border/bg tint off
                currentColor (not `foreground`) for the same reason. */}
            <button
              onClick={requestHeroSwapToggle}
              aria-label={heroSwapMode ? 'Switch to veiled reveal mode' : 'Switch to 3D-model-visible mode'}
              aria-pressed={heroSwapMode}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-current/15 bg-current/5 backdrop-blur-md transition-colors duration-300 hover:border-current/40 hover:bg-current/10"
            >
              {heroSwapMode ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-current/15 bg-current/5 backdrop-blur-md transition-colors duration-300 hover:border-current/40 hover:bg-current/10"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={17} strokeWidth={1.5} /> : <Menu size={17} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Scroll Timeline Menu — now the one and only nav on
          every breakpoint, not just mobile. A laid-out desktop nav row (with
          or without roman-numeral prefixes) was extra chrome sitting in the
          header at all times; a single burger button plus this overlay
          keeps the header itself down to just the wordmark. */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9990] flex flex-col justify-center overflow-hidden bg-background/95 px-8 backdrop-blur-3xl md:px-16"
          >
            {/* Grain Noise Overlay */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('/textures/noise.svg')] bg-repeat" />

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


