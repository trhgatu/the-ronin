'use client';

import React, { useRef, useEffect } from 'react';
import gsap from '@/lib/gsap';
import { watchVisibility } from '@/lib/visibility';
import { Renderer, Program, Mesh, Plane, Transform, Texture } from 'ogl';

export interface ProjectPortalItem {
  id: string;
  image: string;
  accent: string;
  title: string;
}

export interface ProjectMistPortalHandle {
  setProgress: (scrollProgress: number) => void;
  /** Grow the mist frame into `sheet`'s box (the case study panel) while
   * the image settles into `image`'s box (its hero slot), showing project
   * `index`. */
  open: (sheet: HTMLElement, image: HTMLElement, index: number) => void;
  /** Shrink back into the resting frame; `onDone` fires once it has landed. */
  close: (onDone?: () => void) => void;
}

interface ProjectMistPortalProps {
  projects: ProjectPortalItem[];
  /** Element the (full-stage) canvas is appended to. The portal's own div is
   * only the anchor that says where the resting frame sits. */
  canvasHostRef: React.RefObject<HTMLElement | null>;
  currentIndex?: number;
  className?: string;
}

// The canvas covers the whole sticky stage so the portal can grow to any size
// without ever resizing its drawing buffer, re-creating the GL context or
// re-uploading a texture — the image the visitor clicked is already on the
// GPU, so the case study opens on the very next frame. Only a quad around the
// portal's current rect is drawn, so a full-stage canvas costs no more fill
// than the old frame-sized one.
const VERTEX_SHADER = `
attribute vec3 position;
attribute vec2 uv;
uniform vec4 uBounds; // clip space: minX, minY, maxX, maxY
void main() {
  vec2 t = position.xy + 0.5;
  gl_Position = vec4(mix(uBounds.xy, uBounds.zw, t), 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform float uProgress;
uniform float uTime;
uniform vec4 uRect;       // image rect in drawing-buffer px: x, y (bottom-left), w, h
uniform vec4 uSheet;      // mist sheet rect, same space; equals uRect at rest
uniform float uExpand;    // 0 = resting in its mist frame, 1 = opened into the case study
uniform vec2 uImageSizeA;
uniform vec2 uImageSizeB;
uniform vec3 uAccentA;
uniform vec3 uAccentB;
uniform vec2 uMouse;      // drawing-buffer px
uniform float uMouseStrength;
uniform float uHover;

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
  vec2 frag = gl_FragCoord.xy;

  // Two boxes. The sheet (uSheet) is the torn mist surface; the image
  // (uRect) sits inside it. At rest they're the same box, so the portal is
  // just the image in its mist frame. Opening, the sheet grows into the case
  // study's near-full-screen panel while the image settles into its hero slot
  // within it — the mist itself becomes the "modal".
  vec2 sHalf = uSheet.zw * 0.5;
  vec2 sCenter = uSheet.xy + sHalf;

  // Everything below was tuned in units of the old frame-sized canvas, whose
  // height the image filled 88% of — keep that unit (H) so the mist reads the
  // same at rest, and simply scales up with the sheet as it grows.
  float H = uSheet.w / 0.88;
  vec2 halfC = sHalf / 0.88;
  vec2 uv = (frag - (sCenter - halfC)) / (2.0 * halfC);
  float aspect = halfC.x / halfC.y;

  // calm: cursor effects belong to the resting frame and fade as it opens.
  // travel: an extra bloom of mist while the sheet is in flight.
  float calm = 1.0 - uExpand;
  float travel = sin(uExpand * 3.14159);

  // Single monochrome ethereal mist color (silver-white twilight smoke)
  vec3 mistColor = vec3(0.92, 0.94, 0.98);

  // --- 1. Natural Smoke / Mist Turbulence at the Perimeter ---
  vec2 smokeP1 = uv * vec2(2.5, 2.0) + vec2(uTime * 0.05, -uTime * 0.08);
  float smoke1 = fbm(smokeP1);

  vec2 smokeP2 = uv * vec2(5.5, 4.5) + vec2(-uTime * 0.09, uTime * 0.12) + smoke1 * 0.4;
  float smoke2 = fbm(smokeP2);

  // --- Cursor: ripple + mist vortex (resting state only) ---
  vec2 mDelta = (frag - uMouse) / H;
  float mDist = length(mDelta);
  float hover = uHover * calm;

  float rippleWave = sin(mDist * 28.0 - uTime * 6.5) * exp(-mDist * 4.2) * hover;
  vec2 rippleDisp = normalize(mDelta + vec2(0.0001)) * rippleWave * 0.022;

  float mSwirl = exp(-mDist * 3.5) * (hover * 0.75 + uMouseStrength * calm * 0.25);
  vec2 swirlDisp = vec2(-mDelta.y, mDelta.x) * mSwirl * 0.045;
  vec2 totalHoverDisp = rippleDisp + swirlDisp;

  // Organic edge displacement of the sheet. H grows with the sheet, so the
  // same amplitude would bite ~50px into a full-screen panel — ease it down
  // as it opens to keep the torn edge clear of the case study copy.
  vec2 mistDisplace = vec2(smoke1, smoke2) * (0.055 * mix(1.0, 0.5, uExpand) + 0.03 * travel) + totalHoverDisp * 1.4;

  vec2 pAspect = (frag - sCenter) / H;
  vec2 warpedP = pAspect + mistDisplace * vec2(aspect, 1.0);
  float dist = sdRoundedBox(warpedP, sHalf / H, 0.04);

  float portalAlpha = smoothstep(0.015, -0.035, dist);
  if (portalAlpha <= 0.001) {
    gl_FragColor = vec4(0.0);
    return;
  }

  // --- 2. The image, in its own (moving) box ---
  vec2 halfPx = uRect.zw * 0.5;
  vec2 center = uRect.xy + halfPx;
  vec2 localUv = (frag - (center - halfPx)) / (2.0 * halfPx);
  vec2 clampedLocalUv = clamp(localUv, 0.0, 1.0);

  vec2 imgUvA = getCoverUv(clampedLocalUv, uImageSizeA, uRect.zw);
  vec2 imgUvB = getCoverUv(clampedLocalUv, uImageSizeB, uRect.zw);

  float morphNoise = fbm(clampedLocalUv * 4.0 + vec2(uTime * 0.07, -uTime * 0.10)) * 0.35;
  float p = smoothstep(0.0, 1.0, uProgress);
  float morphThreshold = p * 1.5 - 0.25 + morphNoise;
  float morphMask = smoothstep(0.40, 0.60, morphThreshold);

  float transEnergy = sin(uProgress * 3.14159);
  vec2 transDisp = vec2(cos(morphNoise * 6.28), sin(morphNoise * 6.28)) * transEnergy * 0.04;

  vec2 finalImgDispA = transDisp + totalHoverDisp;
  vec2 finalImgDispB = -transDisp + totalHoverDisp;

  float chroma = length(totalHoverDisp) * 1.6;

  vec3 colA, colB;
  colA.r = texture2D(uTexA, clamp(imgUvA + finalImgDispA + totalHoverDisp * chroma, 0.001, 0.999)).r;
  colA.g = texture2D(uTexA, clamp(imgUvA + finalImgDispA, 0.001, 0.999)).g;
  colA.b = texture2D(uTexA, clamp(imgUvA + finalImgDispA - totalHoverDisp * chroma, 0.001, 0.999)).b;

  colB.r = texture2D(uTexB, clamp(imgUvB + finalImgDispB + totalHoverDisp * chroma, 0.001, 0.999)).r;
  colB.g = texture2D(uTexB, clamp(imgUvB + finalImgDispB, 0.001, 0.999)).g;
  colB.b = texture2D(uTexB, clamp(imgUvB + finalImgDispB - totalHoverDisp * chroma, 0.001, 0.999)).b;

  vec3 imgColor = mix(colA, colB, morphMask);

  float spotlight = exp(-mDist * 3.2) * hover;
  vec3 hoverGlowColor = mix(vec3(1.0), uAccentA, 0.40);
  imgColor += hoverGlowColor * spotlight * 0.32;

  float focusRing = exp(-pow((mDist - 0.12 - sin(uTime * 3.5) * 0.018) * 18.0, 2.0)) * hover * 0.25;
  imgColor += vec3(0.95, 0.98, 1.0) * focusRing;

  float frontier = exp(-pow((morphThreshold - 0.5) * 8.0, 2.0)) * transEnergy;
  imgColor += mistColor * frontier * 0.85;

  // At rest the image fills the whole torn shape (its edge pixels stretch
  // out into the mist, as they always did). Once the sheet starts growing
  // the image becomes its own crisp card and the rest of the sheet is ink.
  float rectDist = sdRoundedBox(frag - center, halfPx, uRect.w * 0.012);
  float rectMask = smoothstep(1.5, -1.5, rectDist);
  float imgWeight = mix(1.0, rectMask, smoothstep(0.0, 0.2, uExpand));

  // --- 3. Sheet: ink surface with slow internal smoke ---
  float internalSmoke = (smoke1 * 0.5 + smoke2 * 0.5);
  vec3 sheetColor = vec3(0.035, 0.036, 0.042) + vec3(internalSmoke) * 0.035;
  vec3 baseColor = mix(sheetColor, imgColor + vec3(internalSmoke) * 0.06 * calm, imgWeight);

  // Ethereal mist rim around the sheet (blooms briefly in flight)
  float rimMist = exp(-pow((dist + 0.008) * 36.0, 2.0)) * (0.35 + 0.5 * travel);
  float hoverRim = exp(-pow((dist + 0.004) * 32.0, 2.0)) * hover * 0.40;
  rimMist += hoverRim;

  vec3 finalColor = baseColor + mistColor * rimMist;

  gl_FragColor = vec4(finalColor, portalAlpha);
}
`;

// Share of the anchor box the image occupies at rest; the rest is room for
// the mist to breathe (matches the old canvas's 0.44 half-size).
const REST_FILL = 0.88;

type Box = { x: number; y: number; w: number; h: number };

export const ProjectMistPortal = React.forwardRef<
  ProjectMistPortalHandle,
  ProjectMistPortalProps
>(({
  projects,
  canvasHostRef,
  currentIndex = 0,
  className = '',
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const programRef = useRef<Program | null>(null);
  const texturesRef = useRef<Texture[]>([]);
  const imageSizesRef = useRef<[number, number][]>([]);

  // Opening state lives in refs: the render loop reads it every frame, and
  // nothing about it should re-render React.
  const expandRef = useRef({ value: 0 });
  const targetRef = useRef<{ sheet: HTMLElement; image: HTMLElement } | null>(null);
  const lastProgressRef = useRef(0);
  const expandTweenRef = useRef<gsap.core.Tween | null>(null);

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

  const applyProgress = (scrollProgress: number) => {
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
  };

  const showSingle = (index: number) => {
    const program = programRef.current;
    const textures = texturesRef.current;
    const sizes = imageSizesRef.current;
    if (!program || textures.length === 0) return;
    const idx = Math.min(Math.max(0, index), projects.length - 1);
    program.uniforms.uTexA.value = textures[idx];
    program.uniforms.uTexB.value = textures[idx];
    program.uniforms.uImageSizeA.value = sizes[idx] || [16, 9];
    program.uniforms.uImageSizeB.value = sizes[idx] || [16, 9];
    program.uniforms.uAccentA.value = parseHex(projects[idx].accent);
    program.uniforms.uAccentB.value = parseHex(projects[idx].accent);
    program.uniforms.uProgress.value = 0;
  };

  React.useImperativeHandle(ref, () => ({
    setProgress: (scrollProgress: number) => {
      lastProgressRef.current = scrollProgress;
      // While a case study is open the image belongs to it; scroll is locked
      // anyway, but never let a stray scrub swap the texture mid-flight.
      if (targetRef.current) return;
      applyProgress(scrollProgress);
    },
    open: (sheet: HTMLElement, image: HTMLElement, index: number) => {
      targetRef.current = { sheet, image };
      showSingle(index);
      expandTweenRef.current?.kill();
      expandTweenRef.current = gsap.to(expandRef.current, {
        value: 1,
        // Starts at full speed on the click frame (no ease-in), but takes
        // long enough to read as the mist frame growing into the page.
        duration: 1.1,
        ease: 'power3.out',
      });
    },
    close: (onDone?: () => void) => {
      expandTweenRef.current?.kill();
      expandTweenRef.current = gsap.to(expandRef.current, {
        value: 0,
        duration: 0.7,
        ease: 'power3.inOut',
        onComplete: () => {
          targetRef.current = null;
          applyProgress(lastProgressRef.current);
          onDone?.();
        },
      });
    },
  }));

  useEffect(() => {
    const container = containerRef.current;
    const host = canvasHostRef.current;
    if (!container || !host || typeof window === 'undefined') return;

    let isActive = true;
    let rafId = 0;
    const startTime = performance.now();

    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: false,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    });
    const gl = renderer.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    host.appendChild(canvas);

    const scene = new Transform();
    const geometry = new Plane(gl);

    // Preload all project textures
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
        // Upload now, while the page loads — the render loop is paused until
        // Artifacts scrolls in, and a first-draw upload there was a
        // ~150ms hitch mid-scroll.
        tex.update();
        loadedSizes[idx] = [img.naturalWidth || 16, img.naturalHeight || 9];
        if (programRef.current && idx === currentIndex) {
          programRef.current.uniforms.uImageSizeA.value = loadedSizes[idx];
        }
      };
      img.src = proj.image;
    });

    texturesRef.current = loadedTextures;
    imageSizesRef.current = loadedSizes;

    // Pointer tracking (client px) & hover over the resting frame
    const mouse = { x: -9999, y: -9999, strength: 0 };
    let isHovered = false;
    let currentHover = 0;

    const onPointerMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      const rect = container.getBoundingClientRect();
      isHovered = rect.width > 0
        && e.clientX >= rect.left && e.clientX <= rect.right
        && e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (isHovered) mouse.strength = Math.min(mouse.strength + 0.35, 1.0);
    };
    window.addEventListener('mousemove', onPointerMove, { passive: true });

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
        uRect: { value: [0, 0, 1, 1] },
        uSheet: { value: [0, 0, 1, 1] },
        uBounds: { value: [-1, -1, 1, 1] },
        uExpand: { value: 0 },
        uImageSizeA: { value: loadedSizes[initialIndex] || [16, 9] },
        uImageSizeB: { value: loadedSizes[initialIndex] || [16, 9] },
        uAccentA: { value: initialAccent },
        uAccentB: { value: initialAccent },
        uMouse: { value: [-9999, -9999] },
        uMouseStrength: { value: 0 },
        uHover: { value: 0 },
      },
      transparent: true,
      depthTest: false,
    });
    programRef.current = program;

    const mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(scene);

    const handleResize = () => {
      if (!isActive) return;
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w > 0 && h > 0) renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(host);
    handleResize();

    const toBox = (r: DOMRect, origin: DOMRect): Box => ({
      x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height,
    });

    const render = () => {
      if (!isActive || paused) return;

      const hostRect = host.getBoundingClientRect();
      const dpr = renderer.dpr;
      const bufH = hostRect.height * dpr;

      // Resting frame: the anchor box, inset so the mist has room around the
      // image; sheet and image share it. Opening: the sheet interpolates to
      // the case study panel, the image to its hero slot.
      const a = toBox(container.getBoundingClientRect(), hostRect);
      const rest: Box = {
        x: a.x + a.w * (1 - REST_FILL) / 2,
        y: a.y + a.h * (1 - REST_FILL) / 2,
        w: a.w * REST_FILL,
        h: a.h * REST_FILL,
      };
      const e = expandRef.current.value;
      const target = targetRef.current;
      const lerpBox = (from: Box, el: HTMLElement): Box => {
        const t = toBox(el.getBoundingClientRect(), hostRect);
        return {
          x: from.x + (t.x - from.x) * e,
          y: from.y + (t.y - from.y) * e,
          w: from.w + (t.w - from.w) * e,
          h: from.h + (t.h - from.h) * e,
        };
      };
      const image = target && e > 0 ? lerpBox(rest, target.image) : rest;
      const sheet = target && e > 0 ? lerpBox(rest, target.sheet) : rest;

      // Drawing-buffer px, GL origin bottom-left
      const toGl = (b: Box) => [b.x * dpr, bufH - (b.y + b.h) * dpr, b.w * dpr, b.h * dpr];
      program.uniforms.uRect.value = toGl(image);
      const [sx, sy, sw, sh] = toGl(sheet);
      program.uniforms.uSheet.value = [sx, sy, sw, sh];
      program.uniforms.uExpand.value = e;

      // Quad = sheet plus room for its mist edge, so fragments outside it are
      // never shaded at all.
      const H = sh / REST_FILL;
      const margin = H * (0.12 + 0.06 * Math.sin(e * Math.PI)) + 4;
      const bufW = hostRect.width * dpr;
      program.uniforms.uBounds.value = [
        ((sx - margin) / bufW) * 2 - 1,
        ((sy - margin) / bufH) * 2 - 1,
        ((sx + sw + margin) / bufW) * 2 - 1,
        ((sy + sh + margin) / bufH) * 2 - 1,
      ];

      program.uniforms.uTime.value = (performance.now() - startTime) * 0.001;
      program.uniforms.uMouse.value = [
        (mouse.x - hostRect.left) * dpr,
        bufH - (mouse.y - hostRect.top) * dpr,
      ];
      program.uniforms.uMouseStrength.value = mouse.strength;
      mouse.strength *= 0.94;

      currentHover += ((isHovered ? 1 : 0) - currentHover) * 0.12;
      program.uniforms.uHover.value = currentHover;

      renderer.render({ scene });
      rafId = requestAnimationFrame(render);
    };

    // Offscreen (Artifacts scrolled away) or hidden tab: stop the loop
    // entirely, restart it on the way back in. See lib/visibility.
    let paused = false;
    const unwatch = watchVisibility(container, (visible) => {
      paused = !visible;
      cancelAnimationFrame(rafId);
      if (visible && isActive) rafId = requestAnimationFrame(render);
    });

    rafId = requestAnimationFrame(render);

    return () => {
      isActive = false;
      unwatch();
      cancelAnimationFrame(rafId);
      ro.disconnect();
      expandTweenRef.current?.kill();
      window.removeEventListener('mousemove', onPointerMove);
      programRef.current = null;
      geometry.remove();
      if (canvas.parentElement === host) host.removeChild(canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Fallback sync if currentIndex changes directly without scrubbing
  useEffect(() => {
    if (targetRef.current) return;
    showSingle(currentIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, projects]);

  return (
    <div
      ref={containerRef}
      className={`relative select-none pointer-events-auto ${className}`}
    />
  );
});

ProjectMistPortal.displayName = 'ProjectMistPortal';
