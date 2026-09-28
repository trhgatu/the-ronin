'use client';

import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { useLenis } from "lenis/react";
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
  description: string;
  image: string;
  tags: string[];
  year: string;
  accent: string;
  /** One line of verifiable facts shown under the title in the case study. */
  highlights: string;
  role: string;
  problem: string;
  approach: string;
  outcome: string;
  engineering: string[];
  links: { label: string; href: string }[];
  credit?: string;
}

// Every claim here is checked against the project's own repo — no invented
// traffic numbers or architecture the code doesn't have.
const PROJECTS: Project[] = [
  {
    id: 'magnum-opus',
    kanji: '壹',
    category: 'Personal OS · Modular Monolith',
    title: 'Magnum Opus',
    description: 'A private operating system for observing and reshaping one\'s own life — journal, mood, memory, habits and routines woven into one loop: record, reflect, notice patterns, change, act.',
    image: '/projects/magnum-opus.webp',
    tags: ['TypeScript', 'NestJS', 'Next.js', 'PostgreSQL', 'Prisma', 'Redis', 'BullMQ', 'Docker'],
    year: '2026',
    accent: '#d4a24c',
    highlights: '330 test files · CI-enforced architecture & perf budgets · Transactional outbox',
    role: 'Solo — product, design and engineering',
    problem: 'Its predecessor, Forge OS, grew into 25+ gamified modules backed by two test files — impressive to demo, hard to trust or change. The product had also drifted into a productivity dashboard, the opposite of what it was for.',
    approach: 'Rebuilt from scratch as a calm, private product, one vertical slice at a time (Journal, Mood, Memory, Timeline, then Habits and Routines), on a foundation strict enough to keep that pace: bounded contexts, CQRS, ports and adapters, and an API and a BullMQ worker as separate composition roots.',
    outcome: '234 commits in two months, shipped through reviewed pull requests. Every slice lands with unit, API end-to-end and browser end-to-end tests, and CI refuses a merge that breaks the architecture rules, the JS budget per route or the migration chain.',
    engineering: [
      'Transactional outbox with idempotent, at-least-once realtime delivery',
      'Dependency rules enforced by a test: domain code cannot import Prisma, BullMQ or infrastructure',
      'Optimistic concurrency and per-user ownership isolation',
      'Production compose with Caddy, encrypted off-host backups and Prometheus alerts — all validated in CI',
      'Foundation shared with my open-source turborepo-advanced-starter',
    ],
    links: [
      { label: 'Live', href: 'https://www.magnum-opus.dev' },
      { label: 'Source', href: 'https://github.com/trhgatu/magnum-opus' },
    ],
  },
  {
    id: 'auto-wp-publisher',
    kanji: '貳',
    category: 'AI Content Pipeline · Client Tool',
    title: 'Auto WP Publisher',
    description: 'Turns a raw Excel or Google Sheets product list into published WooCommerce listings — columns mapped, SEO copy written by Gemini, categories, brands, images and RankMath/Yoast metadata filled in.',
    image: '/projects/auto-wp-publisher.webp',
    tags: ['NestJS', 'React', 'Ant Design', 'PostgreSQL', 'Prisma', 'BullMQ', 'Redis', 'Gemini', 'WooCommerce'],
    year: '2026',
    accent: '#f87171',
    highlights: 'Spreadsheet → Gemini → WooCommerce · Rate-limit-aware queue · Live job progress',
    role: 'Solo — built for a real e-commerce business',
    problem: 'Listing products by hand meant copying fields from spreadsheets, writing an SEO description for each one and uploading images one product at a time — slow, and inconsistent from one listing to the next.',
    approach: 'A NestJS service split into hexagonal bounded contexts (catalog, IAM, settings) with CQRS, fronted by a React admin. Imports become queued jobs; a BullMQ processor writes copy with Gemini, then publishes through the WooCommerce REST API while the UI follows progress over Socket.IO.',
    outcome: 'The whole flow — import, mapping preview, publishing, trash and restore, prompt templates, API log history and a dashboard — works end to end, with CI building and shipping a Docker image on every push.',
    engineering: [
      'Gemini 429 handling with retry and API-key rotation',
      'Queue processor at concurrency 1 behind a rate limiter, with a template fallback when AI generation fails',
      'WooCommerce integration that handles duplicate SKUs and de-duplicates media uploads',
      'Real-time job events pushed to the admin over Socket.IO',
    ],
    links: [
      { label: 'Source', href: 'https://github.com/trhgatu/auto-wp-publisher' },
    ],
  },
  {
    id: 'the-alchemist',
    kanji: '參',
    category: 'Immersive Portfolio · Creative Frontend',
    title: 'The Alchemist',
    description: 'My previous portfolio: a scroll-driven grimoire after Paulo Coelho\'s novel. A washi-paper portal burns open onto a starfield, a 3D spellbook releases the tech stack as a constellation, and the story ends in the desert — in English and Vietnamese.',
    image: '/projects/the-alchemist.webp',
    tags: ['Next.js', 'React Three Fiber', 'GSAP', 'OGL', 'Zustand', 'Tailwind CSS'],
    year: '2025 — 2026',
    accent: '#f59e0b',
    highlights: '3D grimoire · Shader route transitions · EN / VI',
    role: 'Solo — concept, design and engineering',
    problem: 'A portfolio usually reads as a list. I wanted one that plays like a story, where every section is a chapter and the transitions carry the meaning.',
    approach: 'Long pinned scroll timelines drive React Three Fiber scenes through a scroll-progress ref read inside the frame loop, so the 3D never waits on React re-renders. Route changes burn the screen through an OGL noise shader, and torn, scorched parchment is drawn with SVG displacement filters.',
    outcome: 'Live since 2025 and refined over 186 commits across a year. Building it taught me where immersive sites lose people — pacing and weight — which is what this site was designed around.',
    engineering: [
      'Scroll progress kept in refs and read in useFrame, not React state',
      'OGL simplex-noise burn transition orchestrated through a Zustand router store',
      'Tech icons rasterised into textures and flown into a golden-angle constellation',
      'Custom EN / VI i18n store with GSAP timelines rebuilt per language',
    ],
    links: [
      { label: 'Live', href: 'https://thatu.is-a.dev' },
      { label: 'Source', href: 'https://github.com/trhgatu/the-alchemist' },
    ],
  },
  {
    id: 'kim-khanh',
    kanji: '肆',
    category: 'Client Work · Personal Archive',
    title: 'Kim Khanh',
    description: 'A bespoke digital home built for Kim Khanh — a warm botanical scrapbook of flowers, places, notes and small everyday joys, opening on an interactive 3D azalea.',
    image: '/projects/kim-khanh.webp',
    tags: ['Next.js', 'Three.js', 'OGL', 'GSAP', 'Lenis', 'Tailwind CSS'],
    year: '2026',
    accent: '#e8837a',
    highlights: '3D flower study · Shader pollen trail · Reduced-motion support',
    role: 'Solo — designed and built for a client',
    problem: 'A personal site for someone who isn\'t a developer: it had to feel like her — soft, tactile, handmade — rather than like a template, and stay gentle for visitors who prefer less motion.',
    approach: 'An editorial scrapbook layout with paper-like surfaces, a three.js hero flower playing its own animation, and small OGL shaders for the pollen cursor trail, the fog preloader and a cover ripple reserved for precise pointers.',
    outcome: 'Finished and polished across desktop and mobile, with real content throughout, ambient audio behind an opt-in toggle, and a reduced-motion mode.',
    engineering: [
      'three.js GLTF scene with baked animation for the hero flower',
      'OGL shaders for the pollen trail, fog preloader and cover ripple (fine pointers only)',
      'Scroll-linked flowers and a pinned editorial layout on GSAP + Lenis',
      'prefers-reduced-motion respected across the experience',
    ],
    links: [
      { label: 'Source', href: 'https://github.com/trhgatu/kimkhanh-portfolio' },
    ],
    credit: '3D model "Rhododendron - Azalea" by Nestaeric on Sketchfab, licensed CC BY 4.0.',
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
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const portalCanvasHostRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
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

  // Scroll position where project `idx` sits at rest inside the 0.22 -> 0.68
  // showcase band (see the ScrollTrigger below); the first sits just past the tear.
  const projectRestScroll = (idx: number) => {
    const st = ScrollTrigger.getById('artifacts-scroll');
    if (!st) return null;
    const rest = 0.22 + 0.46 * (idx / Math.max(1, PROJECTS.length - 1));
    const targetProgress = Math.min(0.70, Math.max(0.225, rest));
    return st.start + targetProgress * (st.end - st.start);
  };

  // Quick navigation to project on click
  const scrollToProject = (idx: number) => {
    const targetScroll = projectRestScroll(idx);
    if (targetScroll === null) return;
    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    });
    soundManager?.playSwordWhoosh();
  };

  // ---------------------------------------------------------------------------
  // Case study: the portal itself grows into the page. Nothing is loaded on
  // click — the image is already a texture on the GPU and the canvas already
  // covers the stage, so ProjectMistPortal only animates the rect it draws
  // into, from its mist frame to the hero slot below. The copy is plain DOM
  // fading in beside it. Each case study gets its own ?project= URL, and the
  // browser's Back button closes it.
  // ---------------------------------------------------------------------------
  const lenis = useLenis();
  const lenisRef = useRef(lenis);
  useEffect(() => { lenisRef.current = lenis; }, [lenis]);

  const openIdxRef = useRef<number | null>(null);
  const closingRef = useRef(false);

  const openCaseStudy = (idx: number, { push = true } = {}) => {
    if (openIdxRef.current !== null) return;
    openIdxRef.current = idx;
    closingRef.current = false;
    soundManager?.playSwordWhoosh();
    lenisRef.current?.stop();
    if (katanaTrackRef.current) {
      katanaTrackRef.current.style.opacity = '0';
      katanaTrackRef.current.style.pointerEvents = 'none';
    }
    if (push) {
      window.history.pushState({ artifact: PROJECTS[idx].id }, '', `?project=${PROJECTS[idx].id}`);
    }
    setOpenIdx(idx);
  };

  // Layout effect, not a plain effect: the hero slot exists as soon as React
  // commits the overlay, and starting the portal before the first paint is
  // what makes the click feel instant.
  useLayoutEffect(() => {
    if (openIdx === null || !slotRef.current) return;
    portalRef.current?.open(slotRef.current, openIdx);
    gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' });
    const reveal = detailRef.current?.querySelectorAll('.case-reveal');
    if (reveal?.length) {
      gsap.fromTo(reveal, { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.04, delay: 0.2,
      });
    }
  }, [openIdx]);

  const finishClose = () => {
    if (openIdxRef.current === null || closingRef.current) return;
    closingRef.current = true;
    const reveal = detailRef.current?.querySelectorAll('.case-reveal');
    if (reveal?.length) gsap.to(reveal, { opacity: 0, y: 12, duration: 0.25, ease: 'power2.in' });
    gsap.to(backdropRef.current, { opacity: 0, duration: 0.5, delay: 0.15, ease: 'power2.inOut' });
    portalRef.current?.close(() => {
      openIdxRef.current = null;
      closingRef.current = false;
      setOpenIdx(null);
      lenisRef.current?.start();
      if (katanaTrackRef.current) {
        katanaTrackRef.current.style.opacity = '1';
        katanaTrackRef.current.style.pointerEvents = 'auto';
      }
    });
  };

  const closeCaseStudy = () => {
    // Opened in this visit: step back through history so Back/Forward stay
    // coherent (popstate below does the closing). Deep-linked on arrival:
    // there's nothing to go back to on this page, so just drop the param.
    if (window.history.state?.artifact) {
      window.history.back();
    } else {
      window.history.replaceState(null, '', window.location.pathname);
      finishClose();
    }
  };

  const projectFromUrl = () => {
    const id = new URLSearchParams(window.location.search).get('project');
    return PROJECTS.findIndex((p) => p.id === id);
  };

  // Jump the stage to the project at rest, let the scrub settle, then open.
  const jumpAndOpen = (idx: number) => {
    const y = projectRestScroll(idx);
    if (y === null) return;
    if (lenisRef.current) lenisRef.current.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
    setTimeout(() => openCaseStudy(idx, { push: false }), 1200);
  };

  useEffect(() => {
    // lenis.stop() only stops wheel-driven scrolling; keys would still move
    // the page (and the scrubbed stage) behind an open case study.
    const SCROLL_KEYS = new Set([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End']);
    const onKeyDown = (e: KeyboardEvent) => {
      if (openIdxRef.current === null) return;
      if (e.key === 'Escape') closeCaseStudy();
      else if (SCROLL_KEYS.has(e.key) && !(e.target as Element | null)?.closest?.('[data-lenis-prevent]')) {
        e.preventDefault();
      }
    };
    const onPopState = () => {
      const idx = projectFromUrl();
      if (idx < 0) finishClose();
      else if (openIdxRef.current === null) jumpAndOpen(idx);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('popstate', onPopState);

    // Deep link (?project=…): wait for the preloader, like Hero does.
    let onPreloader: (() => void) | null = null;
    const deepLinked = projectFromUrl();
    if (deepLinked >= 0) {
      const go = () => setTimeout(() => jumpAndOpen(deepLinked), 300);
      if (sessionStorage.getItem('preloader-seen') === 'true') go();
      else {
        onPreloader = go;
        window.addEventListener('preloader-complete', onPreloader, { once: true });
      }
    }

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('popstate', onPopState);
      if (onPreloader) window.removeEventListener('preloader-complete', onPreloader);
    };
    // Handlers only touch refs and stable setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          if (portalCanvasHostRef.current) {
            portalCanvasHostRef.current.style.opacity = '1';
            portalCanvasHostRef.current.style.filter = 'none';
          }
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

          // Map scroll (0.22 -> 0.68) to project progress (0.00 -> 1.00), leaving (0.68 -> 0.78) as dwell for the last project
          const projectP = Math.min(1.0, Math.max(0.0, (p - 0.22) / 0.46));
          const lastIdx = PROJECTS.length - 1;

          // 1. Direct real-time GPU uniform updates (zero lag, bidirectional, continuous)
          portalRef.current?.setProgress(projectP);
          reflectionRef.current?.setProgress(projectP);

          // 2. Real-time cinematic text transition for Title & Desc (synchronized with mist portal morphing)
          const v = projectP * lastIdx; // 0 .. lastIdx, each integer is a project at rest
          projectCardsRef.current.forEach((card, idx) => {
            if (!card) return;
            const d = v - idx; // distance from this project's resting point
            if (Math.abs(d) < 0.6) {
              // Fully sharp within 0.2 of the rest point (the mist portal
              // likewise holds each image for 0.15 either side), fading out by
              // 0.6 — without the plateau the copy was only crisp at one exact
              // scroll position, and the rail's jump targets landed on blur.
              const norm = 1.0 - Math.max(0, Math.abs(d) - 0.2) / 0.4;
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

          // 3. Hysteresis: only switch the active project once scroll is well
          // past the halfway point between two of them (0.6 / 0.4 of the way),
          // so hovering near a boundary doesn't flicker the rail or replay audio.
          let nextIdx = lastIndexRef.current;
          const nearest = Math.round(v);
          if (nearest !== lastIndexRef.current && Math.abs(v - nearest) < 0.4) {
            nextIdx = nearest;
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

        // Keep the last project's textures locked at 1.0
        portalRef.current?.setProgress(1.0);
        reflectionRef.current?.setProgress(1.0);

        // Smooth mist expansion from p = 0.78 to 0.98
        const mistProgress = Math.min(1.0, Math.max(0.0, (p - 0.78) / 0.18));
        const lakeFade = Math.max(0, 1.0 - mistProgress * 1.25);

        // Lake elements fade softly as mist rolls in
        // The portal's canvas lives in its own full-stage layer now (see
        // ProjectMistPortal), so it has to fade with the lake explicitly.
        if (portalCanvasHostRef.current) {
          portalCanvasHostRef.current.style.opacity = lakeFade.toFixed(3);
          portalCanvasHostRef.current.style.filter = mistProgress > 0.04 ? `blur(${(mistProgress * 8).toFixed(1)}px)` : 'none';
        }
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

  const openProject = openIdx !== null ? PROJECTS[openIdx] : null;

  return (
    <section
      ref={sectionRef}
      id="artifacts"
      className="relative w-full bg-[#080808] text-[#f5f5f0] select-none"
      // 560vh was tuned for three projects; every extra project adds another
      // transition to the showcase band, so the section grows with the list
      // to keep each one about as long a scroll as before.
      style={{ height: `${320 + PROJECTS.length * 80}vh` }}
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

        {/* Full-stage layer the mist portal draws into (see ProjectMistPortal):
            above the lake, text card and case-study backdrop, below the tear
            paper and the closing mist veil. */}
        <div ref={portalCanvasHostRef} className="pointer-events-none absolute inset-0 z-[25]" aria-hidden="true" />

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
                onClick={() => openCaseStudy(activeIdx)}
                className="relative w-full aspect-[16/10] max-w-[680px] xl:max-w-[760px] flex items-center justify-center cursor-pointer group/portal"
              >
                <ProjectMistPortal
                  ref={portalRef}
                  projects={PROJECTS}
                  canvasHostRef={portalCanvasHostRef}
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
                    <span className="hidden sm:inline font-mono text-[10px] tracking-[0.25em] text-white/30 uppercase">
                      {proj.category}
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
                    {/* The card only has room for one line; the full stack lives in the case study. */}
                    <span>{proj.tags.slice(0, 5).join(" · ")}</span>
                  </div>

                  <button
                    onClick={() => openCaseStudy(idx)}
                    className="inline-flex items-center gap-2 group/link cursor-pointer focus:outline-none"
                  >
                    <span className="font-mono text-xs tracking-[0.25em] uppercase text-white/50 group-hover/link:text-white transition-colors">
                      View Case Study ↗
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

        {/* Case study. Backdrop and copy are separate layers so the portal's
            canvas (z-25) sits between them: over the dimmed lake, under the
            text. The slot is only a target box — the image itself is drawn by
            the portal, which grows into it. */}
        {openProject && (
          <>
            <div
              ref={backdropRef}
              // touch-none: on touch devices Lenis doesn't own scrolling, so a
              // swipe on the backdrop would otherwise scroll the page behind.
              className="absolute inset-0 z-[22] bg-[#080808] touch-none"
              style={{ opacity: 0 }}
              onClick={closeCaseStudy}
              aria-hidden="true"
            />
            <div
              ref={detailRef}
              className="absolute inset-0 z-[35] pointer-events-none"
              role="dialog"
              aria-modal="true"
              aria-labelledby="artifact-case-title"
            >
              <div
                ref={slotRef}
                aria-hidden="true"
                className="absolute left-5 right-5 top-24 aspect-[16/10] lg:left-auto lg:right-[5vw] lg:top-1/2 lg:-translate-y-1/2 lg:w-[52vw] lg:max-w-[980px]"
              />

              {/* data-lenis-prevent: Lenis is stopped while this is open, and
                  this column scrolls natively on its own. */}
              <div
                data-lenis-prevent
                className="pointer-events-auto absolute inset-x-0 bottom-0 top-[calc(6rem+(100vw-2.5rem)*0.625+1.25rem)] overflow-y-auto px-5 pb-16 lg:inset-y-0 lg:right-auto lg:w-[40vw] lg:pl-[5vw] lg:pr-8 lg:pt-32 lg:pb-20"
              >
                <div className="case-reveal flex items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-2xl text-white/30">{openProject.kanji}</span>
                    <span className="font-mono text-xs tracking-[0.25em] text-white/40 uppercase">
                      Case Study · 0{(openIdx ?? 0) + 1}
                    </span>
                  </div>
                  <button
                    onClick={closeCaseStudy}
                    className="font-mono text-[11px] tracking-widest text-white/50 hover:text-white transition-colors cursor-pointer px-2 py-1"
                  >
                    [ CLOSE ✕ ]
                  </button>
                </div>

                <p className="case-reveal font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-white/40 mb-3">
                  {openProject.category} · {openProject.year}
                </p>
                <h2 id="artifact-case-title" className="case-reveal font-serif text-4xl sm:text-5xl xl:text-6xl text-white font-light tracking-tight leading-[1.05] mb-4">
                  {openProject.title}
                </h2>
                <p className="case-reveal flex items-start gap-2.5 font-mono text-xs text-white/70 tracking-wide leading-relaxed mb-2">
                  <span className="mt-1 w-2 h-2 shrink-0 rounded-full" style={{ backgroundColor: openProject.accent }} />
                  {openProject.highlights}
                </p>
                <p className="case-reveal font-caveat text-xl text-white/50 mb-10">{openProject.role}</p>

                {([
                  ['The Problem', openProject.problem],
                  ['The Approach', openProject.approach],
                  ['The Outcome', openProject.outcome],
                ] as const).map(([label, text]) => (
                  <div key={label} className="case-reveal mb-8">
                    <h4 className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 mb-2.5">
                      {label}
                    </h4>
                    <p className="text-sm sm:text-[15px] text-white/75 font-light leading-relaxed">
                      {text}
                    </p>
                  </div>
                ))}

                <div className="case-reveal mb-8">
                  <h4 className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 mb-3">
                    Under the Hood
                  </h4>
                  <ul className="space-y-2.5">
                    {openProject.engineering.map((item) => (
                      <li key={item} className="flex gap-3 text-sm text-white/70 font-light leading-relaxed">
                        <span className="text-white/25 font-serif">一</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="case-reveal mb-8">
                  <h4 className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 mb-2.5">
                    Stack
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {openProject.tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-[10px] tracking-wider px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white/80"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {openProject.credit && (
                  <p className="case-reveal font-mono text-[10px] text-white/35 leading-relaxed mb-8">
                    {openProject.credit}
                  </p>
                )}

                <div className="case-reveal flex flex-wrap items-center gap-3 pt-6 border-t border-white/10">
                  {openProject.links.map((link, i) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`font-mono text-xs tracking-widest uppercase px-4 py-2 rounded transition-colors cursor-pointer ${i === 0
                        ? 'bg-white text-black font-semibold hover:bg-white/90'
                        : 'border border-white/20 text-white/70 hover:text-white hover:border-white/50'
                        }`}
                    >
                      {link.label} ↗
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

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

    </section>
  );
};
