"use client";

import { Mesh, Program, Renderer, Transform, Triangle } from "ogl";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import gsap from "@/lib/gsap";

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
uniform vec2 u_resolution;
uniform vec2 u_origin;
uniform float u_progress;
uniform float u_dissolve;
uniform vec3 u_ink_color;
uniform float u_time;
varying vec2 vUv;

// Simple 2D pseudo-random noise
float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
}

// 4-octave Fractal Brownian Motion (FBM) for realistic fluid ink dynamics
float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 4; ++i) {
        v += a * noise(p);
        p = rot * p * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

void main() {
    // Aspect ratio correction for accurate radial distances
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 uv = vUv * aspect;
    vec2 origin = u_origin * aspect;

    float dist = distance(uv, origin);

    // Dynamic wave fluid noise shifting over time
    float n = fbm(vUv * 3.5 + vec2(u_time * 0.05, -u_time * 0.03));
    
    // Spreading phase boundary calculations
    float maxRadius = 3.2; // Ultrawide screen coverage
    float currentRadius = u_progress * maxRadius;
    
    // Displace distance mapping by FBM to create dynamic splattering arms
    // Gently dampen displacement to 0 at progress = 1.0 to guarantee 100% solid opacity
    float displaceScale = 1.0 - smoothstep(0.82, 1.0, u_progress);
    float displace = n * 0.75 * displaceScale;
    float edge = dist - displace;

    // Soft ink wash bleeding edge
    float inkAlpha = 1.0 - smoothstep(currentRadius - 0.25, currentRadius, edge);

    // Dissolving/Reveal phase
    if (u_dissolve > 0.0) {
        // High frequency FBM for smoky dispersion
        float n_dissolve = fbm(vUv * 7.5 - vec2(0.0, u_time * 0.08));
        // Scale to 1.2 to distribute the dissolve over the entire timeline, completing exactly at u_dissolve = 1.0
        float dissolveEdge = u_dissolve * 1.2;
        // Ripple outward organic dissolve pattern with ultra-soft feather edge (0.5)
        float dissolveMask = smoothstep(dissolveEdge - 0.5, dissolveEdge + 0.5, n_dissolve + dist * 0.15);
        inkAlpha *= dissolveMask;
        // Linear fade factor to ensure a flawless, progressive mist evaporation with zero snapping
        inkAlpha *= (1.0 - u_dissolve);
    }

    gl_FragColor = vec4(u_ink_color, inkAlpha);
}
`;

export function InkTransitionCanvas() {
  const { setTheme } = useTheme();
  const setThemeRef = useRef(setTheme);

  useEffect(() => {
    setThemeRef.current = setTheme;
  }, [setTheme]);

  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [isActive, setIsActive] = useState(false);
  const triggerRef = useRef<{ cx: number; cy: number; targetTheme: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleTrigger = (e: Event) => {
      const customEvent = e as CustomEvent<{ cx: number; cy: number; targetTheme: string }>;
      triggerRef.current = customEvent.detail;
      setIsActive(true);
    };

    window.addEventListener("trigger-ink-transition", handleTrigger);
    return () => {
      window.removeEventListener("trigger-ink-transition", handleTrigger);
    };
  }, [mounted]);

  useEffect(() => {
    if (!isActive || !triggerRef.current || !canvasContainerRef.current) return;

    const container = canvasContainerRef.current;
    const { cx, cy, targetTheme, preset } = triggerRef.current as any;
    const isMist = preset === "mist";

    // 1. Initialize OGL Context only during active transition
    const renderer = new Renderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    const gl = renderer.gl;
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);

    // Match exact background colors from globals.css to avoid color mismatch flicker!
    // Dark Background Color: #020202 | Light Background Color: #fdfdfd
    const inkColor = targetTheme === "dark"
      ? [2 / 255, 2 / 255, 2 / 255]
      : [253 / 255, 253 / 255, 253 / 255];

    // Normalized mouse click origin coordinates (invert Y for WebGL coords)
    const normalizedOrigin = [
      cx / window.innerWidth,
      1.0 - (cy / window.innerHeight)
    ];

    const program = new Program(gl, {
      vertex: VS,
      fragment: FS,
      transparent: true,
      uniforms: {
        u_resolution: { value: [gl.drawingBufferWidth, gl.drawingBufferHeight] },
        u_origin: { value: normalizedOrigin },
        u_progress: { value: isMist ? 1.0 : 0 },
        u_dissolve: { value: 0 },
        u_ink_color: { value: inkColor },
        u_time: { value: 0 },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    const scene = new Transform();
    mesh.setParent(scene);

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      program.uniforms.u_resolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight];
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    // 2. High-performance Animation Tick loop
    let rafId = 0;
    const startTime = performance.now();

    const tick = () => {
      program.uniforms.u_time.value = (performance.now() - startTime) / 1000;
      renderer.render({ scene });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    // 3. GSAP Timeline handling seamless page morphing
    const animState = { progress: isMist ? 1.0 : 0, dissolve: 0 };
    const tl = gsap.timeline({
      onUpdate: () => {
        program.uniforms.u_progress.value = animState.progress;
        program.uniforms.u_dissolve.value = animState.dissolve;
      }
    });

    if (isMist) {
      // Apply theme instantly as viewport is already covered by solid ink color
      setThemeRef.current(targetTheme);

      // Slow, poetic mist evaporation (3.8s) with sine ease for linear-decelerating fade
      tl.to(animState, {
        dissolve: 1.0,
        duration: 3.8,
        ease: "sine.out",
        onComplete: () => {
          setIsActive(false);
        }
      });
    } else {
      // Classic Theme Toggle Ink Spreading Sweep (0.6s)
      tl.to(animState, {
        progress: 1.0,
        duration: 0.6,
        ease: "power2.inOut",
        onComplete: () => {
          // Theme toggle trigger precisely at 100% solid coverage
          setThemeRef.current(targetTheme);
          
          // Creative Dev Master Technique: Artful Ink-Pool Rest Delay (150ms)
          setTimeout(() => {
            gsap.to(animState, {
              dissolve: 1.0,
              duration: 0.8,
              ease: "power1.out",
              onUpdate: () => {
                program.uniforms.u_dissolve.value = animState.dissolve;
              },
              onComplete: () => {
                setIsActive(false);
              }
            });
          }, 150);
        }
      });
    }

    // 4. Teardown completely and release GPU memory upon finishing
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      tl.kill();
      if (gl.canvas.parentElement === container) {
        container.removeChild(gl.canvas);
      }
      setTimeout(() => {
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }, 100);
    };
  }, [isActive]);

  if (!mounted) return null;

  return (
    <div
      ref={canvasContainerRef}
      className={`fixed inset-0 z-[9999] pointer-events-none ${
        isActive ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}
