'use client';

import Link from 'next/link';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative py-16 md:py-24 bg-background overflow-hidden border-t-2 border-foreground/15 opacity-95">
      <div className="absolute top-[-2px] left-0 w-full h-[3px] bg-background" style={{ filter: "url(#line-torn-filter)" }} />
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat z-0" />

      {/* SVG filter definition for horizontal line tearing */}
      <svg className="absolute w-0 h-0 invisible" aria-hidden="true">
        <defs>
          <filter id="line-torn-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className="absolute bottom-[-5%] left-1/2 -translate-x-1/2 pointer-events-none select-none opacity-[0.02] transition-all z-0">
        <h2 className="text-[50vw] md:text-[25vw] font-serif font-black uppercase leading-none text-foreground whitespace-nowrap" style={{ filter: "url(#line-torn-filter)" }}>
          宮本
        </h2>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 md:px-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 items-start mb-20 md:mb-28">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-6 md:mb-10 text-foreground">
              <span className="text-2xl font-serif tracking-widest font-bold">TRHGATU</span>
              <span className="text-2xl font-serif">侍</span>
            </div>
            <p className="text-foreground/60 font-serif font-light leading-relaxed max-w-sm text-sm md:text-base">
              The Way of The Ronin. <br />
              Forging digital artifacts through the perfect synthesis of architecture and aesthetics.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <div className="flex items-center gap-4 mb-8">
              <span className="text-[10px] font-mono text-foreground/50 uppercase tracking-[0.4em] font-bold whitespace-nowrap">The Scrolls //</span>
              <div className="h-[2px] w-full bg-foreground/15 md:hidden" style={{ filter: "url(#line-torn-filter)" }} />
            </div>
            <ul className="space-y-5 md:space-y-4">
              {[
                { label: 'Prologue', href: '#hero' },
                { label: 'The Architect', href: '#about' },
                { label: 'Artifacts', href: '#artifacts' },
                { label: 'The Armory', href: '#stack' },
                { label: 'The Void', href: '#philosophy' },
                { label: 'The Battles', href: '#experience' },
                { label: 'The Summons', href: '#contact' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-xs md:text-sm font-serif font-light text-foreground/50 hover:text-foreground uppercase tracking-widest transition-colors flex items-center gap-3 group"
                  >
                    <span className="text-foreground/20 font-serif text-sm group-hover:translate-x-1 transition-transform duration-500">一</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-4 flex flex-col md:items-end">
            <div className="flex items-center gap-4 mb-8 w-full md:w-auto">
              <span className="text-[10px] font-mono text-foreground/50 uppercase tracking-[0.4em] font-bold whitespace-nowrap">Alliances //</span>
              <div className="h-[2px] w-full bg-foreground/15 md:hidden" style={{ filter: "url(#line-torn-filter)" }} />
            </div>
            <div className="flex flex-col gap-6 md:gap-5 md:text-right w-full">
              {[
                { label: 'LINKEDIN', href: 'https://linkedin.com', sub: 'Clan_Network' },
                { label: 'GITHUB', href: 'https://github.com', sub: 'Dojo_Records' },
                { label: 'Instagram', href: 'https://instagram.com/th_atu/', sub: '@th_atu' }
              ].map((social) => (
                <a key={social.label} href={social.href} className="group flex items-center md:justify-end gap-4 text-base md:text-sm font-serif font-bold uppercase text-foreground/40 hover:text-foreground transition-colors">
                  <span className="text-[9px] font-mono opacity-40 md:opacity-0 md:group-hover:opacity-100 transition-all tracking-[0.3em] text-foreground/50 translate-x-0 md:translate-x-2 md:group-hover:translate-x-0">{social.sub}</span>
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="pt-10 border-t-2 border-foreground/15 flex flex-col md:flex-row justify-between items-center gap-10 md:gap-8 relative">
          <div className="text-[10px] font-mono text-foreground/40 uppercase tracking-widest flex items-center gap-2">
            <span>COPYRIGHT</span>
            <span>© {currentYear} TRHGATU. ALL RIGHTS RESERVED.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

