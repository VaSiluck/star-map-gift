import { useState } from "react";
import type { Constellation } from "../../data/memories";
import { useData, genId } from "../../data/store";
import { Btn, Field, inputCls } from "./fields";

const PALETTE = [
  "#8ab4ff",
  "#ffc98a",
  "#b39cff",
  "#ff8aa6",
  "#8affd1",
  "#ffd27a",
  "#7fe3ff",
  "#ffe66b",
];

type Props = {
  constellation: Constellation;
  onClose: () => void;
};

export default function ConstellationForm({ constellation, onClose }: Props) {
  const { updateConstellation, deleteConstellation } = useData();
  const [name, setName] = useState(constellation.name);
  const [latin, setLatin] = useState(constellation.latin);
  const [subtitle, setSubtitle] = useState(constellation.subtitle);
  const [color, setColor] = useState(constellation.color);

  const save = () => {
    updateConstellation(constellation.id, {
      name: name || "Созвездие",
      latin,
      subtitle,
      color,
    });
    onClose();
  };

  const remove = () => {
    if (!window.confirm(`Удалить созвездие «${constellation.name}» вместе со всеми звёздами?`)) return;
    deleteConstellation(constellation.id);
    onClose();
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-white/90">Редактировать созвездие</h2>
        <button onClick={onClose} className="text-xs text-white/50 hover:text-white">
          закрыть
        </button>
      </div>

      <Field label="Название">
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
      </Field>

      <Field label="Латинское имя">
        <input value={latin} onChange={(e) => setLatin(e.target.value)} placeholder="Initium" className={inputCls} />
      </Field>

      <Field label="Подзаголовок">
        <textarea value={subtitle} onChange={(e) => setSubtitle(e.target.value)} rows={2} className={inputCls} />
      </Field>

      <Field label="Цвет">
        <div className="flex flex-wrap gap-2">
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="h-8 w-8 rounded-full transition"
              style={{
                background: c,
                boxShadow: `0 0 10px ${c}`,
                outline: color === c ? "2px solid #fff" : "none",
                outlineOffset: 2,
              }}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-10 cursor-pointer rounded bg-transparent"
          />
        </div>
      </Field>

      <div className="flex gap-2 pt-2">
        <Btn variant="primary" onClick={save}>
          Сохранить
        </Btn>
        <Btn variant="danger" onClick={remove}>
          Удалить
        </Btn>
      </div>
    </div>
  );
}

export function NewConstellationForm({ onClose }: { onClose: () => void }) {
  const { addConstellation } = useData();
  const [name, setName] = useState("");
  const [latin, setLatin] = useState("");

  const create = () => {
    addConstellation({
      id: genId("c"),
      name: name || "Новое созвездие",
      latin: latin || "NOVA",
      subtitle: "",
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      lines: [],
    });
    onClose();
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-white/90">Новое созвездие</h2>
        <button onClick={onClose} className="text-xs text-white/50 hover:text-white">
          закрыть
        </button>
      </div>
      <Field label="Название">
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus className={inputCls} />
      </Field>
      <Field label="Латинское имя">
        <input value={latin} onChange={(e) => setLatin(e.target.value)} className={inputCls} />
      </Field>
      <div className="flex gap-2 pt-2">
        <Btn variant="primary" onClick={create}>
          Создать
        </Btn>
        <Btn onClick={onClose}>Отмена</Btn>
      </div>
    </div>
  );
}
