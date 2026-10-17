import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { useNavigate } from 'react-router-dom';
import { Accent } from '../types';
import { JOURNEY, PROJECTS_DATA, SKILLS_GROUPED } from '../data/portfolio';
import { useDarkMode } from './ui';

/*
 * The whole home page is one 3D world. A road runs through five districts and the
 * camera drives along it as the page scrolls. Each district owns a slice of the road
 * (tStart..tEnd) and a DOM section; the section's scroll position maps onto its slice.
 *
 * Everything that repeats (trees, bushes, rocks, flowers, fields, dashes, fence posts)
 * is an InstancedMesh, so the whole countryside is a few dozen draw calls.
 */

export const DISTRICTS = {
  hero: [0, 0.07],
  journey: [0.07, 0.5],
  skills: [0.5, 0.67],
  projects: [0.67, 0.9],
  contact: [0.9, 1],
} as const;
export type DistrictKey = keyof typeof DISTRICTS;
const KEYS = Object.keys(DISTRICTS) as DistrictKey[];

export const FEATURED = PROJECTS_DATA.filter((p) => p.is_featured);
export const SKILL_GROUPS = Object.entries(SKILLS_GROUPED);
const STOPS = JOURNEY.length;

export type Hover = { kind: 'stop' | 'skill' | 'project'; index: number } | null;
export type Locals = Record<DistrictKey, number> & { t: number };

interface WorldApi {
  stop: number;
  skill: number;
  project: number;
  hovered: Hover;
  setHovered: (h: Hover) => void;
  register: (key: DistrictKey, el: HTMLElement | null) => void;
  scrollToLocal: (key: DistrictKey, p: number) => void;
  /** Called every animation frame with the scroll position inside each district (0..1). */
  subscribe: (cb: (l: Locals) => void) => () => void;
}

const Ctx = createContext<WorldApi | null>(null);
export const useWorld = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useWorld must be used inside <World>');
  return ctx;
};

// ─── Palette: a sunny countryside, and the same place at night ───

export type Kind = 'home' | 'school' | 'campus' | 'office' | 'tower' | 'hospital' | 'lab' | 'sign' | 'mailbox';

export const PALETTE = {
  light: {
    zenith: 0x3f8fe0, horizon: 0xdcecf8, fog: 0xdcecf8,
    sunColor: 0xfff0cf, sunDisc: 0xfff6dc, sunGlow: 1.0, sunI: 2.2,
    fillColor: 0xdfe9ff, fillI: 0.55, hemiSky: 0xbfdcff, hemiGround: 0x6f8f55, hemiI: 0.95,
    ground: 0x7cae62, field: [0x6a9f52, 0x90bf70, 0xd9b868, 0xb9ca7c, 0x86b25f, 0x9ec56c],
    mountain: 0x8fb3c7, snow: 0xf1f5f8,
    road: 0x4b4c55, dash: 0xf2f2ea, kerb: 0xd9d5c8, line: 0xf7f7f2,
    trunk: 0x6b4a2f, leaf: [0x3f8f3a, 0x55a24a, 0x2f7a35, 0x8fbf4f, 0x4a9a52, 0xe08a2e, 0xd25a2a],
    bush: 0x4c9a45, rock: 0x9a9a92, plot: 0xd2c7ab, path: 0xcdbf9e, fence: 0xb08a5a,
    flower: [0xff5e7a, 0xffd166, 0xfdfdfd, 0xb388ff],
    glass: 0xa9d2ea, glow: 0x000000, cloud: 0xffffff, water: 0x4ea3d6, ripple: 0xeaf6ff,
    car: 0xd7263d, lamp: 0x5a5a60, bulb: 0xfff2c9, heli: [0xd7263d, 0xf7f3ea],
    balloon: [0xd7263d, 0xf4d35e, 0x2a9d8f],
    kinds: {
      home: [0xf3e9d2, 0xa33f2b], school: [0xb5533c, 0x4a4a52], campus: [0xf2e8d8, 0xc9623a],
      office: [0x6f93b8, 0x2f4a66], tower: [0xe9e2d5, 0x3c6fb0], hospital: [0xf7f7f5, 0xd63b3b],
      lab: [0x8b949e, 0x2a9d8f], sign: [0x7a4a2a, 0xf3e9d2], mailbox: [0x2d5fa6, 0xf3e9d2],
    } as Record<Kind, [number, number]>,
  },
  dark: {
    zenith: 0x0b1636, horizon: 0x33467a, fog: 0x26365e,
    sunColor: 0xc9d6ff, sunDisc: 0xf3f1e6, sunGlow: 0.55, sunI: 0.9,
    fillColor: 0x8a9ad0, fillI: 0.5, hemiSky: 0x5068a8, hemiGround: 0x1c2a1c, hemiI: 1.05,
    ground: 0x26482f, field: [0x1b3323, 0x27432d, 0x3d3a22, 0x2c3f24, 0x213a26, 0x2a4428],
    mountain: 0x1b2742, snow: 0x5a6a8a,
    road: 0x1e2026, dash: 0x9a9a90, kerb: 0x3a3a3c, line: 0xa8a8a0,
    trunk: 0x3a2a1c, leaf: [0x1f4d26, 0x2a5e30, 0x173d1e, 0x3f6b2a, 0x234f28, 0x7a4a1c, 0x6e3418],
    bush: 0x24502a, rock: 0x4a4a48, plot: 0x3a3528, path: 0x34302a, fence: 0x5a4630,
    flower: [0x8a3344, 0x8a7238, 0x8a8a88, 0x5e4a8a],
    glass: 0xffd27a, glow: 0xffb347, cloud: 0x46507a, water: 0x1c3f5c, ripple: 0x7fb3d6,
    car: 0xd7263d, lamp: 0x3a3a40, bulb: 0xfff2c9, heli: [0x8f1f2c, 0x9a958c],
    balloon: [0x8f1f2c, 0xa38c3a, 0x1f6b62],
    kinds: {
      home: [0x6e6652, 0x5a2a20], school: [0x6a3426, 0x2a2a30], campus: [0x6e6555, 0x6b3a22],
      office: [0x3a5068, 0x1f2f45], tower: [0x6a655c, 0x27497a], hospital: [0x6f6f6d, 0x8f2c2c],
      lab: [0x4a5058, 0x1f6b62], sign: [0x4a2e1a, 0x6e6652], mailbox: [0x1f3f6e, 0x6e6652],
    } as Record<Kind, [number, number]>,
  },
};
export type Palette = typeof PALETTE.light;

const ACCENT_HEX: Record<Accent, number> = { saffron: 0xf26b1d, amber: 0xf5a623, coral: 0xff5e3a, rose: 0xe8457a };
const CONTAINER = [0xd7263d, 0x2a9d8f, 0x3c6fb0, 0xf4a300, 0x8e6c3a];

// Road through the whole world, left to right. A little extra at both ends so it never looks cut off.
const ROAD_POINTS = [
  [-16, 0, 6], [-6, 0, 4], [0, 0, 1], [6, 0, 5], [12, 0, 0], [18, 0, 4], [24, 0, -1], [30, 0, 3], [36, 0, -2],
  [42, 0, 3], [48, 0, 0], [54, 0, 4], [60, 0, 0], [66, 0, 3], [72, 0, -1], [78, 0, 2], [84, 0, 0], [92, 0, 2], [102, 0, -1],
].map(([x, y, z]) => new THREE.Vector3(x, y, z));

// Where the light comes from (ahead-left of the camera, fairly high so shadows stay readable)...
const SUN_DIR = new THREE.Vector3(-0.95, 0.62, -0.55).normalize();
// ...and where the sun is drawn: same bearing, low over the hills so it sits inside the sky band
export const SKY_SUN_DIR = new THREE.Vector3(-0.95, 0.067, -0.55).normalize();

const STOP_KINDS: Kind[] = ['school', 'campus', 'office', 'tower', 'hospital', 'lab', 'sign'];

export const seeded = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lerpT = (range: readonly [number, number], p: number) => range[0] + (range[1] - range[0]) * p;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const shade = (hex: number, k: number) => new THREE.Color(hex).multiplyScalar(k).getHex();
/** Frame-rate independent easing factor: the share of the distance closed per frame at 60fps. */
const ease = (perFrame: number, dt: number) => 1 - Math.pow(1 - perFrame, dt * 60);

// ─── Builders ───

type Mat = THREE.MeshStandardMaterial;
export const mat = (color: number, rough = 0.85): Mat => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: rough, metalness: 0.02 });

export const box = (w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

/** Soft radial glow for sprites (sun, moon). */
export const glowTexture = (core: string, mid: string) => {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, core);
  g.addColorStop(0.18, core);
  g.addColorStop(0.42, mid);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

export const buildKind = (kind: Kind, p: Palette, dark: boolean) => {
  const g = new THREE.Group();
  const [wallHex, trimHex] = p.kinds[kind];
  const wall = mat(wallHex);
  const wallDark = mat(shade(wallHex, 0.75));
  const trim = mat(trimHex);
  const glass = new THREE.MeshStandardMaterial({
    color: p.glass, flatShading: true, roughness: 0.3, metalness: 0.1,
    emissive: p.glow, emissiveIntensity: dark ? 1.1 : 0,
  });
  let height = 2;
  const windows = (xs: number[], ys: number[], z: number, w = 0.4, h = 0.3) =>
    ys.forEach((y) => xs.forEach((x) => g.add(box(w, h, 0.06, glass, x, y, z))));

  switch (kind) {
    case 'home':
      g.add(box(2.2, 1.2, 1.8, wall));
      g.add(box(2.5, 0.3, 2.1, trim, 0, 1.2));
      g.add(box(1.6, 0.3, 1.4, trim, 0, 1.5));
      g.add(box(0.9, 0.3, 0.8, trim, 0, 1.8));
      g.add(box(0.3, 0.6, 0.3, wallDark, 0.7, 1.9, -0.4));
      g.add(box(0.45, 0.65, 0.06, wallDark, -0.5, 0, 0.9));
      windows([0.55], [0.55], 0.9, 0.5, 0.4);
      height = 2.5;
      break;
    case 'school':
      g.add(box(2.6, 1.1, 1.7, wall));
      g.add(box(2.8, 0.22, 1.9, trim, 0, 1.1));
      g.add(box(0.4, 0.6, 0.06, wallDark, 0, 0, 0.86));
      g.add(box(0.06, 1.6, 0.06, trim, 1.6, 0, 0.9));
      g.add(box(0.5, 0.3, 0.02, mat(0xf4a300), 1.88, 1.3, 0.9));
      windows([-0.9, 0.9], [0.45], 0.86, 0.4, 0.4);
      height = 1.9;
      break;
    case 'campus':
      g.add(box(1.3, 2.0, 1.3, wall, -0.85));
      g.add(box(1.3, 2.7, 1.3, wall, 0.85));
      g.add(box(1.0, 0.9, 1.1, wallDark, 0, 0, 0.1));
      g.add(box(1.4, 0.2, 1.4, trim, -0.85, 2.0));
      g.add(box(1.4, 0.2, 1.4, trim, 0.85, 2.7));
      windows([0.85], [0.4, 1.0, 1.6, 2.2], 0.66, 0.5);
      windows([-0.85], [0.4, 1.0, 1.6], 0.66, 0.5);
      height = 3.1;
      break;
    case 'office':
      g.add(box(1.7, 2.5, 1.7, wall));
      g.add(box(1.9, 0.18, 1.9, trim, 0, 2.5));
      windows([0], [0.35, 0.9, 1.45, 2.0], 0.86, 1.3, 0.22);
      windows([0], [0.35, 0.9, 1.45, 2.0], -0.86, 1.3, 0.22);
      g.add(box(0.5, 0.7, 0.06, trim, 0, 0, 0.86));
      height = 2.9;
      break;
    case 'tower': {
      g.add(box(1.9, 3.3, 1.9, wall));
      g.add(box(2.1, 0.2, 2.1, trim, 0, 1.6));
      g.add(box(2.0, 0.22, 2.0, wallDark, 0, 3.3));
      windows([-0.55, 0.55], [0.35, 0.93, 1.51, 2.09, 2.67], 0.96);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), wallDark);
      mast.position.set(0.5, 3.97, 0.5);
      mast.castShadow = true;
      g.add(mast);
      height = 4.5;
      break;
    }
    case 'hospital':
      g.add(box(2.4, 1.7, 1.9, wall));
      g.add(box(2.6, 0.2, 2.1, wallDark, 0, 1.7));
      g.add(box(0.7, 0.2, 0.08, trim, 0, 1.05, 0.98));
      g.add(box(0.2, 0.7, 0.08, trim, 0, 0.8, 0.98));
      g.add(box(1.0, 0.1, 0.6, wallDark, 0, 1.9, 0.3));
      g.add(box(0.5, 0.2, 0.08, trim, 0, 1.95, 0.62));
      windows([-0.85, 0.85], [0.95], 0.96, 0.5, 0.35);
      g.add(box(0.6, 0.6, 0.06, glass, 0, 0, 0.96));
      height = 2.3;
      break;
    case 'lab':
      g.add(box(1.8, 1.3, 1.8, wall));
      g.add(box(2.0, 0.16, 2.0, trim, 0, 1.3));
      [-0.5, 0, 0.5].forEach((x, i) => g.add(box(0.36, 0.5 + i * 0.25, 0.36, mat(0xd9d9d9, 0.5), x, 1.46, -0.3)));
      g.add(box(1.2, 0.5, 0.06, glass, 0, 0.5, 0.91));
      height = 2.6;
      break;
    case 'sign':
      g.add(box(0.1, 1.9, 0.1, wallDark));
      g.add(box(1.5, 0.8, 0.1, wall, 0, 1.3));
      g.add(box(1.3, 0.6, 0.02, trim, 0, 1.4, 0.06));
      g.add(box(0.5, 0.08, 0.5, wallDark));
      height = 2.4;
      break;
    case 'mailbox':
      g.add(box(0.12, 1.0, 0.12, mat(0x5a5a60)));
      g.add(box(0.55, 0.45, 0.8, wall, 0, 1.0));
      g.add(box(0.06, 0.4, 0.06, mat(0xd7263d), 0.3, 1.45));
      g.add(box(0.25, 0.16, 0.04, mat(0xd7263d), 0.42, 1.7));
      height = 2.1;
      break;
  }
  return { group: g, height };
};

export const makeCloud = (rnd: () => number, m: THREE.Material) => {
  const g = new THREE.Group();
  const n = 4 + Math.floor(rnd() * 4);
  for (let i = 0; i < n; i++) {
    const r = 0.7 + rnd() * 0.9;
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), m);
    puff.position.set((i - (n - 1) / 2) * 1.05 + (rnd() - 0.5) * 0.5, (rnd() - 0.2) * 0.5 + r * 0.2, (rnd() - 0.5) * 0.9);
    puff.scale.y = 0.68;
    puff.castShadow = true;
    g.add(puff);
  }
  const base = new THREE.Mesh(new THREE.BoxGeometry(n * 0.95, 0.35, 1.2), m);
  base.position.y = -0.25;
  base.castShadow = true;
  g.add(base);
  return g;
};

export const makeBird = (m: Mat) => {
  const g = new THREE.Group();
  const l = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.06), m);
  const r = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.06), m);
  l.position.x = -0.11;
  r.position.x = 0.11;
  g.add(l, r);
  g.userData.wings = [l, r];
  return g;
};

const makeWindmill = () => {
  const g = new THREE.Group();
  g.add(box(0.5, 2.6, 0.5, mat(0xf0ebe0)));
  g.add(box(0.7, 0.2, 0.7, mat(0x7a4a2a), 0, 2.6));
  const hub = new THREE.Group();
  hub.position.set(0, 2.5, 0.4);
  const bladeMat = mat(0xe8e3d8);
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.5, 0.04), bladeMat);
    blade.position.y = 0.75;
    blade.castShadow = true;
    const arm = new THREE.Group();
    arm.rotation.z = (i * Math.PI) / 2;
    arm.add(blade);
    hub.add(arm);
  }
  g.add(hub);
  g.userData.hub = hub;
  return g;
};

/** A low-poly rescue helicopter. Nose points along +x. */
const makeHelicopter = (p: Palette, dark: boolean) => {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: p.heli[0], flatShading: true, roughness: 0.4, metalness: 0.2 });
  const white = mat(p.heli[1], 0.5);
  const steel = mat(0x2a2a30, 0.6);
  const glass = new THREE.MeshStandardMaterial({ color: 0x9fd0ea, flatShading: true, roughness: 0.15, metalness: 0.3, emissive: dark ? 0xffd27a : 0x000000, emissiveIntensity: dark ? 0.5 : 0 });

  g.add(box(1.1, 0.5, 0.62, body, 0, -0.25, 0));          // fuselage
  g.add(box(0.5, 0.42, 0.54, body, 0.72, -0.24, 0));      // nose
  g.add(box(0.5, 0.26, 0.5, glass, 0.6, 0.18, 0));        // cockpit glass
  g.add(box(0.26, 0.52, 0.64, white, -0.12, -0.26, 0));   // white band
  g.add(box(0.46, 0.14, 0.64, white, 0.18, 0.2, 0));      // roof
  const boom = box(1.45, 0.16, 0.16, body, -1.2, -0.03, 0);
  boom.rotation.z = 0.06;
  g.add(boom);
  g.add(box(0.28, 0.5, 0.05, body, -1.86, 0.08, 0));      // tail fin
  g.add(box(0.08, 0.04, 0.5, body, -1.55, 0.14, 0));      // stabiliser
  g.add(box(0.03, 0.3, 0.03, steel, 0.02, 0.3, 0));       // mast
  g.add(box(0.14, 0.08, 0.14, steel, 0.02, 0.58, 0));     // hub

  const rotor = new THREE.Group();
  rotor.position.set(0.02, 0.64, 0);
  const bladeMat = mat(0x1e1e22, 0.5);
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group();
    arm.rotation.y = (i * Math.PI) / 2;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.02, 0.1), bladeMat);
    blade.position.x = 0.85;
    blade.castShadow = true;
    arm.add(blade);
    rotor.add(arm);
  }
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.72, 24), new THREE.MeshBasicMaterial({ color: 0x1e1e22, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide }));
  disc.rotation.x = -Math.PI / 2;
  rotor.add(disc);
  g.add(rotor);

  const tail = new THREE.Group();
  tail.position.set(-1.86, 0.34, 0.05);
  [0, Math.PI / 2].forEach((r) => {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.56, 0.06), bladeMat);
    blade.rotation.x = r;
    blade.castShadow = true;
    tail.add(blade);
  });
  g.add(tail);

  [-0.34, 0.34].forEach((z) => {
    g.add(box(1.4, 0.04, 0.05, steel, 0.08, -0.56, z));
    g.add(box(0.04, 0.3, 0.04, steel, -0.3, -0.54, z));
    g.add(box(0.04, 0.3, 0.04, steel, 0.46, -0.54, z));
  });

  const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), new THREE.MeshStandardMaterial({ color: 0xff2b2b, emissive: 0xff2b2b, emissiveIntensity: 0 }));
  strobe.position.set(0, -0.3, 0);
  g.add(strobe);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0 }));
  beacon.position.set(-1.86, 0.62, 0);
  g.add(beacon);

  g.rotation.order = 'YXZ';
  g.userData = { rotor, tail, strobe, beacon };
  return g;
};

/** A ribbon that follows a curve, optionally offset sideways from it. */
const ribbon = (curve: THREE.Curve<THREE.Vector3>, width: number, y: number, segments = 700, offset = 0) => {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const pt = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    const n = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
    const c = pt.clone().addScaledVector(n, offset);
    pos.push(c.x + n.x * width / 2, y, c.z + n.z * width / 2, c.x - n.x * width / 2, y, c.z - n.z * width / 2);
    if (i < segments) {
      const a = i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
};

// Places a thing beside the road at t, facing the road
const beside = (curve: THREE.CatmullRomCurve3, t: number, side: 1 | -1, distance: number) => {
  const pt = curve.getPointAt(t);
  const tan = curve.getTangentAt(t);
  const n = new THREE.Vector3(-tan.z, 0, tan.x).normalize().multiplyScalar(distance * side);
  const pos = pt.clone().add(n);
  const wrapper = new THREE.Group();
  wrapper.position.copy(pos);
  wrapper.rotation.y = Math.atan2(pt.x - pos.x, pt.z - pos.z);
  return { wrapper, pos };
};

/** An instanced mesh with per-instance colour, sized for `capacity` and empty until filled. */
const instanced = (geo: THREE.BufferGeometry, m: THREE.Material, capacity: number, shadows = true) => {
  const mesh = new THREE.InstancedMesh(geo, m, capacity);
  mesh.count = 0;
  mesh.castShadow = shadows;
  mesh.receiveShadow = shadows;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  return mesh;
};

type Tree = {
  x: number; z: number; rotY: number; h: number; size: number;
  style: 0 | 1 | 2; crown: number; blob: number; phase: number; bounce: number;
};

// ─── World ───

export const World: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dark = useDarkMode({ deferred: true });
  const navigate = useNavigate();
  const mountRef = useRef<HTMLDivElement>(null);
  const sections = useRef<Partial<Record<DistrictKey, HTMLElement | null>>>({});
  const labelRefs = useRef<Record<string, HTMLElement | null>>({});
  const listeners = useRef(new Set<(l: Locals) => void>());
  const smoothT = useRef(0);
  const hoveredRef = useRef<Hover>(null);
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const [stop, setStop] = useState(0);
  const [skill, setSkill] = useState(0);
  const [project, setProject] = useState(0);
  const [hovered, setHoveredState] = useState<Hover>(null);

  const setHovered = useCallback((h: Hover) => {
    hoveredRef.current = h;
    setHoveredState(h);
  }, []);

  const register = useCallback((key: DistrictKey, el: HTMLElement | null) => {
    sections.current[key] = el;
  }, []);

  const scrollToLocal = useCallback((key: DistrictKey, p: number) => {
    const el = sections.current[key];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + p * el.offsetHeight - window.innerHeight / 2, behavior: reducedMotion() ? 'auto' : 'smooth' });
  }, []);

  const subscribe = useCallback((cb: (l: Locals) => void) => {
    listeners.current.add(cb);
    return () => { listeners.current.delete(cb); };
  }, []);

  const api = useMemo<WorldApi>(
    () => ({ stop, skill, project, hovered, setHovered, register, scrollToLocal, subscribe }),
    [stop, skill, project, hovered, setHovered, register, scrollToLocal, subscribe]
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const p = dark ? PALETTE.dark : PALETTE.light;
    // ?nogl=1 skips the 3D world (layout checks, very old devices); the page still works without it
    if (new URLSearchParams(window.location.search).has('nogl')) {
      mount.style.background = `linear-gradient(180deg, #${p.zenith.toString(16).padStart(6, '0')}, #${p.horizon.toString(16).padStart(6, '0')} 45%, #${p.ground.toString(16).padStart(6, '0')} 45%)`;
      return () => { mount.style.background = ''; };
    }
    const rnd = seeded(11);
    const small = Math.min(window.innerWidth, window.innerHeight) < 700 || (navigator.hardwareConcurrency ?? 8) <= 4;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.25 : 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = dark ? 1.05 : 1.05;
    renderer.setClearColor(p.fog);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(p.fog, 28, 170);

    // A real perspective camera, low enough to see the horizon
    const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 420);
    let camOffset = new THREE.Vector3(12, 4.0, 12);
    // Where the car sits on screen. The hero card is on the left, every other card on the right,
    // so the look-at point slides sideways as the drive leaves the hero district.
    let shiftHero = new THREE.Vector3();
    let shiftRoad = new THREE.Vector3();
    const camShift = new THREE.Vector3();
    // Night glow: lamps, windows, headlights and the moon bloom softly
    let composer: EffectComposer | null = null;
    let bloom: UnrealBloomPass | null = null;
    const fit = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      composer?.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const portrait = w < h;
      camOffset = portrait ? new THREE.Vector3(15, 5.0, 15) : new THREE.Vector3(12, 4.0, 12);
      if (w >= 768) {
        shiftHero = new THREE.Vector3(-1.9, 0, 3.3);
        shiftRoad = new THREE.Vector3(2.6, 0, -1.2);
      } else {
        // Phones: the car a little above the bottom sheet, centred
        shiftHero = new THREE.Vector3(1.6, 0, 1.6);
        shiftRoad = shiftHero.clone();
      }
    };
    if (dark && !small) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloom = new UnrealBloomPass(new THREE.Vector2(mount.clientWidth, mount.clientHeight), 0.38, 0.45, 0.88);
      composer.addPass(bloom);
      composer.addPass(new OutputPass());
    }
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(mount);

    // ── Sky: a gradient dome that follows the camera, with the sun (or moon) in it ──
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(360, 24, 12),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uZenith: { value: new THREE.Color(p.zenith) },
          uHorizon: { value: new THREE.Color(p.horizon) },
          uSunDir: { value: SKY_SUN_DIR.clone() },
          uSunColor: { value: new THREE.Color(p.sunColor) },
          uGlow: { value: p.sunGlow },
        },
        vertexShader: `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          uniform vec3 uZenith, uHorizon, uSunDir, uSunColor;
          uniform float uGlow;
          varying vec3 vDir;
          void main() {
            vec3 d = normalize(vDir);
            float h = clamp(d.y, 0.0, 1.0);
            vec3 col = mix(uHorizon, uZenith, pow(h, 0.5));
            float s = max(dot(d, uSunDir), 0.0);
            col += uSunColor * (pow(s, 64.0) * 0.55 + pow(s, 6.0) * 0.16) * uGlow;
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      })
    );
    sky.renderOrder = -10;
    sky.frustumCulled = false;
    scene.add(sky);

    const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(dark ? 'rgba(236,240,255,0.95)' : 'rgba(255,250,232,1)', dark ? 'rgba(170,190,255,0.25)' : 'rgba(255,200,120,0.5)'),
      transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, toneMapped: false,
    }));
    sunGlow.scale.setScalar(dark ? 40 : 58);
    scene.add(sunGlow);
    const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(dark ? 3.4 : 5.2, 16, 12), new THREE.MeshBasicMaterial({ color: p.sunDisc, fog: false, toneMapped: false }));
    scene.add(sunDisc);
    const SUN_DIST = 300;

    // Lights: the sun (with shadows), a soft fill from the camera side, and the sky
    scene.add(new THREE.HemisphereLight(p.hemiSky, p.hemiGround, p.hemiI));
    const sun = new THREE.DirectionalLight(p.sunColor, p.sunI);
    sun.castShadow = true;
    sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 140;
    sun.shadow.camera.left = -26; sun.shadow.camera.right = 26;
    sun.shadow.camera.top = 26; sun.shadow.camera.bottom = -26;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.03;
    sun.shadow.radius = 2;
    scene.add(sun, sun.target);
    const fill = new THREE.DirectionalLight(p.fillColor, p.fillI);
    scene.add(fill, fill.target);

    // Night sky
    if (dark) {
      const starGeo = new THREE.BufferGeometry();
      const pts: number[] = [];
      for (let i = 0; i < 700; i++) {
        const a = rnd() * Math.PI * 2;
        const e = rnd() * Math.PI * 0.45 + 0.05;
        const r = 330;
        pts.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r);
      }
      starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: true, fog: false, transparent: true, opacity: 0.9 }));
      stars.userData.followCamera = true;
      scene.add(stars);
      sky.userData.stars = stars;
    }

    // ── Ground, far hills, fields ──
    const groundMat = mat(p.ground, 1);
    groundMat.polygonOffset = true;
    groundMat.polygonOffsetFactor = 1;
    groundMat.polygonOffsetUnits = 1;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(43, 0, 1);
    ground.receiveShadow = true;
    scene.add(ground);

    // Low hills on the horizon: wide, gentle cones that the fog turns into pale silhouettes
    const mountainMat = mat(p.mountain, 1);
    const snowMat = mat(p.snow, 1);
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2 + rnd() * 0.12;
      const r = 118 + rnd() * 50;
      const h = 3 + rnd() * 5.5;
      const base = h * (3.2 + rnd() * 2);
      const m = new THREE.Mesh(new THREE.ConeGeometry(base, h, 6 + Math.floor(rnd() * 4)), mountainMat);
      m.position.set(43 + Math.cos(a) * r, h / 2 - 0.3, 1 + Math.sin(a) * r);
      m.rotation.y = rnd() * Math.PI;
      scene.add(m);
      if (h > 7.4) {
        const cap = new THREE.Mesh(new THREE.ConeGeometry(base * 0.22, h * 0.22, 6), snowMat);
        cap.position.set(m.position.x, h - h * 0.11 - 0.3, m.position.z);
        cap.rotation.y = m.rotation.y;
        scene.add(cap);
      }
    }

    const curve = new THREE.CatmullRomCurve3(ROAD_POINTS, false, 'centripetal', 0.5);
    const roadSamples = Array.from({ length: 520 }, (_, i) => curve.getPointAt(i / 519));
    const nearRoad = (x: number, z: number, gap: number) => roadSamples.some((s) => (s.x - x) ** 2 + (s.z - z) ** 2 < gap * gap);

    // ── River crossing the road between two journey stops, with a bridge ──
    const riverT = lerpT(DISTRICTS.journey, 4.5 / (STOPS - 1));
    const rp = curve.getPointAt(riverT);
    const rt = curve.getTangentAt(riverT);
    const rn = new THREE.Vector3(-rt.z, 0, rt.x).normalize();
    const riverPts: THREE.Vector3[] = [];
    for (let s = -90; s <= 90; s += 5) riverPts.push(rp.clone().addScaledVector(rn, s).addScaledVector(rt, Math.sin(s * 0.16) * 1.8));
    const riverCurve = new THREE.CatmullRomCurve3(riverPts, false, 'centripetal', 0.5);
    const riverSamples = Array.from({ length: 180 }, (_, i) => riverCurve.getPointAt(i / 179));
    const nearRiver = (x: number, z: number, gap: number) => riverSamples.some((s) => (s.x - x) ** 2 + (s.z - z) ** 2 < gap * gap);
    const bank = new THREE.Mesh(ribbon(riverCurve, 3.8, 0.006, 220), mat(p.path, 1));
    bank.receiveShadow = true;
    scene.add(bank);
    const waterMat = new THREE.MeshStandardMaterial({ color: p.water, roughness: 0.22, metalness: 0.18, flatShading: true });
    const water = new THREE.Mesh(ribbon(riverCurve, 2.7, 0.012, 220), waterMat);
    water.receiveShadow = true;
    scene.add(water);
    // Glints: small bright flecks that come and go on the water
    const glintMat = new THREE.MeshBasicMaterial({ color: p.ripple, transparent: true, opacity: dark ? 0.35 : 0.8 });
    const glints = instanced(new THREE.BoxGeometry(0.16, 0.01, 0.05), glintMat, 90, false);
    const glintData: { x: number; z: number; rot: number; phase: number }[] = [];
    for (let i = 0; i < 90; i++) {
      const s = riverCurve.getPointAt(rnd());
      const tan = riverCurve.getTangentAt(rnd());
      const off = (rnd() - 0.5) * 2.0;
      glintData.push({ x: s.x - tan.z * off, z: s.z + tan.x * off, rot: Math.atan2(tan.x, tan.z) + Math.PI / 2, phase: rnd() * Math.PI * 2 });
    }
    glints.count = 90;
    scene.add(glints);
    // Bridge deck and railings
    const bridge = new THREE.Group();
    bridge.position.copy(rp);
    bridge.rotation.y = Math.atan2(rt.x, rt.z);
    const deckMat = mat(shade(p.road, 1.15), 0.9);
    bridge.add(box(2.8, 0.09, 4.8, deckMat, 0, -0.055, 0));
    const railMat = mat(p.line, 0.6);
    [-1.3, 1.3].forEach((x) => {
      for (let z = -2.2; z <= 2.2; z += 0.55) bridge.add(box(0.06, 0.42, 0.06, railMat, x, 0.03, z));
      bridge.add(box(0.05, 0.05, 4.6, railMat, x, 0.42, 0));
      bridge.add(box(0.04, 0.04, 4.6, railMat, x, 0.22, 0));
    });
    scene.add(bridge);

    // Fields: flat coloured patches, never on the road or the river
    const fieldGeo = new THREE.BoxGeometry(1, 1, 1);
    const fields = instanced(fieldGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 1 }), 90, false);
    fields.receiveShadow = true;
    const M = new THREE.Matrix4();
    const Q = new THREE.Quaternion();
    const E = new THREE.Euler();
    const V = new THREE.Vector3();
    const S = new THREE.Vector3();
    const C = new THREE.Color();
    let fieldCount = 0;
    for (let tries = 0; tries < 400 && fieldCount < 90; tries++) {
      const w = 3 + rnd() * 8;
      const d = 2.5 + rnd() * 6;
      const x = -40 + rnd() * 170;
      const z = -34 + rnd() * 70;
      const half = Math.hypot(w, d) / 2;
      if (nearRoad(x, z, half + 1.4) || nearRiver(x, z, half + 1.4)) continue;
      M.compose(V.set(x, 0.004, z), Q.setFromEuler(E.set(0, (rnd() - 0.5) * 0.5, 0)), S.set(w, 0.012, d));
      fields.setMatrixAt(fieldCount, M);
      fields.setColorAt(fieldCount, C.set(p.field[fieldCount % p.field.length]));
      fieldCount++;
    }
    fields.count = fieldCount;
    fields.computeBoundingSphere();
    scene.add(fields);

    // ── Road: gravel shoulder, asphalt, painted edge lines, centre dashes ──
    const shoulder = new THREE.Mesh(ribbon(curve, 2.6, 0.018), mat(p.kerb, 1));
    shoulder.receiveShadow = true;
    scene.add(shoulder);
    const road = new THREE.Mesh(ribbon(curve, 1.8, 0.038), mat(p.road, 1));
    road.receiveShadow = true;
    scene.add(road);
    const lineMat = mat(p.line, 1);
    [-0.78, 0.78].forEach((o) => {
      const line = new THREE.Mesh(ribbon(curve, 0.06, 0.046, 700, o), lineMat);
      line.receiveShadow = true;
      scene.add(line);
    });
    const dashCount = Math.floor(curve.getLength() / 1.1);
    const dashes = instanced(new THREE.BoxGeometry(0.5, 0.01, 0.07), mat(p.dash, 1), dashCount, false);
    dashes.receiveShadow = true;
    for (let i = 0; i < dashCount; i++) {
      const t = (i + 0.5) / dashCount;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      M.compose(V.set(pt.x, 0.05, pt.z), Q.setFromEuler(E.set(0, Math.atan2(tan.x, tan.z) + Math.PI / 2, 0)), S.set(1, 1, 1));
      dashes.setMatrixAt(i, M);
    }
    dashes.count = dashCount;
    dashes.computeBoundingSphere();
    scene.add(dashes);

    // Street lamps along the road
    const lampMat = mat(p.lamp, 0.6);
    const bulbMat = new THREE.MeshStandardMaterial({ color: p.bulb, emissive: p.bulb, emissiveIntensity: dark ? 1.4 : 0.15, flatShading: true });
    const haloMat = new THREE.SpriteMaterial({
      map: glowTexture('rgba(255,236,190,0.55)', 'rgba(255,190,110,0.14)'),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    });
    const lampCount = Math.floor(curve.getLength() / 7);
    for (let i = 0; i < lampCount; i++) {
      const t = (i + 0.5) / lampCount;
      const side: 1 | -1 = i % 2 === 0 ? -1 : 1;
      const { wrapper, pos } = beside(curve, t, side, 1.55);
      if (nearRiver(pos.x, pos.z, 2.6)) continue;
      wrapper.add(box(0.07, 1.6, 0.07, lampMat));
      wrapper.add(box(0.35, 0.05, 0.07, lampMat, 0.15, 1.6, 0));
      wrapper.add(box(0.14, 0.08, 0.1, bulbMat, 0.3, 1.52, 0));
      if (dark && i % 4 === 0) {
        const l = new THREE.PointLight(0xffd9a0, 3, 6, 2);
        l.position.set(0.3, 1.5, 0);
        wrapper.add(l);
      }
      if (dark) {
        const halo = new THREE.Sprite(haloMat);
        halo.position.set(0.3, 1.5, 0);
        halo.scale.setScalar(0.85);
        wrapper.add(halo);
      }
      scene.add(wrapper);
    }

    // Fireflies drifting over the fields at night
    let fireflies: THREE.Points | null = null;
    const fireflyBase: number[] = [];
    if (dark) {
      const n = small ? 70 : 160;
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const x = -18 + rnd() * 124;
        const z = -18 + rnd() * 38;
        const y = 0.35 + rnd() * 1.4;
        pos.set([x, y, z], i * 3);
        fireflyBase.push(x, y, z, rnd() * Math.PI * 2);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      fireflies = new THREE.Points(geo, new THREE.PointsMaterial({
        color: 0xe6ff8a, size: 0.22, map: glowTexture('rgba(255,255,220,1)', 'rgba(210,255,120,0.45)'),
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
      }));
      scene.add(fireflies);
    }

    const plotMat = mat(p.plot, 1);
    const pathMat = mat(p.path, 1);
    const occupied: THREE.Vector3[] = [];
    const pickables: THREE.Object3D[] = [];
    const lifted: { group: THREE.Group; kind: NonNullable<Hover>['kind']; index: number }[] = [];
    const labels: { key: string; pos: THREE.Vector3 }[] = [];
    let chimney: THREE.Vector3 | null = null;

    const place = (kind: Kind, t: number, side: 1 | -1, labelKey?: string, pick?: NonNullable<Hover>) => {
      const { wrapper, pos } = beside(curve, t, side, 3.1);
      const { group, height } = buildKind(kind, p, dark);
      wrapper.add(group);
      const plot = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.03, 3.2), plotMat);
      plot.position.y = 0.015;
      plot.receiveShadow = true;
      wrapper.add(plot);
      // A doorstep path from the plot to the shoulder
      const path = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.012, 0.5), pathMat);
      path.position.set(0, 0.006, 1.75);
      path.receiveShadow = true;
      wrapper.add(path);
      scene.add(wrapper);
      wrapper.updateMatrixWorld(true);
      occupied.push(pos);
      if (kind === 'home') chimney = wrapper.localToWorld(new THREE.Vector3(0.7, 2.5, -0.4));
      if (labelKey) labels.push({ key: labelKey, pos: pos.clone().setY(height + 0.3) });
      if (pick) {
        group.traverse((o) => { o.userData.pick = pick; });
        pickables.push(group);
        lifted.push({ group: wrapper, kind: pick.kind, index: pick.index });
      }
      return pos;
    };

    // The house sits across the road from the camera so it never hides the car at the start
    place('home', 0.014, -1);

    JOURNEY.forEach((_, i) => {
      const t = lerpT(DISTRICTS.journey, i / (STOPS - 1));
      place(STOP_KINDS[i % STOP_KINDS.length], t, i % 2 === 0 ? 1 : -1, `stop-${i}`, { kind: 'stop', index: i });
    });

    // Skills yard: stacks of shipping containers and crates, one yard per group
    SKILL_GROUPS.forEach(([, skills], gi) => {
      const t = lerpT(DISTRICTS.skills, (gi + 0.5) / SKILL_GROUPS.length);
      const side: 1 | -1 = gi % 2 === 0 ? 1 : -1;
      const { wrapper, pos } = beside(curve, t, side, 3.4);
      const cluster = new THREE.Group();
      const cols = 4;
      skills.forEach((_, si) => {
        const cx = (si % cols) - (cols - 1) / 2;
        const cz = Math.floor(si / cols) - 1.5;
        const h = 0.45 + ((si * 7) % 5) * 0.22;
        const c = CONTAINER[(si + gi) % CONTAINER.length];
        cluster.add(box(0.62, h, 0.62, mat(dark ? shade(c, 0.6) : c, 0.7), cx * 0.72, 0, cz * 0.72));
      });
      wrapper.add(cluster);
      const plot = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.03, 3.4), mat(0x8e8a80, 1));
      plot.position.y = 0.015;
      plot.receiveShadow = true;
      wrapper.add(plot);
      scene.add(wrapper);
      occupied.push(pos);
      const pick: NonNullable<Hover> = { kind: 'skill', index: gi };
      cluster.traverse((o) => { o.userData.pick = pick; });
      pickables.push(cluster);
      lifted.push({ group: wrapper, kind: 'skill', index: gi });
      labels.push({ key: `skill-${gi}`, pos: pos.clone().setY(2.1) });
    });

    // Project billboards with the real screenshots
    const loader = new THREE.TextureLoader();
    const textures: THREE.Texture[] = [];
    const postMat = mat(0x5a5a60, 0.6);
    FEATURED.forEach((pr, i) => {
      const t = lerpT(DISTRICTS.projects, (i + 0.5) / FEATURED.length);
      const side: 1 | -1 = i % 2 === 0 ? -1 : 1;
      const { wrapper, pos } = beside(curve, t, side, 3.0);
      const frameHex = ACCENT_HEX[JOURNEY.find((m) => m.projectIds.includes(pr.id))?.accent ?? 'saffron'];
      const board = new THREE.Group();
      board.add(box(0.1, 1.3, 0.1, postMat, -1.2, 0, 0));
      board.add(box(0.1, 1.3, 0.1, postMat, 1.2, 0, 0));
      board.add(box(3.0, 1.95, 0.14, mat(0xfaf7f0, 0.6), 0, 1.2, 0));
      board.add(box(2.92, 1.87, 0.02, mat(frameHex, 0.6), 0, 1.24, 0.07));
      const screenMat = new THREE.MeshBasicMaterial({ color: 0xdddddd });
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.75), screenMat);
      screen.position.set(0, 2.18, 0.09);
      board.add(screen);
      if (dark) {
        // A little hood lamp over the board instead of a real light: cheap and reads the same
        board.add(box(0.5, 0.06, 0.2, bulbMat, 0, 3.1, 0.15));
      }
      if (pr.image_url) {
        loader.load(pr.image_url, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          const img = tex.image as { width: number; height: number };
          const want = 2.8 / 1.75;
          const have = img.width / img.height;
          if (have > want) {
            tex.repeat.set(want / have, 1);
            tex.offset.set((1 - want / have) / 2, 0);
          } else {
            tex.repeat.set(1, have / want);
            tex.offset.set(0, 1 - have / want);
          }
          screenMat.map = tex;
          screenMat.color.set(0xffffff);
          screenMat.needsUpdate = true;
          textures.push(tex);
        });
      }
      wrapper.add(board);
      const plot = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.03, 1.6), plotMat);
      plot.position.y = 0.015;
      plot.receiveShadow = true;
      wrapper.add(plot);
      scene.add(wrapper);
      occupied.push(pos);
      const pick: NonNullable<Hover> = { kind: 'project', index: i };
      board.traverse((o) => { o.userData.pick = pick; });
      pickables.push(board);
      lifted.push({ group: wrapper, kind: 'project', index: i });
      labels.push({ key: `project-${i}`, pos: pos.clone().setY(3.5) });
    });

    const mailboxPos = place('mailbox', 0.985, 1);
    place('sign', 0.96, -1);

    // Windmills and ponds
    const windmills: THREE.Group[] = [];
    [[0.3, -1, 7.5], [0.76, 1, 8]].forEach(([t, side, dist]) => {
      const { wrapper, pos } = beside(curve, t, side as 1 | -1, dist);
      const w = makeWindmill();
      w.rotation.y = -Math.PI / 4;
      wrapper.add(w);
      scene.add(wrapper);
      occupied.push(pos);
      windmills.push(w);
    });
    const ponds: THREE.Mesh[] = [];
    [[0.18, 1, 7], [0.58, -1, 7.5], [0.93, -1, 7]].forEach(([t, side, dist]) => {
      const { pos } = beside(curve, t, side as 1 | -1, dist);
      const pondBank = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.03, 10), mat(p.path, 1));
      pondBank.position.copy(pos).setY(0.008);
      pondBank.receiveShadow = true;
      scene.add(pondBank);
      const pond = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.04, 10), waterMat);
      pond.position.copy(pos).setY(0.012);
      pond.receiveShadow = true;
      scene.add(pond);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.56, 24), new THREE.MeshBasicMaterial({ color: p.ripple, transparent: true, opacity: 0.6 }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.copy(pos).setY(0.04);
      scene.add(ring);
      ponds.push(ring);
      occupied.push(pos);
    });

    // Wooden fences along the road wherever nothing else stands
    const fenceMat = mat(p.fence, 0.9);
    const posts = instanced(new THREE.BoxGeometry(0.07, 0.5, 0.07), fenceMat, 400);
    const rails = instanced(new THREE.BoxGeometry(1, 0.04, 0.035), fenceMat, 800);
    let postCount = 0;
    let railCount = 0;
    const fenceStep = 0.85 / curve.getLength();
    ([1, -1] as const).forEach((side) => {
      let prev: THREE.Vector3 | null = null;
      for (let t = 0.004; t < 0.996; t += fenceStep) {
        const { pos } = beside(curve, t, side, 1.75);
        const blocked = occupied.some((o) => (o.x - pos.x) ** 2 + (o.z - pos.z) ** 2 < 2.9 * 2.9) || nearRiver(pos.x, pos.z, 2.8);
        // Leave gaps so the fence doesn't feel like a wall
        const gap = Math.floor(t * 23) % 3 === 2;
        if (blocked || gap || postCount >= 400) { prev = null; continue; }
        M.compose(V.set(pos.x, 0.25, pos.z), Q.setFromEuler(E.set(0, 0, 0)), S.set(1, 1, 1));
        posts.setMatrixAt(postCount++, M);
        if (prev && railCount < 798) {
          const len = prev.distanceTo(pos);
          const ang = Math.atan2(prev.x - pos.x, prev.z - pos.z) + Math.PI / 2;
          [0.22, 0.4].forEach((y) => {
            M.compose(V.set((prev!.x + pos.x) / 2, y, (prev!.z + pos.z) / 2), Q.setFromEuler(E.set(0, ang, 0)), S.set(len, 1, 1));
            rails.setMatrixAt(railCount++, M);
          });
        }
        prev = pos;
      }
    });
    posts.count = postCount;
    rails.count = railCount;
    posts.computeBoundingSphere();
    rails.computeBoundingSphere();
    scene.add(posts, rails);

    // ── Trees, bushes, rocks and flowers everywhere the road and buildings aren't ──
    const free = (x: number, z: number, roadGap: number, stopGap: number) =>
      !nearRoad(x, z, roadGap) && !nearRiver(x, z, 2.3) &&
      !occupied.some((s) => (s.x - x) ** 2 + (s.z - z) ** 2 < stopGap ** 2);

    const TREE_MAX = 460;
    const trunkGeo = new THREE.CylinderGeometry(0.07, 0.1, 1, 5).translate(0, 0.5, 0);
    const crownGeos = [new THREE.ConeGeometry(1, 2.2, 6), new THREE.IcosahedronGeometry(1, 0), new THREE.DodecahedronGeometry(0.95, 0)];
    const leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.85 });
    const trunks = instanced(trunkGeo, mat(p.trunk), TREE_MAX);
    const crowns = crownGeos.map((g) => instanced(g, leafMat, TREE_MAX));
    const blobs = instanced(new THREE.IcosahedronGeometry(0.6, 0), leafMat, TREE_MAX);
    const trees: Tree[] = [];
    const crownOwner = crowns.map(() => [] as number[]);
    let tries = 0;
    while (trees.length < TREE_MAX && tries < 4000) {
      tries++;
      const x = -40 + rnd() * 175;
      const z = -34 + rnd() * 72;
      if (!free(x, z, 2.5, 3.3)) continue;
      const h = 0.3 + rnd() * 0.3;
      const size = 0.35 + rnd() * 0.4;
      const leaf = p.leaf[rnd() < 0.2 ? 5 + Math.floor(rnd() * 2) : Math.floor(rnd() * 5)];
      const r = rnd();
      const style: 0 | 1 | 2 = r < 0.4 ? 0 : r < 0.75 ? 1 : 2;
      const i = trees.length;
      const crown = crownOwner[style].length;
      crownOwner[style].push(i);
      const blob = style !== 0 && rnd() > 0.5 ? blobs.count++ : -1;
      trees.push({ x, z, rotY: rnd() * Math.PI * 2, h, size, style, crown, blob, phase: rnd() * Math.PI * 2, bounce: -10 });
      crowns[style].setColorAt(crown, C.set(leaf));
      if (blob >= 0) blobs.setColorAt(blob, C.set(leaf));
      trunks.setMatrixAt(i, M.compose(V.set(x, 0, z), Q.setFromEuler(E.set(0, trees[i].rotY, 0)), S.set(1, h, 1)));
    }
    trunks.count = trees.length;
    crowns.forEach((c, k) => { c.count = crownOwner[k].length; });
    // Scratch matrices for the per-frame tree update: no allocations inside the loop
    const M2 = new THREE.Matrix4();
    const T2 = new THREE.Matrix4();
    const writeTree = (tr: Tree, sway: number, k: number, index: number) => {
      // Base rotation, then sway around the foot, then the hover bounce, then the crown's own offset and size
      const bx = 1 - k * 0.12;
      const by = 1 + k * 0.28;
      M.compose(V.set(tr.x, 0, tr.z), Q.setFromEuler(E.set(0, tr.rotY, sway)), S.set(bx, by, bx));
      const cy = tr.h + (tr.style === 0 ? tr.size * 1.1 : tr.size * 0.85);
      crowns[tr.style].setMatrixAt(tr.crown, M2.copy(M).multiply(T2.makeTranslation(0, cy, 0)).scale(V.set(tr.size, tr.size, tr.size)));
      if (tr.blob >= 0) {
        blobs.setMatrixAt(tr.blob, M2.copy(M).multiply(T2.makeTranslation(tr.size * 0.5, tr.h + tr.size * 1.2, tr.size * 0.2)).scale(V.set(tr.size, tr.size, tr.size)));
      }
      if (k > 0) trunks.setMatrixAt(index, M2.copy(M).scale(V.set(1, tr.h, 1)));
    };
    trees.forEach((tr, i) => writeTree(tr, 0, 0, i));
    [trunks, ...crowns, blobs].forEach((m) => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.computeBoundingSphere(); scene.add(m); });
    crowns.forEach((c, k) => { c.userData.style = k; });

    const bushes = instanced(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.9 }), 220);
    for (let i = 0; i < 400 && bushes.count < 220; i++) {
      const x = -40 + rnd() * 175;
      const z = -34 + rnd() * 72;
      if (!free(x, z, 1.7, 2.2)) continue;
      const r = 0.18 + rnd() * 0.2;
      bushes.setMatrixAt(bushes.count, M.compose(V.set(x, r * 0.6, z), Q.setFromEuler(E.set(0, rnd() * 3, 0)), S.set(r, r * 0.8, r)));
      bushes.setColorAt(bushes.count, C.set(p.bush).offsetHSL(0, 0, (rnd() - 0.5) * 0.08));
      bushes.count++;
    }
    bushes.computeBoundingSphere();
    scene.add(bushes);

    const rocks = instanced(new THREE.DodecahedronGeometry(1, 0), mat(p.rock, 0.95), 80);
    for (let i = 0; i < 160 && rocks.count < 80; i++) {
      const x = -40 + rnd() * 175;
      const z = -34 + rnd() * 72;
      if (!free(x, z, 1.9, 2.2)) continue;
      const r = 0.12 + rnd() * 0.22;
      rocks.setMatrixAt(rocks.count++, M.compose(V.set(x, r * 0.6, z), Q.setFromEuler(E.set(rnd(), rnd(), rnd())), S.set(r, r, r)));
    }
    rocks.computeBoundingSphere();
    scene.add(rocks);

    const flowers = instanced(new THREE.BoxGeometry(0.07, 0.07, 0.07), new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.8 }), 600, false);
    for (let i = 0; i < 900 && flowers.count < 600; i++) {
      // Flowers like the roadside: most sit just beyond the shoulder
      const t = rnd();
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      const side = rnd() < 0.5 ? 1 : -1;
      const d = rnd() < 0.7 ? 1.55 + rnd() * 1.2 : 3 + rnd() * 9;
      const x = pt.x - tan.z * d * side + (rnd() - 0.5) * 0.4;
      const z = pt.z + tan.x * d * side + (rnd() - 0.5) * 0.4;
      if (nearRoad(x, z, 1.45) || nearRiver(x, z, 2.2) || occupied.some((s) => (s.x - x) ** 2 + (s.z - z) ** 2 < 2.3 * 2.3)) continue;
      flowers.setMatrixAt(flowers.count, M.compose(V.set(x, 0.06, z), Q.setFromEuler(E.set(0, rnd() * 3, 0)), S.set(1, 1 + rnd(), 1)));
      flowers.setColorAt(flowers.count, C.set(p.flower[Math.floor(rnd() * p.flower.length)]));
      flowers.count++;
    }
    flowers.computeBoundingSphere();
    scene.add(flowers);

    // ── Sky life: clouds, birds, a balloon and a helicopter ──
    const cloudMat = new THREE.MeshStandardMaterial({ color: p.cloud, flatShading: true, roughness: 1, transparent: true, opacity: dark ? 0.7 : 0.96 });
    const clouds: THREE.Group[] = [];
    for (let i = 0; i < 12; i++) {
      const c = makeCloud(rnd, cloudMat);
      c.position.set(-20 + rnd() * 130, 6.8 + rnd() * 2.6, -30 + rnd() * 50);
      c.scale.setScalar(1 + rnd() * 0.8);
      c.userData.speed = 0.25 + rnd() * 0.3;
      scene.add(c);
      clouds.push(c);
    }
    const birdMat = mat(0x2a2a30);
    const flocks: THREE.Group[] = [];
    for (let f = 0; f < 3; f++) {
      const flock = new THREE.Group();
      for (let b = 0; b < 5; b++) {
        const bird = makeBird(birdMat);
        bird.position.set((b - 2) * 0.5, Math.abs(b - 2) * -0.15, Math.abs(b - 2) * 0.4);
        flock.add(bird);
      }
      flock.userData = { cx: 10 + f * 32, cz: -2 + f * 3, phase: f * 2.1 };
      flock.position.y = 5.2 + f * 0.4;
      scene.add(flock);
      flocks.push(flock);
    }
    const balloon = new THREE.Group();
    const envelope = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 1), mat(p.balloon[0]));
    envelope.position.y = 1.4;
    envelope.castShadow = true;
    balloon.add(envelope);
    [[0.3, p.balloon[1]], [-0.3, p.balloon[2]]].forEach(([y, c]) => {
      const band = new THREE.Mesh(new THREE.IcosahedronGeometry(0.82, 1), mat(c as number));
      band.position.y = 1.4 + (y as number);
      band.scale.set(1, 0.22, 1);
      balloon.add(band);
    });
    balloon.add(box(0.36, 0.3, 0.36, mat(0x8e6c3a), 0, 0, 0));
    balloon.add(box(0.03, 0.9, 0.03, mat(0x5a5a60), -0.14, 0.3, 0));
    balloon.add(box(0.03, 0.9, 0.03, mat(0x5a5a60), 0.14, 0.3, 0));
    balloon.position.set(50, 5.5, -6);
    scene.add(balloon);

    const heli = makeHelicopter(p, dark);
    heli.scale.setScalar(0.9);
    scene.add(heli);
    const HELI = { cx: 41, cz: 1, rx: 52, rz: 13, y: 7.2, period: 66 };
    let heliHeading = 0;
    let heliRoll = 0;

    // ── Car with lights, spinning wheels and exhaust puffs ──
    const car = new THREE.Group();
    const carPaint = new THREE.MeshStandardMaterial({ color: p.car, flatShading: true, roughness: 0.35, metalness: 0.25 });
    const carGlass = new THREE.MeshStandardMaterial({ color: 0x9fd0ea, roughness: 0.2, metalness: 0.3, flatShading: true });
    car.add(box(0.82, 0.2, 0.42, carPaint, 0, 0.1));
    car.add(box(0.46, 0.18, 0.38, carGlass, -0.04, 0.3));
    car.add(box(0.4, 0.04, 0.4, carPaint, -0.04, 0.48));
    car.add(box(0.06, 0.04, 0.5, carPaint, 0.1, 0.3));
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfff4d6, emissive: 0xffe6a8, emissiveIntensity: dark ? 2.2 : 0.4, flatShading: true });
    const tailMat = new THREE.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0xff2222, emissiveIntensity: dark ? 1.6 : 0.3, flatShading: true });
    [-0.14, 0.14].forEach((z) => {
      car.add(box(0.04, 0.06, 0.08, headMat, 0.41, 0.17, z));
      car.add(box(0.04, 0.05, 0.08, tailMat, -0.41, 0.17, z));
    });
    const wheels: THREE.Mesh[] = [];
    const wheelGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 10);
    const wheelMat = mat(0x1e1e22, 0.9);
    [[-0.26, 0.22], [0.26, 0.22], [-0.26, -0.22], [0.26, -0.22]].forEach(([x, z]) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.x = Math.PI / 2;
      w.position.set(x, 0.1, z);
      w.castShadow = true;
      car.add(w);
      wheels.push(w);
    });
    scene.add(car);
    if (dark) {
      const headlight = new THREE.SpotLight(0xffe0b0, 12, 8, 0.55, 0.5, 1.1);
      headlight.position.set(0.4, 0.3, 0);
      headlight.target.position.set(4, -0.5, 0);
      car.add(headlight, headlight.target);
    }
    const puffMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e0, transparent: true, opacity: 0.5, flatShading: true });
    const makePuffs = (n: number, r: number) => Array.from({ length: n }, () => {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), puffMat.clone());
      m.visible = false;
      m.userData.life = 0;
      scene.add(m);
      return m;
    });
    const puffs = makePuffs(14, 0.07);
    const smoke = makePuffs(7, 0.09);

    // Confetti for the end of the road
    const confettiColours = [0xd7263d, 0xf4d35e, 0x2a9d8f, 0x3c6fb0, 0xf26b1d];
    const confetti = Array.from({ length: 70 }, (_, i) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.03), mat(confettiColours[i % confettiColours.length], 0.5));
      m.visible = false;
      m.castShadow = true;
      scene.add(m);
      return m;
    });
    let confettiArmed = true;
    const burst = () => {
      confetti.forEach((c) => {
        c.visible = true;
        c.position.copy(mailboxPos).setY(1.3);
        c.userData.v = new THREE.Vector3((rnd() - 0.5) * 3, 3 + rnd() * 3, (rnd() - 0.5) * 3);
        c.userData.spin = new THREE.Vector3(rnd() * 6, rnd() * 6, rnd() * 6);
        c.userData.life = 2.4 + rnd();
      });
    };

    // ── Pointer picking: buildings, yards, billboards, trees, and the road itself ──
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerInside = false;
    const onPointerMove = (e: PointerEvent) => {
      pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      pointerInside = true;
    };
    const onPointerLeave = () => {
      pointerInside = false;
      if (hoveredRef.current) setHovered(null);
      mount.style.cursor = '';
    };
    const scrollToT = (t: number) => {
      for (const key of KEYS) {
        const [a, b] = DISTRICTS[key];
        if (t >= a && t <= b) { scrollToLocal(key, (t - a) / (b - a)); return; }
      }
    };
    const onClick = () => {
      const h = hoveredRef.current;
      if (h?.kind === 'stop') return scrollToLocal('journey', h.index / (STOPS - 1));
      if (h?.kind === 'skill') return scrollToLocal('skills', (h.index + 0.5) / SKILL_GROUPS.length);
      if (h?.kind === 'project') return navigateRef.current(`/projects/${FEATURED[h.index].id}`);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects([road, shoulder, ground])[0];
      if (!hit) return;
      let best = 0;
      let bestD = Infinity;
      roadSamples.forEach((s, i) => {
        const d = (s.x - hit.point.x) ** 2 + (s.z - hit.point.z) ** 2;
        if (d < bestD) { bestD = d; best = i; }
      });
      if (bestD < 36) scrollToT(best / (roadSamples.length - 1));
    };
    mount.addEventListener('pointermove', onPointerMove);
    mount.addEventListener('pointerleave', onPointerLeave);
    mount.addEventListener('click', onClick);

    const localOf = (key: DistrictKey) => {
      const el = sections.current[key];
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      return clamp01((window.innerHeight * 0.5 - r.top) / r.height);
    };

    const reduced = reducedMotion();
    const tmp = new THREE.Vector3();
    const tmp2 = new THREE.Vector3();
    const clock = new THREE.Clock();
    let last = { stop: -1, skill: -1, project: -1 };
    let prevT = 0;
    let puffTimer = 0;
    let smokeTimer = 0;
    let frame = 0;
    let frameNo = 0;
    let hidden = document.hidden;
    const onVisibility = () => { hidden = document.hidden; };
    document.addEventListener('visibilitychange', onVisibility);
    const bouncing = new Set<Tree>();

    if (process.env.NODE_ENV !== 'production') (window as unknown as { __world: unknown }).__world = { renderer, scene, camera };

    const tick = () => {
      frame = requestAnimationFrame(tick);
      if (hidden) return;
      const dt = Math.min(0.05, clock.getDelta());
      const now = clock.elapsedTime;
      frameNo++;

      const locals = { t: 0 } as Locals;
      let target = 0;
      KEYS.forEach((key) => {
        const l = localOf(key);
        locals[key] = l;
        if (l > 0) target = lerpT(DISTRICTS[key], l);
      });
      smoothT.current += (target - smoothT.current) * (reduced ? 1 : ease(0.07, dt));
      const t = smoothT.current;
      locals.t = t;
      listeners.current.forEach((cb) => cb(locals));

      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      const speed = ((t - prevT) * curve.getLength()) / Math.max(dt, 1e-3);
      prevT = t;
      car.position.set(pt.x, 0.04 + Math.abs(Math.sin(now * 18)) * Math.min(0.012, Math.abs(speed) * 0.002), pt.z);
      // The car model's nose points along +x; this turns +x onto the road's direction of travel
      car.rotation.y = Math.atan2(tan.x, tan.z) - Math.PI / 2;
      car.rotation.z = THREE.MathUtils.lerp(car.rotation.z, THREE.MathUtils.clamp(speed * 0.01, -0.08, 0.08), ease(0.1, dt));
      wheels.forEach((w) => { w.rotation.y -= speed * dt * 10; });
      // The camera eases a little behind the car so corners feel like driving
      camShift.lerpVectors(shiftHero, shiftRoad, THREE.MathUtils.smoothstep(t, 0.045, 0.09));
      // Snap on the first frame so the page never opens mid-flight, then ease behind the car
      camera.position.lerp(tmp.copy(pt).add(camOffset).add(camShift), reduced || frameNo === 1 ? 1 : ease(0.12, dt));
      camera.lookAt(tmp.copy(pt).add(camShift).setY(0.6));
      sun.position.copy(pt).addScaledVector(SUN_DIR, 45);
      sun.target.position.copy(pt);
      fill.position.copy(camera.position).setY(camera.position.y + 6);
      fill.target.position.copy(pt);
      sky.position.copy(camera.position);
      if (sky.userData.stars) (sky.userData.stars as THREE.Object3D).position.copy(camera.position);
      sunGlow.position.copy(camera.position).addScaledVector(SKY_SUN_DIR, SUN_DIST);
      sunDisc.position.copy(sunGlow.position);

      puffTimer -= dt;
      if (Math.abs(speed) > 1.5 && puffTimer <= 0 && !reduced) {
        const puff = puffs.find((m) => !m.visible);
        if (puff) {
          puff.visible = true;
          puff.userData.life = 1;
          puff.position.copy(car.position).add(tmp.set(-tan.x, 0.12, -tan.z).multiplyScalar(0.5));
          puff.scale.setScalar(1);
        }
        puffTimer = 0.09;
      }
      smokeTimer -= dt;
      if (chimney && smokeTimer <= 0 && !reduced) {
        const s = smoke.find((m) => !m.visible);
        if (s) {
          s.visible = true;
          s.userData.life = 1;
          s.position.copy(chimney);
          s.scale.setScalar(0.8);
        }
        smokeTimer = 0.45;
      }
      [...puffs, ...smoke].forEach((m) => {
        if (!m.visible) return;
        const slow = m.userData.life > 0 && smoke.includes(m);
        m.userData.life -= dt * (slow ? 0.45 : 1.4);
        if (m.userData.life <= 0) { m.visible = false; return; }
        m.position.y += dt * (slow ? 0.35 : 0.5);
        m.position.x += slow ? dt * 0.12 : 0;
        m.scale.addScalar(dt * (slow ? 0.9 : 1.6));
        (m.material as THREE.MeshStandardMaterial).opacity = m.userData.life * (slow ? 0.3 : 0.45);
      });

      clouds.forEach((c) => {
        c.position.x += c.userData.speed * dt;
        if (c.position.x > 125) c.position.x = -30;
      });
      flocks.forEach((f) => {
        const { cx, cz, phase } = f.userData;
        f.position.x = cx + Math.sin(now * 0.12 + phase) * 26;
        f.position.z = cz + Math.cos(now * 0.09 + phase) * 9;
        f.rotation.y = Math.atan2(Math.cos(now * 0.12 + phase) * 26 * 0.12, -Math.sin(now * 0.09 + phase) * 9 * 0.09);
        f.children.forEach((bird, i) => {
          const flap = Math.sin(now * 9 + i) * 0.6;
          const [l, r] = bird.userData.wings as THREE.Mesh[];
          l.rotation.z = flap;
          r.rotation.z = -flap;
        });
      });
      balloon.position.x = 50 + Math.sin(now * 0.07) * 14;
      balloon.position.z = -6 + Math.cos(now * 0.05) * 5;
      balloon.position.y = 5.5 + Math.sin(now * 0.6) * 0.25;

      // Helicopter: a long loop over the valley, banking into the turns
      {
        const th = (now / HELI.period) * Math.PI * 2 + 1.3;
        const hx = HELI.cx + Math.cos(th) * HELI.rx;
        const hz = HELI.cz + Math.sin(th) * HELI.rz;
        const vx = -Math.sin(th) * HELI.rx;
        const vz = Math.cos(th) * HELI.rz;
        const heading = Math.atan2(-vz, vx);
        let dh = heading - heliHeading;
        if (dh > Math.PI) dh -= Math.PI * 2;
        if (dh < -Math.PI) dh += Math.PI * 2;
        heliHeading = heading;
        const turn = THREE.MathUtils.clamp(dh / Math.max(dt, 1e-3), -1.5, 1.5);
        heliRoll = THREE.MathUtils.lerp(heliRoll, reduced ? 0 : -turn * 0.75, ease(0.06, dt));
        heli.position.set(hx, HELI.y + Math.sin(now * 0.6) * 0.3, hz);
        heli.rotation.set(heliRoll, heading, -0.07);
        (heli.userData.rotor as THREE.Group).rotation.y += dt * 36;
        (heli.userData.tail as THREE.Group).rotation.x += dt * 55;
        const blink = now % 1.4 < 0.1;
        ((heli.userData.strobe as THREE.Mesh).material as THREE.MeshStandardMaterial).emissiveIntensity = blink ? (dark ? 8 : 2.5) : 0;
        ((heli.userData.beacon as THREE.Mesh).material as THREE.MeshStandardMaterial).emissiveIntensity = (now + 0.7) % 1.4 < 0.08 ? (dark ? 8 : 2) : 0;
      }

      windmills.forEach((w) => { (w.userData.hub as THREE.Group).rotation.z += dt * 1.1; });
      ponds.forEach((r, i) => {
        const s = 1 + ((now * 0.6 + i * 0.7) % 2);
        r.scale.setScalar(s);
        (r.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - (s - 1) / 2);
      });
      glintData.forEach((g, i) => {
        const k = Math.max(0, Math.sin(now * 2.2 + g.phase));
        glints.setMatrixAt(i, M.compose(V.set(g.x, 0.02, g.z), Q.setFromEuler(E.set(0, g.rot, 0)), S.set(k, 1, k)));
      });
      glints.instanceMatrix.needsUpdate = true;

      if (!reduced) {
        // Crowns sway in the wind; a hovered tree does a little jelly bounce
        trees.forEach((tr, i) => {
          const since = now - tr.bounce;
          const k = since < 0.7 ? Math.sin((since / 0.7) * Math.PI) : 0;
          const sway = Math.sin(now * 1.3 + tr.phase) * 0.035;
          writeTree(tr, sway, k, i);
          if (k > 0) bouncing.add(tr);
          else if (bouncing.has(tr)) {
            // Bounce just ended: put the trunk back to its resting size
            bouncing.delete(tr);
            trunks.setMatrixAt(i, M2.copy(M).scale(V.set(1, tr.h, 1)));
            trunks.instanceMatrix.needsUpdate = true;
          }
        });
        crowns.forEach((c) => { c.instanceMatrix.needsUpdate = true; });
        blobs.instanceMatrix.needsUpdate = true;
        if (bouncing.size) trunks.instanceMatrix.needsUpdate = true;
      }

      if (t > 0.955 && confettiArmed) { confettiArmed = false; burst(); }
      if (t < 0.9) confettiArmed = true;
      confetti.forEach((c) => {
        if (!c.visible) return;
        c.userData.life -= dt;
        if (c.userData.life <= 0) { c.visible = false; return; }
        const v = c.userData.v as THREE.Vector3;
        v.y -= 7 * dt;
        c.position.addScaledVector(v, dt);
        if (c.position.y < 0.05) { c.position.y = 0.05; v.set(v.x * 0.6, 0, v.z * 0.6); }
        const sp = c.userData.spin as THREE.Vector3;
        c.rotation.x += sp.x * dt; c.rotation.y += sp.y * dt; c.rotation.z += sp.z * dt;
      });

      const cur = {
        stop: Math.round(locals.journey * (STOPS - 1)),
        skill: Math.min(SKILL_GROUPS.length - 1, Math.floor(locals.skills * SKILL_GROUPS.length)),
        project: Math.min(FEATURED.length - 1, Math.floor(locals.projects * FEATURED.length)),
      };
      if (cur.stop !== last.stop) setStop(cur.stop);
      if (cur.skill !== last.skill) setSkill(cur.skill);
      if (cur.project !== last.project) setProject(cur.project);
      last = cur;

      if (pointerInside && frameNo % 2 === 0) {
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects([...pickables, ...crowns], true)[0];
        if (hit && hit.instanceId !== undefined && hit.object.userData.style !== undefined) {
          const tr = trees[crownOwner[hit.object.userData.style as number][hit.instanceId]];
          if (tr && now - tr.bounce > 0.7) tr.bounce = now;
        }
        const h = (hit?.object.userData.pick as NonNullable<Hover> | undefined) ?? null;
        const prev = hoveredRef.current;
        if ((h?.kind ?? null) !== (prev?.kind ?? null) || (h?.index ?? -1) !== (prev?.index ?? -1)) setHovered(h);
        mount.style.cursor = h ? 'pointer' : hit ? 'grab' : '';
      }

      const hov = hoveredRef.current;
      lifted.forEach((l) => {
        const active = (hov && hov.kind === l.kind && hov.index === l.index) || cur[l.kind] === l.index;
        const s = active ? 1.06 : 1;
        l.group.scale.lerp(tmp.set(s, s, s), reduced ? 1 : ease(0.12, dt));
      });

      const w = mount.clientWidth;
      const h = mount.clientHeight;
      // Project with this frame's camera, not last frame's
      camera.updateMatrixWorld();
      camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
      labels.forEach((l) => {
        const el = labelRefs.current[l.key];
        if (!el) return;
        const dist = tmp2.copy(l.pos).sub(camera.position).length();
        tmp.copy(l.pos).project(camera);
        const x = (tmp.x * 0.5 + 0.5) * w;
        const y = (-tmp.y * 0.5 + 0.5) * h;
        const on = tmp.z < 1 && dist < 48 && x > -80 && x < w + 80 && y > -40 && y < h + 40;
        el.style.transform = `translate(-50%, -100%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        el.style.opacity = on ? String(Math.min(1, (48 - dist) / 10)) : '0';
        el.style.pointerEvents = on ? 'auto' : 'none';
      });

      if (fireflies && !reduced) {
        const attr = fireflies.geometry.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < attr.count; i++) {
          const b = i * 4;
          const ph = fireflyBase[b + 3];
          attr.setXYZ(i,
            fireflyBase[b] + Math.sin(now * 0.4 + ph) * 0.8,
            fireflyBase[b + 1] + Math.sin(now * 1.3 + ph * 2) * 0.25,
            fireflyBase[b + 2] + Math.cos(now * 0.35 + ph) * 0.8);
        }
        attr.needsUpdate = true;
        (fireflies.material as THREE.PointsMaterial).opacity = 0.5 + Math.sin(now * 3) * 0.2;
      }

      if (composer) composer.render(dt);
      else renderer.render(scene, camera);
      if (frameNo === 3 && process.env.NODE_ENV !== 'production') {
        const ndc = tmp.copy(sunGlow.position).project(camera);
        console.log('[world]', JSON.stringify({
          sunNdc: [+ndc.x.toFixed(2), +ndc.y.toFixed(2), +ndc.z.toFixed(3)],
          calls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
          trees: trees.length, t: +t.toFixed(3), cam: camera.position.toArray().map((v) => +v.toFixed(1)),
        }));
      }
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      mount.removeEventListener('pointermove', onPointerMove);
      mount.removeEventListener('pointerleave', onPointerLeave);
      mount.removeEventListener('click', onClick);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Points || o instanceof THREE.Sprite) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
            if ((m as THREE.SpriteMaterial).map) (m as THREE.SpriteMaterial).map?.dispose();
            m.dispose();
          });
          if (o instanceof THREE.InstancedMesh) o.dispose();
        }
      });
      textures.forEach((tx) => tx.dispose());
      haloMat.map?.dispose();
      haloMat.dispose();
      bloom?.dispose();
      composer?.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [dark, setHovered, scrollToLocal]);

  const labelClass = (on: boolean) =>
    `sign-label absolute left-0 top-0 flex items-center gap-1.5 whitespace-nowrap will-change-transform ${on ? 'is-on' : ''}`;
  const isHov = (kind: NonNullable<Hover>['kind'], i: number) => hovered?.kind === kind && hovered.index === i;

  return (
    <Ctx.Provider value={api}>
      <div ref={mountRef} className="fixed inset-0 z-0 [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full" />

      <div className="pointer-events-none fixed inset-0 z-[1]">
        {JOURNEY.map((m, i) => (
          <button key={m.id} ref={(el) => { labelRefs.current[`stop-${i}`] = el; }} onClick={() => scrollToLocal('journey', i / (STOPS - 1))} className={labelClass(stop === i || isHov('stop', i))} style={{ opacity: 0 }}>
            {m.when}
          </button>
        ))}
        {SKILL_GROUPS.map(([name], i) => (
          <button key={name} ref={(el) => { labelRefs.current[`skill-${i}`] = el; }} onClick={() => scrollToLocal('skills', (i + 0.5) / SKILL_GROUPS.length)} className={labelClass(skill === i || isHov('skill', i))} style={{ opacity: 0 }}>
            {name}
          </button>
        ))}
        {FEATURED.map((pr, i) => (
          <button key={pr.id} ref={(el) => { labelRefs.current[`project-${i}`] = el; }} onClick={() => navigate(`/projects/${pr.id}`)} className={labelClass(project === i || isHov('project', i))} style={{ opacity: 0 }}>
            {pr.title.split(':')[0]}
          </button>
        ))}
      </div>

      <div className="relative z-[2]">{children}</div>
    </Ctx.Provider>
  );
};
