import type { Constellation } from "../data/memories";

type Props = {
  constellations: Constellation[];
  totalStars: number;
  onStart: () => void;
};

export default function Intro({ constellations, totalStars, onStart }: Props) {
  return (
    <div className="fixed inset-0 z-[8000] flex items-center justify-center overflow-y-auto bg-[#04050c]/72 px-5 py-10 backdrop-blur-[6px] anim-fade">
      <div className="grain relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/12 p-7 text-center glass shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95)] md:p-10">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-52 w-72 -translate-x-1/2 rounded-full bg-indigo-400/25 blur-3xl" />

        <div className="anim-fade-up relative" style={{ animationDelay: "60ms" }}>
          <p className="text-[10px] uppercase tracking-[0.36em] text-white/40">Для тебя</p>
          <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight text-white md:text-5xl">
            Карта твоих
            <br />
            <span className="italic text-amber-100/90">звёзд</span>
          </h1>
        </div>

        <p
          className="anim-fade-up mt-5 text-balance text-[14.5px] leading-relaxed text-white/65"
          style={{ animationDelay: "180ms" }}
        >
          Я не смог уместить это в открытку, поэтому сделал небо. Каждая звезда здесь — момент из нашей жизни и то,
          что ты в меня этим моментом принесла.
        </p>
        <p
          className="anim-fade-up mt-3 text-balance text-[14.5px] leading-relaxed text-white/50"
          style={{ animationDelay: "260ms" }}
        >
          Звёзды тусклые, пока их не откроешь. Открывай — они загорятся и соберутся в созвездия.
        </p>

        <div className="anim-fade-up mt-7 flex flex-wrap items-center justify-center gap-2" style={{ animationDelay: "340ms" }}>
          {constellations.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/60"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color, boxShadow: `0 0 8px ${c.color}` }} />
              {c.name}
            </span>
          ))}
        </div>

        <button
          onClick={onStart}
          className="anim-fade-up group relative mt-8 w-full overflow-hidden rounded-full bg-white px-8 py-3.5 text-[14px] font-medium text-slate-900 transition hover:shadow-[0_0_50px_-6px_rgba(255,255,255,0.65)] active:scale-[0.98]"
          style={{ animationDelay: "420ms" }}
        >
          <span className="relative z-10">Открыть небо</span>
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-amber-200/60 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </button>

        <p className="anim-fade-up mt-4 text-[11px] tracking-wide text-white/30" style={{ animationDelay: "500ms" }}>
          {totalStars} звёзд · {constellations.length} созвездий · и одна, которая появится в конце
        </p>
      </div>
    </div>
  );
}
