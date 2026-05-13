"use client";

import { ShaderFlow } from "@/components/shared/ShaderFlow";
import type { ReactNode } from "react";

export function PageBackdrop(): ReactNode {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[200vh] overflow-hidden"
    >
      <div className="absolute inset-0 opacity-40 md:opacity-60">
        <ShaderFlow 
          brightness={3} 
          iterations={10} 
          flowSpeed={[0, 0.1]} 
          className="absolute inset-0 h-full w-full grayscale"
        />
      </div>
      
      {/* Ambient Aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-screen bg-accent/5 rounded-full blur-[120px] mix-blend-screen opacity-50" />
    </div>
  );
}
