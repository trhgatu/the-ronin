"use client";

import { useEffect, useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "@/lib/gsap";
import { soundManager } from "@/lib/sound";
import { motion, AnimatePresence } from "framer-motion";

export const Preloader = () => {
  const [mounted, setMounted] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [showEnter, setShowEnter] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    setMounted(true);

    if (typeof window !== "undefined") {
      const hasSeenPreloader = sessionStorage.getItem("preloader-seen");
      if (hasSeenPreloader === "true") {
        setIsActive(false);
        document.body.style.overflow = "";
        document.documentElement.classList.remove("is-loading");
        window.dispatchEvent(new Event("preloader-complete"));
        return;
      }
    }

    // Lock scroll on mount
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useGSAP(
    () => {
      if (
        !mounted ||
        !isActive ||
        !containerRef.current ||
        !quoteRef.current ||
        !circleRef.current
      )
        return;

      const tl = gsap.timeline();

      // 1. Draw the Ensō Zen Circle (fast & clean)
      tl.to(circleRef.current, {
        strokeDashoffset: 0,
        duration: 0.9,
        ease: "power2.out",
      });

      // 2. Character-by-character rapid ink spread for the status line
      const chars = quoteRef.current.querySelectorAll(".loader-char");
      tl.to(
        chars,
        {
          opacity: 1,
          filter: "blur(0px)",
          stagger: 0.012,
          duration: 0.5,
          ease: "power2.out",
        },
        "-=0.6",
      ); // overlap drawing of Ensō

      // 3. Short hold, then reveal the Enter button
      tl.to(
        {},
        {
          duration: 0.15,
          onComplete: () => {
            setShowEnter(true);
          },
        },
      );
    },
    { scope: containerRef, dependencies: [mounted, isActive] },
  );

  const handleEnter = (withSound: boolean = true) => {
    // 1. If withSound, toggle on music and play stamp sound
    if (soundManager) {
      if (withSound) {
        soundManager.toggle();
        soundManager.playStampThud();
      } else {
        soundManager.init();
      }
    }

    // 2. Animate out the elements remaining on the preloader
    const targets = containerRef.current?.querySelectorAll(
      ".preloader-content > *",
    );
    if (targets && targets.length > 0) {
      gsap.to(targets, {
        opacity: 0,
        filter: "blur(12px)",
        y: -30,
        duration: 0.8,
        stagger: 0.08,
        ease: "power2.inOut",
        onComplete: startTransition,
      });
    } else {
      startTransition();
    }
  };

  const startTransition = () => {
    // Trigger the OGL Ink Transition exactly from the center of the screen
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("trigger-ink-transition", {
          detail: {
            cx: window.innerWidth / 2,
            cy: window.innerHeight / 2,
          },
        }),
      );
    }

    // Hide the Preloader overlay exactly when the ink is at solid full coverage (550ms)
    setTimeout(() => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("preloader-seen", "true");
        document.documentElement.classList.remove("is-loading");
      }
      document.body.style.overflow = "";
      setIsActive(false);
      // Dispatch event to kick off animations in Hero section
      window.dispatchEvent(new Event("preloader-complete"));
    }, 550);
  };

  if (!isActive) return null;

  const quoteText = "initializing canvas & audio... ready.";

  return (
    <div
      id="preloader-overlay"
      ref={containerRef}
      suppressHydrationWarning={true}
      className="fixed inset-0 w-full h-full bg-background text-foreground z-[9999] flex flex-col items-center justify-center select-none"
    >
      {/* SVG torn line filter definition */}
      <svg className="absolute w-0 h-0 invisible" aria-hidden="true">
        <defs>
          <filter
            id="line-torn-filter-preloader"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.15"
              numOctaves="3"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="3"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <div className="relative z-10 flex flex-col items-center gap-8 preloader-content">
        <div className="w-28 h-28 md:w-32 md:h-32 relative flex items-center justify-center opacity-70">
          <svg className="w-full h-full text-foreground" viewBox="0 0 100 100">
            <path
              ref={circleRef}
              d="M 50,10 A 40,40 0 1,1 49.9,10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="251.2"
              strokeDashoffset="251.2"
              className="transition-colors duration-500"
            />
          </svg>
          {/* Kanji stamp in center */}
          <div className="absolute font-serif text-[26px] font-black text-red-600/70 select-none animate-pulse">
            道
          </div>
        </div>

        {/* Calligraphic load sign-off */}
        <div
          ref={quoteRef}
          className="font-mono text-xs sm:text-sm text-foreground/50 tracking-wider max-w-md text-center px-6 leading-relaxed"
        >
          {quoteText.split("").map((char, index) => (
            <span
              key={index}
              className="loader-char inline-block opacity-0"
              style={{ filter: "blur(6px)" }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </div>

        <div className="h-16 flex flex-col items-center justify-center mt-2">
          <AnimatePresence>
            {showEnter && (
              <motion.div
                initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4"
              >
                <button
                  onClick={() => handleEnter(true)}
                  className="px-6 py-2.5 border border-foreground/25 hover:border-foreground/60 bg-foreground/5 hover:bg-foreground/10 backdrop-blur-sm font-mono text-[10px] tracking-[0.25em] uppercase font-bold text-foreground/85 hover:text-foreground transition-all duration-300 cursor-pointer relative group focus:outline-none"
                >
                  <div
                    className="absolute inset-0 border border-foreground/5 pointer-events-none group-hover:border-foreground/15 transition-colors duration-300"
                    style={{ filter: "url(#line-torn-filter-preloader)" }}
                  />
                  [ WITH SOUND ]
                </button>

                <button
                  onClick={() => handleEnter(false)}
                  className="px-6 py-2.5 border border-foreground/10 hover:border-foreground/35 bg-transparent hover:bg-foreground/5 backdrop-blur-sm font-mono text-[10px] tracking-[0.25em] uppercase font-medium text-foreground/45 hover:text-foreground/80 transition-all duration-300 cursor-pointer relative group focus:outline-none"
                >
                  [ WITHOUT SOUND ]
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
