'use client';

import React from 'react';
import { Project } from './artifacts.data';

interface CaseStudyModalProps {
  openProject: Project | null;
  galleryIdx: number;
  onClose: () => void;
  onSelectGallery: (idx: number) => void;
  detailRef: React.RefObject<HTMLDivElement | null>;
  sheetRef: React.RefObject<HTMLDivElement | null>;
  slotRef: React.RefObject<HTMLDivElement | null>;
}

export const CaseStudyModal = ({
  openProject,
  galleryIdx,
  onClose,
  onSelectGallery,
  detailRef,
  sheetRef,
  slotRef,
}: CaseStudyModalProps) => {
  if (!openProject) return null;

  return (
    <>
      {/* touch-none: on touch devices Lenis doesn't own scrolling, so a
          swipe outside the copy would otherwise scroll the page behind. */}
      <div className="absolute inset-0 z-[22] touch-none" aria-hidden="true" />
      <div
        ref={detailRef}
        className="absolute inset-0 z-[35] pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="artifact-case-title"
      >
        {/* The sheet box is where the mist panel lands; everything in
            the case study lives inside it, padded clear of its torn
            edge. The slot is only a target box for the image. */}
        <div
          ref={sheetRef}
          className="absolute inset-3 sm:inset-5 lg:inset-[4vmin]"
        >
          {/* Floating Top-Right Close Button */}
          <button
            onClick={onClose}
            aria-label="Close project detail"
            className="case-reveal pointer-events-auto absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-7 lg:right-8 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-black/60 hover:bg-white/10 hover:border-white/50 backdrop-blur-md text-white/70 hover:text-white transition-all duration-300 group cursor-pointer shadow-xl select-none"
          >
            <span className="font-mono text-[10px] tracking-widest uppercase">CLOSE</span>
            <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px] group-hover:bg-white/20 transition-colors">✕</span>
          </button>

          <div className="absolute inset-0 flex flex-col gap-6 px-7 pt-20 pb-8 sm:px-12 sm:pt-24 lg:grid lg:grid-cols-12 lg:gap-[4vw] lg:px-[5vw] lg:pt-28 lg:pb-[5vmin]">
            <div className="shrink-0 flex flex-col gap-3 sm:gap-4 lg:order-last lg:col-span-6 lg:self-center">
              <div ref={slotRef} aria-hidden="true" className="w-full aspect-[16/10]" />

              {/* Gallery: thumbnails are plain images; picking one mist-morphs
                  the portal (already on the GPU, preloaded on open). */}
              {openProject.gallery.length > 1 && (
                <div className="case-reveal pointer-events-auto flex items-center gap-4">
                  <div className="flex gap-2 sm:gap-2.5">
                    {openProject.gallery.map((item, i) => (
                      <button
                        key={item.src}
                        onClick={() => onSelectGallery(i)}
                        aria-label={item.caption}
                        aria-current={i === galleryIdx}
                        className={`relative w-12 sm:w-16 aspect-[16/10] overflow-hidden rounded-[2px] border transition-all duration-500 cursor-pointer ${i === galleryIdx
                          ? 'border-white/60 opacity-100'
                          : 'border-white/10 opacity-40 hover:opacity-80'
                          }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.src} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
                      </button>
                    ))}
                  </div>
                  <p className="min-w-0 font-mono text-[10px] sm:text-[11px] tracking-wider text-white/45 leading-snug">
                    <span className="text-white/70">{String(galleryIdx + 1).padStart(2, '0')} / {String(openProject.gallery.length).padStart(2, '0')}</span>
                    <span className="hidden sm:inline"> — {openProject.gallery[galleryIdx]?.caption}</span>
                  </p>
                </div>
              )}
            </div>

            {/* data-lenis-prevent: Lenis is stopped while this is open,
                and this column scrolls natively on its own. The mask
                fades copy out at the bottom instead of cutting it. */}
            <div
              data-lenis-prevent
              style={{
                maskImage: 'linear-gradient(to bottom, black calc(100% - 4rem), transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 4rem), transparent)',
              }}
              className="case-scroll pointer-events-auto min-h-0 flex-1 overflow-y-auto pr-4 pb-16 lg:col-span-6 lg:h-full"
            >
              <div className="case-reveal flex items-center gap-3 mb-4 pt-1">
                <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-white/50">
                  {openProject.category} · {openProject.year}
                </span>
              </div>
              <h2 id="artifact-case-title" className="case-reveal font-serif text-[2.75rem] sm:text-6xl xl:text-7xl text-white font-light tracking-tight leading-[1.02] mb-5">
                {openProject.title}
              </h2>
              <p className="case-reveal flex items-start gap-2.5 font-mono text-[13px] text-white/75 tracking-wide leading-relaxed mb-3">
                <span className="mt-1 w-2 h-2 shrink-0 rounded-full" style={{ backgroundColor: openProject.accent }} />
                {openProject.highlights}
              </p>
              <p className="case-reveal font-caveat text-2xl text-white/55 mb-6">{openProject.role}</p>

              {/* Primary Action Buttons (Instant Live & Source Links without scrolling) */}
              <div className="case-reveal flex flex-wrap items-center gap-3 mb-10">
                {openProject.links.map((link) => {
                  const isLive = link.label.toLowerCase() === 'live';
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`font-mono text-xs tracking-widest uppercase px-4 py-2.5 rounded transition-all cursor-pointer flex items-center gap-2 ${
                        isLive
                          ? 'bg-white text-black font-semibold hover:bg-white/90 shadow-[0_4px_16px_rgba(255,255,255,0.15)] hover:scale-[1.02]'
                          : 'border border-white/20 bg-white/[0.04] text-white/80 hover:text-white hover:border-white/50 hover:bg-white/[0.08]'
                      }`}
                    >
                      <span>{link.label}</span>
                      <span className="text-sm font-sans">↗</span>
                    </a>
                  );
                })}
              </div>

              {([
                ['The Problem', openProject.problem],
                ['The Approach', openProject.approach],
                ['The Outcome', openProject.outcome],
              ] as const).map(([label, text]) => (
                <div key={label} className="case-reveal mb-10">
                  <h4 className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/45 mb-2.5">
                    {label}
                  </h4>
                  <p className="text-base lg:text-[17px] text-white/80 font-light leading-[1.75]">
                    {text}
                  </p>
                </div>
              ))}

              <div className="case-reveal mb-10">
                <h4 className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/45 mb-3">
                  Under the Hood
                </h4>
                <ul className="space-y-2.5">
                  {openProject.engineering.map((item) => (
                    <li key={item} className="flex gap-3 text-[15px] lg:text-base text-white/75 font-light leading-relaxed">
                      <span className="text-white/30 font-mono">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="case-reveal mb-10">
                <h4 className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/45 mb-2.5">
                  Stack
                </h4>
                <div className="flex flex-wrap gap-2">
                  {openProject.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-[10px] tracking-wider px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white/80"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {openProject.credit && (
                <p className="case-reveal font-mono text-[10px] text-white/35 leading-relaxed mb-8">
                  {openProject.credit}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
