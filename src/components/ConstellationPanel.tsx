import { memo } from "react";
import type { Constellation } from "../data/memories";

type Props = {
  open: boolean;
  isMobile: boolean;
  discovered: Set<string>;
  active: string | null;
  constellations: Constellation[];
  totalStars: number;
  onClose: () => void;
  onFlyToConstellation: (id: string) => void;
  onSelectStar: (id: string) => void;
};

export default memo(function ConstellationPanel({
  open,
  isMobile,
  discovered,
  active,
  constellations,
  totalStars,
  onClose,
  onFlyToConstellation,
  onSelectStar,
}: Props) {
  const found = constellations.reduce(
    (a, c) => a + c.stars.filter((s) => discovered.has(s.id)).length,
    0,
  );

  return (
    <>
      {open && isMobile && <div className="fixed inset-0 z-[6900] bg-black/50 backdrop-blur-[2px]" onClick={onClose} />}
      <aside
        className={`grain glass fixed z-[7000] flex flex-col border border-white/12 shadow-[0_30px_90px_-24px_rgba(0,0,0,0.9)] transition-transform duration-500 ${
          isMobile
            ? `inset-x-2 bottom-2 max-h-[72vh] rounded-2xl ${open ? "translate-y-0" : "translate-y-[130%]"}`
            : `left-3 top-20 bottom-3 w-[286px] rounded-2xl ${open ? "translate-x-0" : "-translate-x-[110%]"}`
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(.16,1,.3,1)" }}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3">
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/35">Атлас</p>
            <p className="font-display text-lg leading-tight text-white/90">Созвездия</p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl leading-none text-white/90">
              {found}
              <span className="text-base text-white/35">/{totalStars}</span>
            </p>
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/30">открыто</p>
          </div>
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-full border border-white/12 text-white/45 transition hover:bg-white/10 hover:text-white"
            aria-label="Свернуть панель"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="thin-scroll flex-1 overflow-y-auto overscroll-contain px-2.5 py-2.5">
          {constellations.map((c) => {
            const cFound = c.stars.filter((s) => discovered.has(s.id)).length;
            const complete = c.stars.length > 0 && cFound === c.stars.length;
            const isActive = active === c.id;
            return (
              <div
                key={c.id}
                className={`mb-1.5 rounded-xl border transition ${
                  isActive ? "border-white/20 bg-white/[0.06]" : "border-transparent hover:bg-white/[0.035]"
                }`}
              >
                <button
                  onClick={() => onFlyToConstellation(c.id)}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      background: c.color,
                      boxShadow: complete ? `0 0 12px ${c.color}` : "none",
                      opacity: complete ? 1 : 0.5,
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium text-white/85">{c.name}</span>
                    <span className="block truncate text-[10px] uppercase tracking-[0.16em] text-white/30">
                      {c.latin} · {cFound}/{c.stars.length}
                    </span>
                  </span>
                  {complete && (
                    <span className="shrink-0 text-[10px]" style={{ color: c.color }}>
                      ✦
                    </span>
                  )}
                </button>
                <div className="px-3 pb-2.5">
                  <p className="mb-2 text-[11px] leading-snug text-white/35">{c.subtitle}</p>
                  <div className="space-y-0.5">
                    {c.stars.map((s) => {
                      const f = discovered.has(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => onSelectStar(s.id)}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/[0.06]"
                        >
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full transition"
                            style={{
                              background: f ? "#fff" : "rgba(255,255,255,0.22)",
                              boxShadow: f ? `0 0 8px ${c.color}` : "none",
                            }}
                          />
                          <span
                            className={`min-w-0 flex-1 truncate text-[12.5px] ${f ? "text-white/75" : "text-white/35"}`}
                          >
                            {f ? s.title : "не открыта"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="shrink-0 border-t border-white/10 px-4 py-2.5">
          <p className="text-[10.5px] leading-snug text-white/30">
            Тяни небо мышкой, приближай колесом. Нажми на звезду — откроется воспоминание.
          </p>
        </div>
      </aside>
    </>
  );
});
