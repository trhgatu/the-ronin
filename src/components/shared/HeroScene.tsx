'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useGLTF, useAnimations, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { HeroWaterRipple } from './HeroWaterRipple';
import { watchVisibility } from '@/lib/visibility';

const MODEL_PATH = '/models/laying_under_a_tree_with_pink_leaves_and_wind.glb';

// Dialed in via a temporary Leva GUI, then baked in here once settled.
const MODEL_POSITION: [number, number, number] = [-4.3, -5, -5];
const MODEL_ROTATION: [number, number, number] = [-1.52, -3.14, 0];
const MODEL_SCALE = 1.65;

// The source GLB (from Sketchfab) has no base-color texture for the leaves —
// the author's own note: "there is no files for leaves base color, I only
// set pink(#F87878) on Sketchfab" — so the pink itself is intentional, just
// flat/matte under our two plain directional lights (Sketchfab's own viewer
// lights every model with a studio HDRI, which is what gave its preview a
// glossier, more reflective look). Lowering roughness and adding a touch of
// metalness gives the same lights something to specular-highlight instead
// of trying to swap the color out (an <Environment> HDRI was tried for the
// reflections too, but drei's preset washed the whole canvas out to white
// even with `background={false}` — not worth chasing further here).
// The leaves' original #F87878 is a saturated candy pink that only ever
// appears alongside Hero's own muted, ink-wash palette (see the swap-mode
// colors in Hero.tsx) — swap that specific flat color for a duller, more
// faded rose so the model reads as part of the same "film stock" as the
// rest of the site instead of a brighter, separately-colored asset dropped
// on top of it.
const LEAF_COLOR = new THREE.Color('#F87878');
const LEAF_TINT = new THREE.Color('#b5645c');
// Same warm parchment as swap mode's own --background in Hero.tsx.
const SWAP_SCENE_BACKGROUND = new THREE.Color('#d9d2c2');

function addLeafSheen(scene: THREE.Object3D) {
  const seen = new Set<THREE.Material>();
  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if (!material || seen.has(material)) continue;
      seen.add(material);
      const std = material as THREE.MeshStandardMaterial;
      if (typeof std.roughness === 'number') std.roughness = Math.min(std.roughness, 0.45);
      if (typeof std.metalness === 'number') std.metalness = Math.max(std.metalness, 0.05);
      // A tolerance instead of an exact equals() — colors round-trip through
      // sRGB/linear conversion on GLTF load, so the in-memory value isn't
      // guaranteed to match a THREE.Color built fresh from the same hex.
      if (std.color) {
        const dr = std.color.r - LEAF_COLOR.r;
        const dg = std.color.g - LEAF_COLOR.g;
        const db = std.color.b - LEAF_COLOR.b;
        if (dr * dr + dg * dg + db * db < 0.01) std.color.copy(LEAF_TINT);
      }
    }
  });
}

function WindModel({ position, rotation, scale }: { position: [number, number, number]; rotation: [number, number, number]; scale: number }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL_PATH);
  const { actions } = useAnimations(animations, group);

  useMemo(() => addLeafSheen(scene), [scene]);

  useEffect(() => {
    const playing = Object.values(actions).map((action) => action?.reset().play());
    return () => { playing.forEach((action) => action?.stop()); };
  }, [actions]);

  return <primitive ref={group} object={scene} position={position} rotation={rotation} scale={scale} />;
}

// Controls the WebGL scene's own clear/background color instead of any DOM
// CSS variable. GlobalCanvas is `alpha: true` and fixed site-wide, so the
// earlier approach — overriding the *global* --background custom property
// while swap mode is on — wasn't scoped to Hero at all: every other
// section's own `bg-background` reads that same global variable, so
// scrolling into the next section while swap mode was active recolored it
// too (which read as "the 3D model is leaking into the next section", even
// though nothing there was actually transparent). Setting `scene.background`
// directly only affects what this canvas itself paints, leaving every DOM
// element's --background untouched — transparent (null) in default/veiled
// mode so the rest of the site is unaffected, opaque parchment only while
// swap mode is on and only wherever this canvas isn't otherwise covered by
// page content.
function SceneBackgroundController() {
  const { scene } = useThree();

  useEffect(() => {
    const onSwapMode = (e: Event) => {
      scene.background = (e as CustomEvent<boolean>).detail ? SWAP_SCENE_BACKGROUND : null;
    };
    window.addEventListener('hero-swap-mode', onSwapMode);
    return () => window.removeEventListener('hero-swap-mode', onSwapMode);
  }, [scene]);

  return null;
}

function WaterRippleController() {
  // Hero.tsx's swap mode lives outside this persistent, app-wide canvas
  // (GlobalCanvas mounts HeroScene once at the layout root), so it's
  // communicated in the same way the site's ink-wash transition already
  // crosses that boundary: a plain window CustomEvent. A ref (not React
  // state) so toggling it never forces this component — or the ripple's
  // per-frame render loop reading it — to re-render.
  const enabledRef = useRef(false);

  useEffect(() => {
    const onSwapMode = (e: Event) => {
      enabledRef.current = (e as CustomEvent<boolean>).detail;
    };
    window.addEventListener('hero-swap-mode', onSwapMode);
    return () => window.removeEventListener('hero-swap-mode', onSwapMode);
  }, []);

  return <HeroWaterRipple enabledRef={enabledRef} />;
}

export function HeroScene() {
  // This canvas is fixed behind the whole page, but every section after Hero
  // paints an opaque background over it — it was rendering the 39MB model,
  // the HDRI lighting and the ripple composite every frame for a scene only
  // Hero ever shows. Stop the frameloop whenever Hero is out of view.
  const [heroVisible, setHeroVisible] = useState(true);
  useEffect(() => {
    const hero = document.getElementById('hero');
    if (!hero) return;
    return watchVisibility(hero, setHeroVisible, '50% 0px');
  }, []);

  return (
    <Canvas
      frameloop={heroVisible ? 'always' : 'never'}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 1.3, 4.4], fov: 32 }}
      className="!absolute inset-0"
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 2]} intensity={1.3} />
      <directionalLight position={[-4, 2, -3]} intensity={0.4} />
      <Suspense fallback={null}>
        <WindModel position={MODEL_POSITION} rotation={MODEL_ROTATION} scale={MODEL_SCALE} />
        {/* A local HDRI (not one of drei's preset CDN environments, which
            washed the canvas out to flat white even with background={false}
            — see addLeafSheen above) gives the leaves' lowered-roughness
            surfaces something moodier to reflect than the two flat
            directional lights alone. */}
        <Environment files="/models/qwantani_night_puresky_2k.hdr" background={false} environmentIntensity={0.6} />
      </Suspense>
      <WaterRippleController />
      <SceneBackgroundController />
    </Canvas>
  );
}

useGLTF.preload(MODEL_PATH);
