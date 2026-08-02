import type { ReactNode } from "react";

export const inputCls =
  "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-400/60";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-wide text-white/45">{label}</span>
      {children}
    </label>
  );
}

export function Btn({
  children,
  onClick,
  variant = "ghost",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
}) {
  const cls =
    variant === "primary"
      ? "flex-1 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-300 disabled:opacity-50"
      : variant === "danger"
        ? "rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
        : "rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/70 transition hover:bg-white/15 hover:text-white disabled:opacity-50";
  return (
    <button onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">{children}</h3>
  );
}
