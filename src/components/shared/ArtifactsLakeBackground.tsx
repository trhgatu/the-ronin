'use client';

import React, { useRef, useEffect } from 'react';
import { watchVisibility } from '@/lib/visibility';
import { Renderer, Program, Mesh, Triangle, Transform } from 'ogl';

const LAKE_VS = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const LAKE_FS = `
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
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
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; ++i) {
    v += a * noise(p);
    p = rot * p * 2.05 + vec2(8.7);
    a *= 0.5;
  }
  return v;
}

// Procedural Sumi-e mountain silhouette (Japanese ink wash landscape)
float sumiMountain(float x, float seed) {
  float m = sin(x * 1.8 + seed) * 0.45;
  m += sin(x * 3.7 + seed * 2.1) * 0.22;
  m += sin(x * 7.5 - seed * 3.4) * 0.12;
  m += noise(vec2(x * 6.0, seed)) * 0.15;
  return m;
}

// Ethereal Sumi ink smoke advection
float sumiInkMist(vec2 p, float t, vec2 mDelta, float mDist, out vec2 q) {
  vec2 wind = vec2(t * 0.05, sin(t * 0.025) * 0.012);
  
  q = vec2(
    fbm(p + wind),
    fbm(p + vec2(3.5, 1.7) - wind * 0.7)
  );

  float mouseWake = exp(-mDist * 4.0);
  vec2 wake = vec2(-mDelta.y, mDelta.x) * mouseWake * 0.5;

  vec2 r = vec2(
    fbm(p + 2.8 * q + vec2(1.5, 8.3) + wind * 1.2 + wake),
    fbm(p + 2.8 * q + vec2(7.2, 2.1) - wind * 0.9 + wake)
  );

  return fbm(p + 2.5 * r + wind * 0.4);
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / uResolution.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

  vec2 mDelta = (uv - uMouse) * vec2(aspect, 1.0);
  float mDist = length(mDelta);
  vec2 mouseParallax = (uMouse - 0.5) * 0.035;

  // Base nocturnal abyss (#080808)
  vec3 bgColor = vec3(8.0 / 255.0, 8.0 / 255.0, 8.0 / 255.0);

  // Waterline is at y = 0.46
  float waterline = 0.46;

  // --- 1. DISTANT SUMI-E MOUNTAIN RIDGES (Atmosphere & Horizon) ---
  float mountainBaseY = 0.46;
  
  // Far mountain silhouette (soft ink wash, shrouded in haze)
  float farMtnHeight = mountainBaseY + 0.14 + sumiMountain(p.x * 0.85 + mouseParallax.x * 0.4, 1.5) * 0.12;
  float farMtnMask = smoothstep(farMtnHeight + 0.03, farMtnHeight - 0.01, uv.y);
  vec3 farMtnColor = vec3(14.0 / 255.0, 17.0 / 255.0, 23.0 / 255.0);

  // Near mountain silhouette (darker charcoal sumi ink)
  float nearMtnHeight = mountainBaseY + 0.07 + sumiMountain(p.x * 1.4 + mouseParallax.x * 0.7, 4.8) * 0.09;
  float nearMtnMask = smoothstep(nearMtnHeight + 0.02, nearMtnHeight - 0.01, uv.y);
  vec3 nearMtnColor = vec3(11.0 / 255.0, 13.0 / 255.0, 17.0 / 255.0);

  // Mountain layer composition with atmospheric haze
  vec3 landScape = mix(bgColor, farMtnColor, farMtnMask * 0.85);
  landScape = mix(landScape, nearMtnColor, nearMtnMask * 0.95);

  // --- 2. ETHEREAL CALLIGRAPHIC SUMI INK MIST (Flowing through mountain passes) ---
  vec2 mistP = vec2((p.x + mouseParallax.x * 0.5) * 0.9, (p.y - 0.01 + mouseParallax.y * 0.5) * 3.4);
  vec2 q;
  float mistFlow = sumiInkMist(mistP, uTime, mDelta, mDist, q);

  // Stratified fog bank hovering across the mountain bases and lake shore
  float horizonStrata = exp(-pow((uv.y - 0.47) * 4.2, 2.0));
  float skyHaze = exp(-pow((uv.y - 0.62) * 3.0, 2.0)) * 0.35;
  float fogTotal = mistFlow * (horizonStrata * 0.95 + skyHaze * 0.45);
  float fogDensity = smoothstep(0.12, 0.72, fogTotal);

  // Ethereal silver moonlit ink wash tone
  vec3 mistSilver = vec3(160.0 / 255.0, 175.0 / 255.0, 200.0 / 255.0);
  vec3 atmosphere = mix(landScape, mistSilver, fogDensity * 0.28);

  // --- 3. ZEN INK LAKE (MIZU NO KOKORO - GLASSY BLACK INK MIRROR) ---
  if (uv.y < waterline) {
    float waterDepth = (waterline - uv.y) / waterline; // 0.0 at horizon, 1.0 at screen bottom
    
    // Glassy calm: only whisper-soft liquid stillness and mouse ripples
    float mouseRipple = sin(mDist * 32.0 - uTime * 4.5) * exp(-mDist * 5.0) * exp(-pow(waterDepth - 0.5, 2.0) * 4.0) * 0.012;
    float naturalMirrorDrift = sin(p.x * 12.0 + uTime * 0.4) * 0.002 * (1.0 - waterDepth);
    float totalWave = mouseRipple + naturalMirrorDrift;

    // Deep obsidian black ink mirror tone
    vec3 obsidianInk = vec3(7.0 / 255.0, 8.0 / 255.0, 11.0 / 255.0);

    // Soft moon-sheen reflection along the glassy surface
    float moonSheen = pow(1.0 - waterDepth, 3.2) * 0.08 + totalWave * 2.5;
    vec3 waterColor = obsidianInk + mistSilver * max(0.0, moonSheen);

    // Horizon line blend
    float horizonBlend = smoothstep(0.0, 0.08, waterDepth);
    atmosphere = mix(atmosphere, waterColor, horizonBlend);

    // Gentle calligraphic ink mist gliding across the mirror water
    vec2 waterMistUv = vec2(p.x * 1.4 + uTime * 0.06, waterDepth * 3.0);
    float waterMist = fbm(waterMistUv + q * 1.6) * (1.0 - waterDepth * 0.5);
    atmosphere = mix(atmosphere, mistSilver, smoothstep(0.20, 0.70, waterMist) * 0.22);
  }

  // --- 4. Center-Stage Focus Vignette ---
  float vignette = smoothstep(1.35, 0.45, length(p));
  vec3 finalColor = mix(bgColor, atmosphere, vignette);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

export const ArtifactsLakeBackground: React.FC<{ className?: string }> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isActive = true;
    let rafId = 0;

    const renderer = new Renderer({
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
    const gl = renderer.gl;
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    gl.canvas.style.display = 'block';
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const scene = new Transform();

    const program = new Program(gl, {
      vertex: LAKE_VS,
      fragment: LAKE_FS,
      uniforms: {
        uResolution: { value: [container.clientWidth, container.clientHeight] },
        uTime: { value: 0 },
        uMouse: { value: [0.5, 0.5] },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(scene);

    const handleResize = () => {
      if (!container || !isActive) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        renderer.setSize(w, h);
        program.uniforms.uResolution.value = [w, h];
      }
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);
    handleResize();

    const mouse = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      mouse.targetX = (e.clientX - rect.left) / rect.width;
      mouse.targetY = 1.0 - (e.clientY - rect.top) / rect.height;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const startTime = performance.now();
    const render = () => {
      if (!isActive || paused) return;

      const elapsed = (performance.now() - startTime) * 0.001;
      program.uniforms.uTime.value = elapsed;

      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;
      program.uniforms.uMouse.value = [mouse.x, mouse.y];

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
      window.removeEventListener('mousemove', onMouseMove);
      if (gl.canvas.parentElement === container) {
        container.removeChild(gl.canvas);
      }
      setTimeout(() => {
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }, 100);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden z-0 ${className}`}
      aria-hidden="true"
    />
  );
};
