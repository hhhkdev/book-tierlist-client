import type { TierValue } from "@/lib/constants";

export const TIER_LABELS: Record<TierValue, string> = {
  S: "S",
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  F: "F",
  ETC: "기타",
};

export const TIER_COLORS: Record<TierValue, string> = {
  S: "bg-rose-100 text-rose-700",
  A: "bg-orange-100 text-orange-700",
  B: "bg-amber-100 text-amber-700",
  C: "bg-yellow-100 text-yellow-700",
  D: "bg-lime-100 text-lime-700",
  F: "bg-slate-200 text-slate-700",
  ETC: "bg-zinc-100 text-zinc-500",
};
