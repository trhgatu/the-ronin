'use client';

import Link from 'next/link';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative py-16 md:py-24 bg-background overflow-hidden border-t border-[var(--separator-gray)] opacity-95">
      <div className="absolute bottom-[-2%] md:bottom-[-10%] left-1/2 -translate-x-1/2 pointer-events-none select-none opacity-[0.04] transition-all">
        <h2 className="text-[40vw] md:text-[22vw] font-black italic uppercase leading-none text-transparent whitespace-nowrap" style={{ WebkitTextStroke: "1px var(--text-stroke)" }}>
          TRHGATU.
        </h2>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 md:px-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 items-start mb-20 md:mb-28">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-6 md:mb-10">
              <div className="w-6 h-6 border border-accent rotate-45 flex items-center justify-center">
                <div className="w-2 h-2 bg-accent animate-pulse" />
              </div>
              <span className="text-2xl font-black italic tracking-widest text-foreground">TRHGATU</span>
            </div>
            <p className="text-foreground/50 font-light leading-relaxed max-w-sm uppercase text-[10px] md:text-[11px] tracking-[0.2em] md:tracking-widest italic">
              Software Architect & Digital Alchemist. <br className="hidden sm:block" />
              Building high-performance digital legacies through the synthesis of logic and aesthetics.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <div className="flex items-center gap-4 mb-8">
              <span className="text-[10px] font-mono text-accent uppercase tracking-[0.4em] font-bold whitespace-nowrap">Protocols //</span>
              <div className="h-px w-full bg-border md:hidden" />
            </div>
            <ul className="space-y-5 md:space-y-4">
              {[
                { label: 'Foundation', href: '#hero' },
                { label: 'Architect', href: '#about' },
                { label: 'Artifacts', href: '#artifacts' },
                { label: 'Essence', href: '#essence' },
                { label: 'Philosophy', href: '#philosophy' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-xs md:text-[10px] font-mono text-foreground/40 hover:text-accent uppercase tracking-[0.3em] md:tracking-widest transition-all flex items-center gap-3 group"
                  >
                    <span className="w-1 h-px bg-accent/0 group-hover:w-4 group-hover:bg-accent transition-all" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-4 flex flex-col md:items-end">
            <div className="flex items-center gap-4 mb-8 w-full md:w-auto">
              <span className="text-[10px] font-mono text-accent uppercase tracking-[0.4em] font-bold whitespace-nowrap">Connectivity //</span>
              <div className="h-px w-full bg-border md:hidden" />
            </div>
            <div className="flex flex-col gap-6 md:gap-5 md:text-right w-full">
              {[
                { label: 'LINKEDIN', sub: 'Connect_To' },
                { label: 'GITHUB', sub: 'Source_Code' },
                { label: 'TELEGRAM', sub: 'Dispatch' }
              ].map((social) => (
                <a key={social.label} href="#" className="group flex items-center md:justify-end gap-4 text-base md:text-sm font-black italic uppercase text-foreground/30 hover:text-foreground transition-all">
                  <span className="text-[9px] font-mono opacity-40 md:opacity-0 md:group-hover:opacity-100 transition-all tracking-[0.3em] text-accent translate-x-0 md:translate-x-2 md:group-hover:translate-x-0">{social.sub}</span>
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="pt-10 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-10 md:gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:flex items-center gap-6 md:gap-10 w-full md:w-auto">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-10">
              <div className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest flex items-center gap-2">
                <span className="text-accent/40">COPYRIGHT</span>
                <span>© {currentYear} TRHGATU</span>
              </div>
              <div className="h-4 w-px bg-border hidden md:block" />
              <div className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest flex items-center gap-2">
                <span className="text-accent/40">NODE</span>
                <span>VN_ALPHA_7.4.2</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between w-full md:w-auto px-4 py-3 md:p-0 border border-border md:border-none rounded-sm bg-foreground/[0.02] md:bg-transparent">
            <div className="text-[10px] font-mono text-foreground/40 flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-accent animate-ping absolute opacity-75" />
                <span className="w-2 h-2 rounded-full bg-accent relative" />
              </div>
              <span className="tracking-[0.2em]">SYSTEM_LIVE</span>
            </div>
            <div className="md:hidden text-[10px] font-mono text-accent/50">
              SECURE_LINK_ESTABLISHED
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
