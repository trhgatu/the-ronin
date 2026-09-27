'use client';

import dynamic from 'next/dynamic';

const HeroScene = dynamic(() => import('./HeroScene').then((m) => m.HeroScene), { ssr: false });

/**
 * A single, app-wide fixed canvas layer sitting behind every section (z-0,
 * below the page's normal-flow content, above the plain body background).
 * Nothing in it is interactive — sections reveal it only by leaving gaps in
 * their own backgrounds (see Hero's mouse-reveal veil).
 */
export function GlobalCanvas() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      <HeroScene />
    </div>
  );
}
