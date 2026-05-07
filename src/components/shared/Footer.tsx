'use client';

import Link from 'next/link';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative py-20 bg-black overflow-hidden border-t border-white/5">
      {/* Background Large Text */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 pointer-events-none select-none opacity-[0.02]">
        <h2 className="text-[25vw] font-black italic uppercase leading-none text-white whitespace-nowrap" style={{ WebkitTextStroke: "2px white", color: "transparent" }}>
          TRHGATU.
        </h2>
      </div>

      <div className="mx-auto max-w-[1400px] px-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 items-start mb-24">

          {/* Brand & Mission */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-6 h-6 border border-accent rotate-45 flex items-center justify-center">
                <div className="w-2 h-2 bg-accent" />
              </div>
              <span className="text-xl font-black italic tracking-widest text-white">TRHGATU</span>
            </div>
            <p className="text-zinc-500 font-light leading-relaxed max-w-sm uppercase text-[11px] tracking-widest">
              Digital Architect & Alchemist. <br />
              Building high-performance digital legacies through the synthesis of logic and aesthetics.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <span className="text-[9px] font-mono text-accent/60 uppercase tracking-[0.4em] mb-8 block font-bold">Protocols //</span>
            <ul className="space-y-4">
              {['Foundation', 'Essence', 'Philosophy', 'Artifacts', 'Journey'].map((item) => (
                <li key={item}>
                  <Link
                    href={`#${item.toLowerCase()}`}
                    className="text-[10px] font-mono text-zinc-600 hover:text-white uppercase tracking-widest transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Connectivity */}
          <div className="md:col-span-4 flex flex-col md:items-end">
            <span className="text-[9px] font-mono text-accent/60 uppercase tracking-[0.4em] mb-8 block font-bold">Connectivity //</span>
            <div className="flex flex-col gap-4 md:text-right">
              <a href="#" className="group flex items-center md:justify-end gap-3 text-sm font-black italic uppercase text-zinc-500 hover:text-white transition-all">
                <span className="text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">Connect_To</span>
                LINKEDIN
              </a>
              <a href="#" className="group flex items-center md:justify-end gap-3 text-sm font-black italic uppercase text-zinc-500 hover:text-white transition-all">
                <span className="text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">Source_Code</span>
                GITHUB
              </a>
              <a href="#" className="group flex items-center md:justify-end gap-3 text-sm font-black italic uppercase text-zinc-500 hover:text-white transition-all">
                <span className="text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">Dispatch</span>
                TELEGRAM
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-white/5 flex flex-col md:row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="text-[9px] font-mono text-zinc-800 uppercase tracking-widest">
              © {currentYear} TRHGATU // ALL_RIGHTS_RESERVED
            </div>
            <div className="h-4 w-px bg-white/5 hidden md:block" />
            <div className="text-[9px] font-mono text-zinc-800 uppercase tracking-widest">
              BUILD_NODE: VN_7.4.2 // STATUS: SECURE
            </div>
          </div>

          <div className="text-[9px] font-mono text-zinc-500 flex items-center gap-2">
            <span className="animate-pulse">●</span>
            SYSTEM_END_OF_SEQUENCE
          </div>
        </div>
      </div>
    </footer>
  );
};
