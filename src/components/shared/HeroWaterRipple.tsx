'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// A ripple height field (ping-pong wave equation, same idea as a fluid
// sim's velocity/dye buffers but reduced to just a scalar wave) driven by
// cursor position+velocity, then used as a normal map to refract the
// already-rendered 3D scene — chromatic aberration and a specular glint
// riding along the normal, exactly the recipe a WebGL "water distortion"
// cursor effect uses on a static image, except the "image" here is this
// frame's real render of HeroScene (captured to a texture first) so the
// model itself visibly ripples instead of a flat picture of it.
const RIPPLE_RES = 256;

const quadVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const rippleFragmentShader = `
  uniform sampler2D uPrev;
  uniform sampler2D uCurrent;
  uniform vec2 uResolution;
  uniform vec2 uPoint;
  uniform vec2 uPrevPoint;
  uniform float uVelocity;
  uniform float uRadius;
  uniform float uIntensity;
  varying vec2 vUv;

  void main() {
    vec2 texel = 1.0 / uResolution;
    float current = texture2D(uCurrent, vUv).r;
    float prev = texture2D(uPrev, vUv).r;

    float l = texture2D(uCurrent, vUv + vec2(-texel.x, 0.0)).r;
    float r = texture2D(uCurrent, vUv + vec2(texel.x, 0.0)).r;
    float t = texture2D(uCurrent, vUv + vec2(0.0, texel.y)).r;
    float b = texture2D(uCurrent, vUv + vec2(0.0, -texel.y)).r;

    // Damped leapfrog wave equation — the mix() against the un-propagated
    // current value is what keeps this from ringing into high-frequency
    // checkerboard noise under continuous forcing (a bare "neighbors*2 -
    // prev" with only a slow multiplicative decay accumulates energy faster
    // than it can dissipate once the pointer moves quickly/often, and the
    // sim diverges into visible static).
    float propagated = (l + r + t + b) * 0.5 - prev;
    float wave = mix(current, propagated, 0.5);
    wave *= 0.93;
    wave = clamp(wave, -1.0, 1.0);

    if (uVelocity > 0.0001) {
      float ripple = 0.0;
      for (float i = 0.0; i < 6.0; i++) {
        vec2 trailPos = mix(uPrevPoint, uPoint, i / 6.0);
        float d = distance(vUv, trailPos);
        ripple = max(ripple, pow(smoothstep(uRadius, 0.0, d), 2.0));
      }
      wave += ripple * uIntensity * min(uVelocity * 14.0, 1.0);
    }

    gl_FragColor = vec4(wave, wave, wave, 1.0);
  }
`;

const compositeFragmentShader = `
  uniform sampler2D uScene;
  uniform sampler2D uRipple;
  uniform vec2 uRippleResolution;
  uniform float uDistortion;
  uniform float uAberration;
  uniform float uLightIntensity;
  uniform float uSpecularPower;
  varying vec2 vUv;

  // Rendering the scene into our own off-screen target (instead of straight
  // to the canvas) makes three.js write it in linear space instead of
  // encoding to the renderer's sRGB output — that encode normally happens
  // once, automatically, only on the final render to the canvas. Sampling
  // those linear values and writing them straight to gl_FragColor here skips
  // that encode entirely, which is what was crushing the model's pastel pink
  // leaves into a much more saturated red. Same formula three.js itself uses
  // (LinearTosRGB in its ShaderChunk), applied once, right before output.
  vec3 linearToSRGB(vec3 value) {
    vec3 lo = value * 12.92;
    vec3 hi = pow(max(value, vec3(0.0)), vec3(1.0 / 2.4)) * 1.055 - 0.055;
    return mix(lo, hi, step(vec3(0.0031308), value));
  }

  vec3 calcNormal(vec2 uv, float strength) {
    vec2 texel = 1.0 / uRippleResolution;
    float l = texture2D(uRipple, uv + vec2(-texel.x, 0.0)).r;
    float r = texture2D(uRipple, uv + vec2(texel.x, 0.0)).r;
    float t = texture2D(uRipple, uv + vec2(0.0, texel.y)).r;
    float b = texture2D(uRipple, uv + vec2(0.0, -texel.y)).r;
    vec3 n;
    n.x = (l - r) * strength;
    n.y = (b - t) * strength;
    n.z = 1.0;
    return normalize(n);
  }

  void main() {
    vec3 normal = calcNormal(vUv, 12.0);
    float deviation = length(normal.xy);

    vec2 refraction = normal.xy * uDistortion;
    vec2 uv = clamp(vUv + refraction, 0.001, 0.999);

    float aberration = uAberration * (abs(normal.x) + abs(normal.y));
    float rC = texture2D(uScene, uv + vec2(aberration, 0.0)).r;
    float gC = texture2D(uScene, uv).g;
    float bC = texture2D(uScene, uv - vec2(aberration, 0.0)).b;
    float aC = texture2D(uScene, vUv).a;

    vec3 color = vec3(rC, gC, bC);

    // Only light up where there's an actual ripple, same masking trick as
    // the reference water-distortion shader — keeps the model glass-flat
    // and unlit everywhere the cursor hasn't touched. A tighter lower bound
    // than the reference (which reads a clean displacement texture) keeps
    // this from catching the low-level numerical jitter always present in
    // a live simulation.
    float mask = smoothstep(0.05, 0.22, deviation);
    vec3 lightDir = normalize(vec3(0.5, 0.5, 1.0));
    float specular = pow(max(dot(normal, lightDir), 0.0), uSpecularPower) * uLightIntensity * mask;
    color += vec3(specular);

    gl_FragColor = vec4(linearToSRGB(color), aC);
  }
`;

function createResources() {
  const options = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.HalfFloatType,
  };
  const rippleTargets = [
    new THREE.WebGLRenderTarget(RIPPLE_RES, RIPPLE_RES, options),
    new THREE.WebGLRenderTarget(RIPPLE_RES, RIPPLE_RES, options),
    new THREE.WebGLRenderTarget(RIPPLE_RES, RIPPLE_RES, options),
  ];
  const sceneTarget = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  const rippleScene = new THREE.Scene();
  const compositeScene = new THREE.Scene();
  const orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadGeometry = new THREE.PlaneGeometry(2, 2);

  const rippleMaterial = new THREE.ShaderMaterial({
    vertexShader: quadVertexShader,
    fragmentShader: rippleFragmentShader,
    uniforms: {
      uPrev: { value: null },
      uCurrent: { value: null },
      uResolution: { value: new THREE.Vector2(RIPPLE_RES, RIPPLE_RES) },
      uPoint: { value: new THREE.Vector2(0.5, 0.5) },
      uPrevPoint: { value: new THREE.Vector2(0.5, 0.5) },
      uVelocity: { value: 0 },
      uRadius: { value: 0.07 },
      uIntensity: { value: 0.34 },
    },
  });

  const compositeMaterial = new THREE.ShaderMaterial({
    vertexShader: quadVertexShader,
    fragmentShader: compositeFragmentShader,
    transparent: true,
    uniforms: {
      uScene: { value: null },
      uRipple: { value: null },
      uRippleResolution: { value: new THREE.Vector2(RIPPLE_RES, RIPPLE_RES) },
      uDistortion: { value: 0.015 },
      uAberration: { value: 0.0015 },
      uLightIntensity: { value: 0.5 },
      uSpecularPower: { value: 32 },
    },
  });

  rippleScene.add(new THREE.Mesh(quadGeometry, rippleMaterial));
  compositeScene.add(new THREE.Mesh(quadGeometry, compositeMaterial));

  return {
    rippleTargets,
    sceneTarget,
    rippleScene,
    compositeScene,
    orthoCamera,
    quadGeometry,
    rippleMaterial,
    compositeMaterial,
  };
}

export function HeroWaterRipple({ enabledRef }: { enabledRef: React.RefObject<boolean> }) {
  const { gl, scene, camera, size } = useThree();

  const pointerRef = useRef({ x: 0.5, y: 0.5 });
  const prevPointerRef = useRef({ x: 0.5, y: 0.5 });
  const pingPongRef = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pointerRef.current.x = e.clientX / window.innerWidth;
      pointerRef.current.y = 1.0 - e.clientY / window.innerHeight;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // A ref (not useMemo) because every one of these three.js objects is
  // mutated imperatively every frame below (uniform values, render target
  // contents) — the kind of ongoing mutation useMemo's "compute once, treat
  // as immutable" contract isn't meant for. Lazily constructed on first
  // render (checked, not read, here — every actual use of `.current` below
  // happens inside an effect or useFrame callback, never during render).
  const resourcesRef = useRef<ReturnType<typeof createResources> | null>(null);
  if (resourcesRef.current === null) {
    resourcesRef.current = createResources();
  }

  useEffect(() => {
    const { sceneTarget } = resourcesRef.current!;
    sceneTarget.setSize(gl.domElement.width, gl.domElement.height);
     
  }, [size, gl]);

  useEffect(() => {
    const { rippleTargets } = resourcesRef.current!;
    rippleTargets.forEach((rt) => {
      gl.setRenderTarget(rt);
      gl.clearColor();
    });
    gl.setRenderTarget(null);
     
  }, [gl]);

  useEffect(() => {
    return () => {
      const { rippleTargets, sceneTarget, quadGeometry, rippleMaterial, compositeMaterial } = resourcesRef.current!;
      rippleTargets.forEach((rt) => rt.dispose());
      sceneTarget.dispose();
      quadGeometry.dispose();
      rippleMaterial.dispose();
      compositeMaterial.dispose();
    };
     
  }, []);

  // Priority > 0 hands R3F's own auto-render off to us so we can render the
  // scene to a texture first, then composite it through the ripple — see
  // https://r3f.docs.pmnd.rs/api/hooks#taking-over-the-render-loop.
  useFrame(() => {
    const { rippleTargets, sceneTarget, rippleScene, compositeScene, orthoCamera, rippleMaterial, compositeMaterial } =
      resourcesRef.current!;

    const dx = pointerRef.current.x - prevPointerRef.current.x;
    const dy = pointerRef.current.y - prevPointerRef.current.y;
    const velocity = Math.sqrt(dx * dx + dy * dy);
    const active = enabledRef.current;

    const current = pingPongRef.current;
    const prev = (current + 2) % 3;
    const next = (current + 1) % 3;

    rippleMaterial.uniforms.uPrev.value = rippleTargets[prev].texture;
    rippleMaterial.uniforms.uCurrent.value = rippleTargets[current].texture;
    rippleMaterial.uniforms.uPoint.value.set(pointerRef.current.x, pointerRef.current.y);
    rippleMaterial.uniforms.uPrevPoint.value.set(prevPointerRef.current.x, prevPointerRef.current.y);
    rippleMaterial.uniforms.uVelocity.value = active ? velocity : 0;

    gl.setRenderTarget(rippleTargets[next]);
    gl.render(rippleScene, orthoCamera);
    pingPongRef.current = next;

    prevPointerRef.current.x = pointerRef.current.x;
    prevPointerRef.current.y = pointerRef.current.y;

    gl.setRenderTarget(sceneTarget);
    gl.clear();
    gl.render(scene, camera);

    compositeMaterial.uniforms.uScene.value = sceneTarget.texture;
    compositeMaterial.uniforms.uRipple.value = rippleTargets[next].texture;

    gl.setRenderTarget(null);
    gl.clear();
    gl.render(compositeScene, orthoCamera);
  }, 1);

  return null;
}
