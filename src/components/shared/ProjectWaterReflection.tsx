'use client';

import React, { useRef, useEffect } from 'react';
import { watchVisibility } from '@/lib/visibility';
import * as THREE from 'three';

interface ProjectWaterReflectionProps {
  imageSrc?: string;
  images?: string[];
  className?: string;
}

export interface ProjectWaterReflectionHandle {
  setProgress: (scrollProgress: number) => void;
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTextureA;
  uniform sampler2D uTextureB;
  uniform float uProgress;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uMouseStrength;
  uniform vec2 uResolution;
  varying vec2 vUv;

  // Stefan Gustavson's classic 2D simplex noise
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

  // Multi-frequency organic liquid height field (gentle, tranquil lake ripples)
  float waterHeight(vec2 p, float t) {
    vec2 p1 = p * vec2(3.0, 7.0) + vec2(t * 0.08, -t * 0.18);
    float n1 = snoise(p1);

    vec2 p2 = p * vec2(6.0, 14.0) + vec2(-t * 0.12, -t * 0.28) + vec2(n1 * 0.35);
    float n2 = snoise(p2);

    vec2 p3 = p * vec2(12.0, 24.0) + vec2(t * 0.20, -t * 0.40);
    float n3 = snoise(p3);

    return n1 * 0.55 + n2 * 0.32 + n3 * 0.13;
  }

  void main() {
    // Invert vertically for water reflection
    vec2 uv = vec2(vUv.x, 1.0 - vUv.y);

    // Depth: 0.0 at waterline (top of reflection), 1.0 deeper down
    float depth = vUv.y;

    // Finite-difference surface slope gradient for natural optical refraction
    vec2 eps = vec2(0.006, 0.006);
    float hL = waterHeight(vUv - vec2(eps.x, 0.0), uTime);
    float hR = waterHeight(vUv + vec2(eps.x, 0.0), uTime);
    float hD = waterHeight(vUv - vec2(0.0, eps.y), uTime);
    float hU = waterHeight(vUv + vec2(0.0, eps.y), uTime);
    vec2 grad = vec2(hR - hL, hU - hD);

    // Calibrated organic displacement: gentle and crisp near waterline, soft liquid drift with depth
    float dispFactor = 0.005 + pow(depth, 1.35) * 0.018;
    vec2 waveDisp = vec2(grad.x * 0.95, grad.y * 0.45) * dispFactor;

    // Interactive mouse fluid ripples
    if (uMouseStrength > 0.005) {
      vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
      vec2 mDelta = (vUv - uMouse) * aspect;
      float mouseDist = length(mDelta);
      float ripple = sin(mouseDist * 28.0 - uTime * 4.5) * exp(-mouseDist * 4.5);
      waveDisp += normalize(mDelta + vec2(0.0001)) * ripple * 0.022 * uMouseStrength;
    }

    // Depth-dependent optical diffusion
    float blur = depth * 0.003;

    // Chromatic dispersion along fluid wave normals
    vec2 uvR = clamp(uv + waveDisp * 1.12, 0.001, 0.999);
    vec2 uvG = clamp(uv + waveDisp,        0.001, 0.999);
    vec2 uvB = clamp(uv + waveDisp * 0.88, 0.001, 0.999);

    // Multi-tap soft sampling for Texture A
    vec3 cRA = (texture2D(uTextureA, uvR).rgb * 0.6 +
                texture2D(uTextureA, uvR + vec2(0.0, blur)).rgb * 0.2 +
                texture2D(uTextureA, uvR - vec2(0.0, blur)).rgb * 0.2);
    vec3 cGA = (texture2D(uTextureA, uvG).rgb * 0.6 +
                texture2D(uTextureA, uvG + vec2(0.0, blur)).rgb * 0.2 +
                texture2D(uTextureA, uvG - vec2(0.0, blur)).rgb * 0.2);
    vec3 cBA = (texture2D(uTextureA, uvB).rgb * 0.6 +
                texture2D(uTextureA, uvB + vec2(0.0, blur)).rgb * 0.2 +
                texture2D(uTextureA, uvB - vec2(0.0, blur)).rgb * 0.2);
    vec3 colA = vec3(cRA.r, cGA.g, cBA.b);

    // Multi-tap soft sampling for Texture B
    vec3 cRB = (texture2D(uTextureB, uvR).rgb * 0.6 +
                texture2D(uTextureB, uvR + vec2(0.0, blur)).rgb * 0.2 +
                texture2D(uTextureB, uvR - vec2(0.0, blur)).rgb * 0.2);
    vec3 cGB = (texture2D(uTextureB, uvG).rgb * 0.6 +
                texture2D(uTextureB, uvG + vec2(0.0, blur)).rgb * 0.2 +
                texture2D(uTextureB, uvG - vec2(0.0, blur)).rgb * 0.2);
    vec3 cBB = (texture2D(uTextureB, uvB).rgb * 0.6 +
                texture2D(uTextureB, uvB + vec2(0.0, blur)).rgb * 0.2 +
                texture2D(uTextureB, uvB - vec2(0.0, blur)).rgb * 0.2);
    vec3 colB = vec3(cRB.r, cGB.g, cBB.b);

    // Realtime morph between A and B
    vec3 color = mix(colA, colB, uProgress);

    // Natural wave facet specular glint on water ripples
    vec3 normal = normalize(vec3(-grad.x * 2.5, -grad.y * 2.5, 1.0));
    vec3 lightDir = normalize(vec3(0.15, 0.85, 0.5));
    vec3 halfVec = normalize(lightDir + vec3(0.0, 0.0, 1.0));
    float specular = pow(max(0.0, dot(normal, halfVec)), 24.0);

    // Deep water absorption & ambient twilight tint
    vec3 waterDeepTint = vec3(0.02, 0.04, 0.07);
    color = mix(color, color * vec3(0.68, 0.86, 1.05) + waterDeepTint, depth * 0.55);
    color += vec3(0.88, 0.94, 1.0) * specular * 0.18 * (1.0 - depth * 0.4);

    // --- Organic Liquid Reflection Shape ---

    // 1. Wave-driven boundary displacement (calm, organic liquid edge)
    float waveErosion = snoise(vec2(vUv.y * 8.0 - uTime * 0.3, vUv.x * 4.0)) * 0.05 +
                        snoise(vec2(vUv.y * 18.0 + uTime * 0.45, vUv.x * 8.0)) * 0.025 +
                        grad.x * 0.20;

    // 2. Natural caustic light column / swath profile
    float nx = abs(vUv.x - 0.5) * 2.0; // 0.0 at center line, 1.0 at outer canvas edge
    float envelopeWidth = 0.82 + depth * 0.10 + waveErosion;
    float lateralFade = smoothstep(envelopeWidth, envelopeWidth * 0.30, nx);

    // 3. Gentle wave ribbon breakup: softly undulating horizontal water ribbons
    float waveFacet = 0.5 + 0.5 * sin(depth * 34.0 - uTime * 0.9 + grad.x * 12.0 + grad.y * 8.0);
    float ribbonMod = mix(1.0, 0.40 + waveFacet * 0.90, smoothstep(0.10, 0.60, depth));

    // 4. Smooth vertical contact and deep abyss decay
    float waterlineContact = smoothstep(0.0, 0.025, depth);
    float depthDissolve = smoothstep(0.95, 0.20, depth);

    // 5. Final combined organic fluid reflection opacity
    float alpha = lateralFade * ribbonMod * waterlineContact * depthDissolve * 0.80;

    gl_FragColor = vec4(color, alpha);
  }
`;

export const ProjectWaterReflection = React.forwardRef<
  ProjectWaterReflectionHandle,
  ProjectWaterReflectionProps
>(({ imageSrc, images = [], className = '' }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const texturesRef = useRef<THREE.Texture[]>([]);

  // Expose imperative real-time scroll scrub handler
  React.useImperativeHandle(ref, () => ({
    setProgress: (scrollProgress: number) => {
      const material = materialRef.current;
      const textures = texturesRef.current;
      if (!material || textures.length < 2) return;

      const v = Math.max(0, Math.min(scrollProgress * 2.0, 2.0));
      if (v < 1.0) {
        material.uniforms.uTextureA.value = textures[0];
        material.uniforms.uTextureB.value = textures[1];
        const t = Math.max(0, Math.min((v - 0.15) / 0.70, 1.0));
        material.uniforms.uProgress.value = t * t * (3 - 2 * t);
      } else {
        const localV = v - 1.0;
        material.uniforms.uTextureA.value = textures[1];
        material.uniforms.uTextureB.value = textures[2] || textures[1];
        const t = Math.max(0, Math.min((localV - 0.15) / 0.70, 1.0));
        material.uniforms.uProgress.value = t * t * (3 - 2 * t);
      }
    },
  }));

  // Fallback if individual imageSrc is passed
  useEffect(() => {
    if (!imageSrc || images.length > 0) return;
    const material = materialRef.current;
    if (!material) return;
    const loader = new THREE.TextureLoader();
    const tex = loader.load(imageSrc);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    material.uniforms.uTextureA.value = tex;
    material.uniforms.uTextureB.value = tex;
    material.uniforms.uProgress.value = 0;
  }, [imageSrc, images.length]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || typeof window === 'undefined') return;

    let isActive = true;
    let rafId = 0;
    const startTime = performance.now();

    // Preload textures
    const textureLoader = new THREE.TextureLoader();
    const imageList = images.length > 0 ? images : imageSrc ? [imageSrc] : [];
    const loadedTextures: THREE.Texture[] = imageList.map((src) => {
      // Uploaded on load rather than on first draw — the loop is paused
      // until Artifacts scrolls in, and a lazy upload there hitched.
      const t = textureLoader.load(src, (tex) => {
        if (isActive) renderer.initTexture(tex);
      });
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
      return t;
    });
    texturesRef.current = loadedTextures;

    const initialTex = loadedTextures[0] || new THREE.Texture();

    // Mouse tracking
    const mouse = { x: 0.5, y: 0.5, strength: 0 };

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      if (x >= -0.3 && x <= 1.3 && y >= -0.3 && y <= 1.3) {
        mouse.x = Math.max(0, Math.min(1, x));
        mouse.y = Math.max(0, Math.min(1, y));
        mouse.strength = Math.min(mouse.strength + 0.25, 1.0);
      }
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });

    // WebGL setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    renderer.setSize(container.clientWidth, container.clientHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        uTextureA: { value: initialTex },
        uTextureB: { value: loadedTextures[1] || initialTex },
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uMouseStrength: { value: 0 },
        uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
      },
    });
    materialRef.current = material;

    scene.add(new THREE.Mesh(geometry, material));

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        renderer.setSize(w, h);
        material.uniforms.uResolution.value.set(w, h);
      }
    };

    window.addEventListener('resize', handleResize);

    const render = () => {
      if (!isActive || paused) return;

      const elapsed = (performance.now() - startTime) * 0.001;
      material.uniforms.uTime.value = elapsed;
      material.uniforms.uMouse.value.set(mouse.x, mouse.y);
      material.uniforms.uMouseStrength.value = mouse.strength;
      mouse.strength *= 0.94;

      renderer.render(scene, camera);
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
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('resize', handleResize);
      materialRef.current = null;
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      texturesRef.current.forEach((t) => t.dispose());
      texturesRef.current = [];
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full pointer-events-none select-none block" />
    </div>
  );
});

ProjectWaterReflection.displayName = 'ProjectWaterReflection';
