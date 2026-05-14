'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [cursorText, setCursorText] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile/touch device
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth < 1024 || 
        window.matchMedia('(pointer: coarse)').matches ||
        'ontouchstart' in window
      );
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const cursor = cursorRef.current;
    const follower = followerRef.current;

    if (!cursor || !follower || isMobile) return;
    
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

    // Animation loop for the follower (smoother than direct events)
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
          scale: 2.5,
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          borderColor: 'rgba(251, 191, 36, 0.5)',
          borderRadius: '50%',
          duration: 0.4,
          ease: 'power2.out'
        });

        if (target.closest('.project-item')) {
          setCursorText('VIEW');
          gsap.to(follower, {
            scale: 4,
            backgroundColor: '#fbbf24',
            borderRadius: '50%',
            mixBlendMode: 'normal',
            duration: 0.4,
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
          borderColor: 'rgba(251, 191, 36, 1)',
          mixBlendMode: 'difference',
          duration: 0.4,
          ease: 'power2.out'
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
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-accent rounded-full pointer-events-none z-[100001] -translate-x-1/2 -translate-y-1/2 hidden lg:block"
      />
      <div
        ref={followerRef}
        className="fixed top-0 left-0 w-8 h-8 border border-accent rounded-full pointer-events-none z-[100000] -translate-x-1/2 -translate-y-1/2 mix-blend-difference items-center justify-center overflow-hidden hidden lg:flex"
      >
        <span
          ref={labelRef}
          className="text-[6px] font-black text-black opacity-100 transition-opacity"
        >
          {cursorText}
        </span>
      </div>
    </>
  );
};
