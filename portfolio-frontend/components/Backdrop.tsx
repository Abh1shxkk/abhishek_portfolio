import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PageSky } from './PageSky';
import { useDarkMode, canUseWebGL } from './ui';
import { PALETTE, SKY_SUN_DIR, box, buildKind, glowTexture, makeBird, makeCloud, mat, seeded, type Kind } from './World';

/*
 * A living street corner behind the inner pages (all projects, case studies, blog): the same
 * low-poly town as the home page, seen from the pavement. Clouds drift, birds circle, the car
 * drives past now and then, and the camera leans a little with the mouse and the scroll.
 * Much lighter than the full world: no shadows, no picking, ~40 draw calls.
 */

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Buildings along the far side of the street, left to right
const STREET: { kind: Kind; x: number }[] = [
  { kind: 'office', x: -12.5 }, { kind: 'school', x: -8.2 }, { kind: 'campus', x: -3.2 }, { kind: 'tower', x: 1.8 },
  { kind: 'hospital', x: 6.4 }, { kind: 'lab', x: 10.6 }, { kind: 'home', x: 14.6 },
];

export const Backdrop: React.FC = () => {
  const dark = useDarkMode({ deferred: true });
  const mountRef = useRef<HTMLDivElement>(null);
  const noGl = !canUseWebGL();

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || noGl) return;
    const p = dark ? PALETTE.dark : PALETTE.light;
    const rnd = seeded(5);
    const reduced = reducedMotion();
    const small = Math.min(window.innerWidth, window.innerHeight) < 700 || (navigator.hardwareConcurrency ?? 8) <= 4;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.25 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(p.fog);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(p.fog, 30, 120);
    const camera = new THREE.PerspectiveCamera(36, 1, 0.5, 300);
    const CAM = new THREE.Vector3(0, 2.4, 11);
    const LOOK = new THREE.Vector3(0, 2.0, 0);

    const fit = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(mount);

    // Sky dome, sun or moon
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(240, 20, 10),
      new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false, fog: false,
        uniforms: {
          uZenith: { value: new THREE.Color(p.zenith) }, uHorizon: { value: new THREE.Color(p.horizon) },
          uSunDir: { value: SKY_SUN_DIR.clone() }, uSunColor: { value: new THREE.Color(p.sunColor) }, uGlow: { value: p.sunGlow },
        },
        vertexShader: `varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `
          uniform vec3 uZenith, uHorizon, uSunDir, uSunColor; uniform float uGlow; varying vec3 vDir;
          void main() {
            vec3 d = normalize(vDir);
            vec3 col = mix(uHorizon, uZenith, pow(clamp(d.y, 0.0, 1.0), 0.5));
            float s = max(dot(d, uSunDir), 0.0);
            col += uSunColor * (pow(s, 64.0) * 0.55 + pow(s, 6.0) * 0.16) * uGlow;
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      })
    );
    sky.frustumCulled = false;
    scene.add(sky);
    const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(dark ? 'rgba(236,240,255,0.95)' : 'rgba(255,250,232,1)', dark ? 'rgba(170,190,255,0.25)' : 'rgba(255,200,120,0.5)'),
      transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, toneMapped: false,
    }));
    sunGlow.scale.setScalar(dark ? 26 : 40);
    sunGlow.position.copy(CAM).addScaledVector(SKY_SUN_DIR, 200);
    scene.add(sunGlow);
    const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(dark ? 2.2 : 3.4, 16, 12), new THREE.MeshBasicMaterial({ color: p.sunDisc, fog: false, toneMapped: false }));
    sunDisc.position.copy(sunGlow.position);
    scene.add(sunDisc);
    if (dark) {
      const pts: number[] = [];
      for (let i = 0; i < 400; i++) {
        const a = rnd() * Math.PI * 2;
        const e = rnd() * Math.PI * 0.45 + 0.05;
        pts.push(Math.cos(a) * Math.cos(e) * 220, Math.sin(e) * 220, Math.sin(a) * Math.cos(e) * 220);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.3, fog: false, transparent: true, opacity: 0.85 })));
    }

    // Lights (no shadows on this page: cheap and the wall covers most of the ground anyway)
    scene.add(new THREE.HemisphereLight(p.hemiSky, p.hemiGround, p.hemiI));
    const sun = new THREE.DirectionalLight(p.sunColor, p.sunI);
    sun.position.set(-20, 30, 14);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(p.fillColor, p.fillI);
    fill.position.set(10, 8, 20);
    scene.add(fill);

    // Ground, far hills, street and pavement
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mat(p.ground, 1));
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    const hillMat = mat(p.mountain, 1);
    for (let i = 0; i < 9; i++) {
      const h = 6 + rnd() * 9;
      const hill = new THREE.Mesh(new THREE.ConeGeometry(9 + rnd() * 10, h, 5), hillMat);
      hill.position.set(-60 + i * 15 + rnd() * 6, h / 2 - 0.5, -42 - rnd() * 18);
      hill.rotation.y = rnd() * Math.PI;
      scene.add(hill);
    }
    const road = new THREE.Mesh(new THREE.BoxGeometry(90, 0.04, 4.2), mat(p.road, 1));
    road.position.set(0, 0.02, 4.4);
    scene.add(road);
    const dashMat = mat(p.dash, 1);
    for (let x = -44; x < 44; x += 1.3) {
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.012, 0.08), dashMat);
      d.position.set(x, 0.05, 4.4);
      scene.add(d);
    }
    const pavement = new THREE.Mesh(new THREE.BoxGeometry(90, 0.12, 2.4), mat(p.kerb, 1));
    pavement.position.set(0, 0.06, 1.2);
    scene.add(pavement);

    // Buildings, trees between them, lamps on the pavement
    STREET.forEach(({ kind, x }) => {
      const { group } = buildKind(kind, p, dark);
      group.position.set(x, 0, -2.2);
      group.scale.setScalar(1.6);
      scene.add(group);
    });
    const trunk = mat(p.trunk);
    const leaves = p.leaf.slice(0, 5).map((c) => mat(c));
    for (let i = 0; i < 14; i++) {
      const x = -16 + i * 2.5 + (rnd() - 0.5) * 1.2;
      const z = i % 2 ? -0.1 : -5.6 - rnd() * 3;
      const h = 0.5 + rnd() * 0.4;
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, h, 5), trunk);
      t.position.set(x, h / 2, z);
      scene.add(t);
      const size = 0.55 + rnd() * 0.45;
      const crown = new THREE.Mesh(rnd() > 0.5 ? new THREE.IcosahedronGeometry(size, 0) : new THREE.ConeGeometry(size, size * 2.2, 6), leaves[Math.floor(rnd() * leaves.length)]);
      crown.position.set(x, h + size * 0.85, z);
      crown.rotation.y = rnd() * Math.PI;
      scene.add(crown);
    }
    const lampMat = mat(p.lamp, 0.6);
    const bulbMat = new THREE.MeshStandardMaterial({ color: p.bulb, emissive: p.bulb, emissiveIntensity: dark ? 1.4 : 0.15, flatShading: true });
    const haloMat = new THREE.SpriteMaterial({
      map: glowTexture('rgba(255,236,190,0.55)', 'rgba(255,190,110,0.14)'),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    });
    for (let x = -14; x <= 14; x += 7) {
      const lamp = new THREE.Group();
      lamp.add(box(0.08, 2.4, 0.08, lampMat));
      lamp.add(box(0.5, 0.06, 0.08, lampMat, 0.22, 2.4, 0));
      lamp.add(box(0.18, 0.1, 0.12, bulbMat, 0.42, 2.3, 0));
      if (dark) {
        const halo = new THREE.Sprite(haloMat);
        halo.position.set(0.42, 2.3, 0);
        halo.scale.setScalar(1.1);
        lamp.add(halo);
        const l = new THREE.PointLight(0xffd9a0, 2.5, 7, 2);
        l.position.set(0.42, 2.2, 0);
        lamp.add(l);
      }
      lamp.position.set(x, 0.12, 2.1);
      scene.add(lamp);
    }

    // Clouds and birds
    const cloudMat = new THREE.MeshStandardMaterial({ color: p.cloud, flatShading: true, roughness: 1, transparent: true, opacity: dark ? 0.7 : 0.96 });
    const clouds: THREE.Group[] = [];
    for (let i = 0; i < 7; i++) {
      const c = makeCloud(rnd, cloudMat);
      c.position.set(-40 + rnd() * 80, 9 + rnd() * 5, -20 - rnd() * 25);
      c.scale.setScalar(1.4 + rnd());
      c.userData.speed = 0.3 + rnd() * 0.35;
      scene.add(c);
      clouds.push(c);
    }
    const flock = new THREE.Group();
    const birdMat = mat(0x2a2a30);
    for (let b = 0; b < 6; b++) {
      const bird = makeBird(birdMat);
      bird.position.set((b - 2.5) * 0.5, Math.abs(b - 2.5) * -0.15, Math.abs(b - 2.5) * 0.4);
      flock.add(bird);
    }
    flock.position.y = 8;
    scene.add(flock);

    // The car passes along the street now and then
    const car = new THREE.Group();
    const paint = new THREE.MeshStandardMaterial({ color: p.car, flatShading: true, roughness: 0.35, metalness: 0.25 });
    car.add(box(0.82, 0.2, 0.42, paint, 0, 0.1));
    car.add(box(0.46, 0.18, 0.38, new THREE.MeshStandardMaterial({ color: 0x9fd0ea, roughness: 0.2, metalness: 0.3, flatShading: true }), -0.04, 0.3));
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfff4d6, emissive: 0xffe6a8, emissiveIntensity: dark ? 2.2 : 0.4, flatShading: true });
    const tailMat = new THREE.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0xff2222, emissiveIntensity: dark ? 1.6 : 0.3, flatShading: true });
    [-0.14, 0.14].forEach((z) => {
      car.add(box(0.04, 0.06, 0.08, headMat, 0.41, 0.17, z));
      car.add(box(0.04, 0.05, 0.08, tailMat, -0.41, 0.17, z));
    });
    const wheelGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 10);
    const wheelMat = mat(0x1e1e22, 0.9);
    const wheels: THREE.Mesh[] = [];
    [[-0.26, 0.22], [0.26, 0.22], [-0.26, -0.22], [0.26, -0.22]].forEach(([x, z]) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.x = Math.PI / 2;
      w.position.set(x, 0.1, z);
      car.add(w);
      wheels.push(w);
    });
    car.scale.setScalar(1.5);
    car.position.set(-30, 0.04, 5.2);
    scene.add(car);
    let carX = -30;
    let carWait = 2;

    // Parallax from the mouse and the scroll
    const target = new THREE.Vector2();
    const smooth = new THREE.Vector2();
    const onMove = (e: PointerEvent) => target.set((e.clientX / window.innerWidth - 0.5) * 2, (e.clientY / window.innerHeight - 0.5) * 2);
    window.addEventListener('pointermove', onMove, { passive: true });

    const clock = new THREE.Clock();
    let frame = 0;
    let hidden = document.hidden;
    const onVisibility = () => { hidden = document.hidden; };
    document.addEventListener('visibilitychange', onVisibility);
    const tmp = new THREE.Vector3();

    const tick = () => {
      frame = requestAnimationFrame(tick);
      if (hidden) return;
      const dt = Math.min(0.05, clock.getDelta());
      const now = clock.elapsedTime;

      smooth.lerp(target, 0.05);
      const scroll = Math.min(1, window.scrollY / Math.max(1, window.innerHeight * 2));
      camera.position.set(CAM.x + smooth.x * 0.9, CAM.y - smooth.y * 0.35 + scroll * 1.6, CAM.z - scroll * 2.5);
      camera.lookAt(tmp.copy(LOOK).add(new THREE.Vector3(smooth.x * 0.4, -smooth.y * 0.2 + scroll * 0.6, 0)));
      sky.position.copy(camera.position);

      if (!reduced) {
        clouds.forEach((c) => {
          c.position.x += c.userData.speed * dt;
          if (c.position.x > 46) c.position.x = -46;
        });
        flock.position.x = Math.sin(now * 0.1) * 22;
        flock.position.z = -14 + Math.cos(now * 0.07) * 8;
        flock.rotation.y = Math.atan2(Math.cos(now * 0.1) * 2.2, -Math.sin(now * 0.07) * 0.56);
        flock.children.forEach((bird, i) => {
          const flap = Math.sin(now * 9 + i) * 0.6;
          const [l, r] = bird.userData.wings as THREE.Mesh[];
          l.rotation.z = flap;
          r.rotation.z = -flap;
        });

        // Car: wait at the left, drive across, wait again
        if (carWait > 0) carWait -= dt;
        else {
          carX += 7 * dt;
          wheels.forEach((w) => { w.rotation.y -= 7 * dt * 10; });
          if (carX > 32) { carX = -32; carWait = 6 + rnd() * 8; }
        }
        car.position.x = carX;
        car.position.y = 0.04 + (carWait > 0 ? 0 : Math.abs(Math.sin(now * 18)) * 0.01);
      }

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVisibility);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Points || o instanceof THREE.Sprite) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
            if ((m as THREE.SpriteMaterial).map) (m as THREE.SpriteMaterial).map?.dispose();
            m.dispose();
          });
        }
      });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [dark, noGl]);

  if (noGl) return <PageSky />;
  return <div ref={mountRef} className="pointer-events-none fixed inset-0 z-0 [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full" aria-hidden="true" />;
};
