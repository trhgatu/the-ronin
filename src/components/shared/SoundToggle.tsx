'use client';

import { useState, useEffect } from 'react';
import { soundManager } from '@/lib/sound';
import { Volume2, VolumeX } from 'lucide-react';

export const SoundToggle = () => {
  const [mounted, setMounted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (soundManager) {
      setIsMuted(soundManager.getMuteState());
    }

    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsMuted(customEvent.detail.isMuted);
    };

    window.addEventListener('sound-mute-toggle', handleToggle);
    return () => {
      window.removeEventListener('sound-mute-toggle', handleToggle);
    };
  }, []);

  if (!mounted || !soundManager) return null;

  return (
    <button
      onClick={() => soundManager?.toggle()}
      className="fixed bottom-6 right-6 z-50 p-3 bg-background/80 backdrop-blur-md border border-foreground/15 text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-all duration-500 rounded-none group flex items-center justify-center cursor-none focus:outline-none shadow-[0_8px_24px_rgba(0,0,0,0.15)] group/btn"
      aria-label="Toggle Soundscape"
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      <div
        className="absolute inset-0 border border-foreground/10 pointer-events-none group-hover:border-foreground/20 transition-colors duration-500"
        style={{ filter: "url(#line-torn-filter-sound)" }}
      />

      <svg className="absolute w-0 h-0 invisible" aria-hidden="true">
        <defs>
          <filter id="line-torn-filter-sound" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.15" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className="flex items-center gap-2.5 relative z-10">
        {/* Animated soundwaves */}
        <div className="flex items-end gap-[2px] h-3.5 w-5">
          {[1, 2, 3, 4].map((bar) => {
            const delay = bar * 0.15;
            const heightClass = bar === 1 ? "h-2" : bar === 2 ? "h-3.5" : bar === 3 ? "h-2.5" : "h-1.5";
            return (
              <span
                key={bar}
                className={`w-[2px] bg-foreground/60 group-hover:bg-foreground rounded-none transition-all duration-300 origin-bottom ${heightClass}`}
                style={{
                  animationName: !isMuted ? 'soundWave' : 'none',
                  animationDuration: '1.2s',
                  animationTimingFunction: 'ease-in-out',
                  animationIterationCount: 'infinite',
                  animationDirection: 'alternate',
                  animationDelay: `${delay}s`,
                }}
              />
            );
          })}
        </div>

        <div className="h-4 w-[1px] bg-foreground/15" />

        <span className="font-mono text-[9px] tracking-[0.25em] uppercase font-bold text-foreground/45 group-hover:text-foreground/75 transition-colors duration-300 pl-0.5">
          {isMuted ? "off" : "on"}
        </span>
      </div>

      <style jsx global>{`
        @keyframes soundWave {
          0% {
            transform: scaleY(0.3);
          }
          100% {
            transform: scaleY(1.1);
          }
        }
      `}</style>
    </button>
  );
};
