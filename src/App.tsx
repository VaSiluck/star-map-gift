import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SkyCanvas, { type Camera } from "./components/SkyCanvas";
import StarField from "./components/StarField";
import MemoryWindow, { WIN_W, type WindowState } from "./components/MemoryWindow";
import ConstellationPanel from "./components/ConstellationPanel";
import Intro from "./components/Intro";
import FinalLetter from "./components/FinalLetter";
import EditorPanel from "./components/editor/EditorPanel";
import { useData } from "./data/store";
import { WORLD_H, WORLD_W, type Star } from "./data/memories";

const LS_FOUND = "starmap.discovered.v1";
const LS_INTRO = "starmap.intro.v1";
const MIN_Z = 0.28;
const MAX_Z = 2.1;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function loadFound(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_FOUND);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    /* ignore */
  }
  return new Set();
}

export default function App() {
  const { constellations, polaris, editMode, moveStar, updateStar, updatePolaris, lineDrawing, lineClick } = useData();

  const starIndex = useMemo(
    () =>
      Object.fromEntries(
        constellations.flatMap((c) => c.stars.map((s) => [s.id, { star: s, constellation: c }])),
      ) as Record<string, { star: Star; constellation: (typeof constellations)[number] }>,
    [constellations],
  );
  const TOTAL_STARS = useMemo(
    () => constellations.reduce((a, c) => a + c.stars.length, 0),
    [constellations],
  );

  const [size, setSize] = useState(() => ({
    w: typeof window === "undefined" ? 1440 : window.innerWidth,
    h: typeof window === "undefined" ? 900 : window.innerHeight,
  }));
  const isMobile = size.w < 768;

  const initialZoom = useMemo(
    () => clamp(Math.min(size.w / WORLD_W, size.h / WORLD_H) * 0.98, MIN_Z, 0.9),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [camera, setCamera] = useState<Camera>({ x: WORLD_W / 2, y: WORLD_H / 2, zoom: initialZoom });
  const cameraRef = useRef<Camera>(camera);
  cameraRef.current = camera;

  const [discovered, setDiscovered] = useState<Set<string>>(() => loadFound());
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [showFinal, setShowFinal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return localStorage.getItem(LS_INTRO) !== "done";
    } catch {
      return true;
    }
  });

  const zRef = useRef(100);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({ active: false, sx: 0, sy: 0, cx: 0, cy: 0, moved: 0 });
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);
  const animRef = useRef<number | null>(null);
  const finaleRef = useRef(false);

  const allFound = discovered.size >= TOTAL_STARS && TOTAL_STARS > 0;

  /* ---------- viewport ---------- */
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  /* ---------- persistence ---------- */
  useEffect(() => {
    try {
      localStorage.setItem(LS_FOUND, JSON.stringify([...discovered]));
    } catch {
      /* ignore */
    }
  }, [discovered]);

  /* ---------- camera helpers ---------- */
  const clampCam = useCallback((c: Camera): Camera => {
    const m = 420;
    return {
      zoom: clamp(c.zoom, MIN_Z, MAX_Z),
      x: clamp(c.x, -m, WORLD_W + m),
      y: clamp(c.y, -m, WORLD_H + m),
    };
  }, []);

  const flyTo = useCallback(
    (x: number, y: number, zoom?: number, dur = 900) => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      const from = { ...cameraRef.current };
      const to = clampCam({ x, y, zoom: zoom ?? cameraRef.current.zoom });
      const t0 = performance.now();
      const step = (now: number) => {
        const p = clamp((now - t0) / dur, 0, 1);
        const e = easeOut(p);
        setCamera({
          x: from.x + (to.x - from.x) * e,
          y: from.y + (to.y - from.y) * e,
          zoom: from.zoom + (to.zoom - from.zoom) * e,
        });
        if (p < 1) animRef.current = requestAnimationFrame(step);
      };
      animRef.current = requestAnimationFrame(step);
    },
    [clampCam],
  );

  const zoomAt = useCallback(
    (factor: number, mx: number, my: number) => {
      setCamera((c) => {
        const nz = clamp(c.zoom * factor, MIN_Z, MAX_Z);
        const wx = c.x + (mx - size.w / 2) / c.zoom;
        const wy = c.y + (my - size.h / 2) / c.zoom;
        return clampCam({
          zoom: nz,
          x: wx - (mx - size.w / 2) / nz,
          y: wy - (my - size.h / 2) / nz,
        });
      });
    },
    [clampCam, size.w, size.h],
  );

  /* ---------- wheel zoom ---------- */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (animRef.current) cancelAnimationFrame(animRef.current);
      const factor = Math.exp(-e.deltaY * 0.0016);
      zoomAt(factor, e.clientX, e.clientY);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  /* ---------- pan / pinch ---------- */
  const onPointerDown = (e: React.PointerEvent) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: cameraRef.current.zoom };
      dragRef.current.active = false;
      return;
    }
    if (animRef.current) cancelAnimationFrame(animRef.current);
    dragRef.current = {
      active: true,
      sx: e.clientX,
      sy: e.clientY,
      cx: cameraRef.current.x,
      cy: cameraRef.current.y,
      moved: 0,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    if (pointersRef.current.size === 2 && pinchRef.current) {
      const [a, b] = [...pointersRef.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const nz = clamp((pinchRef.current.zoom * d) / pinchRef.current.dist, MIN_Z, MAX_Z);
      setCamera((c) => clampCam({ ...c, zoom: nz }));
      return;
    }
    const d = dragRef.current;
    if (!d.active) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    d.moved = Math.max(d.moved, Math.hypot(dx, dy));
    const z = cameraRef.current.zoom;
    setCamera(clampCam({ x: d.cx - dx / z, y: d.cy - dy / z, zoom: z }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    dragRef.current.active = false;
    window.setTimeout(() => {
      dragRef.current.moved = 0;
    }, 60);
  };

  const wasDragged = useCallback(() => dragRef.current.moved > 5, []);

  /* ---------- windows ---------- */
  /** поднять/открыть окно звезды (позиционируется рядом со звездой) */
  const raiseWindow = useCallback(
    (id: string) => {
      const entry = starIndex[id];
      if (!entry) return;
      const { star } = entry;
      zRef.current += 1;
      setWindows((prev) => {
        const existing = prev.find((w) => w.starId === id);
        if (existing) {
          return prev.map((w) => (w.starId === id ? { ...w, z: zRef.current, collapsed: false } : w));
        }
        const cam = cameraRef.current;
        const sx = (star.x - cam.x) * cam.zoom + size.w / 2;
        const sy = (star.y - cam.y) * cam.zoom + size.h / 2;
        const maxX = Math.max(12, size.w - WIN_W - 16);
        const x = clamp(sx + 34, 12, maxX);
        const y = clamp(sy - 130, 76, Math.max(80, size.h - 260));
        const win: WindowState = { key: `${id}-${Date.now()}`, starId: id, x, y, z: zRef.current, collapsed: false };
        const limit = isMobile ? 1 : 4;
        return [...prev.filter((w) => w.starId !== id), win].slice(-limit);
      });
    },
    [isMobile, size.w, size.h, starIndex],
  );

  const openStar = useCallback(
    (id: string) => {
      if (id === polaris.id) {
        setShowFinal(true);
        return;
      }
      if (!starIndex[id]) return;
      const { constellation } = starIndex[id];

      setDiscovered((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      setActive(constellation.id);
      raiseWindow(id);
    },
    [polaris.id, raiseWindow, starIndex],
  );

  const selectFromPanel = useCallback(
    (id: string) => {
      const entry = starIndex[id];
      if (!entry) return;
      flyTo(entry.star.x, entry.star.y, Math.max(cameraRef.current.zoom, 0.9), 800);
      if (isMobile) setPanelOpen(false);
      window.setTimeout(() => openStar(id), 620);
    },
    [flyTo, isMobile, openStar, starIndex],
  );

  const flyToConstellation = useCallback(
    (id: string) => {
      const c = constellations.find((k) => k.id === id);
      if (!c) return;
      const cx = c.stars.reduce((a, s) => a + s.x, 0) / c.stars.length;
      const cy = c.stars.reduce((a, s) => a + s.y, 0) / c.stars.length;
      setActive(id);
      flyTo(cx, cy, isMobile ? 0.72 : 0.95, 900);
    },
    [constellations, flyTo, isMobile],
  );

  const closeWindow = useCallback((key: string) => setWindows((p) => p.filter((w) => w.key !== key)), []);
  const focusWindow = useCallback((key: string) => {
    zRef.current += 1;
    const z = zRef.current;
    setWindows((p) => p.map((w) => (w.key === key ? { ...w, z } : w)));
  }, []);
  const moveWindow = useCallback(
    (key: string, x: number, y: number) => setWindows((p) => p.map((w) => (w.key === key ? { ...w, x, y } : w))),
    [],
  );
  const toggleCollapse = useCallback(
    (key: string) => setWindows((p) => p.map((w) => (w.key === key ? { ...w, collapsed: !w.collapsed } : w))),
    [],
  );

  /* ---------- editing helpers ---------- */
  const handleEditSelect = useCallback(
    (id: string) => {
      if (id === polaris.id) {
        // Полярную редактируем через панель — просто подлетаем к ней
        flyTo(polaris.x, polaris.y, 1, 800);
        return;
      }
      const entry = starIndex[id];
      if (!entry) return;
      // подлетаем к звезде и открываем её окно — чтобы сразу править состав вживую
      flyTo(entry.star.x, entry.star.y, Math.max(cameraRef.current.zoom, 0.95), 750);
      window.setTimeout(() => raiseWindow(id), 700);
    },
    [flyTo, polaris.x, polaris.y, starIndex, raiseWindow],
  );

  const handleDragStar = useCallback(
    (id: string, x: number, y: number) => {
      if (id === polaris.id) {
        updatePolaris({ x, y });
        return;
      }
      moveStar(id, x, y);
      updateStar(id, { x, y });
    },
    [moveStar, polaris.id, updatePolaris, updateStar],
  );

  /* ---------- finale ---------- */
  useEffect(() => {
    if (allFound && !finaleRef.current) {
      finaleRef.current = true;
      setToast("На небе появилась новая звезда…");
      const t1 = window.setTimeout(() => {
        setActive(null);
        flyTo(polaris.x, polaris.y, isMobile ? 0.75 : 1, 1600);
      }, 900);
      const t2 = window.setTimeout(() => setToast(null), 5200);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }
  }, [allFound, flyTo, isMobile, polaris.x, polaris.y]);

  const reset = () => {
    try {
      localStorage.removeItem(LS_FOUND);
      localStorage.removeItem(LS_INTRO);
    } catch {
      /* ignore */
    }
    finaleRef.current = false;
    setDiscovered(new Set());
    setWindows([]);
    setActive(null);
    setShowFinal(false);
    setShowIntro(true);
    setCamera({ x: WORLD_W / 2, y: WORLD_H / 2, zoom: initialZoom });
  };

  const startIntro = () => {
    try {
      localStorage.setItem(LS_INTRO, "done");
    } catch {
      /* ignore */
    }
    setShowIntro(false);
    flyTo(WORLD_W / 2, WORLD_H / 2, clamp(initialZoom * 1.02, MIN_Z, MAX_Z), 1400);
  };

  const progress = TOTAL_STARS > 0 ? Math.round((discovered.size / TOTAL_STARS) * 100) : 0;

  return (
    <div className="relative h-full w-full select-none overflow-hidden bg-[#04050c]">
      <div
        ref={containerRef}
        className="absolute inset-0 touch-none"
        style={{ cursor: dragRef.current.active ? "grabbing" : editMode ? "default" : "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
        onClick={(e) => {
          const tag = (e.target as Element).tagName;
          if (!wasDragged() && (tag === "DIV" || tag === "svg" || tag === "CANVAS")) setActive(null);
        }}
      >
        <SkyCanvas cameraRef={cameraRef} />
        <StarField
          camera={camera}
          vw={size.w}
          vh={size.h}
          discovered={discovered}
          hovered={hovered}
          activeConstellation={active}
          allFound={allFound}
          polarisOpened={showFinal}
          constellations={constellations}
          polaris={polaris}
          onHover={setHovered}
          onSelect={editMode ? handleEditSelect : openStar}
          wasDragged={wasDragged}
          editMode={editMode}
          onDragStar={handleDragStar}
          lineDrawing={lineDrawing}
          onLineClick={lineClick}
        />
      </div>

      {/* ---------- top bar ---------- */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-[7500] flex items-start justify-between gap-3 p-3 md:p-4">
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setPanelOpen((v) => !v)}
            className="grain glass grid h-10 w-10 place-items-center rounded-xl border border-white/12 text-white/70 transition hover:text-white"
            aria-label="Атлас созвездий"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 4h12M2 8h12M2 12h8" strokeLinecap="round" />
            </svg>
          </button>
          <div className="grain glass hidden items-baseline gap-2.5 rounded-xl border border-white/12 px-4 py-2 sm:flex">
            <span className="font-display text-lg leading-none tracking-tight text-white/90">Карта твоих звёзд</span>
            <span className="text-[10px] uppercase tracking-[0.22em] text-white/30">atlas memoriae</span>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          {editMode && (
            <button
              onClick={() => (window.location.href = window.location.pathname)}
              className="grain glass rounded-xl border border-amber-200/25 px-3.5 py-2.5 text-[12px] font-medium text-amber-100/90 transition hover:bg-amber-300/10"
            >
              ✦ Режим автора
            </button>
          )}
          <div className="grain glass flex items-center gap-3 rounded-xl border border-white/12 px-3.5 py-2">
            <div className="text-right leading-none">
              <span className="font-display text-lg text-white/90">{discovered.size}</span>
              <span className="text-[11px] text-white/35">/{TOTAL_STARS}</span>
            </div>
            <div className="h-1 w-14 overflow-hidden rounded-full bg-white/12 sm:w-20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-300 via-amber-100 to-amber-200 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <button
            onClick={reset}
            className="grain glass hidden h-10 w-10 place-items-center rounded-xl border border-white/12 text-white/50 transition hover:text-white sm:grid"
            aria-label="Сбросить прогресс"
            title="Сбросить прогресс"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M13.5 8a5.5 5.5 0 1 1-1.7-3.97" strokeLinecap="round" />
              <path d="M13.6 2.4v3.2h-3.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* ---------- bottom controls ---------- */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[7400] flex items-end justify-between gap-3 p-3 md:p-4">
        <div className="grain glass pointer-events-auto hidden max-w-xs rounded-xl border border-white/12 px-4 py-2.5 md:block">
          <p className="text-[11.5px] leading-snug text-white/45">
            {editMode
              ? "Перетаскивай звёзды мышью · клик — выбрать · панель справа — редактор"
              : hovered && starIndex[hovered]
                ? starIndex[hovered].star.date
                : "Тяни небо · колесо для зума · нажми на звезду, чтобы открыть воспоминание"}
          </p>
        </div>
        <div className="pointer-events-auto ml-auto flex items-center gap-2">
          <button
            onClick={() => flyTo(WORLD_W / 2, WORLD_H / 2, initialZoom, 800)}
            className="grain glass rounded-xl border border-white/12 px-3.5 py-2.5 text-[12px] text-white/60 transition hover:text-white"
          >
            всё небо
          </button>
          <div className="grain glass flex overflow-hidden rounded-xl border border-white/12">
            <button
              onClick={() => zoomAt(0.8, size.w / 2, size.h / 2)}
              className="grid h-10 w-10 place-items-center text-white/60 transition hover:bg-white/8 hover:text-white"
              aria-label="Отдалить"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 7h8" strokeLinecap="round" />
              </svg>
            </button>
            <span className="w-px bg-white/10" />
            <button
              onClick={() => zoomAt(1.25, size.w / 2, size.h / 2)}
              className="grid h-10 w-10 place-items-center text-white/60 transition hover:bg-white/8 hover:text-white"
              aria-label="Приблизить"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.6">
                <path d="M7 3v8M3 7h8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ---------- toast ---------- */}
      {toast && (
        <div className="anim-fade-up pointer-events-none fixed left-1/2 top-20 z-[7800] -translate-x-1/2">
          <div className="grain glass flex items-center gap-2.5 rounded-full border border-amber-100/25 px-5 py-2.5">
            <span className="text-amber-100">✦</span>
            <span className="text-[13px] text-amber-50/85">{toast}</span>
          </div>
        </div>
      )}

      <ConstellationPanel
        open={panelOpen}
        isMobile={isMobile}
        discovered={discovered}
        active={active}
        constellations={constellations}
        totalStars={TOTAL_STARS}
        onClose={() => setPanelOpen(false)}
        onFlyToConstellation={flyToConstellation}
        onSelectStar={selectFromPanel}
      />

      {editMode && <EditorPanel />}

      {windows.map((w) => {
        const entry = starIndex[w.starId];
        if (!entry) return null;
        return (
          <MemoryWindow
            key={w.key}
            win={w}
            star={entry.star}
            constellation={entry.constellation}
            isMobile={isMobile}
            onClose={closeWindow}
            onFocus={focusWindow}
            onMove={moveWindow}
            onToggleCollapse={toggleCollapse}
          />
        );
      })}

      {showFinal && <FinalLetter polaris={polaris} onClose={() => setShowFinal(false)} />}
      {showIntro && <Intro constellations={constellations} totalStars={TOTAL_STARS} onStart={startIntro} />}
    </div>
  );
}
