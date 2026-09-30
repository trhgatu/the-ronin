'use client';

import Link from 'next/link';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative py-16 md:py-24 bg-[#111111] text-white overflow-hidden border-t border-white/10 select-none z-20">
      {/* Torn paper line transition at the boundary */}
      <div
        className="absolute top-[-2px] left-0 w-full h-[3px] bg-[#111111]"
        style={{ filter: "url(#line-torn-filter-footer)" }}
      />

      <svg className="absolute w-0 h-0 invisible" aria-hidden="true">
        <defs>
          <filter id="line-torn-filter-footer" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className="mx-auto max-w-[1400px] px-6 md:px-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 items-start mb-20 md:mb-24">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-6 md:mb-8 text-white">
              <span className="text-2xl font-serif tracking-widest font-bold">TRHGATU</span>
            </div>
            <p className="text-white/60 font-serif font-light leading-relaxed max-w-sm text-sm md:text-base">
              The Way of The Ronin. <br />
              Forging digital artifacts through the perfect synthesis of architecture and aesthetics.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <div className="flex items-center gap-4 mb-8">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.4em] font-bold whitespace-nowrap">
                The Scrolls //
              </span>
              <div className="h-[1px] w-full bg-white/10 md:hidden" />
            </div>
            <ul className="space-y-4">
              {[
                { label: 'Prologue', href: '#hero' },
                { label: 'The Architect', href: '#about' },
                { label: 'Artifacts', href: '#artifacts' },
                { label: 'The Void', href: '#philosophy' },
                { label: 'The Battles', href: '#experience' },
                { label: 'The Summons', href: '#contact' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-xs md:text-sm font-serif font-light text-white/50 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-3 group"
                  >
                    <span className="text-white/20 font-serif text-sm group-hover:translate-x-1 transition-transform duration-300">
                      —
                    </span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Alliances */}
          <div className="md:col-span-4 flex flex-col md:items-end">
            <div className="flex items-center gap-4 mb-8 w-full md:w-auto">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.4em] font-bold whitespace-nowrap">
                Alliances //
              </span>
              <div className="h-[1px] w-full bg-white/10 md:hidden" />
            </div>
            <div className="flex flex-col gap-5 md:text-right w-full">
              {[
                { label: 'LINKEDIN', href: 'https://linkedin.com/in/trhgatu1103', sub: '@trhgatu1103' },
                { label: 'GITHUB', href: 'https://github.com/trhgatu', sub: '@trhgatu' },
                { label: 'Instagram', href: 'https://instagram.com/th_atu/', sub: '@th_atu' }
              ].map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center md:justify-end gap-4 text-sm font-serif font-bold uppercase text-white/40 hover:text-white transition-colors"
                >
                  <span className="text-[9px] font-mono opacity-40 md:opacity-0 md:group-hover:opacity-100 transition-all tracking-[0.3em] text-white/40 translate-x-0 md:translate-x-2 md:group-hover:translate-x-0">
                    {social.sub}
                  </span>
                  {social.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-6 relative">
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
            <span>© {currentYear} TRHGATU. ALL RIGHTS RESERVED.</span>
          </div>

          <button
            onClick={scrollToTop}
            className="text-[10px] font-mono text-white/40 hover:text-white uppercase tracking-widest transition-colors cursor-pointer"
          >
            BACK TO TOP ↑
          </button>
        </div>
      </div>
    </footer>
  );
};
