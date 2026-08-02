import { useRef, useState } from "react";
import type { Constellation, Star } from "../../data/memories";
import { useData, genId } from "../../data/store";
import { fileToResizedDataUrl } from "../../lib/image";
import { Btn, Field, SectionTitle, inputCls } from "./fields";

type Props = {
  star: Star;
  constellation: Constellation;
  onClose: () => void;
};

export default function StarForm({ star, constellation, onClose }: Props) {
  const { updateStar, deleteStar, moveStarToConstellation, constellations } = useData();
  const [title, setTitle] = useState(star.title);
  const [date, setDate] = useState(star.date);
  const [caption, setCaption] = useState(star.caption);
  const [story, setStory] = useState(star.story);
  const [gift, setGift] = useState(star.gift);
  const [thought, setThought] = useState(star.thought);
  const [magnitude, setMagnitude] = useState<1 | 2 | 3>(star.magnitude);
  const [photo, setPhoto] = useState(star.photo);
  const [constellationId, setConstellationId] = useState(constellation.id);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setPhoto(dataUrl);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = () => {
    const patched: Partial<Star> = {
      title: title || "Без названия",
      date,
      caption,
      story,
      gift,
      thought,
      magnitude,
      photo,
    };
    if (constellationId !== constellation.id) {
      // переносим звезду в другое созвездие
      const target = constellations.find((c) => c.id === constellationId);
      if (target) {
        moveStarToConstellation(star.id, constellation.id, target.id, { ...star, ...patched });
      }
    } else {
      updateStar(star.id, patched);
    }
    onClose();
  };

  const remove = () => {
    if (!window.confirm(`Удалить звезду «${star.title}»?`)) return;
    deleteStar(star.id);
    onClose();
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-white/90">{star.id ? "Редактировать звезду" : "Новая звезда"}</h2>
        <button onClick={onClose} className="text-xs text-white/50 hover:text-white">
          закрыть
        </button>
      </div>

      <Field label="Название воспоминания">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
      </Field>

      <Field label="Дата / период (поэтично)">
        <input value={date} onChange={(e) => setDate(e.target.value)} placeholder="сентябрь, поздний вечер" className={inputCls} />
      </Field>

      <Field label="Созвездие">
        <select
          value={constellationId}
          onChange={(e) => setConstellationId(e.target.value)}
          className={inputCls}
        >
          {constellations.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Яркость звезды (1 — самая яркая)">
        <div className="flex gap-1.5">
          {([1, 2, 3] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMagnitude(m)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                magnitude === m
                  ? "border-amber-300/60 bg-amber-300/15 text-amber-100"
                  : "border-white/12 bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              {"★".repeat(4 - m)}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Фото">
        <div className="flex items-center gap-3">
          {photo ? (
            <img src={photo} alt="" className="h-16 w-16 rounded-lg object-cover" />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-lg bg-white/5 text-2xl">🖼️</div>
          )}
          <div className="flex flex-col gap-1">
            <label className="cursor-pointer rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs transition hover:bg-white/15">
              {uploading ? "сжатие…" : "Загрузить фото"}
              <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
            </label>
            {photo && (
              <button onClick={() => setPhoto("")} className="text-xs text-white/40 hover:text-white">
                убрать
              </button>
            )}
          </div>
        </div>
        <p className="text-[10px] text-white/30">можно вставить и ссылку: {`https://…`}</p>
        <input
          value={photo.startsWith("data:") ? "" : photo}
          onChange={(e) => setPhoto(e.target.value)}
          placeholder="или URL картинки"
          className={inputCls}
        />
      </Field>

      <Field label="Подпись под фото (1 строка)">
        <input value={caption} onChange={(e) => setCaption(e.target.value)} className={inputCls} />
      </Field>

      <div>
        <SectionTitle>Как это было</SectionTitle>
        <textarea value={story} onChange={(e) => setStory(e.target.value)} rows={3} className={inputCls} />
      </div>

      <div>
        <SectionTitle>Что ты мне принесла</SectionTitle>
        <textarea value={gift} onChange={(e) => setGift(e.target.value)} rows={3} className={inputCls} />
      </div>

      <div>
        <SectionTitle>Мысль вслух (короткая строка)</SectionTitle>
        <input value={thought} onChange={(e) => setThought(e.target.value)} className={inputCls} />
      </div>

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

export function NewStarForm({ constellation, onClose }: { constellation: Constellation; onClose: () => void }) {
  const { addStar } = useData();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  const create = () => {
    const id = genId("s");
    const base = constellation.stars.length
      ? constellation.stars.reduce((a, s) => a + s.x, 0) / constellation.stars.length
      : 1000;
    const baseY = constellation.stars.length
      ? constellation.stars.reduce((a, s) => a + s.y, 0) / constellation.stars.length
      : 600;
    addStar(constellation.id, {
      id,
      title: title || "Новая звезда",
      date,
      x: base + (Math.random() - 0.5) * 200,
      y: baseY + (Math.random() - 0.5) * 160,
      magnitude: 2,
      photo: "",
      caption: "",
      story: "",
      gift: "",
      thought: "",
    });
    onClose();
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-white/90">Новая звезда</h2>
        <button onClick={onClose} className="text-xs text-white/50 hover:text-white">
          закрыть
        </button>
      </div>
      <Field label="Название">
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus className={inputCls} />
      </Field>
      <Field label="Дата / период">
        <input value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
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
