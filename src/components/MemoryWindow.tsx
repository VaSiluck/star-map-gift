import { useCallback, useEffect, useRef, useState } from "react";
import type { Constellation, Star } from "../data/memories";

export type WindowState = {
  key: string;
  starId: string;
  x: number;
  y: number;
  z: number;
  collapsed: boolean;
};

type Props = {
  win: WindowState;
  star: Star;
  constellation: Constellation;
  isMobile: boolean;
  onClose: (key: string) => void;
  onFocus: (key: string) => void;
  onMove: (key: string, x: number, y: number) => void;
  onToggleCollapse: (key: string) => void;
};

export const WIN_W = 372;

export default function MemoryWindow({
  win,
  star,
  constellation,
  isMobile,
  onClose,
  onFocus,
  onMove,
  onToggleCollapse,
}: Props) {
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isMobile) return;
      if ((e.target as HTMLElement).closest("button")) return;
      onFocus(win.key);
      dragRef.current = { dx: e.clientX - win.x, dy: e.clientY - win.y };
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      e.preventDefault();
    },
    [isMobile, onFocus, win.key, win.x, win.y],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const nx = e.clientX - dragRef.current.dx;
      const ny = e.clientY - dragRef.current.dy;
      const maxX = window.innerWidth - 120;
      const maxY = window.innerHeight - 56;
      onMove(win.key, Math.max(-WIN_W + 120, Math.min(maxX, nx)), Math.max(4, Math.min(maxY, ny)));
    },
    [onMove, win.key],
  );

  const endDrag = useCallback(() => {
    dragRef.current = null;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(win.key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, win.key]);

  const style: React.CSSProperties = isMobile
    ? { zIndex: win.z, left: 12, right: 12, bottom: 12, top: 86 }
    : { zIndex: win.z, left: win.x, top: win.y, width: WIN_W };

  return (
    <div
      className="anim-window grain fixed flex flex-col overflow-hidden rounded-2xl border border-white/12 shadow-[0_28px_80px_-18px_rgba(0,0,0,0.9)] glass"
      style={style}
      onPointerDown={() => onFocus(win.key)}
    >
      {/* верхний светящийся кант в цвет созвездия */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${constellation.color}, transparent)` }}
      />
      <div
        className="pointer-events-none absolute -top-20 left-1/2 h-40 w-64 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: constellation.color, opacity: 0.18 }}
      />

      {/* header / drag handle */}
      <div
        className={`relative flex shrink-0 items-center gap-2.5 border-b border-white/8 px-3.5 py-2.5 ${
          isMobile ? "" : "cursor-grab active:cursor-grabbing"
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: constellation.color, boxShadow: `0 0 10px ${constellation.color}` }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium tracking-tight text-white/90">{star.title}</p>
          <p className="truncate text-[10px] uppercase tracking-[0.16em] text-white/35">
            {constellation.name} · {star.date}
          </p>
        </div>
        {!isMobile && (
          <button
            onClick={() => onToggleCollapse(win.key)}
            className="grid h-6 w-6 place-items-center rounded-md text-white/40 transition hover:bg-white/10 hover:text-white/80"
            aria-label="Свернуть"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d={win.collapsed ? "M2 8l4-4 4 4" : "M2 4l4 4 4-4"} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <button
          onClick={() => onClose(win.key)}
          className="grid h-6 w-6 place-items-center rounded-md text-white/40 transition hover:bg-rose-500/25 hover:text-rose-200"
          aria-label="Закрыть"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {!win.collapsed && (
        <div className="thin-scroll relative flex-1 overflow-y-auto overscroll-contain">
          {/* photo */}
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-white/5">
            <img
              src={star.photo}
              alt={star.caption}
              loading="lazy"
              draggable={false}
              onLoad={() => setImgLoaded(true)}
              className={`h-full w-full object-cover transition-all duration-700 ${
                imgLoaded ? "scale-100 opacity-100 blur-0" : "scale-105 opacity-0 blur-md"
              }`}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0c1c] via-transparent to-transparent" />
            <div
              className="pointer-events-none absolute inset-0 mix-blend-soft-light"
              style={{ background: constellation.color, opacity: 0.16 }}
            />
            <p className="absolute inset-x-0 bottom-0 px-3.5 pb-2.5 font-display text-[13px] italic leading-snug text-white/75">
              {star.caption}
            </p>
          </div>

          <div className="space-y-4 px-4 py-4">
            <section>
              <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                Как это было
              </h4>
              <p className="text-[13.5px] leading-relaxed text-white/78">{star.story}</p>
            </section>

            <section
              className="rounded-xl border p-3"
              style={{
                borderColor: `${constellation.color}33`,
                background: `linear-gradient(140deg, ${constellation.color}14, transparent 70%)`,
              }}
            >
              <h4
                className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: constellation.color }}
              >
                Что ты мне принесла
              </h4>
              <p className="text-[13.5px] leading-relaxed text-white/85">{star.gift}</p>
            </section>

            <section className="border-l-2 pl-3" style={{ borderColor: `${constellation.color}66` }}>
              <p className="font-display text-[16px] italic leading-snug text-white/70">«{star.thought}»</p>
            </section>

            <div className="flex items-center gap-2 pt-0.5 text-[10px] uppercase tracking-[0.18em] text-white/25">
              <span>
                {constellation.latin} · {star.id.toUpperCase()}
              </span>
              <span className="h-px flex-1 bg-white/10" />
              <span>{"★".repeat(4 - star.magnitude)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
