'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

interface WindStrand {
  x: number;
  y: number;
  length: number;
  width: number;
  speed: number;
  angle: number;
  alpha: number;
  fadeSpeed: number;
  life: number;
  maxLife: number;
  history: { x: number; y: number }[];
  amplitude: number;
  frequency: number;
}

export const WindFlow = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = container.clientWidth);
    let height = (canvas.height = container.clientHeight);

    let strands: WindStrand[] = [];
    const maxStrands = Math.min(65, Math.floor(width / 22)); // Balanced density based on width

    const createStrand = (startX: number, forceAlpha = 0): WindStrand => {
      const maxLife = 180 + Math.random() * 150;
      return {
        x: startX,
        y: Math.random() * height,
        length: 120 + Math.random() * 180,
        width: 0.4 + Math.random() * 0.9,
        speed: 1.2 + Math.random() * 2.2,
        angle: (Math.random() - 0.5) * 0.05, // Slightly drifting angle
        alpha: forceAlpha,
        fadeSpeed: 0.005 + Math.random() * 0.01,
        life: 0,
        maxLife,
        history: [],
        amplitude: 15 + Math.random() * 25,
        frequency: 0.002 + Math.random() * 0.004,
      };
    };

    // Initialize initial strands scattered across the screen
    for (let i = 0; i < maxStrands; i++) {
      strands.push(createStrand(Math.random() * width, Math.random() * 0.3));
    }

    const resizeCanvas = () => {
      if (!canvas || !container) return;
      width = canvas.width = container.clientWidth;
      height = canvas.height = container.clientHeight;
      // Re-populate strands on screen resize to match new density
      const targetDensity = Math.min(65, Math.floor(width / 22));
      if (strands.length < targetDensity) {
        for (let i = strands.length; i < targetDensity; i++) {
          strands.push(createStrand(Math.random() * width));
        }
      } else if (strands.length > targetDensity) {
        strands = strands.slice(0, targetDensity);
      }
    };

    window.addEventListener('resize', resizeCanvas);

    // Active tracking of theme colors
    let windColor = resolvedTheme === 'dark' ? 'rgba(255, 255, 255, ' : 'rgba(0, 0, 0, ';

    let time = 0;
    let isVisible = true;

    // IntersectionObserver to pause loop when out of view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { rootMargin: '100px' }
    );
    observer.observe(container);

    const updateAndDraw = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(updateAndDraw);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      time += 0.5;

      // Update theme color dynamically
      windColor = resolvedTheme === 'dark' ? 'rgba(255, 255, 255, ' : 'rgba(0, 0, 0, ';

      for (let i = 0; i < strands.length; i++) {
        const s = strands[i];

        // Wave motion using sine / cosine flow fields
        const flowFieldAngle = 
          Math.sin(s.x * s.frequency + time * 0.01 + s.y * 0.001) * 0.12 + 
          Math.cos(s.x * 0.003 - time * 0.005) * 0.04;

        // Apply flow field vector to speed
        const vx = Math.cos(s.angle + flowFieldAngle) * s.speed;
        const vy = Math.sin(s.angle + flowFieldAngle) * s.speed + Math.sin(time * 0.008 + s.y) * 0.12;

        s.x += vx;
        s.y += vy;

        s.life++;

        // Fading in at birth, fading out near death
        if (s.life < 50) {
          s.alpha = Math.min(s.alpha + s.fadeSpeed * 1.5, 0.45);
        } else if (s.life > s.maxLife - 60) {
          s.alpha = Math.max(s.alpha - s.fadeSpeed * 1.8, 0);
        }

        // Record history for smooth trailing curves
        s.history.push({ x: s.x, y: s.y });
        
        // Keep trail length within strands bounds
        const maxHistory = Math.floor(s.length / s.speed);
        if (s.history.length > maxHistory) {
          s.history.shift();
        }

        // Draw the strand as a sweeping brush stroke path
        if (s.history.length > 2) {
          ctx.beginPath();
          ctx.moveTo(s.history[0].x, s.history[0].y);

          for (let j = 1; j < s.history.length - 1; j++) {
            const xc = (s.history[j].x + s.history[j + 1].x) / 2;
            const yc = (s.history[j].y + s.history[j + 1].y) / 2;
            ctx.quadraticCurveTo(s.history[j].x, s.history[j].y, xc, yc);
          }

          ctx.strokeStyle = `${windColor}${s.alpha * 0.28})`;
          ctx.lineWidth = s.width;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }

        // Recycle strand if it exits canvas or runs out of life
        if (s.x > width + s.length || s.life >= s.maxLife || s.y < -s.length || s.y > height + s.length) {
          strands[i] = createStrand(-s.length);
        }
      }

      animationFrameId = requestAnimationFrame(updateAndDraw);
    };

    updateAndDraw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [resolvedTheme]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full opacity-65 md:opacity-85 mix-blend-multiply dark:mix-blend-screen" />
    </div>
  );
};

