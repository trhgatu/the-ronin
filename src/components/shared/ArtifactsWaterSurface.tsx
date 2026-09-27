'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

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
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 texel = 1.0 / uResolution;
    float current = texture2D(uCurrent, vUv).r;
    float prev = texture2D(uPrev, vUv).r;

    float l = texture2D(uCurrent, vUv + vec2(-texel.x, 0.0)).r;
    float r = texture2D(uCurrent, vUv + vec2(texel.x, 0.0)).r;
    float t = texture2D(uCurrent, vUv + vec2(0.0, texel.y)).r;
    float b = texture2D(uCurrent, vUv + vec2(0.0, -texel.y)).r;

    // Damped leapfrog wave equation with silky fluid decay
    float propagated = (l + r + t + b) * 0.5 - prev;
    float wave = mix(current, propagated, 0.5);
    wave *= 0.96; // Silkier, longer-lasting fluid ripple rings
    wave = clamp(wave, -1.0, 1.0);

    // Continuous hydrodynamic wake injection with smooth velocity falloff
    if (uVelocity > 0.0001) {
      float ripple = 0.0;
      for (float i = 0.0; i < 8.0; i++) {
        vec2 trailPos = mix(uPrevPoint, uPoint, i / 8.0);
        float d = distance(vUv, trailPos);
        float dynRadius = mix(uRadius * 0.85, uRadius * 1.35, min(uVelocity * 7.0, 1.0));
        ripple = max(ripple, pow(smoothstep(dynRadius, 0.0, d), 1.8));
      }
      wave += ripple * uIntensity * min(uVelocity * 16.0, 1.0);
    }

    // Gentle ambient micro-swells (water breathes continuously, never dead frozen)
    float ambient = sin(vUv.x * 14.0 + uTime * 1.4) * cos(vUv.y * 12.0 + uTime * 1.8) * 0.0016;
    wave += ambient;

    gl_FragColor = vec4(wave, wave, wave, 1.0);
  }
`;

const compositeFragmentShader = `
  uniform sampler2D uVideo;
  uniform sampler2D uRipple;
  uniform vec2 uResolution;
  uniform vec2 uVideoResolution;
  uniform vec2 uRippleResolution;
  uniform float uDistortion;
  uniform float uAberration;
  uniform float uLightIntensity;
  uniform float uSpecularPower;
  uniform float uTime;
  varying vec2 vUv;

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

  // Cover aspect ratio mapping rotated horizontally (-90 deg counter-clockwise)
  vec2 getCoverRotatedUv(vec2 uv) {
    float screenAspect = uResolution.x / uResolution.y;
    // Native video is 720x1224. Rotated horizontally it is 1224x720 (~1.70)
    float videoAspect = uVideoResolution.y / uVideoResolution.x;
    vec2 scale = vec2(1.0);
    if (screenAspect > videoAspect) {
      scale.y = videoAspect / screenAspect;
    } else {
      scale.x = screenAspect / videoAspect;
    }
    vec2 covered = (uv - 0.5) * scale + 0.5;

    // Rotate UV +90 degrees (180 deg opposite from previous orientation)
    vec2 rotated = vec2(covered.y, 1.0 - covered.x);
    return clamp(rotated, 0.001, 0.999);
  }

  void main() {
    vec3 normal = calcNormal(vUv, 13.5);
    float deviation = length(normal.xy);

    // True optical refraction displacing the background fluid video
    vec2 refraction = normal.xy * uDistortion;
    vec2 uv = clamp(vUv + refraction, 0.001, 0.999);
    vec2 uvG = getCoverRotatedUv(uv);

    // Texture unsharp masking to restore razor-sharp ink edges & detail
    vec2 texel = 1.0 / uVideoResolution;
    vec3 centerColor = texture2D(uVideo, uvG).rgb;
    vec3 neighborBlur = (
      texture2D(uVideo, uvG + vec2(texel.x, 0.0)).rgb +
      texture2D(uVideo, uvG - vec2(texel.x, 0.0)).rgb +
      texture2D(uVideo, uvG + vec2(0.0, texel.y)).rgb +
      texture2D(uVideo, uvG - vec2(0.0, texel.y)).rgb
    ) * 0.25;
    vec3 color = centerColor + (centerColor - neighborBlur) * 0.85;

    // 360-degree chromatic dispersion along true surface normal gradient (only active on wave ripples)
    if (deviation > 0.025) {
      vec2 disp = normal.xy * (uAberration * smoothstep(0.025, 0.16, deviation));
      vec2 uvR = getCoverRotatedUv(clamp(uv + disp, 0.001, 0.999));
      vec2 uvB = getCoverRotatedUv(clamp(uv - disp, 0.001, 0.999));
      color.r = texture2D(uVideo, uvR).r;
      color.b = texture2D(uVideo, uvB).b;
    }

    // Deep ink tone mapping: boost clarity, remove washed-out milky haze
    color = pow(max(color, vec3(0.0)), vec3(1.18));
    color = clamp(color * 1.12, 0.0, 1.0);

    // Fresnel water sheen on wave slopes
    float fresnel = pow(clamp(1.0 - normal.z, 0.0, 1.0), 3.0);
    color += vec3(0.08, 0.14, 0.22) * fresnel * 0.85;

    // Dual-specular glints: sharp sun highlight + soft ambient skylight
    float mask = smoothstep(0.035, 0.18, deviation);
    vec3 sunDir = normalize(vec3(0.5, 0.6, 1.0));
    vec3 skyDir = normalize(vec3(-0.4, 0.8, 0.8));

    float specSharp = pow(max(dot(normal, sunDir), 0.0), uSpecularPower) * uLightIntensity * 1.35;
    float specSoft = pow(max(dot(normal, skyDir), 0.0), 12.0) * (uLightIntensity * 0.4);
    color += vec3(specSharp + specSoft) * mask;

    // Fluid caustics concentration on ripple crests
    float caustics = smoothstep(0.07, 0.22, deviation) * 0.1;
    color += vec3(caustics);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function ArtifactsWaterSurface({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || typeof window === 'undefined') return;

    let isActive = true;
    let rafId = 0;

    // Create hidden background video element for WebGL VideoTexture
    const video = document.createElement('video');
    video.src = '/video/musashi-fluid-loop-web.mp4';
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.play().catch(() => {});
    videoRef.current = video;

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBAFormat;
    videoTexture.generateMipmaps = false;

    // Pointer state tracking matching HeroWaterRipple exact velocity computation
    const pointer = { x: 0.5, y: 0.5, prevX: 0.5, prevY: 0.5, clickImpulse: 0 };

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      pointer.x = (e.clientX - rect.left) / rect.width;
      pointer.y = 1.0 - (e.clientY - rect.top) / rect.height;
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = (e.clientX - rect.left) / rect.width;
      pointer.y = 1.0 - (e.clientY - rect.top) / rect.height;
      pointer.clickImpulse = 0.65; // Water drop splash impulse
    };

    container.addEventListener('mousemove', onPointerMove, { passive: true });
    container.addEventListener('click', onClick, { passive: true });

    // WebGL Renderer setup with crisp DPR support
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: false,
      antialias: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    renderer.setSize(container.clientWidth, container.clientHeight);

    const targetOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
    };

    const rippleTargets = [
      new THREE.WebGLRenderTarget(RIPPLE_RES, RIPPLE_RES, targetOptions),
      new THREE.WebGLRenderTarget(RIPPLE_RES, RIPPLE_RES, targetOptions),
      new THREE.WebGLRenderTarget(RIPPLE_RES, RIPPLE_RES, targetOptions),
    ];

    const orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quadGeo = new THREE.PlaneGeometry(2, 2);

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
        uRadius: { value: 0.075 },
        uIntensity: { value: 0.38 },
        uTime: { value: 0 },
      },
    });

    const compositeMaterial = new THREE.ShaderMaterial({
      vertexShader: quadVertexShader,
      fragmentShader: compositeFragmentShader,
      uniforms: {
        uVideo: { value: videoTexture },
        uRipple: { value: null },
        uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
        uVideoResolution: { value: new THREE.Vector2(720, 1224) },
        uRippleResolution: { value: new THREE.Vector2(RIPPLE_RES, RIPPLE_RES) },
        uDistortion: { value: 0.018 },
        uAberration: { value: 0.0022 },
        uLightIntensity: { value: 0.65 },
        uSpecularPower: { value: 36.0 },
        uTime: { value: 0 },
      },
    });

    video.addEventListener('loadedmetadata', () => {
      if (video.videoWidth && video.videoHeight) {
        compositeMaterial.uniforms.uVideoResolution.value.set(video.videoWidth, video.videoHeight);
      }
    });

    const rippleScene = new THREE.Scene();
    rippleScene.add(new THREE.Mesh(quadGeo, rippleMaterial));

    const compositeScene = new THREE.Scene();
    compositeScene.add(new THREE.Mesh(quadGeo, compositeMaterial));

    let pingPong = 0;
    const startTime = performance.now();

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      compositeMaterial.uniforms.uResolution.value.set(w, h);
    };
    window.addEventListener('resize', handleResize);

    const render = () => {
      if (!isActive) return;

      const elapsedTime = (performance.now() - startTime) * 0.001;
      rippleMaterial.uniforms.uTime.value = elapsedTime;
      compositeMaterial.uniforms.uTime.value = elapsedTime;

      const prevTarget = rippleTargets[pingPong];
      const currentTarget = rippleTargets[(pingPong + 1) % 3];
      const nextTarget = rippleTargets[(pingPong + 2) % 3];

      // Instantaneous pointer velocity matching HeroWaterRipple
      const dx = pointer.x - pointer.prevX;
      const dy = pointer.y - pointer.prevY;
      const velocity = Math.sqrt(dx * dx + dy * dy);

      const effectiveVelocity = pointer.clickImpulse > 0 ? pointer.clickImpulse : velocity;
      if (pointer.clickImpulse > 0) pointer.clickImpulse *= 0.84;

      // Pass 1: Step wave equation
      rippleMaterial.uniforms.uPrev.value = prevTarget.texture;
      rippleMaterial.uniforms.uCurrent.value = currentTarget.texture;
      rippleMaterial.uniforms.uPoint.value.set(pointer.x, pointer.y);
      rippleMaterial.uniforms.uPrevPoint.value.set(pointer.prevX, pointer.prevY);
      rippleMaterial.uniforms.uVelocity.value = effectiveVelocity;

      renderer.setRenderTarget(nextTarget);
      renderer.render(rippleScene, orthoCamera);

      // Pass 2: Refract video texture through wave normals & add specular glints
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        videoTexture.needsUpdate = true;
      }
      compositeMaterial.uniforms.uRipple.value = nextTarget.texture;
      renderer.setRenderTarget(null);
      renderer.render(compositeScene, orthoCamera);

      pointer.prevX = pointer.x;
      pointer.prevY = pointer.y;

      pingPong = (pingPong + 1) % 3;
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      isActive = false;
      cancelAnimationFrame(rafId);
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('click', onClick);
      window.removeEventListener('resize', handleResize);

      video.pause();
      video.src = '';
      videoTexture.dispose();
      rippleTargets.forEach((t) => t.dispose());
      quadGeo.dispose();
      rippleMaterial.dispose();
      compositeMaterial.dispose();
      renderer.dispose();
    };
  }, [containerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-0"
    />
  );
}
