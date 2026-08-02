import { useState } from "react";

type Req = { id: string; name: string; desc: string; p: "Must" | "Should" | "Could" };

const FR: Req[] = [
  { id: "FR-01", name: "Небо на весь экран", desc: "Анимированный звёздный фон: 3 слоя параллакса, мерцание, туманности, редкие падающие звёзды.", p: "Must" },
  { id: "FR-02", name: "Панорама и зум", desc: "Перетаскивание мышью/пальцем, колесо мыши, кнопки ±, ограничение зума 0.4–2.2 и границ мира.", p: "Must" },
  { id: "FR-03", name: "Звезда = воспоминание", desc: "Каждая звезда — отдельная запись с фото, датой, историей, ценностью и мыслью.", p: "Must" },
  { id: "FR-04", name: "Созвездия", desc: "Звёзды сгруппированы в 5 созвездий, связаны линиями; линия «загорается», когда открыты обе звезды.", p: "Must" },
  { id: "FR-05", name: "Плавающее окно", desc: "Клик по звезде открывает окно-карточку: фото, заголовок, дата, 3 текстовых блока. Стекло, свечение в цвет созвездия.", p: "Must" },
  { id: "FR-06", name: "Мультиокно + перетаскивание", desc: "Можно открыть несколько окон, таскать за шапку, поднимать по z-index, сворачивать и закрывать.", p: "Must" },
  { id: "FR-07", name: "Состояние «открыто»", desc: "Открытая звезда становится яркой и подписанной. Прогресс — счётчик N/18.", p: "Must" },
  { id: "FR-08", name: "Сохранение прогресса", desc: "localStorage: список открытых звёзд, факт просмотра интро. Сброс из меню.", p: "Should" },
  { id: "FR-09", name: "Навигатор созвездий", desc: "Боковая панель со списком созвездий и звёзд; клик — плавный перелёт камеры и подсветка группы.", p: "Should" },
  { id: "FR-10", name: "Интро-экран", desc: "Первый вход: обращение, объяснение метафоры, кнопка «Открыть небо».", p: "Should" },
  { id: "FR-11", name: "Финальная звезда", desc: "После открытия всех 18 звёзд появляется Полярная с финальным письмом.", p: "Should" },
  { id: "FR-12", name: "Адаптив", desc: "На мобильном окно раскрывается как полноэкранная карточка; жесты: drag + pinch-zoom.", p: "Must" },
  { id: "FR-13", name: "Звук", desc: "Фоновый эмбиент и мягкий звук открытия звезды с кнопкой mute.", p: "Could" },
  { id: "FR-14", name: "Режим «Экскурсия»", desc: "Автопрокрутка по звёздам в хронологическом порядке.", p: "Could" },
];

const NFR = [
  ["Производительность", "60 fps на ноутбуке и ≥30 fps на телефоне. Фон — <canvas>, интерактив — SVG. Не более ~600 фоновых точек."],
  ["Вес", "Одностраничная сборка, no-backend. Фото — оптимизированные JPEG ≤200 КБ, lazy-load."],
  ["Приватность", "Только статика, никакой аналитики и трекеров. Ссылка — «неугадываемая», по желанию — пароль-дата."],
  ["Доступность", "Контраст текста ≥ 4.5:1, закрытие окна по Esc, фокус-стили, prefers-reduced-motion выключает пульсацию."],
  ["Совместимость", "Актуальные Chrome / Safari / Firefox, iOS Safari 16+."],
  ["Отказоустойчивость", "Если фото не загрузилось — окно остаётся читаемым (плейсхолдер-градиент)."],
];

const FLOWS = [
  {
    t: "Сценарий 1 — Первое открытие",
    s: [
      "Открывает ссылку с телефона → интро с обращением по имени.",
      "Жмёт «Открыть небо» → камера мягко отъезжает, проявляются созвездия.",
      "Тыкает первую звезду → всплывает окно с фото и текстом.",
      "Читает, закрывает, звезда остаётся гореть. Счётчик 1/18.",
    ],
  },
  {
    t: "Сценарий 2 — Сравнение воспоминаний",
    s: [
      "С ноутбука открывает 2–3 окна одновременно.",
      "Раскладывает их по экрану перетаскиванием.",
      "Видит, как между открытыми звёздами загораются линии созвездия.",
    ],
  },
  {
    t: "Сценарий 3 — Финал",
    s: [
      "Открывает последнюю, 18-ю звезду.",
      "Внизу карты проявляется Полярная с отдельной анимацией.",
      "Клик → финальное письмо на весь экран.",
    ],
  },
];

const CONTENT_CHECK = [
  "18 фото (по одному на звезду), горизонтальные, ≥1200 px по ширине",
  "18 заголовков-названий звёзд (2–4 слова)",
  "18 дат / временных меток — можно неточных и поэтичных",
  "18 текстов «Как это было» — 2–4 предложения",
  "18 текстов «Что ты мне принесла» — главный смысл подарка, 1–3 предложения",
  "18 коротких мыслей-цитат — одна строка",
  "5 названий созвездий + подзаголовки",
  "1 финальное письмо (3 абзаца)",
];

const STAGES = [
  ["Этап 0", "Контент", "Собрать фото и написать тексты по чек-листу", "самое долгое"],
  ["Этап 1", "Каркас", "Canvas-небо, камера, пан/зум", "~0.5 дня"],
  ["Этап 2", "Данные и звёзды", "Модель данных, SVG-слой, созвездия, hover", "~0.5 дня"],
  ["Этап 3", "Окна", "Плавающие окна, драг, z-index, мобильный режим", "~0.5 дня"],
  ["Этап 4", "Обвязка", "Интро, панель созвездий, прогресс, финал, localStorage", "~0.5 дня"],
  ["Этап 5", "Полировка", "Тексты, тайминги анимаций, адаптив, деплой", "~0.5 дня"],
];

const DOD = [
  "Все 18 звёзд открываются и показывают корректный контент",
  "Прогресс сохраняется после перезагрузки страницы",
  "Работает на iPhone и на десктопе без горизонтального скролла",
  "Ни одного «залипшего» окна: всё закрывается по крестику и Esc",
  "Первая отрисовка < 2 c на 4G",
  "Финальная звезда появляется ровно после 18/18",
];

const V2 = [
  "Аудио-воспоминания: голосовая заметка в окне звезды",
  "Режим «добавить звезду» — она сама дописывает карту",
  "Таймлайн-переключатель: небо ↔ хронология",
  "Экспорт карты в PDF / печать постера с созвездиями",
  "Подарочный конверт: ссылка открывается только в заданную дату",
];

function Pill({ children, tone = "default" }: { children: React.ReactNode; tone?: "must" | "should" | "could" | "default" }) {
  const map: Record<string, string> = {
    must: "bg-rose-400/12 text-rose-200 border-rose-300/25",
    should: "bg-amber-300/12 text-amber-100 border-amber-200/25",
    could: "bg-sky-300/10 text-sky-100 border-sky-200/20",
    default: "bg-white/8 text-white/60 border-white/15",
  };
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide ${map[tone]}`}>
      {children}
    </span>
  );
}

function Block({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="scroll-mt-20">
      <div className="mb-3 flex items-baseline gap-3">
        <span className="font-display text-2xl text-white/25">{n}</span>
        <h3 className="font-display text-2xl tracking-tight text-white/90">{title}</h3>
        <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
      </div>
      <div className="space-y-3 text-[13.5px] leading-relaxed text-white/65">{children}</div>
    </section>
  );
}

export default function SpecSheet({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"tz" | "data">("tz");

  return (
    <div className="fixed inset-0 z-[9000] overflow-hidden bg-[#04050c]/80 backdrop-blur-md anim-fade">
      <div className="absolute inset-0 md:inset-6 lg:inset-x-[8%] lg:inset-y-8">
        <div className="grain glass relative flex h-full flex-col overflow-hidden border border-white/12 md:rounded-3xl">
          <header className="flex shrink-0 items-center gap-4 border-b border-white/10 px-5 py-4 md:px-8">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">Техническое задание · MVP</p>
              <h2 className="font-display text-2xl tracking-tight text-white/95 md:text-3xl">
                «Карта звёзд» — интерактивный подарок
              </h2>
            </div>
            <div className="hidden gap-1 rounded-full border border-white/10 bg-white/5 p-1 md:flex">
              {(
                [
                  ["tz", "ТЗ"],
                  ["data", "Данные и код"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`rounded-full px-4 py-1.5 text-xs transition ${
                    tab === k ? "bg-white/90 text-slate-900" : "text-white/60 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Закрыть"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          </header>

          <div className="thin-scroll flex-1 overflow-y-auto px-5 py-7 md:px-8">
            {tab === "tz" ? (
              <div className="mx-auto max-w-3xl space-y-10 pb-16">
                <Block n="1" title="Зачем это нужно">
                  <p>
                    <b className="text-white/85">Цель.</b> Сделать личный подарок, который читается не как открытка, а как
                    маленький мир. Вместо списка «10 причин, почему я тебя люблю» — небо, по которому можно бродить,
                    и в котором каждая точка — конкретное воспоминание и конкретная благодарность.
                  </p>
                  <p>
                    <b className="text-white/85">Главная метафора.</b> Одна звезда — один момент. Линии между звёздами —
                    то, как эти моменты связаны. Созвездие — целый период наших отношений. Пока звезда не открыта, она
                    тусклая; открывая её, она загорается — «вспоминаем — значит светится».
                  </p>
                  <p>
                    <b className="text-white/85">Эмоциональная задача.</b> Вызвать эффект «он реально это помнит».
                    Ценность не в технологиях, а в точности деталей: запах, фраза, погода, глупая шутка.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      ["Кому", "Один человек. Девушка. Читает с телефона, потом пересматривает с ноутбука."],
                      ["Когда", "День рождения / годовщина. Тихий вечер, 15–25 минут."],
                      ["Результат", "Ссылка, которую можно открыть в любой момент и добавить в закладки."],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/35">{k}</p>
                        <p className="text-[12.5px] leading-relaxed text-white/70">{v}</p>
                      </div>
                    ))}
                  </div>
                </Block>

                <Block n="2" title="Объём MVP">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/[0.06] p-4">
                      <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-emerald-200/80">Входит</p>
                      <ul className="space-y-1.5 text-[13px] text-white/70">
                        {[
                          "Одна страница, без роутинга и бэкенда",
                          "5 созвездий · 18 звёзд · 1 финальная звезда",
                          "Панорама, зум, hover, клик",
                          "Плавающие окна с фото и текстом",
                          "Прогресс в localStorage",
                          "Адаптив под телефон",
                        ].map((x) => (
                          <li key={x} className="flex gap-2">
                            <span className="text-emerald-300/70">✦</span>
                            {x}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/35">Не входит в MVP</p>
                      <ul className="space-y-1.5 text-[13px] text-white/55">
                        {[
                          "Админка и редактирование из браузера",
                          "Регистрация, аккаунты, база данных",
                          "Загрузка фото пользователем",
                          "Мультиязычность",
                          "3D-глобус неба и реальные координаты созвездий",
                        ].map((x) => (
                          <li key={x} className="flex gap-2">
                            <span className="text-white/25">✕</span>
                            {x}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Block>

                <Block n="3" title="Функциональные требования">
                  <div className="overflow-hidden rounded-xl border border-white/10">
                    {FR.map((r, i) => (
                      <div
                        key={r.id}
                        className={`flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:gap-4 ${
                          i % 2 ? "bg-white/[0.02]" : ""
                        }`}
                      >
                        <span className="w-14 shrink-0 font-mono text-[11px] text-white/35">{r.id}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-medium text-white/85">{r.name}</p>
                          <p className="text-[12.5px] leading-relaxed text-white/55">{r.desc}</p>
                        </div>
                        <div className="shrink-0">
                          <Pill tone={r.p.toLowerCase() as "must" | "should" | "could"}>{r.p}</Pill>
                        </div>
                      </div>
                    ))}
                  </div>
                </Block>

                <Block n="4" title="Пользовательские сценарии">
                  <div className="grid gap-4 md:grid-cols-3">
                    {FLOWS.map((f) => (
                      <div key={f.t} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="mb-2 text-[12px] font-medium text-white/85">{f.t}</p>
                        <ol className="space-y-1.5 text-[12.5px] leading-relaxed text-white/60">
                          {f.s.map((x, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-white/30">{i + 1}.</span>
                              {x}
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                </Block>

                <Block n="5" title="Визуальный язык">
                  <div className="flex flex-wrap gap-2">
                    {[
                      ["#04050c", "Космос / фон"],
                      ["#8ab4ff", "Начало"],
                      ["#ffc98a", "Дорога"],
                      ["#b39cff", "Тихий свет"],
                      ["#ff8aa6", "Шторм"],
                      ["#8affd1", "Впереди"],
                      ["#fff3c4", "Полярная"],
                    ].map(([hex, label]) => (
                      <div key={hex} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                        <span className="h-5 w-5 rounded-full" style={{ background: hex, boxShadow: `0 0 12px ${hex}` }} />
                        <div className="leading-tight">
                          <p className="text-[11px] text-white/70">{label}</p>
                          <p className="font-mono text-[10px] text-white/35">{hex}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    <li>
                      <b className="text-white/80">Типографика:</b> Cormorant Garamond для заголовков и цитат (романтика,
                      «астрономический атлас»), Manrope для интерфейса.
                    </li>
                    <li>
                      <b className="text-white/80">Окна:</b> стекло 18px blur, радиус 16px, тонкая световая линия сверху
                      в цвет созвездия, тень 0 28px 80px.
                    </li>
                    <li>
                      <b className="text-white/80">Motion:</b> появление окна 420 мс, cubic-bezier(.16,1,.3,1); перелёт
                      камеры 900 мс ease-out; пульсация неоткрытых звёзд 3.6 c.
                    </li>
                    <li>
                      <b className="text-white/80">Тон текста:</b> обращение на «ты», без пафоса, с конкретикой и лёгкой
                      иронией. Ключевой блок в каждом окне — «Что ты мне принесла».
                    </li>
                  </ul>
                </Block>

                <Block n="6" title="Нефункциональные требования">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {NFR.map(([k, v]) => (
                      <div key={k} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                        <p className="mb-1 text-[12px] font-medium text-white/85">{k}</p>
                        <p className="text-[12.5px] leading-relaxed text-white/55">{v}</p>
                      </div>
                    ))}
                  </div>
                </Block>

                <Block n="7" title="Контент-чек-лист">
                  <p>Разработка занимает вечер. Сбор контента — главная работа. Что нужно подготовить:</p>
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {CONTENT_CHECK.map((c) => (
                      <li key={c} className="flex gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 text-[12.5px] text-white/65">
                        <span className="text-white/25">☐</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </Block>

                <Block n="8" title="Этапы и оценка">
                  <div className="overflow-hidden rounded-xl border border-white/10">
                    {STAGES.map(([a, b, c, d], i) => (
                      <div key={a} className={`flex items-center gap-4 px-4 py-3 ${i % 2 ? "bg-white/[0.02]" : ""}`}>
                        <span className="w-16 shrink-0 font-mono text-[11px] text-white/35">{a}</span>
                        <span className="w-32 shrink-0 text-[13px] text-white/85">{b}</span>
                        <span className="min-w-0 flex-1 text-[12.5px] text-white/55">{c}</span>
                        <span className="shrink-0 text-[11px] text-white/40">{d}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-white/50">
                    Итого: ~2.5 дня разработки одним человеком + время на тексты. Деплой — статика на любой хостинг.
                  </p>
                </Block>

                <Block n="9" title="Критерии приёмки">
                  <ul className="space-y-1.5">
                    {DOD.map((d) => (
                      <li key={d} className="flex gap-2.5">
                        <span className="mt-0.5 text-emerald-300/70">✓</span>
                        <span className="text-white/70">{d}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 rounded-xl border border-amber-200/20 bg-amber-300/[0.06] p-3.5 text-[13px] text-amber-50/80">
                    <b>Главный критерий, не измеряемый метрикой:</b> она должна остановиться на какой-нибудь звезде
                    дольше, чем нужно, чтобы прочитать текст.
                  </p>
                </Block>

                <Block n="10" title="Бэклог v2">
                  <ul className="space-y-1.5">
                    {V2.map((v) => (
                      <li key={v} className="flex gap-2.5 text-white/65">
                        <span className="text-white/30">→</span>
                        {v}
                      </li>
                    ))}
                  </ul>
                </Block>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-8 pb-16">
                <Block n="A" title="Стек и архитектура">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      ["Фронтенд", "React 19 + TypeScript + Vite. Сборка в статику, деплой куда угодно."],
                      ["Стили", "Tailwind CSS v4, кастомные keyframes для мерцания и появления окон."],
                      ["Фон", "<canvas> 2D: 3 слоя звёзд с параллаксом, туманности радиальными градиентами, падающие звёзды."],
                      ["Интерактив", "SVG-слой поверх canvas: линии созвездий, хит-зоны звёзд, подписи. Звёзды контр-масштабируются, чтобы не «пухнуть» при зуме."],
                      ["Состояние", "useState в App + localStorage. Никаких стор-библиотек — не нужно."],
                      ["Контент", "Один файл src/data/memories.ts — правится вручную, без CMS."],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                        <p className="mb-1 text-[12px] font-medium text-white/85">{k}</p>
                        <p className="text-[12.5px] leading-relaxed text-white/55">{v}</p>
                      </div>
                    ))}
                  </div>
                </Block>

                <Block n="B" title="Модель данных">
                  <pre className="thin-scroll overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-[11.5px] leading-relaxed text-sky-100/80">
{`type Star = {
  id: string;          // "n1"
  title: string;       // "Первый взгляд"
  date: string;        // "сентябрь, поздний вечер"
  x: number; y: number;// координаты в мире 2400 × 1500
  magnitude: 1 | 2 | 3;// яркость: 1 — самая большая
  photo: string;       // URL фотографии
  caption: string;     // подпись под фото
  story: string;       // «Как это было»
  gift: string;        // «Что ты мне принесла»  ← смысл подарка
  thought: string;     // короткая мысль-цитата
};

type Constellation = {
  id: string;
  name: string;        // "Тихий свет"
  latin: string;       // "Lumen"
  subtitle: string;
  color: string;       // hex, красит линии, свечение и окно
  lines: [string, string][]; // рёбра между id звёзд
  stars: Star[];
};`}
                  </pre>
                </Block>

                <Block n="C" title="Как наполнить своими данными">
                  <ol className="space-y-2">
                    {[
                      "Открой src/data/memories.ts — это единственный файл с контентом.",
                      "Замени photo на свои ссылки (или положи файлы в public/photos/ и укажи «/photos/имя.jpg»).",
                      "Перепиши title / date / story / gift / thought своими словами. Чем конкретнее деталь, тем сильнее эффект.",
                      "Координаты x, y — это положение на «небе» 2400 × 1500. Двигай их, чтобы созвездие выглядело красиво.",
                      "lines — пары id: какие звёзды соединить линией. Можно рисовать любые фигуры.",
                      "В polaris.text лежит финальное письмо — три абзаца, которые она увидит последними.",
                    ].map((s, i) => (
                      <li key={i} className="flex gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3.5 py-2.5">
                        <span className="font-mono text-[11px] text-white/30">{String(i + 1).padStart(2, "0")}</span>
                        <span className="text-[13px] leading-relaxed text-white/70">{s}</span>
                      </li>
                    ))}
                  </ol>
                </Block>

                <Block n="D" title="Структура проекта">
                  <pre className="thin-scroll overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-[11.5px] leading-relaxed text-white/60">
{`src/
├─ App.tsx                 камера, состояние, компоновка
├─ data/memories.ts        ВЕСЬ КОНТЕНТ
└─ components/
   ├─ SkyCanvas.tsx        анимированный фон (canvas)
   ├─ StarField.tsx        созвездия и звёзды (svg)
   ├─ MemoryWindow.tsx     плавающее окно воспоминания
   ├─ ConstellationPanel.tsx  навигатор
   ├─ Intro.tsx            первый экран
   ├─ FinalLetter.tsx      финальное письмо
   └─ SpecSheet.tsx        это ТЗ`}
                  </pre>
                </Block>

                <Block n="E" title="Риски">
                  <div className="space-y-2">
                    {[
                      ["Много фото → долгая загрузка", "lazy-load + сжатие до 200 КБ, размытый плейсхолдер вместо пустоты."],
                      ["Не найдёт все звёзды", "Панель созвездий со списком и счётчик прогресса 0/18."],
                      ["Тыкает мимо звезды на телефоне", "Хит-зона 26 px радиусом вокруг точки, независимо от зума."],
                      ["Случайно закроет вкладку", "Прогресс в localStorage — вернётся на то же место."],
                    ].map(([r, s]) => (
                      <div key={r} className="grid gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 sm:grid-cols-2 sm:gap-4">
                        <p className="text-[12.5px] text-rose-100/70">⚠ {r}</p>
                        <p className="text-[12.5px] text-white/60">{s}</p>
                      </div>
                    ))}
                  </div>
                </Block>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 px-5 py-3 md:hidden">
            {(
              [
                ["tz", "ТЗ"],
                ["data", "Данные и код"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`flex-1 rounded-full px-4 py-2 text-xs transition ${
                  tab === k ? "bg-white/90 text-slate-900" : "border border-white/12 text-white/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
