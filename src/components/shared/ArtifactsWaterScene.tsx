'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
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
  varying vec2 vUv;

  void main() {
    vec2 texel = 1.0 / uResolution;
    float current = texture2D(uCurrent, vUv).r;
    float prev = texture2D(uPrev, vUv).r;

    float l = texture2D(uCurrent, vUv + vec2(-texel.x, 0.0)).r;
    float r = texture2D(uCurrent, vUv + vec2(texel.x, 0.0)).r;
    float t = texture2D(uCurrent, vUv + vec2(0.0, texel.y)).r;
    float b = texture2D(uCurrent, vUv + vec2(0.0, -texel.y)).r;

    // Damped leapfrog wave equation (Identical to HeroWaterRipple)
    float propagated = (l + r + t + b) * 0.5 - prev;
    float wave = mix(current, propagated, 0.5);
    wave *= 0.94;
    wave = clamp(wave, -1.0, 1.0);

    if (uVelocity > 0.0001) {
      float ripple = 0.0;
      for (float i = 0.0; i < 6.0; i++) {
        vec2 trailPos = mix(uPrevPoint, uPoint, i / 6.0);
        float d = distance(vUv, trailPos);
        ripple = max(ripple, pow(smoothstep(uRadius, 0.0, d), 2.0));
      }
      wave += ripple * uIntensity * min(uVelocity * 16.0, 1.0);
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
    vec3 normal = calcNormal(vUv, 14.0);
    float deviation = length(normal.xy);

    // Refraction of the underlying project scene
    vec2 refraction = normal.xy * uDistortion;
    vec2 uv = clamp(vUv + refraction, 0.001, 0.999);

    // Chromatic aberration (RGB channel separation along wave gradients)
    float aberration = uAberration * (abs(normal.x) + abs(normal.y));
    float rC = texture2D(uScene, uv + vec2(aberration, 0.0)).r;
    float gC = texture2D(uScene, uv).g;
    float bC = texture2D(uScene, uv - vec2(aberration, 0.0)).b;
    float aC = texture2D(uScene, vUv).a;

    vec3 color = vec3(rC, gC, bC);

    // Water surface specular highlight along wave crests
    float mask = smoothstep(0.04, 0.22, deviation);
    vec3 lightDir = normalize(vec3(0.4, 0.6, 1.0));
    float specular = pow(max(dot(normal, lightDir), 0.0), uSpecularPower) * uLightIntensity * mask;
    color += vec3(specular);

    gl_FragColor = vec4(color, aC);
  }
`;

function createRipplePipeline() {
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

  const sceneTarget = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  });

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
      uRadius: { value: 0.075 },
      uIntensity: { value: 0.36 },
    },
  });

  const compositeMaterial = new THREE.ShaderMaterial({
    vertexShader: quadVertexShader,
    fragmentShader: compositeFragmentShader,
    uniforms: {
      uScene: { value: null },
      uRipple: { value: null },
      uRippleResolution: { value: new THREE.Vector2(RIPPLE_RES, RIPPLE_RES) },
      uDistortion: { value: 0.024 },
      uAberration: { value: 0.003 },
      uLightIntensity: { value: 0.8 },
      uSpecularPower: { value: 28 },
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

function WaterSurfaceEffect() {
  const { gl, scene, camera, size } = useThree();
  const pointerRef = useRef({ x: 0.5, y: 0.5, prevX: 0.5, prevY: 0.5, velocity: 0 });
  const pingPongRef = useRef(0);

  const pipelineRef = useRef<ReturnType<typeof createRipplePipeline> | null>(null);
  if (pipelineRef.current === null) {
    pipelineRef.current = createRipplePipeline();
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = 1.0 - e.clientY / window.innerHeight;
      const dx = x - pointerRef.current.prevX;
      const dy = y - pointerRef.current.prevY;
      pointerRef.current.velocity = Math.sqrt(dx * dx + dy * dy);
      pointerRef.current.x = x;
      pointerRef.current.y = y;
    };

    const onClick = (e: MouseEvent) => {
      pointerRef.current.x = e.clientX / window.innerWidth;
      pointerRef.current.y = 1.0 - e.clientY / window.innerHeight;
      pointerRef.current.velocity = 0.75; // Splash wave impulse
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('click', onClick, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('click', onClick);
    };
  }, []);

  useEffect(() => {
    const { sceneTarget } = pipelineRef.current!;
    sceneTarget.setSize(gl.domElement.width, gl.domElement.height);
  }, [size, gl]);

  useFrame(() => {
    const {
      rippleTargets,
      sceneTarget,
      rippleScene,
      compositeScene,
      orthoCamera,
      rippleMaterial,
      compositeMaterial,
    } = pipelineRef.current!;

    const prevTarget = rippleTargets[pingPongRef.current];
    const currentTarget = rippleTargets[(pingPongRef.current + 1) % 3];
    const nextTarget = rippleTargets[(pingPongRef.current + 2) % 3];

    // Pass 1: Render project scene into offscreen target
    gl.setRenderTarget(sceneTarget);
    gl.render(scene, camera);

    // Pass 2: Step wave equation
    rippleMaterial.uniforms.uPrev.value = prevTarget.texture;
    rippleMaterial.uniforms.uCurrent.value = currentTarget.texture;
    rippleMaterial.uniforms.uPoint.value.set(pointerRef.current.x, pointerRef.current.y);
    rippleMaterial.uniforms.uPrevPoint.value.set(pointerRef.current.prevX, pointerRef.current.prevY);
    rippleMaterial.uniforms.uVelocity.value = pointerRef.current.velocity;

    gl.setRenderTarget(nextTarget);
    gl.render(rippleScene, orthoCamera);

    // Pass 3: Composite refraction onto screen
    compositeMaterial.uniforms.uScene.value = sceneTarget.texture;
    compositeMaterial.uniforms.uRipple.value = nextTarget.texture;

    gl.setRenderTarget(null);
    gl.render(compositeScene, orthoCamera);

    pointerRef.current.prevX = pointerRef.current.x;
    pointerRef.current.prevY = pointerRef.current.y;
    pointerRef.current.velocity *= 0.88;

    pingPongRef.current = (pingPongRef.current + 1) % 3;
  }, 1);

  return null;
}

// 4 Project Image Meshes laid out horizontally in 3D space
const SPACING = 5.2;

function HorizontalProjectGallery({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);

  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return [
      loader.load('/projects/forgeos.png'),
      loader.load('/projects/ecommerce.png'),
      loader.load('/projects/crypto.png'),
      loader.load('/projects/ai-platform.png'),
    ];
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    // Slide the 3D planes horizontally matching scroll progress
    const targetX = -progress * SPACING * 3;
    groupRef.current.position.x = targetX;
  });

  return (
    <group ref={groupRef}>
      {textures.map((tex, i) => (
        <mesh key={i} position={[i * SPACING, 0, 0]}>
          <planeGeometry args={[3.8, 2.4]} />
          <meshBasicMaterial map={tex} />
        </mesh>
      ))}
    </group>
  );
}

export function ArtifactsWaterScene({ progress }: { progress: number }) {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0">
      <Canvas
        gl={{ antialias: false, alpha: false }}
        camera={{ position: [0, 0, 4.2], fov: 36 }}
        className="w-full h-full"
      >
        <color attach="background" args={['#080808']} />
        <HorizontalProjectGallery progress={progress} />
        <WaterSurfaceEffect />
      </Canvas>
    </div>
  );
}
