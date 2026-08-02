import { useState } from "react";
import { useData } from "../../data/store";
import { Btn, Field, SectionTitle, inputCls } from "./fields";

export default function PolarisForm({ onClose }: { onClose: () => void }) {
  const { polaris, updatePolaris } = useData();
  const [title, setTitle] = useState(polaris.title);
  const [heading, setHeading] = useState(polaris.heading);
  const [color, setColor] = useState(polaris.color);
  const [enabled, setEnabled] = useState(polaris.enabled !== false);
  const [text, setText] = useState(polaris.text.join("\n\n"));

  const save = () => {
    updatePolaris({
      title: title || "Полярная",
      heading,
      color,
      enabled,
      text: text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean),
    });
    onClose();
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-white/90">Полярная — финальное письмо</h2>
        <button onClick={onClose} className="text-xs text-white/50 hover:text-white">
          закрыть
        </button>
      </div>

      <Field label="Название">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
      </Field>

      <Field label="Надзаголовок (маленький текст)">
        <input value={heading} onChange={(e) => setHeading(e.target.value)} className={inputCls} />
      </Field>

      <Field label="Цвет">
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-16 cursor-pointer rounded bg-transparent" />
      </Field>

      <Field label="Показывать Полярную (финал карты)">
        <div className="flex gap-1.5">
          <button
            onClick={() => setEnabled(true)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
              enabled ? "border-amber-300/60 bg-amber-300/15 text-amber-100" : "border-white/12 bg-white/5 text-white/50 hover:text-white"
            }`}
          >
            Включена
          </button>
          <button
            onClick={() => setEnabled(false)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
              !enabled ? "border-rose-300/60 bg-rose-300/15 text-rose-100" : "border-white/12 bg-white/5 text-white/50 hover:text-white"
            }`}
          >
            Скрыта
          </button>
        </div>
        <p className="text-[10.5px] leading-snug text-white/35">
          {enabled
            ? "Появится на карте после открытия всех звёзд."
            : "Не появится вообще — финал карты будет без неё."}
        </p>
      </Field>

      <div>
        <SectionTitle>Письмо (абзацы через пустую строку)</SectionTitle>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} className={inputCls} />
      </div>

      <p className="text-[10.5px] leading-snug text-white/35">
        Позицию Полярной можно менять перетаскиванием на карте в режиме автора.
      </p>

      <div className="flex gap-2 pt-2">
        <Btn variant="primary" onClick={save}>
          Сохранить
        </Btn>
        <Btn onClick={onClose}>Отмена</Btn>
      </div>
    </div>
  );
}
