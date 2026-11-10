import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import landDots from "../data/land-dots.json";

// Cities on the globe. kind: "egypt" (origin), "eu", "uk" (from 2027), "future" (planned).
const CITIES = [
  { id: "cairo", lat: 30.04, lon: 31.24, kind: "egypt" },
  { id: "alexandria", lat: 31.2, lon: 29.92, kind: "egypt" },
  { id: "suez", lat: 29.97, lon: 32.55, kind: "egypt" },
  { id: "rotterdam", lat: 51.92, lon: 4.48, kind: "eu" },
  { id: "berlin", lat: 52.52, lon: 13.4, kind: "eu" },
  { id: "paris", lat: 48.86, lon: 2.35, kind: "eu" },
  { id: "rome", lat: 41.9, lon: 12.5, kind: "eu" },
  { id: "london", lat: 51.51, lon: -0.13, kind: "uk" },
  { id: "casablanca", lat: 33.57, lon: -7.59, kind: "future" },
  { id: "riyadh", lat: 24.71, lon: 46.68, kind: "future" },
  { id: "istanbul", lat: 41.01, lon: 28.98, kind: "future" },
  { id: "mumbai", lat: 19.08, lon: 72.88, kind: "future" },
  { id: "johannesburg", lat: -26.2, lon: 28.05, kind: "future" },
];
const ROUTES = [
  ["alexandria", "rotterdam", "live"],
  ["cairo", "berlin", "live"],
  ["cairo", "paris", "live"],
  ["alexandria", "rome", "live"],
  ["cairo", "london", "uk"],
  ["casablanca", "rotterdam", "future"],
  ["riyadh", "rotterdam", "future"],
  ["istanbul", "berlin", "future"],
  ["mumbai", "rotterdam", "future"],
  ["johannesburg", "london", "future"],
];
const COLORS = { egypt: 0xe2b35c, eu: 0xf2eee6, uk: 0xf2eee6, future: 0x7fa3aa };

function toVector(THREE, lat, lon, r = 1) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

export default function Globe({ className = "" }) {
  const { t } = useLanguage();
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const [hover, setHover] = useState(null); // { id, x, y }
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Load Three.js only when the globe mounts, so the rest of the page is light.
    import("three").then((THREE) => {
      if (disposed) return;
      const host = hostRef.current;
      const canvas = canvasRef.current;
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      } catch {
        setFailed(true);
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      camera.position.set(0, 0, 3.6);

      scene.add(new THREE.AmbientLight(0xffffff, 0.7));
      const sun = new THREE.DirectionalLight(0xfff2dc, 1.1);
      sun.position.set(-2, 2, 3);
      scene.add(sun);

      // Pivot: pitch on the outer group, yaw on the inner one.
      const pitch = new THREE.Group();
      const yaw = new THREE.Group();
      pitch.add(yaw);
      scene.add(pitch);

      // Ocean sphere and a thin gold rim.
      yaw.add(new THREE.Mesh(new THREE.SphereGeometry(0.995, 64, 64), new THREE.MeshStandardMaterial({ color: 0x0c4450, roughness: 0.9, metalness: 0.05 })));
      const rim = new THREE.Mesh(new THREE.SphereGeometry(1.06, 64, 64), new THREE.MeshBasicMaterial({ color: 0xc8963e, transparent: true, opacity: 0.06, side: THREE.BackSide }));
      scene.add(rim);

      // Land as round gold dots.
      const dotCanvas = document.createElement("canvas");
      dotCanvas.width = dotCanvas.height = 32;
      const ctx = dotCanvas.getContext("2d");
      ctx.beginPath();
      ctx.arc(16, 16, 14, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      const positions = new Float32Array(landDots.length * 3);
      landDots.forEach(([lat, lon], i) => toVector(THREE, lat, lon, 1.001).toArray(positions, i * 3));
      const dotsGeo = new THREE.BufferGeometry();
      dotsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const dotsMat = new THREE.PointsMaterial({ size: 0.024, color: 0xe6c27a, map: new THREE.CanvasTexture(dotCanvas), transparent: true, alphaTest: 0.35, opacity: 1 });
      yaw.add(new THREE.Points(dotsGeo, dotsMat));

      // City markers, with larger invisible hit targets for hover.
      const byId = Object.fromEntries(CITIES.map((c) => [c.id, c]));
      const hitTargets = [];
      for (const c of CITIES) {
        const pos = toVector(THREE, c.lat, c.lon, 1.012);
        const size = c.kind === "egypt" ? 0.022 : 0.016;
        const marker = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 16), new THREE.MeshBasicMaterial({ color: COLORS[c.kind], transparent: c.kind === "future", opacity: c.kind === "future" ? 0.8 : 1 }));
        marker.position.copy(pos);
        yaw.add(marker);
        if (c.kind === "egypt" || c.kind === "uk") {
          const ring = new THREE.Mesh(new THREE.RingGeometry(size * 1.6, size * 2.1, 32), new THREE.MeshBasicMaterial({ color: COLORS[c.kind], transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
          ring.position.copy(pos);
          ring.lookAt(pos.clone().multiplyScalar(2));
          yaw.add(ring);
        }
        const hit = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ visible: false }));
        hit.position.copy(pos);
        hit.userData.id = c.id;
        yaw.add(hit);
        hitTargets.push(hit);
      }

      // Routes: solid gold arcs (live), lighter arc to the UK, dashed lines (future).
      const packets = [];
      for (const [from, to, kind] of ROUTES) {
        const a = toVector(THREE, byId[from].lat, byId[from].lon, 1.01);
        const b = toVector(THREE, byId[to].lat, byId[to].lon, 1.01);
        const lift = 1 + a.distanceTo(b) * 0.45;
        const mid = a.clone().add(b).normalize().multiplyScalar(lift);
        const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
        if (kind === "future") {
          const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(64)), new THREE.LineDashedMaterial({ color: COLORS.future, dashSize: 0.025, gapSize: 0.02, transparent: true, opacity: 0.7 }));
          line.computeLineDistances();
          yaw.add(line);
        } else {
          const color = kind === "uk" ? 0xf2eee6 : 0xe2b35c;
          yaw.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.0035, 6, false), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 })));
          const packet = new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 12), new THREE.MeshBasicMaterial({ color: 0xfff4d6 }));
          yaw.add(packet);
          packets.push({ packet, curve, offset: Math.random() });
        }
      }

      // Face the Mediterranean: Egypt and Europe in view.
      const focus = { lat: 38, lon: 18 };
      const theta = ((focus.lon + 180) * Math.PI) / 180;
      const baseYaw = -Math.atan2(-Math.cos(theta), Math.sin(theta));
      const basePitch = (focus.lat * Math.PI) / 180;
      const state = { yaw: baseYaw, pitch: basePitch, vYaw: 0, dragging: false, lastX: 0, lastY: 0, idle: 0, visible: true };

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const onMove = (e) => {
        const r = host.getBoundingClientRect();
        if (state.dragging) {
          const dx = e.clientX - state.lastX, dy = e.clientY - state.lastY;
          state.vYaw = dx * 0.006;
          state.yaw += state.vYaw;
          state.pitch = Math.max(-0.9, Math.min(1.2, state.pitch + dy * 0.004));
          state.lastX = e.clientX;
          state.lastY = e.clientY;
        }
        state.idle = 0;
        pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(hitTargets)[0];
        if (hit) {
          // Only show markers on the visible side of the globe.
          const world = hit.object.getWorldPosition(new THREE.Vector3());
          if (world.z > 0) {
            setHover({ id: hit.object.userData.id, x: e.clientX - r.left, y: e.clientY - r.top });
            return;
          }
        }
        setHover(null);
      };
      const onDown = (e) => {
        state.dragging = true;
        state.lastX = e.clientX;
        state.lastY = e.clientY;
        host.setPointerCapture?.(e.pointerId);
      };
      const onUp = () => (state.dragging = false);
      const onLeave = () => {
        state.dragging = false;
        setHover(null);
      };
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerdown", onDown);
      host.addEventListener("pointerup", onUp);
      host.addEventListener("pointerleave", onLeave);

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = host;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(host);
      resize();
      const io = new IntersectionObserver(([en]) => (state.visible = en.isIntersecting));
      io.observe(host);

      const clock = new THREE.Clock();
      let raf;
      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (!state.visible) return;
        const dt = clock.getDelta();
        const time = clock.elapsedTime;
        if (!state.dragging) {
          state.vYaw *= 0.94;
          state.yaw += state.vYaw;
          state.idle += dt;
          // Untouched for a while: ease back so Egypt and Europe stay in view,
          // with a slow sway around them (none with reduced motion).
          if (state.idle > 3) {
            const sway = reduceMotion ? 0 : Math.sin(time * 0.25) * 0.35;
            state.yaw += (baseYaw + sway - state.yaw) * 0.02;
            state.pitch += (basePitch - state.pitch) * 0.02;
          }
        }
        yaw.rotation.y = state.yaw;
        pitch.rotation.x = state.pitch;
        if (!reduceMotion) for (const p of packets) p.packet.position.copy(p.curve.getPoint((time * 0.18 + p.offset) % 1));
        renderer.render(scene, camera);
      };
      loop();

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        host.removeEventListener("pointermove", onMove);
        host.removeEventListener("pointerdown", onDown);
        host.removeEventListener("pointerup", onUp);
        host.removeEventListener("pointerleave", onLeave);
        renderer.dispose();
        scene.traverse((o) => {
          o.geometry?.dispose?.();
          o.material?.dispose?.();
        });
      };
    }).catch(() => setFailed(true));

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={`relative cursor-grab touch-none select-none active:cursor-grabbing ${className}`}
      role="img"
      aria-label={t("globe.label")}
    >
      {!failed && <canvas ref={canvasRef} className="block h-full w-full" />}
      {failed && <div className="flex h-full items-center justify-center text-sm text-on-nile-2">{t("globe.label")}</div>}
      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+12px)] whitespace-nowrap rounded-control bg-cream px-3 py-1.5 text-xs font-medium text-text shadow-float"
          style={{ left: hover.x, top: hover.y }}
        >
          {t(`globe.cities.${hover.id}`)}
        </div>
      )}
    </div>
  );
}
