"use client";

import { Mesh, Program, Renderer, Transform, Triangle } from "ogl";
import { useEffect, useRef, type ReactNode } from "react";

export type TechGridProps = {
  className?: string;
  gridSize?: number;
  mouseRadius?: number;
  mouseStrength?: number;
  glowColor?: [number, number, number];
  lineColor?: [number, number, number];
};

const VS = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FS = `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform float uGridSize;
uniform float uMouseRadius;
uniform float uMouseStrength;
uniform vec3 uLineColor;
uniform vec3 uGlowColor;
uniform vec3 uBgColor;

varying vec2 vUv;

float grid(vec2 uv, float res) {
  vec2 grid = fract(uv * res);
  vec2 line = smoothstep(0.0, 0.03, grid) - smoothstep(0.03, 0.06, grid);
  return max(line.x, line.y);
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / uResolution.y;
  uv.x *= aspect;
  
  vec2 mouse = uMouse;
  mouse.x *= aspect;

  // Mouse distortion / influence
  float d = length(uv - mouse);
  float mFactor = smoothstep(uMouseRadius, 0.0, d) * uMouseStrength;
  
  // Grid calculation
  float g = grid(uv, uGridSize);
  
  // Scanline effect
  float scanline = smoothstep(0.9, 1.0, fract(uv.y * 2.0 - uTime * 0.2));
  
  // Pulse at intersections near mouse
  vec2 gridUV = fract(uv * uGridSize);
  float intersection = smoothstep(0.1, 0.0, length(gridUV - 0.5));
  float pulse = intersection * mFactor;

  // Combine colors
  vec3 color = uBgColor;
  
  // Base grid lines
  color = mix(color, uLineColor, g * 0.3);
  
  // Glowing lines near mouse
  color = mix(color, uGlowColor, g * mFactor * 2.0);
  
  // Intersection pulses
  color += uGlowColor * pulse * 0.5;
  
  // Subtle scanline overlay
  color += uLineColor * scanline * 0.05;

  gl_FragColor = vec4(color, 1.0);
}
`;

function parseColor(input: string): [number, number, number] | null {
  const s = input.trim();
  if (s.startsWith("#")) {
    let hex = s.slice(1);
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("");
    }
    if (hex.length !== 6) return null;
    const n = parseInt(hex, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const m = s.match(/(\d+(?:\.\d+)?)/g);
  if (!m || m.length < 3) return null;
  return [Number(m[0]) / 255, Number(m[1]) / 255, Number(m[2]) / 255];
}

function getVariableColor(varName: string): [number, number, number] {
  if (typeof window === "undefined") return [0, 0, 0];
  const styles = getComputedStyle(document.documentElement);
  const val = styles.getPropertyValue(varName).trim();
  return parseColor(val) ?? [0.5, 0.5, 0.5];
}

export function TechGrid({
  className,
  gridSize = 25,
  mouseRadius = 0.3,
  mouseStrength = 0.8,
  lineColor,
  glowColor,
}: TechGridProps): ReactNode {
  const ref = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef<[number, number]>([-1, -1]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      alpha: false,
      antialias: false,
    });
    const gl = renderer.gl;
    el.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: VS,
      fragment: FS,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [0, 0] },
        uMouse: { value: [-1, -1] },
        uGridSize: { value: gridSize },
        uMouseRadius: { value: mouseRadius },
        uMouseStrength: { value: mouseStrength },
        uLineColor: { value: lineColor ?? [0.2, 0.2, 0.2] },
        uGlowColor: { value: glowColor ?? [0.98, 0.75, 0.14] }, // Default accent amber
        uBgColor: { value: [0.02, 0.02, 0.02] },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    const scene = new Transform();
    mesh.setParent(scene);

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h);
      program.uniforms.uResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight];
    };

    const updateColors = () => {
      program.uniforms.uBgColor.value = getVariableColor("--background");
      const accent = getVariableColor("--accent");
      if (!glowColor) program.uniforms.uGlowColor.value = accent;
      if (!lineColor) program.uniforms.uLineColor.value = accent.map(c => c * 0.3);
    };

    window.addEventListener("resize", resize);
    resize();
    updateColors();

    const onPointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      mouseRef.current = [x, y];
    };
    el.addEventListener("pointermove", onPointerMove);

    let raf = 0;
    const tick = (t: number) => {
      program.uniforms.uTime.value = t * 0.001;
      program.uniforms.uMouse.value = mouseRef.current;
      renderer.render({ scene });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      el.removeEventListener("pointermove", onPointerMove);
      observer.disconnect();
      if (gl.canvas.parentNode === el) el.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [gridSize, mouseRadius, mouseStrength, lineColor, glowColor]);

  return <div ref={ref} className={className ?? "absolute inset-0 z-0"} />;
}

