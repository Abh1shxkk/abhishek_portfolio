import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import { Accent } from '../types';
import { JOURNEY, PROJECTS_DATA, SKILLS_GROUPED } from '../data/portfolio';
import { useDarkMode } from './ui';

/*
 * The whole home page is one 3D world. A road runs through five districts and the
 * camera drives along it as the page scrolls. Each district owns a slice of the road
 * (tStart..tEnd) and a DOM section; the section's scroll position maps onto its slice.
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

// ─── Palette: daytime countryside, and the same place at night ───

type Kind = 'home' | 'school' | 'campus' | 'office' | 'tower' | 'hospital' | 'lab' | 'sign' | 'mailbox';

const PALETTE = {
  light: {
    sky: 0xcfe6f5, fog: 0xd9ebf6,
    ground: 0x7cae62, field: [0x6a9f52, 0x90bf70, 0xd9b868, 0xb9ca7c, 0x86b25f],
    road: 0x4b4c55, dash: 0xf2f2ea, kerb: 0xd9d5c8,
    trunk: 0x6b4a2f, leaf: [0x3f8f3a, 0x55a24a, 0x2f7a35, 0x8fbf4f, 0x4a9a52, 0xe08a2e, 0xd25a2a],
    bush: 0x4c9a45, rock: 0x9a9a92, plot: 0xd2c7ab, path: 0xcdbf9e,
    glass: 0xa9d2ea, glow: 0x000000, cloud: 0xffffff, water: 0x4ea3d6, ripple: 0xeaf6ff,
    car: 0xd7263d, lamp: 0x5a5a60, bulb: 0xfff2c9,
    hemiSky: 0xbfdcff, hemiGround: 0x6f8f55, hemiI: 1.05, sunColor: 0xfff4e0, sunI: 1.9,
    balloon: [0xd7263d, 0xf4d35e, 0x2a9d8f],
    kinds: {
      home: [0xf3e9d2, 0xa33f2b], school: [0xb5533c, 0x4a4a52], campus: [0xf2e8d8, 0xc9623a],
      office: [0x6f93b8, 0x2f4a66], tower: [0xe9e2d5, 0x3c6fb0], hospital: [0xf7f7f5, 0xd63b3b],
      lab: [0x8b949e, 0x2a9d8f], sign: [0x7a4a2a, 0xf3e9d2], mailbox: [0x2d5fa6, 0xf3e9d2],
    } as Record<Kind, [number, number]>,
  },
  dark: {
    sky: 0x0b1226, fog: 0x0f1a33,
    ground: 0x1f3a28, field: [0x1b3323, 0x27432d, 0x3d3a22, 0x2c3f24, 0x213a26],
    road: 0x1e2026, dash: 0x9a9a90, kerb: 0x3a3a3c,
    trunk: 0x3a2a1c, leaf: [0x1f4d26, 0x2a5e30, 0x173d1e, 0x3f6b2a, 0x234f28, 0x7a4a1c, 0x6e3418],
    bush: 0x24502a, rock: 0x4a4a48, plot: 0x3a3528, path: 0x34302a,
    glass: 0xffd27a, glow: 0xffb347, cloud: 0x2a3148, water: 0x1c3f5c, ripple: 0x7fb3d6,
    car: 0xd7263d, lamp: 0x3a3a40, bulb: 0xfff2c9,
    hemiSky: 0x2b3a66, hemiGround: 0x101a10, hemiI: 0.6, sunColor: 0x9fb4ff, sunI: 0.7,
    balloon: [0x8f1f2c, 0xa38c3a, 0x1f6b62],
    kinds: {
      home: [0x6e6652, 0x5a2a20], school: [0x6a3426, 0x2a2a30], campus: [0x6e6555, 0x6b3a22],
      office: [0x3a5068, 0x1f2f45], tower: [0x6a655c, 0x27497a], hospital: [0x6f6f6d, 0x8f2c2c],
      lab: [0x4a5058, 0x1f6b62], sign: [0x4a2e1a, 0x6e6652], mailbox: [0x1f3f6e, 0x6e6652],
    } as Record<Kind, [number, number]>,
  },
};
type Palette = typeof PALETTE.light;

const ACCENT_HEX: Record<Accent, number> = { saffron: 0xf26b1d, amber: 0xf5a623, coral: 0xff5e3a, rose: 0xe8457a };
const CONTAINER = [0xd7263d, 0x2a9d8f, 0x3c6fb0, 0xf4a300, 0x8e6c3a];

// Road through the whole world, left to right
const ROAD_POINTS = [
  [-6, 0, 4], [0, 0, 1], [6, 0, 5], [12, 0, 0], [18, 0, 4], [24, 0, -1], [30, 0, 3], [36, 0, -2],
  [42, 0, 3], [48, 0, 0], [54, 0, 4], [60, 0, 0], [66, 0, 3], [72, 0, -1], [78, 0, 2], [84, 0, 0], [92, 0, 2],
].map(([x, y, z]) => new THREE.Vector3(x, y, z));

const STOP_KINDS: Kind[] = ['school', 'campus', 'office', 'tower', 'hospital', 'lab', 'sign'];

const seeded = (seed: number) => () => {
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

// ─── Builders ───

type Mat = THREE.MeshStandardMaterial;
const mat = (color: number, rough = 0.85): Mat => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: rough, metalness: 0.02 });

const box = (w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

const buildKind = (kind: Kind, p: Palette, dark: boolean) => {
  const g = new THREE.Group();
  const [wallHex, trimHex] = p.kinds[kind];
  const wall = mat(wallHex);
  const wallDark = mat(shade(wallHex, 0.75));
  const trim = mat(trimHex);
  const glass = new THREE.MeshStandardMaterial({
    color: p.glass, flatShading: true, roughness: 0.3, metalness: 0.1,
    emissive: p.glow, emissiveIntensity: dark ? 0.9 : 0,
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

const makeTree = (rnd: () => number, trunk: Mat, leaves: Mat[]) => {
  const g = new THREE.Group();
  const h = 0.3 + rnd() * 0.3;
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, h, 5), trunk);
  t.position.y = h / 2;
  t.castShadow = true;
  g.add(t);
  const size = 0.35 + rnd() * 0.4;
  // Mostly green, one in five turning autumn
  const m = leaves[rnd() < 0.2 ? 5 + Math.floor(rnd() * 2) : Math.floor(rnd() * 5)];
  const style = rnd();
  let crown: THREE.Mesh;
  if (style < 0.4) crown = new THREE.Mesh(new THREE.ConeGeometry(size, size * 2.2, 6), m);
  else if (style < 0.75) crown = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 0), m);
  else crown = new THREE.Mesh(new THREE.DodecahedronGeometry(size * 0.95, 0), m);
  crown.position.y = h + (style < 0.4 ? size * 1.1 : size * 0.85);
  crown.castShadow = true;
  crown.receiveShadow = true;
  g.add(crown);
  if (style >= 0.4 && rnd() > 0.5) {
    const c2 = new THREE.Mesh(new THREE.IcosahedronGeometry(size * 0.6, 0), m);
    c2.position.set(size * 0.5, h + size * 1.2, size * 0.2);
    c2.castShadow = true;
    g.add(c2);
  }
  g.rotation.y = rnd() * Math.PI * 2;
  return g;
};

const makeCloud = (rnd: () => number, m: Mat) => {
  const g = new THREE.Group();
  const n = 3 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    const w = 0.9 + rnd() * 1.4;
    const b = box(w, 0.5 + rnd() * 0.5, 0.8 + rnd() * 0.8, m, (i - n / 2) * 0.8 + rnd() * 0.4, rnd() * 0.3, rnd() * 0.4 - 0.2);
    b.receiveShadow = false;
    g.add(b);
  }
  return g;
};

const makeBird = (m: Mat) => {
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

const roadGeometry = (curve: THREE.CatmullRomCurve3, width: number, y: number, segments = 700) => {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const pt = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    const n = new THREE.Vector3(-tan.z, 0, tan.x).normalize().multiplyScalar(width / 2);
    pos.push(pt.x + n.x, y, pt.z + n.z, pt.x - n.x, y, pt.z - n.z);
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

// ─── World ───

export const World: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dark = useDarkMode();
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
    const rnd = seeded(11);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = dark ? 0.9 : 1.05;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(p.sky);
    scene.fog = new THREE.Fog(p.fog, 16, 52);

    // A real perspective camera, raised and looking down the valley
    const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 140);
    let camOffset = new THREE.Vector3(11, 9.5, 11);
    let camShift = new THREE.Vector3();
    const fit = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const portrait = w < h;
      camOffset = portrait ? new THREE.Vector3(14, 12.5, 14) : new THREE.Vector3(11, 9.5, 11);
      camShift = w >= 768 ? new THREE.Vector3(2.2, 0, 2.2) : new THREE.Vector3(-1.4, 0, -1.4);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(mount);

    // Lights
    scene.add(new THREE.HemisphereLight(p.hemiSky, p.hemiGround, p.hemiI));
    const sun = new THREE.DirectionalLight(p.sunColor, p.sunI);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 80;
    sun.shadow.camera.left = -17; sun.shadow.camera.right = 17;
    sun.shadow.camera.top = 17; sun.shadow.camera.bottom = -17;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.03;
    sun.shadow.radius = 3;
    scene.add(sun, sun.target);
    const SUN_OFFSET = new THREE.Vector3(-9, 18, 9);

    // Night sky
    if (dark) {
      const starGeo = new THREE.BufferGeometry();
      const pts: number[] = [];
      for (let i = 0; i < 500; i++) {
        const a = rnd() * Math.PI * 2;
        const e = rnd() * Math.PI * 0.45 + 0.1;
        const r = 110;
        pts.push(43 + Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, 1 + Math.sin(a) * Math.cos(e) * r);
      }
      starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.9, sizeAttenuation: true, fog: false }));
      scene.add(stars);
    }

    // Ground, fields, road
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 110), mat(p.ground, 1));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(43, 0, 1);
    ground.receiveShadow = true;
    scene.add(ground);
    const fieldMats = p.field.map((c) => mat(c, 1));
    for (let i = 0; i < 48; i++) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(3 + rnd() * 7, 0.02, 2 + rnd() * 5), fieldMats[i % fieldMats.length]);
      f.position.set(-16 + rnd() * 122, 0.005, -20 + rnd() * 42);
      f.rotation.y = (rnd() - 0.5) * 0.4;
      f.receiveShadow = true;
      scene.add(f);
    }
    const curve = new THREE.CatmullRomCurve3(ROAD_POINTS, false, 'centripetal', 0.5);
    const kerb = new THREE.Mesh(roadGeometry(curve, 2.1, 0.015), mat(p.kerb, 1));
    kerb.receiveShadow = true;
    scene.add(kerb);
    const road = new THREE.Mesh(roadGeometry(curve, 1.7, 0.03), mat(p.road, 1));
    road.receiveShadow = true;
    scene.add(road);
    const dashMat = mat(p.dash, 1);
    const dashGeo = new THREE.BoxGeometry(0.5, 0.012, 0.07);
    const dashCount = Math.floor(curve.getLength() / 1.1);
    for (let i = 0; i < dashCount; i++) {
      const t = (i + 0.5) / dashCount;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      const d = new THREE.Mesh(dashGeo, dashMat);
      d.position.set(pt.x, 0.045, pt.z);
      d.rotation.y = Math.atan2(tan.x, tan.z) + Math.PI / 2;
      scene.add(d);
    }

    // Street lamps along the road
    const lampMat = mat(p.lamp, 0.6);
    const bulbMat = new THREE.MeshStandardMaterial({ color: p.bulb, emissive: p.bulb, emissiveIntensity: dark ? 2.5 : 0.15, flatShading: true });
    const lampCount = Math.floor(curve.getLength() / 7);
    for (let i = 0; i < lampCount; i++) {
      const t = (i + 0.5) / lampCount;
      const side: 1 | -1 = i % 2 === 0 ? 1 : -1;
      const { wrapper } = beside(curve, t, side, 1.35);
      wrapper.add(box(0.07, 1.6, 0.07, lampMat));
      wrapper.add(box(0.35, 0.05, 0.07, lampMat, 0.15, 1.6, 0));
      wrapper.add(box(0.14, 0.08, 0.1, bulbMat, 0.3, 1.52, 0));
      if (dark && i % 2 === 0) {
        const l = new THREE.PointLight(0xffd9a0, 4, 6, 2);
        l.position.set(0.3, 1.5, 0);
        wrapper.add(l);
      }
      scene.add(wrapper);
    }

    const plotMat = mat(p.plot, 1);
    const pathMat = mat(p.path, 1);
    const occupied: THREE.Vector3[] = [];
    const pickables: THREE.Object3D[] = [];
    const lifted: { group: THREE.Group; kind: NonNullable<Hover>['kind']; index: number }[] = [];
    const labels: { key: string; pos: THREE.Vector3 }[] = [];

    const place = (kind: Kind, t: number, side: 1 | -1, labelKey?: string, pick?: NonNullable<Hover>) => {
      const { wrapper, pos } = beside(curve, t, side, 3.1);
      const { group, height } = buildKind(kind, p, dark);
      wrapper.add(group);
      const plot = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.05, 3.2), plotMat);
      plot.receiveShadow = true;
      wrapper.add(plot);
      // A little path from the door to the road
      const path = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 1.6), pathMat);
      path.position.set(0, 0.0, 2.2);
      path.receiveShadow = true;
      wrapper.add(path);
      scene.add(wrapper);
      occupied.push(pos);
      if (labelKey) labels.push({ key: labelKey, pos: pos.clone().setY(height + 0.3) });
      if (pick) {
        group.traverse((o) => { o.userData.pick = pick; });
        pickables.push(group);
        lifted.push({ group: wrapper, kind: pick.kind, index: pick.index });
      }
      return pos;
    };

    place('home', 0.01, 1);

    JOURNEY.forEach((_, i) => {
      const t = lerpT(DISTRICTS.journey, i / (STOPS - 1));
      place(STOP_KINDS[i % STOP_KINDS.length], t, i % 2 === 0 ? 1 : -1, `stop-${i}`, { kind: 'stop', index: i });
    });

    // Skills yard: stacks of shipping containers and crates, one yard per category
    SKILL_GROUPS.forEach(([, skills], gi) => {
      const t = lerpT(DISTRICTS.skills, (gi + 0.5) / SKILL_GROUPS.length);
      const side: 1 | -1 = gi % 2 === 0 ? 1 : -1;
      const { wrapper, pos } = beside(curve, t, side, 3.4);
      const cluster = new THREE.Group();
      const cols = 4;
      skills.forEach((_, si) => {
        const cx = (si % cols) - (cols - 1) / 2;
        const cz = Math.floor(si / cols) - 1;
        const h = 0.45 + ((si * 7) % 5) * 0.22;
        const c = CONTAINER[(si + gi) % CONTAINER.length];
        cluster.add(box(0.62, h, 0.62, mat(dark ? shade(c, 0.6) : c, 0.7), cx * 0.72, 0, cz * 0.72));
      });
      wrapper.add(cluster);
      const plot = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.05, 3.0), mat(0x8e8a80, 1));
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
        const l = new THREE.SpotLight(0xffffff, 10, 5, 0.6, 0.6, 1.5);
        l.position.set(0, 3.4, 1.2);
        l.target = screen;
        board.add(l);
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
      const plot = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.05, 1.6), plotMat);
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
      const bank = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.03, 10), mat(p.path, 1));
      bank.position.copy(pos).setY(0.008);
      bank.receiveShadow = true;
      scene.add(bank);
      const pond = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.04, 10), new THREE.MeshStandardMaterial({ color: p.water, roughness: 0.15, metalness: 0.3, flatShading: true }));
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

    // Trees, bushes and rocks everywhere the road and buildings aren't
    const trunk = mat(p.trunk);
    const leaves = p.leaf.map((c) => mat(c));
    const bushMat = mat(p.bush);
    const rockMat = mat(p.rock, 0.95);
    const samples = Array.from({ length: 400 }, (_, i) => curve.getPointAt(i / 399));
    const trees: THREE.Group[] = [];
    const free = (x: number, z: number, roadGap: number, stopGap: number) =>
      !samples.some((s) => (s.x - x) ** 2 + (s.z - z) ** 2 < roadGap ** 2) &&
      !occupied.some((s) => (s.x - x) ** 2 + (s.z - z) ** 2 < stopGap ** 2);
    let planted = 0;
    let tries = 0;
    while (planted < 300 && tries < 2400) {
      tries++;
      const x = -18 + rnd() * 124;
      const z = -20 + rnd() * 42;
      if (!free(x, z, 2.4, 3.3)) continue;
      const tree = makeTree(rnd, trunk, leaves);
      tree.position.set(x, 0, z);
      tree.userData.phase = rnd() * Math.PI * 2;
      tree.userData.bounce = -10;
      tree.traverse((o) => { o.userData.tree = tree; });
      scene.add(tree);
      trees.push(tree);
      planted++;
    }
    for (let i = 0; i < 160; i++) {
      const x = -18 + rnd() * 124;
      const z = -20 + rnd() * 42;
      if (!free(x, z, 1.6, 2.2)) continue;
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18 + rnd() * 0.2, 0), bushMat);
      b.position.set(x, 0.12, z);
      b.castShadow = true;
      b.receiveShadow = true;
      scene.add(b);
    }
    for (let i = 0; i < 50; i++) {
      const x = -18 + rnd() * 124;
      const z = -20 + rnd() * 42;
      if (!free(x, z, 1.8, 2.2)) continue;
      const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12 + rnd() * 0.22, 0), rockMat);
      r.position.set(x, 0.08, z);
      r.rotation.set(rnd(), rnd(), rnd());
      r.castShadow = true;
      scene.add(r);
    }

    // Sky life: clouds, birds, a balloon
    const cloudMat = new THREE.MeshStandardMaterial({ color: p.cloud, flatShading: true, roughness: 1, transparent: true, opacity: dark ? 0.6 : 0.95 });
    const clouds: THREE.Group[] = [];
    for (let i = 0; i < 10; i++) {
      const c = makeCloud(rnd, cloudMat);
      c.position.set(-10 + rnd() * 110, 7 + rnd() * 2.5, -16 + rnd() * 34);
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

    // Car with lights, spinning wheels and exhaust puffs
    const car = new THREE.Group();
    const carPaint = new THREE.MeshStandardMaterial({ color: p.car, flatShading: true, roughness: 0.35, metalness: 0.25 });
    car.add(box(0.8, 0.22, 0.42, carPaint, 0, 0.1));
    car.add(box(0.42, 0.2, 0.36, new THREE.MeshStandardMaterial({ color: 0x9fd0ea, roughness: 0.2, metalness: 0.3, flatShading: true }), -0.05, 0.32));
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfff4d6, emissive: 0xffe6a8, emissiveIntensity: dark ? 2.2 : 0.4, flatShading: true });
    const tailMat = new THREE.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0xff2222, emissiveIntensity: dark ? 1.8 : 0.3, flatShading: true });
    [-0.14, 0.14].forEach((z) => {
      car.add(box(0.04, 0.06, 0.08, headMat, 0.4, 0.17, z));
      car.add(box(0.04, 0.05, 0.08, tailMat, -0.4, 0.17, z));
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
      const headlight = new THREE.SpotLight(0xffe0b0, 12, 7, 0.55, 0.5, 1.2);
      headlight.position.set(0.4, 0.3, 0);
      headlight.target.position.set(4, -0.5, 0);
      car.add(headlight, headlight.target);
    }
    const puffMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e0, transparent: true, opacity: 0.5, flatShading: true });
    const puffs = Array.from({ length: 14 }, () => {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), puffMat.clone());
      m.visible = false;
      m.userData.life = 0;
      scene.add(m);
      return m;
    });

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

    // Pointer picking: buildings, yards, billboards, trees, and the road itself
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
      const hit = raycaster.intersectObjects([road, kerb, ground])[0];
      if (!hit) return;
      let best = 0;
      let bestD = Infinity;
      samples.forEach((s, i) => {
        const d = (s.x - hit.point.x) ** 2 + (s.z - hit.point.z) ** 2;
        if (d < bestD) { bestD = d; best = i; }
      });
      if (bestD < 36) scrollToT(best / (samples.length - 1));
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
    const clock = new THREE.Clock();
    let last = { stop: -1, skill: -1, project: -1 };
    let prevT = 0;
    let puffTimer = 0;
    let frame = 0;
    let hidden = document.hidden;
    const onVisibility = () => { hidden = document.hidden; };
    document.addEventListener('visibilitychange', onVisibility);

    const tick = () => {
      frame = requestAnimationFrame(tick);
      if (hidden) return;
      const dt = Math.min(0.05, clock.getDelta());
      const now = clock.elapsedTime;

      const locals = { t: 0 } as Locals;
      let target = 0;
      KEYS.forEach((key) => {
        const l = localOf(key);
        locals[key] = l;
        if (l > 0) target = lerpT(DISTRICTS[key], l);
      });
      smoothT.current += (target - smoothT.current) * (reduced ? 1 : 0.07);
      const t = smoothT.current;
      locals.t = t;
      listeners.current.forEach((cb) => cb(locals));

      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      const speed = ((t - prevT) * curve.getLength()) / Math.max(dt, 1e-3);
      prevT = t;
      car.position.set(pt.x, 0.03 + Math.abs(Math.sin(now * 18)) * Math.min(0.012, Math.abs(speed) * 0.002), pt.z);
      car.rotation.y = Math.atan2(tan.x, tan.z) + Math.PI / 2;
      car.rotation.z = THREE.MathUtils.lerp(car.rotation.z, THREE.MathUtils.clamp(-speed * 0.01, -0.08, 0.08), 0.1);
      wheels.forEach((w) => { w.rotation.y += speed * dt * 10; });
      // The camera eases a little behind the car so corners feel like driving
      camera.position.lerp(tmp.copy(pt).add(camOffset).add(camShift), reduced ? 1 : 0.12);
      camera.lookAt(tmp.copy(pt).add(camShift).setY(0.6));
      sun.position.copy(pt).add(SUN_OFFSET);
      sun.target.position.copy(pt);

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
      puffs.forEach((m) => {
        if (!m.visible) return;
        m.userData.life -= dt * 1.4;
        if (m.userData.life <= 0) { m.visible = false; return; }
        m.position.y += dt * 0.5;
        m.scale.addScalar(dt * 1.6);
        (m.material as THREE.MeshStandardMaterial).opacity = m.userData.life * 0.45;
      });

      clouds.forEach((c) => {
        c.position.x += c.userData.speed * dt;
        if (c.position.x > 108) c.position.x = -14;
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
      windmills.forEach((w) => { (w.userData.hub as THREE.Group).rotation.z += dt * 1.1; });
      ponds.forEach((r, i) => {
        const s = 1 + ((now * 0.6 + i * 0.7) % 2);
        r.scale.setScalar(s);
        (r.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - (s - 1) / 2);
      });
      if (!reduced) {
        trees.forEach((tr) => {
          tr.rotation.z = Math.sin(now * 1.3 + tr.userData.phase) * 0.035;
          const since = now - tr.userData.bounce;
          if (since < 0.7) {
            const k = Math.sin((since / 0.7) * Math.PI);
            tr.scale.set(1 - k * 0.12, 1 + k * 0.28, 1 - k * 0.12);
          } else if (tr.scale.y !== 1) tr.scale.set(1, 1, 1);
        });
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
        if (c.position.y < 0.03) { c.position.y = 0.03; v.set(v.x * 0.6, 0, v.z * 0.6); }
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

      if (pointerInside) {
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects([...pickables, ...trees], true)[0];
        const tree = hit?.object.userData.tree as THREE.Group | undefined;
        if (tree && now - tree.userData.bounce > 0.7) tree.userData.bounce = now;
        const h = (hit?.object.userData.pick as NonNullable<Hover> | undefined) ?? null;
        const prev = hoveredRef.current;
        if ((h?.kind ?? null) !== (prev?.kind ?? null) || (h?.index ?? -1) !== (prev?.index ?? -1)) setHovered(h);
        mount.style.cursor = h ? 'pointer' : hit ? 'grab' : '';
      }

      const hov = hoveredRef.current;
      lifted.forEach((l) => {
        const active = (hov && hov.kind === l.kind && hov.index === l.index) || cur[l.kind] === l.index;
        const s = active ? 1.06 : 1;
        l.group.scale.lerp(tmp.set(s, s, s), reduced ? 1 : 0.12);
      });

      const w = mount.clientWidth;
      const h = mount.clientHeight;
      labels.forEach((l) => {
        const el = labelRefs.current[l.key];
        if (!el) return;
        tmp.copy(l.pos).project(camera);
        const x = (tmp.x * 0.5 + 0.5) * w;
        const y = (-tmp.y * 0.5 + 0.5) * h;
        const on = tmp.z < 1 && x > -80 && x < w + 80 && y > -40 && y < h + 40;
        el.style.transform = `translate(-50%, -100%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        el.style.opacity = on ? '1' : '0';
        el.style.pointerEvents = on ? 'auto' : 'none';
      });

      renderer.render(scene, camera);
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
        if (o instanceof THREE.Mesh || o instanceof THREE.Points) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
        }
      });
      textures.forEach((tx) => tx.dispose());
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [dark, setHovered, scrollToLocal]);

  const labelClass = (on: boolean) =>
    `absolute left-0 top-0 flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 font-display text-[10px] uppercase tracking-wide transition-colors duration-300 will-change-transform
     ${on ? 'border-white bg-[#1f7a3f] text-white shadow-lift' : 'border-line bg-surface/90 text-ink backdrop-blur hover:bg-surface'}`;
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
