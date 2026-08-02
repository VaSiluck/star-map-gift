import type { Polaris } from "../data/memories";

type Props = {
  polaris: Polaris;
  onClose: () => void;
};

export default function FinalLetter({ polaris, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[8500] flex items-center justify-center overflow-y-auto bg-[#04050c]/80 px-5 py-10 backdrop-blur-md anim-fade"
      onClick={onClose}
    >
      <div
        className="grain relative w-full max-w-xl overflow-hidden rounded-3xl border border-amber-100/20 p-8 glass shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95)] md:p-12"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute -top-28 left-1/2 h-56 w-80 -translate-x-1/2 rounded-full bg-amber-200/25 blur-3xl" />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-white/15 text-white/50 transition hover:bg-white/10 hover:text-white"
          aria-label="Закрыть"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 3l7 7M10 3l-7 7" strokeLinecap="round" />
          </svg>
        </button>

        <div className="relative text-center">
          <div className="anim-drift mx-auto mb-5 grid h-14 w-14 place-items-center">
            <svg viewBox="-30 -30 60 60" className="h-14 w-14">
              <path
                d="M0 -26 Q 2.4 -2.4 26 0 Q 2.4 2.4 0 26 Q -2.4 2.4 -26 0 Q -2.4 -2.4 0 -26 Z"
                fill={polaris.color}
                opacity="0.85"
              />
              <circle r="4" fill="#fff" />
            </svg>
          </div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-amber-100/50">{polaris.heading}</p>
          <h2 className="mt-3 font-display text-4xl italic tracking-tight text-white md:text-5xl">{polaris.title}</h2>
        </div>

        <div className="relative mt-7 space-y-4">
          {polaris.text.map((p, i) => (
            <p
              key={i}
              className="anim-fade-up font-display text-[19px] leading-relaxed text-white/80 md:text-[21px]"
              style={{ animationDelay: `${180 + i * 140}ms` }}
            >
              {p}
            </p>
          ))}
        </div>

        <div className="relative mt-8 flex items-center gap-3">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-100/25 to-transparent" />
          <span className="font-display text-lg italic text-amber-100/60">навсегда твой</span>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-100/25 to-transparent" />
        </div>
      </div>
    </div>
  );
}
