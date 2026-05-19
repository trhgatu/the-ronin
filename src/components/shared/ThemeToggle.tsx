"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { soundManager } from "@/lib/sound";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 flex items-center justify-center rounded-none bg-background/50 border border-foreground/20 backdrop-blur-sm">
        <div className="w-[15px] h-[15px]" />
      </div>
    );
  }

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    soundManager?.playWaterSplash();
    const currentTheme = theme === "system" ? resolvedTheme : theme;
    const next = currentTheme === "dark" ? "light" : "dark";

    const prefersReducedMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setTheme(next);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("trigger-ink-transition", {
          detail: { cx, cy, targetTheme: next },
        })
      );
    } else {
      setTheme(next);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative w-10 h-10 flex items-center justify-center rounded-none bg-background/50 backdrop-blur-sm border border-foreground/20 hover:border-foreground/50 transition-colors focus:outline-none text-foreground/70 hover:text-foreground"
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === "dark" ? (
          <motion.div
            key="moon"
            initial={{ y: 10, opacity: 0, rotate: -45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -10, opacity: 0, rotate: 45 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="w-[15px] h-[15px]" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ y: 10, opacity: 0, rotate: -45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -10, opacity: 0, rotate: 45 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="w-[15px] h-[15px]" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

