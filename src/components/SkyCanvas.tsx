import { useEffect, useRef, type RefObject } from "react";

export type Camera = { x: number; y: number; zoom: number };

type Layer = {
  x: number;
  y: number;
  r: number;
  a: number;
  tw: number;
  ph: number;
  /** базовый цвет без альфы — кэшируется, чтобы не строить строки каждый кадр */
  c1: string;
  c2: string;
};

type Shooting = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
};

const LAYERS = [
  { count: 320, parallax: 0.06, rMin: 0.35, rMax: 0.95, aMin: 0.18, aMax: 0.55 },
  { count: 170, parallax: 0.16, rMin: 0.6, rMax: 1.5, aMin: 0.25, aMax: 0.75 },
  { count: 70, parallax: 0.34, rMin: 1.0, rMax: 2.2, aMin: 0.35, aMax: 0.95 },
];

const TAU = Math.PI * 2;
/** запас вокруг вьюпорта для запечённой туманности (сдвиг параллакса не более ~75px) */
const NEB_PAD = 160;

const NEB_BLOBS: [number, number, number, string][] = [
  [0.22, 0.28, 0.62, "rgba(74,86,190,0.30)"],
  [0.78, 0.24, 0.5, "rgba(150,80,190,0.20)"],
  [0.55, 0.82, 0.66, "rgba(40,110,170,0.20)"],
  [0.12, 0.78, 0.42, "rgba(190,110,140,0.13)"],
  [0.9, 0.66, 0.44, "rgba(70,160,190,0.14)"],
];

export default function SkyCanvas({ cameraRef }: { cameraRef: RefObject<Camera> }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let layers: Layer[][] = [];
    let shooting: Shooting | null = null;
    let nextShoot = 3000 + Math.random() * 6000;
    let last = performance.now();
    let t = 0;

    let bgGrad: CanvasGradient | null = null;
    let vignetteGrad: CanvasGradient | null = null;

    // туманность рисуется один раз на размер и затем просто копируется с параллаксом
    const nebCanvas = document.createElement("canvas");
    const nebCtx = nebCanvas.getContext("2d");
    let nebW = 0;
    let nebH = 0;

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const build = () => {
      layers = LAYERS.map((cfg) => {
        const arr: Layer[] = [];
        const n = Math.round((cfg.count * (w * h)) / (1440 * 900));
        for (let i = 0; i < Math.max(40, n); i++) {
          const hue = Math.random() < 0.18 ? rand(200, 260) : rand(35, 60);
          arr.push({
            x: Math.random(),
            y: Math.random(),
            r: rand(cfg.rMin, cfg.rMax),
            a: rand(cfg.aMin, cfg.aMax),
            tw: rand(0.4, 1.7),
            ph: Math.random() * Math.PI * 2,
            c1: `hsl(${hue}, 90%, ${hue > 150 ? 82 : 92}%)`,
            c2: `hsl(${hue}, 90%, 85%)`,
          });
        }
        return arr;
      });
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // статичные градиенты создаём один раз на размер, а не каждый кадр
      bgGrad = ctx.createLinearGradient(0, 0, w * 0.4, h);
      bgGrad.addColorStop(0, "#070a1a");
      bgGrad.addColorStop(0.5, "#050713");
      bgGrad.addColorStop(1, "#03040c");

      vignetteGrad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.78);
      vignetteGrad.addColorStop(0, "rgba(0,0,0,0)");
      vignetteGrad.addColorStop(1, "rgba(0,0,0,0.62)");

      nebW = w + NEB_PAD * 2;
      nebH = h + NEB_PAD * 2;
      nebCanvas.width = Math.floor(nebW * dpr);
      nebCanvas.height = Math.floor(nebH * dpr);
      if (nebCtx) {
        nebCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        nebCtx.clearRect(0, 0, nebW, nebH);
        const base = Math.max(w, h);
        for (const [bx, by, br, color] of NEB_BLOBS) {
          const cx = bx * w + NEB_PAD;
          const cy = by * h + NEB_PAD;
          const r = br * base;
          const g = nebCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
          g.addColorStop(0, color);
          g.addColorStop(1, "rgba(0,0,0,0)");
          nebCtx.fillStyle = g;
          nebCtx.fillRect(0, 0, nebW, nebH);
        }
      }

      build();
    };

    const frame = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      t += dt / 1000;

      const cam = cameraRef.current ?? { x: 0, y: 0, zoom: 1 };

      if (bgGrad) {
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
      }

      const ox = -cam.x * 0.05;
      const oy = -cam.y * 0.05;
      ctx.drawImage(nebCanvas, ox * 0.5 - NEB_PAD, oy * 0.5 - NEB_PAD, nebW, nebH);

      const zoomScale = 0.85 + cam.zoom * 0.2;
      for (let li = 0; li < layers.length; li++) {
        const arr = layers[li];
        const p = LAYERS[li].parallax;
        const sx = -cam.x * p;
        const sy = -cam.y * p;
        for (let i = 0; i < arr.length; i++) {
          const s = arr[i];
          let x = (s.x * w + sx) % w;
          let y = (s.y * h + sy) % h;
          if (x < 0) x += w;
          if (y < 0) y += h;
          const alpha = s.a * (0.62 + 0.38 * Math.sin(t * s.tw + s.ph));
          const r = s.r * zoomScale;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = s.c1;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          ctx.fill();
          if (r > 1.4) {
            ctx.globalAlpha = alpha * 0.13;
            ctx.fillStyle = s.c2;
            ctx.beginPath();
            ctx.arc(x, y, r * 4.5, 0, TAU);
            ctx.fill();
          }
        }
      }
      ctx.globalAlpha = 1;

      // shooting stars
      nextShoot -= dt;
      if (!shooting && nextShoot <= 0) {
        const fromLeft = Math.random() < 0.5;
        shooting = {
          x: fromLeft ? rand(-0.1, 0.4) * w : rand(0.6, 1.1) * w,
          y: rand(-0.05, 0.45) * h,
          vx: (fromLeft ? 1 : -1) * rand(0.42, 0.72),
          vy: rand(0.16, 0.34),
          life: 0,
          max: rand(900, 1500),
        };
        nextShoot = 7000 + Math.random() * 12000;
      }
      if (shooting) {
        shooting.life += dt;
        const prog = shooting.life / shooting.max;
        shooting.x += shooting.vx * dt;
        shooting.y += shooting.vy * dt;
        const fade = Math.sin(Math.PI * Math.min(1, prog));
        const tailX = shooting.x - shooting.vx * 190;
        const tailY = shooting.y - shooting.vy * 190;
        const g = ctx.createLinearGradient(shooting.x, shooting.y, tailX, tailY);
        g.addColorStop(0, `rgba(255,255,255,${0.85 * fade})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(shooting.x, shooting.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        if (prog >= 1) shooting = null;
      }

      // vignette
      if (vignetteGrad) {
        ctx.fillStyle = vignetteGrad;
        ctx.fillRect(0, 0, w, h);
      }

      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [cameraRef]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />;
}
