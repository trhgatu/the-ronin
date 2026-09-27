'use client';

import React, { useRef, useEffect } from 'react';
import { Renderer, Program, Mesh, Triangle, Transform, Texture } from 'ogl';

export interface ProjectPortalItem {
  id: string;
  image: string;
  accent: string;
  title: string;
}

export interface ProjectMistPortalHandle {
  setProgress: (scrollProgress: number) => void;
}

interface ProjectMistPortalProps {
  projects: ProjectPortalItem[];
  currentIndex?: number;
  className?: string;
  onSelectProject?: (index: number) => void;
}

const VERTEX_SHADER = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform float uProgress;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uImageSizeA;
uniform vec2 uImageSizeB;
uniform vec3 uAccentA;
uniform vec3 uAccentB;
uniform vec2 uMouse;
uniform float uMouseStrength;
uniform float uHover;

varying vec2 vUv;

// Stefan Gustavson classic 2D Simplex Noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187,
                      0.366025403784439,
                     -0.577350269189626,
                      0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// 4-octave Fractal Brownian Motion for ethereal mist & smoke
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  for (int i = 0; i < 4; ++i) {
    v += a * snoise(p);
    p = p * 2.05 + shift;
    a *= 0.5;
  }
  return v;
}

// Multi-frequency organic liquid water height
float waterHeight(vec2 p, float t) {
  vec2 p1 = p * vec2(3.5, 9.0) + vec2(t * 0.35, -t * 0.85);
  float n1 = snoise(p1);

  vec2 p2 = p * vec2(7.0, 18.0) + vec2(-t * 0.65, -t * 1.35) + vec2(n1 * 0.45);
  float n2 = snoise(p2);

  vec2 p3 = p * vec2(15.0, 32.0) + vec2(t * 1.2, -t * 2.1);
  float n3 = snoise(p3);

  return n1 * 0.52 + n2 * 0.34 + n3 * 0.14;
}

// Signed distance to a rounded rectangle
float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

// Helper to cover-fit image texture inside portal zone
vec2 getCoverUv(vec2 uv, vec2 imgSize, vec2 targetSize) {
  vec2 ratio = vec2(
    min((targetSize.x / targetSize.y) / (imgSize.x / imgSize.y), 1.0),
    min((targetSize.y / targetSize.x) / (imgSize.y / imgSize.x), 1.0)
  );
  return vec2(
    uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    uv.y * ratio.y + (1.0 - ratio.y) * 0.5
  );
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / uResolution.y;

  // Single monochrome ethereal mist color (silver-white twilight smoke)
  vec3 mistColor = vec3(0.92, 0.94, 0.98);

  // Portal geometry parameters: centered in canvas
  vec2 portalCenter = vec2(0.5, 0.5);
  vec2 portalHalfSize = vec2(0.44 * aspect, 0.44);
  float cornerRadius = 0.04;

  // --- 1. Natural Smoke / Mist Turbulence at the Perimeter ---
  vec2 smokeP1 = uv * vec2(2.5, 2.0) + vec2(uTime * 0.05, -uTime * 0.08);
  float smoke1 = fbm(smokeP1);

  vec2 smokeP2 = uv * vec2(5.5, 4.5) + vec2(-uTime * 0.09, uTime * 0.12) + smoke1 * 0.4;
  float smoke2 = fbm(smokeP2);

  // --- 1. Natural Smoke / Mist Turbulence at the Perimeter & Cursor ---
  vec2 mDelta = (uv - uMouse) * vec2(aspect, 1.0);
  float mDist = length(mDelta);

  // Dynamic liquid ripple wave radiating from cursor when hovered
  float rippleWave = sin(mDist * 28.0 - uTime * 6.5) * exp(-mDist * 4.2) * uHover;
  vec2 rippleDisp = normalize(mDelta + vec2(0.0001)) * rippleWave * 0.022;

  // Swirling mist vortex around cursor
  float mSwirl = exp(-mDist * 3.5) * (uHover * 0.75 + uMouseStrength * 0.25);
  vec2 swirlDisp = vec2(-mDelta.y, mDelta.x) * mSwirl * 0.045;
  vec2 totalHoverDisp = rippleDisp + swirlDisp;

  // Organic edge displacement (dissolves the hard rectangular border into living mist)
  vec2 mistDisplace = vec2(smoke1, smoke2) * 0.055 + totalHoverDisp * 1.4;

  // Distance to portal boundary with organic mist turbulence
  vec2 pAspect = (uv - portalCenter) * vec2(aspect, 1.0);
  vec2 warpedP = pAspect + mistDisplace * vec2(aspect, 1.0);
  float dist = sdRoundedBox(warpedP, portalHalfSize, cornerRadius);

  // Soft organic portal mask: 1.0 inside, feathers out to 0.0 at perimeter
  float portalAlpha = smoothstep(0.015, -0.035, dist);

  // CRITICAL: Strictly discard/zero outside pixels so there is ZERO milky white film outside!
  if (portalAlpha <= 0.001) {
    gl_FragColor = vec4(0.0);
    return;
  }

  // Compute local portal UV for image mapping
  vec2 localUv = (uv - (portalCenter - portalHalfSize)) / (portalHalfSize * 2.0);
  vec2 clampedLocalUv = clamp(localUv, 0.0, 1.0);

  vec2 imgUvA = getCoverUv(clampedLocalUv, uImageSizeA, portalHalfSize * 2.0);
  vec2 imgUvB = getCoverUv(clampedLocalUv, uImageSizeB, portalHalfSize * 2.0);

  // --- 2. In-Place Project Morphing & Interactive OGL Liquid Refraction ---
  float morphNoise = fbm(clampedLocalUv * 4.0 + vec2(uTime * 0.07, -uTime * 0.10)) * 0.35;
  float p = smoothstep(0.0, 1.0, uProgress);
  float morphThreshold = p * 1.5 - 0.25 + morphNoise;
  float morphMask = smoothstep(0.40, 0.60, morphThreshold);

  float transEnergy = sin(uProgress * 3.14159);
  vec2 transDisp = vec2(cos(morphNoise * 6.28), sin(morphNoise * 6.28)) * transEnergy * 0.04;

  // Total image coordinate displacement combining morph scroll and mouse hover liquid lens
  vec2 finalImgDispA = transDisp + totalHoverDisp;
  vec2 finalImgDispB = -transDisp + totalHoverDisp;

  // Subtle chromatic dispersion on hover
  float chroma = length(totalHoverDisp) * 1.6;

  vec3 colA, colB;
  colA.r = texture2D(uTexA, clamp(imgUvA + finalImgDispA + totalHoverDisp * chroma, 0.001, 0.999)).r;
  colA.g = texture2D(uTexA, clamp(imgUvA + finalImgDispA, 0.001, 0.999)).g;
  colA.b = texture2D(uTexA, clamp(imgUvA + finalImgDispA - totalHoverDisp * chroma, 0.001, 0.999)).b;

  colB.r = texture2D(uTexB, clamp(imgUvB + finalImgDispB + totalHoverDisp * chroma, 0.001, 0.999)).r;
  colB.g = texture2D(uTexB, clamp(imgUvB + finalImgDispB, 0.001, 0.999)).g;
  colB.b = texture2D(uTexB, clamp(imgUvB + finalImgDispB - totalHoverDisp * chroma, 0.001, 0.999)).b;

  vec3 imgColor = mix(colA, colB, morphMask);

  // Interactive luminous focus spotlight following cursor
  float spotlight = exp(-mDist * 3.2) * uHover;
  vec3 hoverGlowColor = mix(vec3(1.0), uAccentA, 0.40);
  imgColor += hoverGlowColor * spotlight * 0.32;

  // Expanding luminous focus ring
  float focusRing = exp(-pow((mDist - 0.12 - sin(uTime * 3.5) * 0.018) * 18.0, 2.0)) * uHover * 0.25;
  imgColor += vec3(0.95, 0.98, 1.0) * focusRing;

  // Transition frontier energy aura in pure monochrome mist
  float frontier = exp(-pow((morphThreshold - 0.5) * 8.0, 2.0)) * transEnergy;
  imgColor += mistColor * frontier * 0.85;

  // --- 3. Delicate Ethereal Mist Rim (Subtle, Translucent, Excited by Hover) ---
  float rimMist = exp(-pow((dist + 0.008) * 36.0, 2.0)) * 0.35;
  float hoverRim = exp(-pow((dist + 0.004) * 32.0, 2.0)) * uHover * 0.40;
  rimMist += hoverRim;

  // Very faint internal floating smoke wisps
  float internalSmoke = (smoke1 * 0.5 + smoke2 * 0.5) * 0.06;

  vec3 finalColor = imgColor + vec3(internalSmoke) + mistColor * rimMist;

  gl_FragColor = vec4(finalColor, portalAlpha);
}
`;

export const ProjectMistPortal = React.forwardRef<
  ProjectMistPortalHandle,
  ProjectMistPortalProps
>(({
  projects,
  currentIndex = 0,
  className = '',
  onSelectProject,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // References for state management across renders
  const prevIndexRef = useRef(currentIndex);
  const programRef = useRef<Program | null>(null);
  const texturesRef = useRef<Texture[]>([]);
  const imageSizesRef = useRef<[number, number][]>([]);

  // Hex color to [R, G, B] normalized
  const parseHex = (hex: string): [number, number, number] => {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    return [
      ((num >> 16) & 255) / 255,
      ((num >> 8) & 255) / 255,
      (num & 255) / 255,
    ];
  };

  // Expose real-time scroll scrub handler
  React.useImperativeHandle(ref, () => ({
    setProgress: (scrollProgress: number) => {
      const program = programRef.current;
      const textures = texturesRef.current;
      const sizes = imageSizesRef.current;
      if (!program || textures.length === 0) return;

      const totalTransitions = Math.max(1, projects.length - 1);
      const v = Math.max(0, Math.min(scrollProgress * totalTransitions, totalTransitions));
      
      const idxA = Math.min(Math.floor(v), projects.length - 2);
      const idxB = idxA + 1;
      const localV = v - idxA;

      program.uniforms.uTexA.value = textures[idxA];
      program.uniforms.uTexB.value = textures[idxB] || textures[idxA];
      program.uniforms.uImageSizeA.value = sizes[idxA] || [16, 9];
      program.uniforms.uImageSizeB.value = sizes[idxB] || sizes[idxA] || [16, 9];
      program.uniforms.uAccentA.value = parseHex(projects[idxA].accent);
      program.uniforms.uAccentB.value = parseHex(projects[idxB]?.accent || projects[idxA].accent);

      // Smooth hermite interpolation for mist morphing
      const t = Math.max(0, Math.min((localV - 0.15) / 0.70, 1.0));
      program.uniforms.uProgress.value = t * t * (3 - 2 * t);
    },
  }));

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || typeof window === 'undefined') return;

    let isActive = true;
    let rafId = 0;
    const startTime = performance.now();

    // 1. Initialize OGL Renderer
    const renderer = new Renderer({
      canvas,
      alpha: true,
      premultipliedAlpha: false,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    });
    const gl = renderer.gl;

    const scene = new Transform();
    const geometry = new Triangle(gl);

    // 2. Preload all project textures
    const loadedTextures: Texture[] = [];
    const loadedSizes: [number, number][] = [];

    projects.forEach((proj, idx) => {
      const tex = new Texture(gl, { generateMipmaps: false });
      loadedTextures.push(tex);
      loadedSizes.push([16, 9]); // Default fallback aspect

      const img = new Image();
      if (proj.image.startsWith('http://') || proj.image.startsWith('https://')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        if (!isActive) return;
        tex.image = img;
        loadedSizes[idx] = [img.naturalWidth || 16, img.naturalHeight || 9];
        if (programRef.current) {
          if (idx === currentIndex) {
            programRef.current.uniforms.uImageSizeA.value = loadedSizes[idx];
          }
        }
      };
      img.src = proj.image;
    });

    texturesRef.current = loadedTextures;
    imageSizesRef.current = loadedSizes;

    // 3. Mouse pointer tracking & hover detection
    const mouse = { x: 0.5, y: 0.5, strength: 0 };
    let isHovered = false;
    let currentHover = 0;

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height; // Invert for GL coordinates
      if (x >= 0.0 && x <= 1.0 && y >= 0.0 && y <= 1.0) {
        mouse.x = x;
        mouse.y = y;
        mouse.strength = Math.min(mouse.strength + 0.35, 1.0);
        isHovered = true;
      } else {
        isHovered = false;
      }
    };
    window.addEventListener('mousemove', onPointerMove, { passive: true });

    const onPointerEnter = () => {
      isHovered = true;
    };
    const onPointerLeave = () => {
      isHovered = false;
    };
    container.addEventListener('pointerenter', onPointerEnter);
    container.addEventListener('pointerleave', onPointerLeave);

    // 4. Create OGL Shader Program
    const initialIndex = Math.min(currentIndex, projects.length - 1);
    const initialAccent = parseHex(projects[initialIndex].accent);

    const program = new Program(gl, {
      vertex: VERTEX_SHADER,
      fragment: FRAGMENT_SHADER,
      uniforms: {
        uTexA: { value: loadedTextures[initialIndex] },
        uTexB: { value: loadedTextures[initialIndex] },
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uResolution: { value: [container.clientWidth, container.clientHeight] },
        uImageSizeA: { value: loadedSizes[initialIndex] || [16, 9] },
        uImageSizeB: { value: loadedSizes[initialIndex] || [16, 9] },
        uAccentA: { value: initialAccent },
        uAccentB: { value: initialAccent },
        uMouse: { value: [0.5, 0.5] },
        uMouseStrength: { value: 0 },
        uHover: { value: 0 },
      },
      transparent: true,
    });
    programRef.current = program;

    const mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(scene);

    // 5. Responsive Resize Handling
    const handleResize = () => {
      if (!container || !isActive) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        renderer.setSize(w, h);
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        program.uniforms.uResolution.value = [w * renderer.dpr, h * renderer.dpr];
      }
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);
    handleResize();

    // 6. Animation Render Loop
    const render = () => {
      if (!isActive) return;

      const elapsed = (performance.now() - startTime) * 0.001;
      program.uniforms.uTime.value = elapsed;
      program.uniforms.uMouse.value = [mouse.x, mouse.y];
      program.uniforms.uMouseStrength.value = mouse.strength;
      mouse.strength *= 0.94; // Smooth decay

      const targetHover = isHovered ? 1.0 : 0.0;
      currentHover += (targetHover - currentHover) * 0.12;
      program.uniforms.uHover.value = currentHover;

      renderer.render({ scene });
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      isActive = false;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('pointerenter', onPointerEnter);
      container.removeEventListener('pointerleave', onPointerLeave);
      programRef.current = null;
      geometry.remove();
    };
  }, []); // Run once on mount

  // Fallback sync if currentIndex changes directly without scrubbing
  useEffect(() => {
    if (currentIndex === undefined) return;
    const program = programRef.current;
    const textures = texturesRef.current;
    const sizes = imageSizesRef.current;
    if (!program || textures.length === 0) return;

    const idx = Math.min(Math.max(0, currentIndex), projects.length - 1);
    prevIndexRef.current = idx;

    program.uniforms.uTexA.value = textures[idx];
    program.uniforms.uTexB.value = textures[idx];
    program.uniforms.uImageSizeA.value = sizes[idx] || [16, 9];
    program.uniforms.uImageSizeB.value = sizes[idx] || [16, 9];
    program.uniforms.uAccentA.value = parseHex(projects[idx].accent);
    program.uniforms.uAccentB.value = parseHex(projects[idx].accent);
    program.uniforms.uProgress.value = 0;
  }, [currentIndex, projects]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none pointer-events-auto ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none select-none"
      />
    </div>
  );
});

ProjectMistPortal.displayName = 'ProjectMistPortal';
