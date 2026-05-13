'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative py-20 bg-background overflow-hidden border-t border-[var(--separator-gray)] opacity-90">
      {/* Background Large Text */}
      <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 pointer-events-none select-none opacity-[0.03]">
        <h2 className="text-[22vw] font-black italic uppercase leading-none text-transparent whitespace-nowrap" style={{ WebkitTextStroke: "1px var(--text-stroke)" }}>
          TRHGATU.
        </h2>
      </div>

      <div className="mx-auto max-w-[1400px] px-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 items-start mb-24">

          {/* Brand & Mission */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-5 h-5 border border-accent rotate-45 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-accent" />
              </div>
              <span className="text-xl font-black italic tracking-widest text-foreground">TRHGATU</span>
            </div>
            <p className="text-foreground/40 font-light leading-relaxed max-w-sm uppercase text-[10px] tracking-widest">
              Software Architect & Digital Alchemist. <br />
              Building high-performance digital legacies through the synthesis of logic and aesthetics.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <span className="text-[9px] font-mono text-accent/60 uppercase tracking-[0.4em] mb-8 block font-bold">Protocols //</span>
            <ul className="space-y-4">
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
                    className="text-[10px] font-mono text-foreground/40 hover:text-accent uppercase tracking-widest transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-px bg-accent/0 group-hover:w-3 group-hover:bg-accent transition-all" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Connectivity */}
          <div className="md:col-span-4 flex flex-col md:items-end">
            <span className="text-[9px] font-mono text-accent/60 uppercase tracking-[0.4em] mb-8 block font-bold">Connectivity //</span>
            <div className="flex flex-col gap-5 md:text-right">
              {[
                { label: 'LINKEDIN', sub: 'Connect_To' },
                { label: 'GITHUB', sub: 'Source_Code' },
                { label: 'TELEGRAM', sub: 'Dispatch' }
              ].map((social) => (
                <a key={social.label} href="#" className="group flex items-center md:justify-end gap-3 text-sm font-black italic uppercase text-foreground/30 hover:text-foreground transition-all">
                  <span className="text-[8px] font-mono opacity-0 group-hover:opacity-100 transition-all tracking-[0.3em] text-accent translate-x-2 group-hover:translate-x-0">{social.sub}</span>
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-[var(--separator-gray)] flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="text-[9px] font-mono text-foreground/20 uppercase tracking-widest">
              © {currentYear} TRHGATU // ALL_RIGHTS_RESERVED
            </div>
            <div className="h-4 w-px bg-foreground/5 hidden md:block" />
            <div className="text-[9px] font-mono text-foreground/20 uppercase tracking-widest">
              BUILD_NODE: VN_7.4.2 // STATUS: SECURE
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-[9px] font-mono text-foreground/40 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              SYSTEM_OPERATIONAL
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
