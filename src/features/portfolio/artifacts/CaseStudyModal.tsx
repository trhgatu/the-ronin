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
      {/* Backdrop click to close */}
      <div
        onClick={onClose}
        className="absolute inset-0 z-[22] cursor-pointer touch-none"
        aria-hidden="true"
      />
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
          {/* Close Button: Fog Lens Capsule */}
          <button
            onClick={onClose}
            aria-label="Close project detail"
            title="Close (ESC)"
            className="case-reveal pointer-events-auto absolute top-5 right-5 sm:top-6 sm:right-6 lg:top-7 lg:right-8 z-50 flex items-center gap-2.5 pl-3.5 pr-2.5 py-1.5 sm:pl-4 sm:pr-3 sm:py-2 rounded-full border border-white/20 bg-black/70 hover:bg-black/90 hover:border-white/50 backdrop-blur-xl text-white/70 hover:text-white shadow-[0_4px_20px_rgba(0,0,0,0.6),0_0_12px_rgba(255,255,255,0.06)] hover:shadow-[0_4px_25px_rgba(0,0,0,0.8),0_0_20px_rgba(255,255,255,0.18)] transition-all duration-300 group cursor-pointer select-none"
          >
            <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.2em] uppercase transition-colors">
              Close
            </span>
            <span className="w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-full bg-white/10 group-hover:bg-white/25 flex items-center justify-center transition-all duration-300">
              <svg
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white/80 group-hover:text-white transition-transform duration-300 group-hover:rotate-90"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </span>
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
              {/* Header Info */}
              <div className="case-reveal mb-3 pt-1 text-[11px] font-mono tracking-[0.25em] uppercase text-white/40">
                <span>{openProject.type ?? (openProject.category.toLowerCase().includes('client') ? 'Client Work' : 'Personal Project')}</span>
                <span className="mx-2 text-white/20 select-none">·</span>
                <span>{openProject.year}</span>
              </div>

              <h2 id="artifact-case-title" className="case-reveal font-serif text-[2.75rem] sm:text-6xl xl:text-7xl text-white font-light tracking-tight leading-[1.02] mb-3">
                {openProject.title}
              </h2>

              <p className="case-reveal font-mono text-[12px] sm:text-[13px] text-white/60 tracking-wide leading-relaxed my-3">
                {openProject.highlights}
              </p>

              {/* Action Links */}
              <div className="case-reveal flex flex-wrap items-center gap-3 my-7">
                {openProject.links.map((link) => {
                  const isLive = link.label.toLowerCase() === 'live';
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group font-mono text-[11px] tracking-[0.2em] uppercase px-4 py-2 border rounded-[2px] transition-all duration-300 flex items-center gap-2 select-none cursor-pointer ${
                        isLive
                          ? 'border-white bg-white text-black font-semibold hover:bg-white/90'
                          : 'border-white/20 bg-white/[0.03] text-white/80 hover:border-white/50 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      <span>{link.label}</span>
                      <span className="text-xs transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
                    </a>
                  );
                })}
              </div>

              {([
                ['The Problem', openProject.problem],
                ['Approach', openProject.approach],
                ['Outcome', openProject.outcome],
              ] as const).map(([label, text]) => (
                <div key={label} className="case-reveal mb-9">
                  <h4 className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-white/40 mb-2 font-medium">
                    {label}
                  </h4>
                  <p className="text-base lg:text-[16.5px] text-white/80 font-light leading-[1.8]">
                    {text}
                  </p>
                </div>
              ))}

              <div className="case-reveal mb-9">
                <h4 className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-white/40 mb-2.5 font-medium">
                  Engineering Notes
                </h4>
                <ul className="space-y-2.5">
                  {openProject.engineering.map((item) => (
                    <li key={item} className="flex gap-3 text-[14.5px] lg:text-[15.5px] text-white/75 font-light leading-relaxed">
                      <span className="text-white/30 font-mono select-none">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="case-reveal mb-9 pt-4 border-t border-white/10">
                <h4 className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-white/40 mb-2.5 font-medium">
                  Stack
                </h4>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[12px] font-mono text-white/60">
                  {openProject.tags.map((tag, idx) => (
                    <span key={tag} className="flex items-center gap-2">
                      <span className="hover:text-white transition-colors">{tag}</span>
                      {idx < openProject.tags.length - 1 && (
                        <span className="text-white/20 select-none">/</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {openProject.credit && (
                <p className="case-reveal font-mono text-[10px] text-white/35 leading-relaxed mb-6">
                  {openProject.credit}
                </p>
              )}

              {/* Bottom Exit: Return to the lake/surface */}
              <div className="case-reveal pt-8 pb-14 mt-4 border-t border-white/10 flex items-center justify-between">
                <button
                  onClick={onClose}
                  className="group flex items-center gap-3 text-white/50 hover:text-white transition-colors duration-300 font-mono text-[11px] tracking-[0.2em] uppercase cursor-pointer select-none"
                >
                  <span className="w-6 h-6 rounded-full border border-white/20 group-hover:border-white/60 flex items-center justify-center transition-all duration-300 group-hover:-translate-x-0.5">
                    ←
                  </span>
                  <span>Return to projects</span>
                </button>
                <span className="font-mono text-[10px] text-white/30 tracking-widest hidden sm:inline-block select-none">
                  [ESC] TO CLOSE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
