'use client';

import { useEffect } from 'react';

// A torn, irregular reveal hole (à la segerman.dev's jagged cursor-following
// cutout) instead of a clean geometric circle — built as several static data
// URIs (different feTurbulence seeds) so the per-frame update only ever
// touches `mask-position` and swaps which precomputed `mask-image` is active
// (both plain CSS property writes, proven safe) rather than mutating an SVG
// element's own internals. An EARLIER attempt animated a live SVG <mask> by
// rewriting its inner <g transform> attribute each frame, referenced via
// `mask: url(#id)` — deep jank/bug in Chromium: it silently never repaints on
// that kind of mutation. A SECOND attempt baked just one static shape and
// only ever moved it — correct, but visually dead: the torn edge itself
// never changed, just slid around, reading as a rigid stamp rather than
// paper. Cycling between several pre-torn variants as the cursor moves is
// what actually makes the edge tremble/breathe like real torn paper. Reuses
// the exact feTurbulence + feDisplacementMap recipe already used for the
// site's other torn-paper edges (About's avatar frame, the Hero emblem
// frame), just with different seeds.
export const CURSOR_MASK_SIZE = 340;
const CURSOR_MASK_SEEDS = [2, 7, 13, 19, 31, 42];
export const CURSOR_MASK_URLS = CURSOR_MASK_SEEDS.map((seed) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${CURSOR_MASK_SIZE}" height="${CURSOR_MASK_SIZE}" viewBox="0 0 ${CURSOR_MASK_SIZE} ${CURSOR_MASK_SIZE}">
      <defs>
        <filter id="t" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="4" seed="${seed}" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="70" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <circle cx="${CURSOR_MASK_SIZE / 2}" cy="${CURSOR_MASK_SIZE / 2}" r="${CURSOR_MASK_SIZE * 0.28}" fill="black" filter="url(#t)" />
    </svg>
  `;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
});

/**
 * Drives a torn cursor-following reveal hole on `wrapperRef`'s mask-image/
 * mask-position, tracking mouse movement over `containerRef`. Multiple
 * independent callers (e.g. Hero's text/emblem overlay and SumiLeaves' pink
 * reveal layer) can each call this against the same containerRef — every
 * instance reads the same real mouse events each frame, so their holes stay
 * visually coincident without needing to share state.
 */
export function useTornCursorMask(
  containerRef: React.RefObject<HTMLElement | null>,
  wrapperRef: React.RefObject<HTMLElement | null>,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    const wrapper = wrapperRef.current;
    if (!container || !wrapper) return;

    const HALF = CURSOR_MASK_SIZE / 2;
    // Swap to the next torn variant every ~28px of cursor travel — tied to
    // motion rather than a fixed timer, so the edge only trembles while
    // actually moving (a paused cursor holds a stable, readable shape).
    const SWAP_DISTANCE = 28;
    let rafId = 0;
    let pointer: { x: number; y: number } | null = null;
    let lastSwapPoint: { x: number; y: number } | null = null;
    let variantIndex = 0;

    const setMaskPosition = (px: number, py: number) => {
      const value = `${px - HALF}px ${py - HALF}px`;
      wrapper.style.maskPosition = value;
      wrapper.style.setProperty('-webkit-mask-position', value);
    };

    const setMaskVariant = (index: number) => {
      const url = CURSOR_MASK_URLS[index % CURSOR_MASK_URLS.length];
      wrapper.style.maskImage = url;
      wrapper.style.setProperty('-webkit-mask-image', url);
    };

    setMaskVariant(variantIndex);
    // Start with nothing revealed — the duplicate stays fully hidden until the cursor actually enters.
    setMaskPosition(-9999, -9999);

    const apply = () => {
      rafId = 0;
      if (!pointer) return;
      const rect = wrapper.getBoundingClientRect();
      const px = pointer.x - rect.left;
      const py = pointer.y - rect.top;
      setMaskPosition(px, py);

      if (!lastSwapPoint || Math.hypot(px - lastSwapPoint.x, py - lastSwapPoint.y) >= SWAP_DISTANCE) {
        lastSwapPoint = { x: px, y: py };
        variantIndex += 1;
        setMaskVariant(variantIndex);
      }
    };

    const schedule = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(apply);
    };

    const onMove = (e: MouseEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
      schedule();
    };
    const onLeave = () => {
      pointer = null;
      setMaskPosition(-9999, -9999);
    };

    container.addEventListener('mousemove', onMove);
    container.addEventListener('mouseleave', onLeave);
    return () => {
      container.removeEventListener('mousemove', onMove);
      container.removeEventListener('mouseleave', onLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [active, containerRef, wrapperRef]);
}
