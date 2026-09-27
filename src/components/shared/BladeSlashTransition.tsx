"use client";

import { useEffect, useRef, useState } from "react";
import { Mesh, Program, Renderer, Transform, Triangle } from "ogl";
import gsap from "@/lib/gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { soundManager } from "@/lib/sound";

gsap.registerPlugin(ScrollTrigger);

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
    if (u_progress <= 0.001) {
        gl_FragColor = vec4(0.0);
        return;
    }

    // Exact screen pixel coordinates
    // In the reference screenshot, the slash goes from BOTTOM-LEFT to TOP-RIGHT!
    // Angle: ~35 degrees upward to the right.
    vec2 pA = vec2(0.0, 0.0);
    vec2 pB = u_resolution;
    vec2 lineDir = normalize(pB - pA);
    vec2 normal = vec2(-lineDir.y, lineDir.x);

    // Center of screen
    vec2 center = u_resolution * 0.5;
    vec2 toFrag = gl_FragCoord.xy - center;

    // Component along the blade cut line, and component perpendicular across it
    float along = abs(dot(toFrag, lineDir));
    float across = abs(dot(toFrag, normal));

    // Asymmetric random bite factor (makes the 4 points uneven and organically wild like real torn paper)
    vec2 polarUv = vec2(atan(toFrag.y, toFrag.x), length(toFrag) / length(u_resolution));
    float angleWobble = fbm(vec2(polarUv.x * 2.5, polarUv.y * 1.5)) * 0.35;

    // Morph tear geometry:
    // Starts as an ultra-sharp needle-concave star (p=0.52, a=4.0) cutting along the blade angle,
    // then organically blooms into an expanding elliptical tear (p=1.85, a=1.0, b=1.0).
    // This allows the tear boundary to physically and naturally sweep past all 4 screen corners,
    // eliminating any sudden pop, flash, or artificial dimming of the background.
    float morphTear = smoothstep(0.20, 0.80, u_progress);
    float p = mix(0.52, 1.85, morphTear);
    float invP = 1.0 / p;
    float a = mix(4.0 + angleWobble, 1.0, morphTear);
    float b = mix(1.05 + angleWobble * 0.45, 1.0, morphTear);
    float safeAlong = max(along / a, 0.0001);
    float safeAcross = max(across / b, 0.0001);
    float r = pow(pow(safeAlong, p) + pow(safeAcross, p), invP);

    // Multi-tier violent tearing noise (Large chunks, medium rips, fine jagged paper teeth)
    vec2 flowUv = vUv * 6.0 + vec2(u_time * 0.04, -u_time * 0.03);
    float nChunk = (fbm(flowUv * 0.8) - 0.5) * 2.0;       // Giant missing paper chunks (~100px)
    float nRip = (fbm(flowUv * 2.4) - 0.5) * 2.0;         // Jagged teeth (~70px)
    float nFine = (fbm(vUv * 45.0) - 0.5) * 2.0;          // Fine paper shreds (~35px)
    float nMicro = (fbm(vUv * 110.0) - 0.5) * 2.0;       // Microscopic fibers (~15px)

    // Combined violent tear displacement (amplitude up to ~220px variance!)
    float violentTearNoise = (nChunk * 95.0 + nRip * 65.0 + nFine * 35.0 + nMicro * 15.0);

    // Tear expansion radius: 1.65x screen diagonal guarantees smooth natural coverage past all 4 corners
    float maxReachPx = length(u_resolution) * 1.65;
    float currentTearPx = u_progress * maxReachPx;

    // Displace edge violently (active from the start, scales naturally with opening)
    float displaceScale = 1.0 - smoothstep(0.75, 0.95, u_progress);
    float displacedEdgePx = r - violentTearNoise * displaceScale;

    // Razor-sharp violent bite edge (1.6px crisp feather)
    float edgeFeatherPx = 1.6;
    float torn = 1.0 - smoothstep(currentTearPx - edgeFeatherPx, currentTearPx, displacedEdgePx);

    // Fade out any rim/energy lines early so screen turns 100% pitch black smoothly
    float rimFade = 1.0 - smoothstep(0.35, 0.65, u_progress);
    float rimBandPx = 12.0;
    float rim = (1.0 - smoothstep(0.0, rimBandPx, abs(displacedEdgePx - currentTearPx))) * torn * rimFade;

    // Pure organic darkness: as the tear naturally expands past the viewport boundaries,
    // the final pixels are naturally engulfed without any abrupt fade or snap.
    float finalSafety = smoothstep(0.92, 0.99, u_progress);
    torn = mix(torn, 1.0, finalSafety);
    rim *= (1.0 - finalSafety);

    vec3 deepInk = vec3(7.0 / 255.0, 7.0 / 255.0, 7.0 / 255.0);
    vec3 brightRim = vec3(1.0, 1.0, 1.0);
    vec3 tornColor = mix(deepInk, brightRim, rim * 0.75);

    // Zero out any residue white lines so only pure black void remains
    gl_FragColor = vec4(tornColor, torn);
}
`;

export function BladeSlashTransition() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const slashLineRef = useRef<SVGLineElement>(null);
  const slashShadowRef = useRef<SVGLineElement>(null);
  const flashOverlayRef = useRef<HTMLDivElement>(null);
  const textPromptRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const topHalfRef = useRef<HTMLDivElement>(null);
  const bottomHalfRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvasWrap = canvasRef.current;

    // 1. Initialize OGL Context
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
      vertex: VS,
      fragment: FS,
      transparent: true,
      uniforms: {
        u_resolution: { value: [gl.drawingBufferWidth, gl.drawingBufferHeight] },
        u_progress: { value: 0 },
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

    let rafId = 0;
    const startTime = performance.now();
    const tick = () => {
      program.uniforms.u_time.value = (performance.now() - startTime) / 1000;
      renderer.render({ scene });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    // 2. Setup GSAP ScrollTrigger Sequence
    const ctx = gsap.context(() => {
      const slashProgress = { value: 0 };
      let hasPlayedSound = false;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.0,
          onUpdate: (self) => {
            // Sound triggers at moment of razor cut
            if (self.progress > 0.15 && !hasPlayedSound && self.direction > 0) {
              soundManager?.playSwordWhoosh();
              hasPlayedSound = true;
            } else if (self.progress < 0.08) {
              hasPlayedSound = false;
            }

            // Sync Navbar theme to dark mode once tear reveals the black forge
            if (self.progress >= 0.5) {
              window.dispatchEvent(new CustomEvent("dark-section", { detail: true }));
            } else if (self.direction < 0 && self.progress < 0.45) {
              window.dispatchEvent(new CustomEvent("dark-section", { detail: false }));
            }
          },
        },
      });

      // Stage 1: The Zen of Stillness - Breath is held as scroll enters (0.0 -> 0.15)
      tl.fromTo(
        textPromptRef.current,
        { opacity: 1, scale: 1 },
        {
          opacity: 0,
          scale: 0.94,
          filter: "blur(8px)",
          duration: 0.15,
          ease: "power2.in",
        }
      )
        // Stage 2: Razor-thin Blade Slash cuts across (0.15 -> 0.32)
        .fromTo(
          [slashLineRef.current, slashShadowRef.current],
          { strokeDashoffset: 3000, opacity: 0 },
          {
            strokeDashoffset: 0,
            opacity: 1,
            duration: 0.17,
            ease: "power3.inOut",
          },
          0.15
        )
        // Quick subtle white flash of steel reflection
        .fromTo(
          flashOverlayRef.current,
          { opacity: 0 },
          {
            opacity: 0.4,
            duration: 0.06,
            yoyo: true,
            repeat: 1,
            ease: "power2.out",
          },
          "-=0.1"
        )
        // Paper splits: two sides shift slightly apart (Screen Tear effect)
        .to(
          topHalfRef.current,
          {
            x: -24,
            y: -14,
            duration: 0.3,
            ease: "power2.out",
          },
          "-=0.05"
        )
        .to(
          bottomHalfRef.current,
          {
            x: 24,
            y: 14,
            duration: 0.3,
            ease: "power2.out",
          },
          "<"
        )
        // Stage 3: The tear opens wide, OGL reveals the dark forge beneath (0.3 -> 1.0)
        .to(
          slashProgress,
          {
            value: 1.0,
            duration: 0.7,
            ease: "power1.inOut",
            onUpdate: () => {
              program.uniforms.u_progress.value = slashProgress.value;
            },
          },
          "-=0.15"
        )
        // Razor slash line and aura fade out early as the screen tears open
        .to(
          [slashLineRef.current, slashShadowRef.current],
          {
            opacity: 0,
            duration: 0.2,
            ease: "power1.out",
          },
          "-=0.5"
        )
        // Stage 4: The Forge Portal emerges directly from inside the expanding tear
        .fromTo(
          portalRef.current,
          {
            opacity: 0,
            scale: 0.88,
            filter: "blur(14px)",
            y: 28,
          },
          {
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            y: 0,
            duration: 0.45,
            ease: "power2.out",
          },
          "-=0.45"
        )
        // Towards completion, portal smoothly rises into hand-off position
        .to(
          portalRef.current,
          {
            y: -50,
            opacity: 0.92,
            duration: 0.2,
            ease: "power1.in",
          },
          "-=0.08"
        );
    }, container);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      ctx.revert();
      if (gl.canvas.parentElement === canvasWrap) {
        canvasWrap.removeChild(gl.canvas);
      }
      setTimeout(() => {
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }, 100);
    };
  }, [mounted]);

  return (
    <section
      ref={containerRef}
      id="slash-transition"
      className="relative w-full h-[240vh] bg-background z-20"
    >
      {/* Sticky viewport frame */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center pointer-events-none">
        {/* Stage 1: Pure Minimalist Stillness (No decor, short & impactful) */}
        <div
          ref={textPromptRef}
          className="absolute z-10 text-center select-none px-6 pointer-events-none"
        >
          <p className="font-serif italic text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-foreground/75 font-light tracking-tight">
            Where thought becomes form.
          </p>
        </div>

        {/* Paper Slice Layers: split displacement */}
        <div ref={topHalfRef} className="absolute inset-0 pointer-events-none z-5" />
        <div ref={bottomHalfRef} className="absolute inset-0 pointer-events-none z-5" />

        {/* Anime Katana Cut Line & Sparkling Glint (Exact match to YouTube reference) */}
        <svg
          className="absolute inset-0 w-full h-full z-25 pointer-events-none overflow-visible"
        >
          <defs>
            <filter id="blade-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer glow aura of the razor cut */}
          <line
            ref={slashShadowRef}
            x1="-5%"
            y1="105%"
            x2="105%"
            y2="-5%"
            stroke="#ffffff"
            strokeWidth="4"
            strokeDasharray="3000"
            strokeDashoffset="3000"
            filter="url(#blade-glow)"
            className="opacity-0"
          />

          {/* Razor-thin steel blade incision (1.5px stark white-silver) */}
          <line
            ref={slashLineRef}
            x1="-5%"
            y1="105%"
            x2="105%"
            y2="-5%"
            stroke="#111111"
            strokeWidth="1.8"
            strokeDasharray="3000"
            strokeDashoffset="3000"
            strokeLinecap="round"
            className="opacity-0"
          />
        </svg>

        {/* Subtle white flash on impact */}
        <div
          ref={flashOverlayRef}
          className="absolute inset-0 bg-white z-30 pointer-events-none opacity-0"
        />

        {/* OGL Canvas: Rách mở màn hình từ đường chém */}
        <div
          ref={canvasRef}
          className="absolute inset-0 w-full h-full z-15 pointer-events-none"
        />

        {/* Stage 4: The Forge Portal - Revealed directly inside the tear */}
        <div
          ref={portalRef}
          className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 pointer-events-none px-6 select-none opacity-0"
        >
          <h2 className="relative z-10 font-serif font-light text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-white tracking-tighter uppercase leading-[0.88] mb-5">
            <span>DIGITAL</span> <br />
            <span
              className="text-transparent"
              style={{ WebkitTextStroke: "1.5px rgba(255,255,255,0.85)" }}
            >
              ARTIFACTS.
            </span>
          </h2>
        </div>
      </div>
    </section>
  );
}
