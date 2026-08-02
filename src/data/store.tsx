import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  constellations as defaultConstellations,
  polaris as defaultPolaris,
  type Constellation,
  type Polaris,
  type Star,
} from "./memories";

/**
 * Хранилище контента открытки.
 *
 * - Дефолт — данные из memories.ts (захардкоженный контент).
 * - Если в localStorage есть сохранённые правки (starmap.data.v1) — берём их.
 * - Любое изменение сразу пишется в localStorage (черновик автора).
 * - Экспорт: кнопки «Скачать JSON» (бэкап) и «Скачать memories.ts» (вшить в сборку).
 */

const LS_KEY = "starmap.data.v1";

export type DataShape = {
  constellations: Constellation[];
  polaris: Polaris;
};

type DataCtx = DataShape & {
  /** true, если сейчас открыт режим автора (?edit) */
  editMode: boolean;
  /** обновить звезду в её созвездии */
  updateStar: (starId: string, patch: Partial<Star>) => void;
  /** переместить звезду (координаты в мировых единицах) */
  moveStar: (starId: string, x: number, y: number) => void;
  /** добавить новую звезду в созвездие */
  addStar: (constellationId: string, star: Star) => void;
  /** удалить звезду */
  deleteStar: (starId: string) => void;
  /** перенести звезду в другое созвездие (с применёнными правками) */
  moveStarToConstellation: (starId: string, fromId: string, toId: string, patched: Star) => void;
  /** обновить созвездие */
  updateConstellation: (id: string, patch: Partial<Omit<Constellation, "stars" | "lines">> & { lines?: [string, string][] }) => void;
  /** добавить созвездие */
  addConstellation: (c: Omit<Constellation, "stars">) => void;
  /** удалить созвездие вместе со звёздами */
  deleteConstellation: (id: string) => void;
  /** обновить Полярную */
  updatePolaris: (patch: Partial<Polaris>) => void;
  /** активный режим рисования связей: созвездие + выбранная звезда */
  lineDrawing: { constellationId: string; pending: string | null } | null;
  /** включить/выключить режим рисования связей для созвездия */
  startLineDrawing: (constellationId: string) => void;
  stopLineDrawing: () => void;
  /** клик по звезде в режиме рисования: выбрать/соединить/разъединить */
  lineClick: (starId: string) => void;
  /** сбросить всё к дефолту из memories.ts */
  resetToDefault: () => void;
  /** скачать JSON с текущими данными */
  exportJson: () => void;
  /** скачать memories.ts (готовый файл для src/data/) */
  exportMemoriesTs: () => void;
  /** импортировать JSON из файла */
  importJson: (file: File) => Promise<void>;
};

const Ctx = createContext<DataCtx | null>(null);

function loadSaved(): DataShape | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DataShape>;
    if (!Array.isArray(parsed.constellations) || !parsed.polaris) return null;
    return { constellations: parsed.constellations, polaris: parsed.polaris };
  } catch {
    return null;
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [editMode] = useState(() =>
    typeof window !== "undefined" && window.location.search.includes("edit"),
  );
  const [data, setData] = useState<DataShape>(() => loadSaved() ?? {
    constellations: defaultConstellations,
    polaris: defaultPolaris,
  });
  const dataRef = useRef(data);
  dataRef.current = data;

  // Черновик автора живёт в localStorage — чтобы не потерять правки при F5.
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [data]);

  const setConstellations = useCallback(
    (updater: (prev: Constellation[]) => Constellation[]) =>
      setData((d) => ({ ...d, constellations: updater(d.constellations) })),
    [],
  );

  const updateStar = useCallback(
    (starId: string, patch: Partial<Star>) => {
      setConstellations((prev) =>
        prev.map((c) =>
          c.stars.some((s) => s.id === starId)
            ? { ...c, stars: c.stars.map((s) => (s.id === starId ? { ...s, ...patch } : s)) }
            : c,
        ),
      );
    },
    [setConstellations],
  );

  const moveStar = useCallback(
    (starId: string, x: number, y: number) => updateStar(starId, { x, y }),
    [updateStar],
  );

  const addStar = useCallback(
    (constellationId: string, star: Star) => {
      setConstellations((prev) =>
        prev.map((c) => (c.id === constellationId ? { ...c, stars: [...c.stars, star] } : c)),
      );
    },
    [setConstellations],
  );

  const deleteStar = useCallback(
    (starId: string) => {
      setConstellations((prev) =>
        prev.map((c) => ({
          ...c,
          stars: c.stars.filter((s) => s.id !== starId),
          lines: c.lines.filter(([a, b]) => a !== starId && b !== starId),
        })),
      );
    },
    [setConstellations],
  );

  /** перенести звезду (со всеми правками) в другое созвездие */
  const moveStarToConstellation = useCallback(
    (starId: string, fromId: string, toId: string, patched: Star) => {
      setConstellations((prev) =>
        prev.map((c) => {
          if (c.id === fromId) {
            return {
              ...c,
              stars: c.stars.filter((s) => s.id !== starId),
              lines: c.lines.filter(([a, b]) => a !== starId && b !== starId),
            };
          }
          if (c.id === toId) {
            return { ...c, stars: [...c.stars, patched] };
          }
          return c;
        }),
      );
    },
    [setConstellations],
  );

  const updateConstellation = useCallback(
    (id: string, patch: Partial<Omit<Constellation, "stars" | "lines">> & { lines?: [string, string][] }) => {
      setConstellations((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    },
    [setConstellations],
  );

  const addConstellation = useCallback(
    (c: Omit<Constellation, "stars">) => {
      setConstellations((prev) => [...prev, { ...c, stars: [] }]);
    },
    [setConstellations],
  );

  const deleteConstellation = useCallback(
    (id: string) => {
      setConstellations((prev) => prev.filter((c) => c.id !== id));
    },
    [setConstellations],
  );

  const updatePolaris = useCallback((patch: Partial<Polaris>) => {
    setData((d) => ({ ...d, polaris: { ...d.polaris, ...patch } }));
  }, []);

  /* ---------- рисование связей созвездий ---------- */
  const [lineDrawing, setLineDrawing] = useState<{ constellationId: string; pending: string | null } | null>(null);

  const startLineDrawing = useCallback((constellationId: string) => {
    setLineDrawing((cur) => (cur?.constellationId === constellationId ? null : { constellationId, pending: null }));
  }, []);

  const stopLineDrawing = useCallback(() => setLineDrawing(null), []);

  const lineClick = useCallback(
    (starId: string) => {
      setLineDrawing((cur) => {
        if (!cur) return cur;
        const c = dataRef.current.constellations.find((x) => x.id === cur.constellationId);
        if (!c || !c.stars.some((s) => s.id === starId)) return cur;
        if (!cur.pending) {
          return { ...cur, pending: starId };
        }
        if (cur.pending === starId) {
          return { ...cur, pending: null }; // клик по той же звезде — сброс выбора
        }
        const [a, b] = [cur.pending, starId];
        const has = c.lines.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
        const lines: [string, string][] = has
          ? c.lines.filter(([x, y]) => !((x === a && y === b) || (x === b && y === a)))
          : [...c.lines, [a, b]];
        setData((d) => ({
          ...d,
          constellations: d.constellations.map((cc) => (cc.id === c.id ? { ...cc, lines } : cc)),
        }));
        return { ...cur, pending: starId }; // следующее ребро от последней звезды
      });
    },
    [],
  );

  const resetToDefault = useCallback(() => {
    if (!window.confirm("Сбросить все правки к исходному контенту?")) return;
    setData({ constellations: defaultConstellations, polaris: defaultPolaris });
  }, []);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(dataRef.current, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "starmap-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportMemoriesTs = useCallback(() => {
    const { constellations: cs, polaris: pl } = dataRef.current;
    const content = `// ═══════════════════════════════════════════════════════
//  Автосгенерировано редактором открытки (режим ?edit).
//  Не редактируй вручную — правь в браузере и экспортируй снова.
// ═══════════════════════════════════════════════════════
export type Star = {
  id: string;
  title: string;
  date: string;
  x: number;
  y: number;
  magnitude: 1 | 2 | 3;
  photo: string;
  caption: string;
  story: string;
  gift: string;
  thought: string;
};

export type Constellation = {
  id: string;
  name: string;
  latin: string;
  subtitle: string;
  color: string;
  lines: [string, string][];
  stars: Star[];
};

export type Polaris = {
  id: string;
  title: string;
  x: number;
  y: number;
  color: string;
  heading: string;
  text: string[];
  enabled?: boolean;
};

export const WORLD_W = 2400;
export const WORLD_H = 1500;

export const constellations: Constellation[] = ${JSON.stringify(cs, null, 2)};

export const polaris: Polaris = ${JSON.stringify(pl, null, 2)};

export const allStars: Star[] = constellations.flatMap((c) => c.stars);
export const TOTAL_STARS = allStars.length;

export const starIndex: Record<string, { star: Star; constellation: Constellation }> =
  Object.fromEntries(
    constellations.flatMap((c) => c.stars.map((s) => [s.id, { star: s, constellation: c }])),
  );
`;
    const blob = new Blob([content], { type: "text/typescript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "memories.ts";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importJson = useCallback(
    async (file: File) => {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<DataShape>;
      if (!Array.isArray(parsed.constellations) || !parsed.polaris) {
        throw new Error("Неверный формат JSON: нужны поля constellations и polaris");
      }
      setData({ constellations: parsed.constellations, polaris: parsed.polaris });
    },
    [],
  );

  const value = useMemo<DataCtx>(
    () => ({
      ...data,
      editMode,
      updateStar,
      moveStar,
      addStar,
      deleteStar,
      moveStarToConstellation,
      updateConstellation,
      addConstellation,
      deleteConstellation,
      updatePolaris,
      lineDrawing,
      startLineDrawing,
      stopLineDrawing,
      lineClick,
      resetToDefault,
      exportJson,
      exportMemoriesTs,
      importJson,
    }),
    [data, editMode, updateStar, moveStar, addStar, deleteStar, moveStarToConstellation, updateConstellation, addConstellation, deleteConstellation, updatePolaris, lineDrawing, startLineDrawing, stopLineDrawing, lineClick, resetToDefault, exportJson, exportMemoriesTs, importJson],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData(): DataCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

/** Генератор id для новых звёзд/созвездий */
export function genId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 36).toString(36)}`;
}
