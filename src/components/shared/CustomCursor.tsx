'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [cursorText, setCursorText] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const ua = navigator.userAgent;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      setIsMobile(isMobileUA || window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const cursor = cursorRef.current;
    const follower = followerRef.current;

    if (!cursor || !follower || isMobile) return;

    // Set percentage translations in GSAP to perfectly center the custom cursor
    gsap.set(cursor, { xPercent: -50, yPercent: -50 });
    gsap.set(follower, { xPercent: -50, yPercent: -50 });

    const xCursor = gsap.quickSetter(cursor, "x", "px");
    const yCursor = gsap.quickSetter(cursor, "y", "px");
    const xFollower = gsap.quickSetter(follower, "x", "px");
    const yFollower = gsap.quickSetter(follower, "y", "px");
    let mouseX = 0;
    let mouseY = 0;
    let followerX = 0;
    let followerY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      xCursor(mouseX);
      yCursor(mouseY);
    };

    // Animation loop for the follower
    const tick = () => {
      followerX += (mouseX - followerX) * 0.15;
      followerY += (mouseY - followerY) * 0.15;
      xFollower(followerX);
      yFollower(followerY);
      requestAnimationFrame(tick);
    };
    const rafId = requestAnimationFrame(tick);

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = target.closest('a, button, .project-item, .group\\/icon');

      if (interactive) {
        gsap.to(follower, {
          scale: 1.5,
          backgroundColor: 'rgba(0, 0, 0, 0.03)',
          borderColor: 'var(--foreground)',
          borderWidth: '0.5px',
          duration: 0.4,
          ease: 'power2.out'
        });

        if (target.closest('.project-item') || target.closest('a') || target.closest('button')) {
          setCursorText('見'); // 'Ken' - See/View
          gsap.to(follower, {
            scale: 2.5,
            backgroundColor: 'var(--foreground)',
            borderColor: 'transparent',
            mixBlendMode: 'difference',
            duration: 0.4,
          });
          gsap.to(cursor, {
            scale: 0,
            duration: 0.2
          });
        }
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = target.closest('a, button, .project-item, .group\\/icon');

      if (interactive) {
        setCursorText('');
        gsap.to(follower, {
          scale: 1,
          backgroundColor: 'transparent',
          borderColor: 'var(--foreground)',
          borderWidth: '1px',
          mixBlendMode: 'normal',
          duration: 0.4,
          ease: 'power2.out'
        });
        gsap.to(cursor, {
          scale: 1,
          duration: 0.2
        });
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseover', onMouseOver);
    window.addEventListener('mouseout', onMouseOut);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('mouseout', onMouseOut);
      cancelAnimationFrame(rafId);
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <>
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-foreground rounded-full pointer-events-none z-[100001] hidden lg:block"
      />
      <div
        ref={followerRef}
        className="fixed top-0 left-0 w-8 h-8 border border-foreground/40 rounded-full pointer-events-none z-[100000] items-center justify-center overflow-hidden hidden lg:flex"
      >
        <span
          ref={labelRef}
          className="text-[10px] font-serif font-light text-background opacity-100 transition-opacity"
        >
          {cursorText}
        </span>
      </div>
    </>
  );
};

