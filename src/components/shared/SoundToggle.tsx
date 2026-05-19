'use client';

import { useState, useEffect } from 'react';
import { soundManager } from '@/lib/sound';

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
      className="relative w-10 h-10 flex items-center justify-center rounded-none bg-background/50 backdrop-blur-sm border border-foreground/20 hover:border-foreground/50 transition-colors focus:outline-none text-foreground/70 hover:text-foreground cursor-none"
      aria-label="Toggle Soundscape"
    >
      <div className="flex items-end gap-[2px] h-3.5 w-4 justify-center">
        {[1, 2, 3, 4].map((bar) => {
          const delay = bar * 0.15;
          const heightClass = bar === 1 ? "h-2" : bar === 2 ? "h-3.5" : bar === 3 ? "h-2.5" : "h-1.5";
          return (
            <span
              key={bar}
              className={`w-[2px] bg-foreground/60 rounded-none transition-all duration-300 origin-bottom ${heightClass}`}
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

