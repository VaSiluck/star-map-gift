import { memo, useRef, useState } from "react";
import { useData } from "../../data/store";
import StarForm, { NewStarForm } from "./StarForm";
import ConstellationForm, { NewConstellationForm } from "./ConstellationForm";
import PolarisForm from "./PolarisForm";
import { Btn } from "./fields";

type Mode =
  | { kind: "list" }
  | { kind: "star"; id: string }
  | { kind: "newStar"; constellationId: string }
  | { kind: "constellation"; id: string }
  | { kind: "newConstellation" }
  | { kind: "polaris" };

export default memo(function EditorPanel() {
  const {
    constellations,
    polaris,
    updateConstellation,
    resetToDefault,
    exportJson,
    exportMemoriesTs,
    importJson,
    lineDrawing,
    startLineDrawing,
    stopLineDrawing,
  } = useData();
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const flash = (t: string) => {
    setHint(t);
    window.setTimeout(() => setHint(null), 2000);
  };

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importJson(file);
      flash("Данные импортированы ✓");
      setImportError(null);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Ошибка импорта");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const autoLines = (constellationId: string) => {
    const c = constellations.find((x) => x.id === constellationId);
    if (!c || c.stars.length < 2) return;
    const lines: [string, string][] = [];
    for (let i = 0; i < c.stars.length - 1; i++) {
      lines.push([c.stars[i].id, c.stars[i + 1].id]);
    }
    updateConstellation(constellationId, { lines });
    flash("Линии построены по порядку звёзд ✓");
  };

  const toggleCollapse = (id: string) => setCollapsed((p) => ({ ...p, [id]: !p[id] }));

  return (
    <>
      {/* затемнение позади панели */}
      <div className="pointer-events-none fixed inset-0 z-[7900] bg-black/20" />

      <aside className="grain glass thin-scroll fixed inset-y-3 right-3 z-[8000] flex w-[340px] max-w-[calc(100vw-24px)] flex-col overflow-y-auto rounded-2xl border border-amber-200/20 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95)]">
        {/* header */}
        <div className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-white/10 bg-[#0a0c1c]/95 px-4 py-3 backdrop-blur">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-300/15 text-sm text-amber-200">✦</span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base leading-tight text-white/90">Редактор открытки</p>
            <p className="text-[9.5px] uppercase tracking-[0.2em] text-white/35">режим автора · ?edit</p>
          </div>
          <button
            onClick={() => (window.location.href = window.location.pathname)}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] text-white/70 transition hover:bg-white/15 hover:text-white"
            title="Выйти из режима автора"
          >
            готово
          </button>
        </div>

        {hint && (
          <div className="mx-4 mt-3 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs text-emerald-300">{hint}</div>
        )}
        {importError && (
          <div className="mx-4 mt-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300">{importError}</div>
        )}

        {lineDrawing && (
          <div className="mx-4 mt-3 rounded-xl border border-amber-200/25 bg-amber-300/10 px-3.5 py-3">
            <p className="text-[12px] font-medium text-amber-100">
              ✏️ Рисуем связи: {constellations.find((c) => c.id === lineDrawing.constellationId)?.name}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-amber-50/60">
              {lineDrawing.pending
                ? "Кликни по второй звезде — линия соединит. Клик по уже соединённой паре — разъединит."
                : "Кликни по первой звезде созвездия."}
            </p>
            <button
              onClick={stopLineDrawing}
              className="mt-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] text-white/70 transition hover:bg-white/15 hover:text-white"
            >
              готово
            </button>
          </div>
        )}

        {mode.kind === "list" && (
          <div className="flex flex-col gap-4 p-4">
            <div className="flex gap-2">
              <Btn
                variant="primary"
                onClick={() => {
                  if (constellations.length > 0) setMode({ kind: "newStar", constellationId: constellations[0].id });
                  else flash("Сначала создай созвездие");
                }}
              >
                + Звезда
              </Btn>
              <Btn onClick={() => setMode({ kind: "newConstellation" })}>+ Созвездие</Btn>
            </div>

            {/* Полярная */}
            <button
              onClick={() => setMode({ kind: "polaris" })}
              className="flex items-center gap-2.5 rounded-xl border border-amber-100/20 bg-amber-300/[0.06] px-3 py-2.5 text-left transition hover:bg-amber-300/10"
            >
              <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[13px]"
                style={{ background: polaris.color, boxShadow: `0 0 12px ${polaris.color}` }}
              >
                ★
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-medium text-white/85">{polaris.title}</span>
                <span className="block text-[10px] uppercase tracking-[0.16em] text-white/30">финальное письмо · {polaris.text.length} абз.</span>
              </span>
              <span className="text-[10px] text-white/40">изменить →</span>
            </button>

            {/* Созвездия */}
            {constellations.map((c) => {
              const isCollapsed = collapsed[c.id];
              const isDrawing = lineDrawing?.constellationId === c.id;
              return (
                <div
                  key={c.id}
                  className={`overflow-hidden rounded-xl border transition ${
                    isDrawing ? "border-amber-200/40 bg-amber-300/[0.05]" : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ background: c.color, boxShadow: `0 0 8px ${c.color}` }}
                    />
                    <button
                      onClick={() => toggleCollapse(c.id)}
                      className="min-w-0 flex-1 text-left"
                      title="Развернуть/свернуть"
                    >
                      <span className="block truncate text-[13.5px] font-medium text-white/85">{c.name}</span>
                      <span className="block text-[10px] uppercase tracking-[0.16em] text-white/30">
                        {c.latin} · {c.stars.length} звёзд · {c.lines.length} связей
                      </span>
                    </button>
                    <button
                      onClick={() => setMode({ kind: "newStar", constellationId: c.id })}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-white/12 text-white/50 transition hover:bg-white/10 hover:text-white"
                      title="Добавить звезду сюда"
                    >
                      +
                    </button>
                    <button
                      onClick={() => startLineDrawing(c.id)}
                      className={`rounded-lg border px-2 py-1.5 text-[10px] transition ${
                        isDrawing
                          ? "border-amber-300/60 bg-amber-300/20 text-amber-100"
                          : "border-white/12 text-white/50 hover:bg-white/10 hover:text-white"
                      }`}
                      title="Рисовать связи созвездия: кликай по звёздам"
                    >
                      ✏️ связи
                    </button>
                    <button
                      onClick={() => setMode({ kind: "constellation", id: c.id })}
                      className="rounded-lg border border-white/12 px-2 py-1.5 text-[10px] text-white/50 transition hover:bg-white/10 hover:text-white"
                    >
                      изменить
                    </button>
                  </div>

                  {!isCollapsed && (
                    <div className="border-t border-white/8 px-2 py-1.5">
                      {c.stars.length === 0 && <p className="px-2 py-1 text-[11px] text-white/30">пока нет звёзд</p>}
                      {c.stars.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setMode({ kind: "star", id: s.id })}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/[0.07]"
                        >
                          <span className="text-amber-300/80">✦</span>
                          <span className="min-w-0 flex-1 truncate text-[12.5px] text-white/75">{s.title}</span>
                          {s.photo && <span className="text-[10px]">🖼️</span>}
                        </button>
                      ))}
                      {c.stars.length >= 2 && (
                        <button
                          onClick={() => autoLines(c.id)}
                          className="mt-1 w-full rounded-lg border border-dashed border-white/15 px-2 py-1.5 text-[10.5px] text-white/40 transition hover:bg-white/[0.05] hover:text-white/70"
                        >
                          ⚡ перестроить линии по порядку звёзд
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* экспорт/импорт */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/35">Публикация</p>
              <div className="flex flex-col gap-1.5">
                <Btn onClick={exportMemoriesTs}>⬇ Скачать memories.ts</Btn>
                <p className="text-[10.5px] leading-snug text-white/35">
                  Положи файл в src/data/ (замени memories.ts), затем npm run build. После пересборки черновик в браузере
                  сбросится сам — покажется новая версия файла.
                </p>
                <div className="mt-1 flex gap-1.5">
                  <Btn onClick={exportJson}>JSON</Btn>
                  <Btn
                    onClick={() => fileRef.current?.click()}
                  >
                    Импорт
                  </Btn>
                  <Btn onClick={resetToDefault}>Сброс</Btn>
                </div>
                <input ref={fileRef} type="file" accept="application/json" onChange={onImport} className="hidden" />
              </div>
            </div>

            <p className="text-[10.5px] leading-snug text-white/30">
              Подсказка: звёзды перетаскиваются мышью прямо по карте. Клик по звезде открывает её форму.
            </p>
          </div>
        )}

        {mode.kind === "star" && (() => {
          for (const c of constellations) {
            const s = c.stars.find((x) => x.id === mode.id);
            if (s) return <StarForm key={s.id} star={s} constellation={c} onClose={() => setMode({ kind: "list" })} />;
          }
          return (
            <div className="p-4 text-sm text-white/50">
              Звезда не найдена. <button onClick={() => setMode({ kind: "list" })} className="text-amber-200 underline">назад</button>
            </div>
          );
        })()}

        {mode.kind === "newStar" && (() => {
          const c = constellations.find((x) => x.id === mode.constellationId);
          if (!c) return null;
          return <NewStarForm key={c.id} constellation={c} onClose={() => setMode({ kind: "list" })} />;
        })()}

        {mode.kind === "constellation" && (() => {
          const c = constellations.find((x) => x.id === mode.id);
          if (!c) return null;
          return <ConstellationForm key={c.id} constellation={c} onClose={() => setMode({ kind: "list" })} />;
        })()}

        {mode.kind === "newConstellation" && <NewConstellationForm onClose={() => setMode({ kind: "list" })} />}

        {mode.kind === "polaris" && <PolarisForm onClose={() => setMode({ kind: "list" })} />}
      </aside>
    </>
  );
});
