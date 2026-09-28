'use client';

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "@/lib/gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Mesh, Program, Renderer, Transform, Triangle } from "ogl";
import { soundManager } from "@/lib/sound";
import { watchVisibility } from "@/lib/visibility";
import { ProjectMistPortal, ProjectMistPortalHandle } from "@/components/shared/ProjectMistPortal";
import { ProjectWaterReflection, ProjectWaterReflectionHandle } from "@/components/shared/ProjectWaterReflection";
import { ArtifactsLakeBackground } from "@/components/shared/ArtifactsLakeBackground";

gsap.registerPlugin(ScrollTrigger);

const SLASH_VS = `
attribute vec2 position;
varying vec2 vUv;
void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const SLASH_FS = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_progress;
uniform float u_time;
varying vec2 vUv;

float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

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
    if (u_progress >= 0.999) {
        gl_FragColor = vec4(0.0);
        return;
    }

    // Exact pure background matching --background (#fdfdfd)
    vec3 paperColor = vec3(253.0 / 255.0, 253.0 / 255.0, 253.0 / 255.0);

    if (u_progress <= 0.001) {
        gl_FragColor = vec4(paperColor, 1.0);
        return;
    }

    // Slash goes from BOTTOM-LEFT to TOP-RIGHT (~35 degrees)
    vec2 pA = vec2(0.0, 0.0);
    vec2 pB = u_resolution;
    vec2 lineDir = normalize(pB - pA);
    vec2 normal = vec2(-lineDir.y, lineDir.x);

    vec2 center = u_resolution * 0.5;
    vec2 toFrag = gl_FragCoord.xy - center;

    float along = abs(dot(toFrag, lineDir));
    float across = abs(dot(toFrag, normal));

    vec2 polarUv = vec2(atan(toFrag.y, toFrag.x), length(toFrag) / length(u_resolution));
    float angleWobble = fbm(vec2(polarUv.x * 2.5, polarUv.y * 1.5)) * 0.35;

    float morphTear = smoothstep(0.20, 0.80, u_progress);
    float p = mix(0.52, 1.85, morphTear);
    float invP = 1.0 / p;
    float a = mix(4.0 + angleWobble, 1.0, morphTear);
    float b = mix(1.05 + angleWobble * 0.45, 1.0, morphTear);
    float safeAlong = max(along / a, 0.0001);
    float safeAcross = max(across / b, 0.0001);
    float r = pow(pow(safeAlong, p) + pow(safeAcross, p), invP);

    vec2 flowUv = vUv * 6.0 + vec2(u_time * 0.04, -u_time * 0.03);
    float nChunk = (fbm(flowUv * 0.8) - 0.5) * 2.0;
    float nRip = (fbm(flowUv * 2.4) - 0.5) * 2.0;
    float nFine = (fbm(vUv * 45.0) - 0.5) * 2.0;
    float nMicro = (fbm(vUv * 110.0) - 0.5) * 2.0;

    float violentTearNoise = (nChunk * 95.0 + nRip * 65.0 + nFine * 35.0 + nMicro * 15.0);

    // Natural reach to clear 4 corners without racing across screen (0.85x diagonal)
    float maxReachPx = length(u_resolution) * 0.85;
    float currentTearPx = u_progress * maxReachPx;

    float displaceScale = 1.0 - smoothstep(0.75, 0.95, u_progress);
    float displacedEdgePx = r - violentTearNoise * displaceScale;

    float edgeFeatherPx = 1.6;
    float torn = 1.0 - smoothstep(currentTearPx - edgeFeatherPx, currentTearPx, displacedEdgePx);

    float finalSafety = smoothstep(0.92, 0.99, u_progress);
    torn = mix(torn, 1.0, finalSafety);

    // Outside the tear: paper remains visible (alpha = 1.0) with pure #fdfdfd
    // Inside the tear: paper vanishes (alpha = 0.0), revealing Magnum Opus & dark forge beneath
    float paperAlpha = 1.0 - torn;

    gl_FragColor = vec4(paperColor, paperAlpha);
}
`;

interface Project {
  id: string;
  kanji: string;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  tags: string[];
  year: string;
  accent: string;
  layout: 'center' | 'left' | 'panoramic';
  metrics: string;
  architecture: string;
}

const PROJECTS: Project[] = [
  {
    id: 'forgeos',
    kanji: '壹',
    category: 'Core System & Self-Mastery OS',
    title: 'Magnum Opus',
    subtitle: 'Domain-Driven Design · CQRS',
    description: 'A sovereign operating system engineered for self-mastery, cognitive telemetry, and gamified engineering growth. Built on event-sourced architecture and high-throughput real-time queues.',
    image: '/projects/forgeos.png',
    tags: ['TypeScript', 'Next.js', 'NestJS', 'PostgreSQL', 'Redis', 'Docker'],
    year: '2026',
    accent: '#f59e0b',
    layout: 'center',
    metrics: '120,000 req/s · Event Sourced · Sub-10ms p99',
    architecture: 'CQRS & Event Sourcing, NestJS microservices, Redis Pub/Sub cluster, PostgreSQL event journal',
  },
  {
    id: 'aether',
    kanji: '貳',
    category: 'Interface Infrastructure',
    title: 'Aether System',
    subtitle: 'Mathematical Precision & Micro-Interactions',
    description: 'An enterprise design system tailored for high-velocity software interfaces, balancing strict layout constraints with fluid 60FPS canvas micro-interactions.',
    image: '/projects/ecommerce.png',
    tags: ['Next.js', 'GSAP', 'Three.js', 'TailwindCSS'],
    year: '2024',
    accent: '#e2e8f0',
    layout: 'left',
    metrics: '60 FPS Micro-Interactions · 0 CLS · 98 Lighthouse',
    architecture: 'Custom GLSL shaders, headless primitives, atomic CSS tokens, hardware-accelerated GSAP pipelines',
  },
  {
    id: 'sentience',
    kanji: '參',
    category: 'Intelligence & State Protocol',
    title: 'Sentience AI',
    subtitle: 'Topological Viz & Streaming Engine',
    description: 'Full-stack AI analytics platform featuring real-time WebGL topological visualizations, dynamic token tracking, and high-frequency reactive state manifolds.',
    image: '/projects/crypto.png',
    tags: ['React', 'Three.js', 'Python', 'WebSockets'],
    year: '2025',
    accent: '#38bdf8',
    layout: 'panoramic',
    metrics: 'WebGL Topo Viz · Low-Latency WebSocket Bus · Reactive Graph',
    architecture: 'Real-time GLSL raymarching, WebSocket event bus, Python ML telemetry, Web Worker state manifolds',
  },
];

export const Artifacts = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const textCardRef = useRef<HTMLDivElement>(null);
  const portalWrapperRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<ProjectMistPortalHandle>(null);
  const reflectionRef = useRef<ProjectWaterReflectionHandle>(null);
  const projectCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const katanaTrackRef = useRef<HTMLDivElement>(null);

  const tearContainerRef = useRef<HTMLDivElement>(null);
  const tearCanvasRef = useRef<HTMLDivElement>(null);
  const slashLineRef = useRef<SVGLineElement>(null);
  const slashShadowRef = useRef<SVGLineElement>(null);
  const stillnessQuoteRef = useRef<HTMLDivElement>(null);
  const mistVeilRef = useRef<HTMLDivElement>(null);
  const tearProgramRef = useRef<Program | null>(null);
  const hasPlayedSlashSound = useRef<boolean>(false);

  const tearProgressRef = useRef({ current: 0, target: 0 });
  const slashProgressRef = useRef({ current: 0, target: 0 });
  const scrollPRef = useRef(0);

  const [mounted, setMounted] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const lastIndexRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize OGL Tear Paper Shader
  useEffect(() => {
    if (!mounted || !tearCanvasRef.current) return;
    const canvasWrap = tearCanvasRef.current;

    const renderer = new Renderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    const gl = renderer.gl;
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";
    canvasWrap.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: SLASH_VS,
      fragment: SLASH_FS,
      transparent: true,
      uniforms: {
        u_resolution: { value: [gl.drawingBufferWidth, gl.drawingBufferHeight] },
        u_progress: { value: 0 },
        u_time: { value: 0 },
      },
    });
    tearProgramRef.current = program;

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

    let rafId = 0;
    let paused = false;
    const startTime = performance.now();
    const tick = () => {
      if (paused) return;
      program.uniforms.u_time.value = (performance.now() - startTime) / 1000;

      // 1. Organic inertial smoothing for paper tear expansion
      const tp = tearProgressRef.current;
      tp.current += (tp.target - tp.current) * 0.08;
      const easedTear = tp.current * tp.current * (3.0 - 2.0 * tp.current);
      program.uniforms.u_progress.value = Math.max(0.0, Math.min(1.0, easedTear));

      // 2. Organic inertial smoothing for Katana blade cut stroke
      const sp = slashProgressRef.current;
      sp.current += (sp.target - sp.current) * 0.12;
      const s = Math.max(0.0, Math.min(1.0, sp.current));
      const dashOffset = 3000 * (1.0 - s);
      const opacity = s < 0.85 ? Math.min(1.0, s * 4.0) : Math.max(0, 1.0 - (s - 0.85) * 7.5);

      if (slashLineRef.current) {
        slashLineRef.current.style.strokeDashoffset = String(dashOffset);
        slashLineRef.current.style.opacity = String(opacity);
      }
      if (slashShadowRef.current) {
        slashShadowRef.current.style.strokeDashoffset = String(dashOffset);
        slashShadowRef.current.style.opacity = String(opacity * 0.75);
      }

      // 3. Keep tear container active ONLY during Intro (< 0.22)
      const tearVisible = scrollPRef.current < 0.22;
      if (tearContainerRef.current) {
        tearContainerRef.current.style.display = tearVisible ? 'block' : 'none';
      }

      // Past the intro the canvas is display:none — drawing a full-screen
      // shader nobody can see was the bulk of this loop's cost.
      if (tearVisible) renderer.render({ scene });
      rafId = requestAnimationFrame(tick);
    };

    const section = sectionRef.current;
    const unwatch = section
      ? watchVisibility(section, (visible) => {
          paused = !visible;
          cancelAnimationFrame(rafId);
          if (visible) rafId = requestAnimationFrame(tick);
          // A full viewport of margin: the paper this canvas paints is what
          // hides the dark forge at p=0, so it must have drawn before the
          // section's top edge actually scrolls in.
        }, '100% 0px')
      : () => {};
    rafId = requestAnimationFrame(tick);

    return () => {
      unwatch();
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      tearProgramRef.current = null;
      if (gl.canvas.parentElement === canvasWrap) {
        canvasWrap.removeChild(gl.canvas);
      }
      setTimeout(() => {
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }, 100);
    };
  }, [mounted]);

  // Fluid 3D mouse parallax response
  useEffect(() => {
    const sticky = stickyRef.current;
    if (!sticky) return;

    let rafId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = sticky.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      targetX = (e.clientX - rect.left) / rect.width - 0.5;
      targetY = (e.clientY - rect.top) / rect.height - 0.5;
    };

    let paused = false;
    const updateParallax = () => {
      if (paused) return;
      currentX += (targetX - currentX) * 0.07;
      currentY += (targetY - currentY) * 0.07;

      if (portalWrapperRef.current) {
        portalWrapperRef.current.style.transform = `perspective(1200px) rotateY(${currentX * 7}deg) rotateX(${-currentY * 6}deg) translateZ(12px)`;
      }

      if (textCardRef.current) {
        textCardRef.current.style.transform = `translate3d(${-currentX * 14}px, ${-currentY * 10}px, 0)`;
      }

      rafId = requestAnimationFrame(updateParallax);
    };

    sticky.addEventListener('mousemove', onMouseMove, { passive: true });
    const unwatch = watchVisibility(sticky, (visible) => {
      paused = !visible;
      cancelAnimationFrame(rafId);
      if (visible) rafId = requestAnimationFrame(updateParallax);
    });
    rafId = requestAnimationFrame(updateParallax);

    return () => {
      unwatch();
      sticky.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Quick navigation to project on click
  const scrollToProject = (idx: number) => {
    if (!sectionRef.current) return;
    const st = ScrollTrigger.getById('artifacts-scroll');
    if (!st) return;
    // idx 0 lands directly at Project 01 after the tear is open; idx 1 -> Project 02; idx 2 -> Project 03
    const targetProgress = idx === 0 ? 0.26 : idx === 1 ? 0.48 : 0.70;
    const targetScroll = st.start + targetProgress * (st.end - st.start);
    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    });
    soundManager?.playSwordWhoosh();
  };

  // Close specification modal on Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedProject(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useGSAP(() => {
    if (!sectionRef.current) return;

    // Harmonize with dark forge palette
    gsap.set(sectionRef.current, {
      "--background": "#080808",
      "--foreground": "#f5f5f0",
    });

    // Pinned ScrollTrigger with 1:1 hardware-accelerated GPU scrubbing
    ScrollTrigger.create({
      id: 'artifacts-scroll',
      trigger: sectionRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      onUpdate: (self) => {
        const p = self.progress;
        scrollPRef.current = p;

        // =========================================================================
        // PHASE 1: STILLNESS, KATANA SLASH & PAPER TEAR REVEAL (p: 0.00 -> 0.22)
        // =========================================================================
        if (p < 0.22) {
          if (tearContainerRef.current) {
            tearContainerRef.current.style.display = 'block';
          }

          // 1. Stillness quote: rests serenely, then dissolves with motion blur (0.00 -> 0.06)
          const pStillness = Math.min(1.0, Math.max(0.0, p / 0.06));
          if (stillnessQuoteRef.current) {
            const quoteOpacity = 1.0 - pStillness;
            stillnessQuoteRef.current.style.opacity = quoteOpacity.toFixed(3);
            stillnessQuoteRef.current.style.filter = pStillness > 0.01 ? `blur(${(pStillness * 8).toFixed(1)}px)` : 'none';
            stillnessQuoteRef.current.style.transform = `scale(${(1.0 - pStillness * 0.06).toFixed(3)})`;
            stillnessQuoteRef.current.style.pointerEvents = quoteOpacity > 0.1 ? 'auto' : 'none';
          }

          // 2. Katana blade slice stroke: drives target with generous scroll space (0.04 -> 0.14)
          const targetSlash = Math.min(1.0, Math.max(0.0, (p - 0.04) / 0.10));
          slashProgressRef.current.target = targetSlash;

          // Razor cut sound trigger right at blade impact
          if (p >= 0.06 && !hasPlayedSlashSound.current && self.direction > 0) {
            soundManager?.playSwordWhoosh();
            hasPlayedSlashSound.current = true;
          } else if (p < 0.03) {
            hasPlayedSlashSound.current = false;
          }

          // 3. OGL Tear Shader: drives target tear smoothly across (0.08 -> 0.22)
          const targetTear = Math.min(1.0, Math.max(0.0, (p - 0.08) / 0.14));
          tearProgressRef.current.target = targetTear;

          // 4. Navbar theme: switch to dark mode once tear begins to reveal the black forge
          // A single threshold both ways — the old down-at-0.14 / up-at-0.08
          // hysteresis left the header white over the white paper on the way
          // back up, which read as the navbar vanishing.
          window.dispatchEvent(new CustomEvent("dark-section", { detail: p >= 0.12 }));

          // Katana rail track on the right remains hidden during slash intro
          if (katanaTrackRef.current) {
            katanaTrackRef.current.style.opacity = '0';
            katanaTrackRef.current.style.pointerEvents = 'none';
          }

          // Keep Project 01 at rest (p = 0) so it shines directly inside the tear
          portalRef.current?.setProgress(0);
          reflectionRef.current?.setProgress(0);

          projectCardsRef.current.forEach((card, idx) => {
            if (!card) return;
            if (idx === 0) {
              card.style.opacity = '1';
              card.style.transform = 'translate3d(0, 0px, 0)';
              card.style.filter = 'none';
              card.style.pointerEvents = 'auto';
            } else {
              card.style.opacity = '0';
              card.style.transform = 'translate3d(0, 28px, 0)';
              card.style.filter = 'blur(6px)';
              card.style.pointerEvents = 'none';
            }
          });
          return;
        }

        // =========================================================================
        // PHASE 2: PROJECT SHOWCASE & REAL-TIME MORPHING (p: 0.22 -> 0.78)
        // Generous resting dwell on Project 03 (0.68 -> 0.78)
        // =========================================================================
        if (p < 0.78) {
          slashProgressRef.current.target = 1.0;
          tearProgressRef.current.target = 1.0;

          // Ensure intro quote and tear container are completely hidden on reload
          if (tearProgressRef.current.current < 0.99) {
            tearProgressRef.current.current = 1.0;
            slashProgressRef.current.current = 1.0;
          }
          if (stillnessQuoteRef.current) {
            stillnessQuoteRef.current.style.opacity = '0';
            stillnessQuoteRef.current.style.pointerEvents = 'none';
          }
          if (tearContainerRef.current) {
            tearContainerRef.current.style.display = 'none';
          }

          // Reset nocturnal lake elements while in project browsing
          if (portalWrapperRef.current) {
            portalWrapperRef.current.style.opacity = '1';
            portalWrapperRef.current.style.transform = 'none';
            portalWrapperRef.current.style.filter = 'none';
          }
          if (textCardRef.current) {
            textCardRef.current.style.transform = 'none';
            textCardRef.current.style.filter = 'none';
          }
          if (katanaTrackRef.current) {
            katanaTrackRef.current.style.opacity = '1';
            katanaTrackRef.current.style.pointerEvents = 'auto';
          }
          window.dispatchEvent(new CustomEvent("dark-section", { detail: true }));

          // Map scroll (0.22 -> 0.68) to project progress (0.00 -> 1.00), leaving (0.68 -> 0.78) as dwell for Project 03
          const projectP = Math.min(1.0, Math.max(0.0, (p - 0.22) / 0.46));

          // 1. Direct real-time GPU uniform updates (zero lag, bidirectional, continuous)
          portalRef.current?.setProgress(projectP);
          reflectionRef.current?.setProgress(projectP);

          // 2. Real-time cinematic text transition for Title & Desc (synchronized with mist portal morphing)
          const v = Math.max(0, Math.min(projectP * 2.0, 2.0)); // 0.0 to 2.0
          projectCardsRef.current.forEach((card, idx) => {
            if (!card) return;
            const d = v - idx; // distance from this project's resting point
            if (Math.abs(d) < 0.6) {
              const norm = 1.0 - Math.abs(d) / 0.6;
              const opacity = norm * norm * (3.0 - 2.0 * norm); // Smooth cubic ease
              const y = -d * 28.0; // Floats up as you scroll past, glides in from bottom as you approach
              const blur = (1.0 - opacity) * 6.0;
              card.style.opacity = opacity.toFixed(3);
              card.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
              card.style.filter = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : 'none';
              card.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
            } else {
              card.style.opacity = '0';
              card.style.transform = `translate3d(0, ${d > 0 ? -28 : 28}px, 0)`;
              card.style.filter = 'blur(6px)';
              card.style.pointerEvents = 'none';
            }
          });

          // 3. Hysteresis buffer zones: prevents jitter for project audio and top markers
          let nextIdx = lastIndexRef.current;
          if (lastIndexRef.current === 0) {
            if (projectP >= 0.38) nextIdx = 1;
          } else if (lastIndexRef.current === 1) {
            if (projectP <= 0.28) nextIdx = 0;
            else if (projectP >= 0.72) nextIdx = 2;
          } else if (lastIndexRef.current === 2) {
            if (projectP <= 0.62) nextIdx = 1;
          }

          if (nextIdx !== lastIndexRef.current) {
            soundManager?.playSwordWhoosh();
            lastIndexRef.current = nextIdx;
            setActiveIdx(nextIdx);
          }
          return;
        }

        // =========================================================================
        // PHASE 3: ETHEREAL SUMI-E MIST VEIL TRANSITION (p: 0.78 -> 1.00)
        // Hồ đêm và Project 03 dần được bao bọc trong màn sương mù trắng Washi
        // Khi sương mù tan, người xem đã đứng trọn vẹn trong không gian Philosophy
        // =========================================================================
        // Ensure intro quote and tear container are completely hidden
        if (stillnessQuoteRef.current) {
          stillnessQuoteRef.current.style.opacity = '0';
          stillnessQuoteRef.current.style.pointerEvents = 'none';
        }
        if (tearContainerRef.current) {
          tearContainerRef.current.style.display = 'none';
        }

        // Keep Project 03 textures locked at 1.0
        portalRef.current?.setProgress(1.0);
        reflectionRef.current?.setProgress(1.0);

        // Smooth mist expansion from p = 0.78 to 0.98
        const mistProgress = Math.min(1.0, Math.max(0.0, (p - 0.78) / 0.18));
        const lakeFade = Math.max(0, 1.0 - mistProgress * 1.25);

        // Lake elements fade softly as mist rolls in
        if (portalWrapperRef.current) {
          portalWrapperRef.current.style.opacity = lakeFade.toFixed(3);
          portalWrapperRef.current.style.filter = mistProgress > 0.04 ? `blur(${(mistProgress * 8).toFixed(1)}px)` : 'none';
        }
        if (textCardRef.current) {
          textCardRef.current.style.opacity = lakeFade.toFixed(3);
          textCardRef.current.style.filter = mistProgress > 0.04 ? `blur(${(mistProgress * 8).toFixed(1)}px)` : 'none';
        }

        // Katana rail track fades out smoothly as mist rises
        if (katanaTrackRef.current) {
          katanaTrackRef.current.style.opacity = lakeFade.toFixed(3);
          katanaTrackRef.current.style.pointerEvents = lakeFade > 0.5 ? 'auto' : 'none';
        }

        // The dense white Washi mist veil covers the screen
        if (mistVeilRef.current) {
          mistVeilRef.current.style.opacity = mistProgress.toFixed(3);
          mistVeilRef.current.style.pointerEvents = mistProgress > 0.7 ? 'auto' : 'none';
        }

        // Seamless handover for navbar: switches to dark text as mist envelops the view
        window.dispatchEvent(new CustomEvent("dark-section", { detail: mistProgress < 0.45 }));
      },
    });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="artifacts"
      className="relative w-full bg-[#080808] text-[#f5f5f0] select-none"
      style={{ height: "560vh" }}
    >
      {/* Sticky Fullscreen Stage */}
      <div
        ref={stickyRef}
        className="sticky top-0 left-0 w-full h-screen overflow-hidden flex flex-col justify-center items-center py-4 sm:py-6 px-6 sm:px-10 md:px-14 lg:px-20 z-10 bg-[#080808]"
      >
        {/* Atmospheric Nocturnal Lake & Distant Sumi Mist */}
        <ArtifactsLakeBackground />

        {/* Katana Slash & Paper Tear Reveal Layer */}
        <div
          ref={tearContainerRef}
          className="absolute inset-0 w-full h-full z-30 pointer-events-none overflow-hidden"
        >
          {/* Stage 1: Minimalist Stillness Quote */}
          <div
            ref={stillnessQuoteRef}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none px-6 z-20 will-change-transform"
          >
            <p className="font-serif italic text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#111111]/80 font-light tracking-tight mb-3">
              Where thought becomes form.
            </p>
          </div>

          {/* OGL Canvas: Rách mở màn hình theo vết chém kĩ thuật */}
          <div
            ref={tearCanvasRef}
            className="absolute inset-0 w-full h-full z-10 pointer-events-none"
          />

          {/* Anime Katana Cut Line */}
          <svg
            className="absolute inset-0 w-full h-full z-25 pointer-events-none overflow-visible"
          >
            {/* Subtle silver blade gleam */}
            <line
              ref={slashShadowRef}
              x1="-5%"
              y1="105%"
              x2="105%"
              y2="-5%"
              stroke="#ffffff"
              strokeWidth="3.5"
              strokeDasharray="3000"
              strokeDashoffset="3000"
              strokeLinecap="round"
              className="opacity-0"
            />
            {/* Razor-thin steel blade incision */}
            <line
              ref={slashLineRef}
              x1="-5%"
              y1="105%"
              x2="105%"
              y2="-5%"
              stroke="#111111"
              strokeWidth="2"
              strokeDasharray="3000"
              strokeDashoffset="3000"
              strokeLinecap="round"
              className="opacity-0"
            />
          </svg>
        </div>

        {/* Central Stage: Split 2-Column Layout (Portal Left, Title & Desc Right) */}
        <div className="relative w-full max-w-[1560px] mx-auto flex items-center justify-between z-10 py-2 sm:py-4 px-2 sm:px-4">
          <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
            {/* LEFT COLUMN: Enlarged Mist Portal & Submerged Water Reflection */}
            <div
              ref={portalWrapperRef}
              className="lg:col-span-7 xl:col-span-7 w-full flex flex-col items-center lg:items-start will-change-transform"
            >
              {/* The OGL Mist Portal (Expanded size with interactive inspection trigger) */}
              <div
                onClick={() => {
                  soundManager?.playSwordWhoosh();
                  setSelectedProject(PROJECTS[activeIdx]);
                }}
                className="relative w-full aspect-[16/10] max-w-[680px] xl:max-w-[760px] flex items-center justify-center cursor-pointer group/portal"
              >
                <ProjectMistPortal
                  ref={portalRef}
                  projects={PROJECTS}
                  currentIndex={activeIdx}
                  className="w-full h-full"
                />
              </div>

              {/* The Submerged Water Mirror Reflection */}
              <div className="relative w-full max-w-[680px] xl:max-w-[760px] h-[160px] sm:h-[190px] lg:h-[220px] -mt-[2px] pointer-events-none select-none overflow-hidden">
                <ProjectWaterReflection
                  ref={reflectionRef}
                  images={PROJECTS.map((p) => p.image)}
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: Project Title & Description with Realtime Transition */}
            <div
              ref={textCardRef}
              className="lg:col-span-5 xl:col-span-5 relative w-full min-h-[340px] sm:min-h-[380px] will-change-transform pl-0 lg:pl-6"
            >
              {PROJECTS.map((proj, idx) => (
                <div
                  key={proj.id}
                  ref={(el) => { projectCardsRef.current[idx] = el; }}
                  className="absolute inset-0 flex flex-col items-start text-left will-change-transform"
                  style={{
                    opacity: idx === 0 ? 1 : 0,
                    transform: idx === 0 ? 'translate3d(0, 0px, 0)' : 'translate3d(0, 28px, 0)',
                    filter: idx === 0 ? 'none' : 'blur(6px)',
                    pointerEvents: idx === 0 ? 'auto' : 'none',
                  }}
                >
                  <div className="flex items-center gap-3.5 mb-3">
                    <span className="font-serif text-3xl lg:text-4xl text-white/25 select-none">
                      {proj.kanji}
                    </span>
                    <span className="font-mono text-xs tracking-[0.3em] text-white/40 uppercase">
                      0{idx + 1}
                    </span>
                  </div>

                  <h3 className="font-serif font-light text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white tracking-tight leading-[1.08] mb-4">
                    {proj.title}
                  </h3>

                  <p className="font-light text-white/70 text-sm sm:text-base lg:text-[17px] leading-relaxed max-w-xl mb-4">
                    {proj.description}
                  </p>

                  {/* Minimal Mono Tech Stack */}
                  <div className="font-mono text-xs sm:text-[13px] text-white/40 tracking-wider mb-6 flex items-center gap-2.5 select-none">
                    <span className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)]" style={{ backgroundColor: proj.accent }} />
                    <span>{proj.tags.join(" · ")}</span>
                  </div>

                  <button
                    onClick={() => {
                      soundManager?.playSwordWhoosh();
                      setSelectedProject(proj);
                    }}
                    className="inline-flex items-center gap-2 group/link cursor-pointer focus:outline-none"
                  >
                    <span className="font-mono text-xs tracking-[0.25em] uppercase text-white/50 group-hover/link:text-white transition-colors">
                      View Specification ↗
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Minimal Katana Navigation Track on the far right */}
        <div
          ref={katanaTrackRef}
          className="hidden lg:flex flex-col items-end gap-5 absolute right-6 top-1/2 -translate-y-1/2 z-40 select-none transition-opacity duration-300"
          style={{ opacity: 0, pointerEvents: 'none' }}
        >
          {PROJECTS.map((proj, idx) => {
            const isActive = activeIdx === idx;
            return (
              <button
                key={proj.id}
                onClick={() => scrollToProject(idx)}
                className="group flex items-center gap-3 py-1.5 cursor-pointer focus:outline-none"
                aria-label={`Jump to ${proj.title}`}
              >
                <span className={`font-mono text-[9px] tracking-[0.25em] transition-all duration-300 ${isActive ? 'text-white font-semibold' : 'text-white/20 group-hover:text-white/60'
                  }`}>
                  0{idx + 1}
                </span>
                <span className={`block h-[1px] transition-all duration-500 ${isActive ? 'w-8 bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]' : 'w-3 bg-white/20 group-hover:w-5 group-hover:bg-white/50'
                  }`} />
              </button>
            );
          })}
        </div>

        {/* Phase 3: Ethereal Sumi-e Mist / Morning Fog Transition Layer */}
        <div
          ref={mistVeilRef}
          className="absolute inset-0 w-full h-full z-40 pointer-events-none opacity-0 flex flex-col items-center justify-center overflow-hidden bg-[#fdfdfd]"
        >
          {/* Layered swirling mist gradients */}
          <div 
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse at 50% 50%, rgba(253, 253, 253, 0.98) 0%, rgba(253, 253, 253, 0.92) 55%, rgba(253, 253, 253, 1) 100%),
                radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.85) 0%, transparent 60%),
                radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.85) 0%, transparent 60%)
              `,
            }}
          />
        </div>
      </div>

      {/* Ethereal Technical Specification Modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-[#0b0b0b]/95 border border-white/10 p-6 sm:p-8 rounded-lg shadow-2xl overflow-hidden select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <span className="font-serif text-2xl text-white/30">{selectedProject.kanji}</span>
                <span className="font-mono text-xs tracking-[0.25em] text-white/40 uppercase">
                  Technical Specification
                </span>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="font-mono text-[11px] tracking-widest text-white/40 hover:text-white transition-colors cursor-pointer px-2 py-1"
              >
                [ CLOSE ✕ ]
              </button>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-white font-light tracking-tight mb-2">
              {selectedProject.title}
            </h2>
            <p className="font-mono text-xs text-white/70 tracking-wide mb-6">
              {selectedProject.metrics}
            </p>
            <div className="mb-6">
              <h4 className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 mb-2">
                Architecture & Engineering
              </h4>
              <p className="text-xs sm:text-sm text-white/70 font-light leading-relaxed mb-3">
                {selectedProject.description}
              </p>
              <div className="p-3.5 rounded bg-white/[0.03] border border-white/5 font-mono text-[11px] text-white/60 leading-relaxed">
                {selectedProject.architecture}
              </div>
            </div>

            {/* Tech Stack List */}
            <div className="mb-6">
              <h4 className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 mb-2.5">
                Core Technologies
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedProject.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[10px] tracking-wider px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/10">
              <button
                onClick={() => setSelectedProject(null)}
                className="font-mono text-xs tracking-widest uppercase text-white/60 hover:text-white px-4 py-2 cursor-pointer transition-colors"
              >
                Dismiss
              </button>
              <a
                href="#contact"
                onClick={() => setSelectedProject(null)}
                className="font-mono text-xs tracking-widest uppercase bg-white text-black font-semibold px-4 py-2 rounded hover:bg-white/90 transition-colors cursor-pointer"
              >
                Inquire System ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
