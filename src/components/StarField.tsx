import { Fragment, memo, useCallback, useEffect, useRef } from "react";
import type { Constellation, Polaris, Star } from "../data/memories";
import type { Camera } from "./SkyCanvas";

type Props = {
  camera: Camera;
  vw: number;
  vh: number;
  discovered: Set<string>;
  hovered: string | null;
  activeConstellation: string | null;
  allFound: boolean;
  polarisOpened: boolean;
  constellations: Constellation[];
  polaris: Polaris;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  wasDragged: () => boolean;
  /** режим автора: звёзды можно перетаскивать */
  editMode?: boolean;
  onDragStar?: (id: string, x: number, y: number) => void;
  /** режим рисования связей */
  lineDrawing?: { constellationId: string; pending: string | null } | null;
  onLineClick?: (starId: string) => void;
};

const spike = (len: number, wdt: number) =>
  `M0 ${-len} Q ${wdt} ${-wdt} ${len} 0 Q ${wdt} ${wdt} 0 ${len} Q ${-wdt} ${wdt} ${-len} 0 Q ${-wdt} ${-wdt} 0 ${-len} Z`;

const starVisual = (s: Star, color: string, found: boolean, isHover: boolean, dimmed: boolean) => {
  const base = 4.6 - s.magnitude * 0.75;
  const r = found ? base : base * 0.62;
  const glow = found ? 24 : 15;
  const op = dimmed ? 0.42 : 1;
  return (
    <g opacity={op} style={{ transition: "opacity .5s ease" }}>
      <circle
        r={glow * (isHover ? 1.45 : 1)}
        fill={`url(#g-${color.replace("#", "")})`}
        className={found ? "" : "anim-breathe"}
        style={{ transition: "r .35s cubic-bezier(.16,1,.3,1)" }}
        opacity={found ? 0.95 : 0.6}
      />
      {found && (
        <path
          d={spike(isHover ? 20 : 15, 1.5)}
          fill={color}
          opacity={isHover ? 0.85 : 0.55}
          style={{ transition: "opacity .3s ease" }}
        />
      )}
      <circle r={r * (isHover ? 1.35 : 1)} fill={found ? "#ffffff" : color} opacity={found ? 1 : 0.75} />
      {found && <circle r={r + 2.6} fill="none" stroke="#fff" strokeOpacity={0.22} strokeWidth={0.8} />}
    </g>
  );
};

type ContentProps = {
  inv: number;
  hitR: number;
  discovered: Set<string>;
  hovered: string | null;
  activeConstellation: string | null;
  allFound: boolean;
  polarisOpened: boolean;
  constellations: Constellation[];
  polaris: Polaris;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  wasDragged: () => boolean;
  editMode: boolean;
  lineDrawing: { constellationId: string; pending: string | null } | null;
  onLineClick?: (starId: string) => void;
  onStarDragStart: (id: string, x: number, y: number) => void;
};

/**
 * Всё содержимое неба, зависящее только от зума/состояния, но не от позиции
 * камеры. Мемоизировано: при панорамировании (меняются только x/y) React
 * перерисовывает лишь корневой transform, а не сотни SVG-узлов.
 */
const SkyContent = memo(function SkyContent({
  inv,
  hitR,
  discovered,
  hovered,
  activeConstellation,
  allFound,
  polarisOpened,
  constellations,
  polaris,
  onHover,
  onSelect,
  wasDragged,
  editMode,
  lineDrawing,
  onLineClick,
  onStarDragStart,
}: ContentProps) {
  const showPolaris = polaris.enabled !== false && (allFound || editMode);
  const drawingConstellation = lineDrawing?.constellationId ?? null;

  return (
    <>
      {constellations.map((c) => {
        const pos = Object.fromEntries(c.stars.map((s) => [s.id, s]));
        const foundCount = c.stars.filter((s) => discovered.has(s.id)).length;
        const complete = c.stars.length > 0 && foundCount === c.stars.length;
        const dimmed = !!activeConstellation && activeConstellation !== c.id;
        const isDrawing = drawingConstellation === c.id;
        const cx = c.stars.length ? c.stars.reduce((a, s) => a + s.x, 0) / c.stars.length : 0;
        const cy = c.stars.length ? c.stars.reduce((a, s) => a + s.y, 0) / c.stars.length : 0;

        return (
          <Fragment key={c.id}>
            {/* линии созвездия */}
            <g opacity={dimmed ? 0.18 : 1} style={{ transition: "opacity .5s ease" }}>
              {c.lines.map(([a, b], i) => {
                const sa = pos[a];
                const sb = pos[b];
                if (!sa || !sb) return null;
                const both = discovered.has(a) && discovered.has(b);
                const one = discovered.has(a) || discovered.has(b);
                return (
                  <line
                    key={i}
                    x1={sa.x}
                    y1={sa.y}
                    x2={sb.x}
                    y2={sb.y}
                    stroke={c.color}
                    strokeOpacity={editMode ? 0.55 : both ? (complete ? 0.62 : 0.42) : one ? 0.2 : 0.09}
                    strokeWidth={both ? 1.4 : 1}
                    strokeDasharray={both ? undefined : "3 7"}
                    vectorEffect="non-scaling-stroke"
                    style={{ transition: "stroke-opacity .6s ease" }}
                  />
                );
              })}
            </g>

            {/* подпись созвездия */}
            <g transform={`translate(${cx} ${cy}) scale(${inv})`} pointerEvents="none">
              <text
                y={-118}
                textAnchor="middle"
                className="font-display"
                style={{ transition: "opacity .5s ease" }}
                fill={c.color}
                fillOpacity={dimmed ? 0.18 : complete ? 0.5 : 0.28}
                fontSize={19}
                letterSpacing="0.34em"
              >
                {c.name.toUpperCase()}
              </text>
              <text
                y={-100}
                textAnchor="middle"
                fill="#ffffff"
                fillOpacity={dimmed ? 0.1 : 0.22}
                fontSize={8.5}
                letterSpacing="0.3em"
                textRendering="optimizeLegibility"
              >
                {c.latin.toUpperCase()} · {foundCount}/{c.stars.length}
              </text>
            </g>

            {/* звёзды */}
            {c.stars.map((s) => {
              const found = discovered.has(s.id);
              const isHover = hovered === s.id;
              const isPending = isDrawing && lineDrawing?.pending === s.id;
              const isLineTarget = isDrawing && !!lineDrawing?.pending && lineDrawing.pending !== s.id;
              return (
                <g key={s.id} transform={`translate(${s.x} ${s.y})`}>
                  <g transform={`scale(${inv})`}>
                    {starVisual(s, c.color, found, isHover, dimmed)}
                    <g
                      opacity={isHover || found ? (dimmed ? 0.35 : 1) : 0}
                      style={{ transition: "opacity .35s ease" }}
                      pointerEvents="none"
                    >
                      <text
                        y={38}
                        textAnchor="middle"
                        fill="#ffffff"
                        fillOpacity={isHover ? 0.95 : 0.6}
                        fontSize={11.5}
                        letterSpacing="0.06em"
                      >
                        {found || isHover ? s.title : ""}
                      </text>
                      {isHover && (
                        <text
                          y={52}
                          textAnchor="middle"
                          fill={c.color}
                          fillOpacity={0.7}
                          fontSize={8.5}
                          letterSpacing="0.22em"
                        >
                          {isDrawing
                            ? isPending
                              ? "КЛИКНИ ВТОРУЮ ЗВЕЗДУ"
                              : "СОЕДИНИТЬ / РАЗЪЕДИНИТЬ"
                            : editMode
                              ? "ПЕРЕТАЩИ / КЛИК — РЕДАКТИРОВАТЬ"
                              : found
                                ? "ОТКРЫТЬ СНОВА"
                                : "НАЖМИ, ЧТОБЫ ОТКРЫТЬ"}
                        </text>
                      )}
                    </g>
                    {isPending && (
                      <circle
                        r={hitR + 10}
                        fill="transparent"
                        stroke="#fff"
                        strokeWidth={1.6}
                        strokeOpacity={0.9}
                      />
                    )}
                    {isLineTarget && (
                      <circle
                        r={hitR + 6}
                        fill="transparent"
                        stroke={c.color}
                        strokeWidth={1.4}
                        strokeOpacity={0.7}
                        strokeDasharray="4 3"
                      />
                    )}
                    {editMode && !isDrawing && (
                      <circle
                        r={hitR + 8}
                        fill="transparent"
                        stroke="#fff"
                        strokeOpacity={0.25}
                        strokeWidth={1}
                        strokeDasharray="3 4"
                        style={{ cursor: "move" }}
                      />
                    )}
                    <circle
                      r={hitR}
                      fill="transparent"
                      style={{ cursor: isDrawing ? "crosshair" : editMode ? "move" : "pointer" }}
                      onPointerEnter={() => onHover(s.id)}
                      onPointerLeave={() => onHover(null)}
                      onPointerDown={(e) => {
                        if (!editMode) return;
                        // ВАЖНО: всегда останавливаем всплытие, чтобы панорамирование
                        // карты (App.onPointerDown) не перехватывало клики по звёздам
                        e.stopPropagation();
                        if (isDrawing) return;
                        onStarDragStart(s.id, e.clientX, e.clientY);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (wasDragged()) return;
                        if (isDrawing) {
                          onLineClick?.(s.id);
                          return;
                        }
                        onSelect(s.id);
                      }}
                    />
                  </g>
                </g>
              );
            })}
          </Fragment>
        );
      })}

      {/* Полярная */}
      {showPolaris && (
        <g transform={`translate(${polaris.x} ${polaris.y})`} className={editMode ? "" : "anim-fade"}>
          <g transform={`scale(${inv})`}>
            <circle
              r={46}
              fill={`url(#g-${polaris.color.replace("#", "")})`}
              className={polarisOpened || editMode ? "" : "anim-breathe"}
            />
            <path d={spike(30, 2.4)} fill={polaris.color} opacity={0.7} />
            <path d={spike(15, 1.6)} fill="#fff" opacity={0.9} transform="rotate(45)" />
            <circle r={4.6} fill="#fff" />
            <text
              y={62}
              textAnchor="middle"
              className="font-display"
              fill={polaris.color}
              fillOpacity={0.85}
              fontSize={17}
              letterSpacing="0.3em"
            >
              {polaris.title.toUpperCase()}
            </text>
            {editMode && (
              <circle
                r={60}
                fill="transparent"
                stroke="#fff"
                strokeOpacity={0.35}
                strokeWidth={1}
                strokeDasharray="3 4"
                style={{ cursor: "move" }}
              />
            )}
            <circle
              r={editMode ? 60 : 40}
              fill="transparent"
              style={{ cursor: editMode ? "move" : "pointer" }}
              onPointerEnter={() => onHover(polaris.id)}
              onPointerLeave={() => onHover(null)}
              onPointerDown={(e) => {
                if (!editMode) return;
                e.stopPropagation();
                onStarDragStart(polaris.id, e.clientX, e.clientY);
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (wasDragged()) return;
                onSelect(polaris.id);
              }}
            />
          </g>
        </g>
      )}
    </>
  );
});

export default function StarField({
  camera,
  vw,
  vh,
  discovered,
  hovered,
  activeConstellation,
  allFound,
  polarisOpened,
  constellations,
  polaris,
  onHover,
  onSelect,
  wasDragged,
  editMode = false,
  onDragStar,
  lineDrawing = null,
  onLineClick,
}: Props) {
  const t = `translate(${vw / 2} ${vh / 2}) scale(${camera.zoom}) translate(${-camera.x} ${-camera.y})`;
  const inv = 1 / camera.zoom;
  const hitR = camera.zoom < 0.5 ? 19 : 26;

  // ---- drag звезды в режиме автора ----
  // Координаты камеры читаем из ref, чтобы не переподписывать обработчики
  // на каждый кадр панорамирования.
  const cameraRef = useRef(camera);
  cameraRef.current = camera;
  const dragRef = useRef<{ id: string; startX: number; startY: number; moved: boolean } | null>(null);

  const handleStarDragStart = useCallback((id: string, x: number, y: number) => {
    dragRef.current = { id, startX: x, startY: y, moved: false };
  }, []);

  useEffect(() => {
    if (!editMode) return;
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
      if (d.moved && onDragStar) {
        const cam = cameraRef.current;
        const wx = cam.x + (e.clientX - vw / 2) / cam.zoom;
        const wy = cam.y + (e.clientY - vh / 2) / cam.zoom;
        onDragStar(d.id, wx, wy);
      }
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [editMode, vw, vh, onDragStar]);

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      width={vw}
      height={vh}
      style={{ overflow: "visible" }}
    >
      <defs>
        {[...constellations.map((c) => c.color), polaris.color].map((color) => (
          <radialGradient id={`g-${color.replace("#", "")}`} key={color}>
            <stop offset="0%" stopColor={color} stopOpacity="0.85" />
            <stop offset="38%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>

      <g transform={t}>
        <SkyContent
          inv={inv}
          hitR={hitR}
          discovered={discovered}
          hovered={hovered}
          activeConstellation={activeConstellation}
          allFound={allFound}
          polarisOpened={polarisOpened}
          constellations={constellations}
          polaris={polaris}
          onHover={onHover}
          onSelect={onSelect}
          wasDragged={wasDragged}
          editMode={editMode}
          lineDrawing={lineDrawing}
          onLineClick={onLineClick}
          onStarDragStart={handleStarDragStart}
        />
      </g>
    </svg>
  );
}
