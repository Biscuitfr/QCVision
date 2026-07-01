import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import type { Decision } from "@/types/analysis";

const CONFIG: Record<
  Decision,
  { label: string; sub: string; icon: typeof CheckCircle2; classes: string }
> = {
  GL: {
    label: "GL",
    sub: "Green Light — Conforme",
    icon: CheckCircle2,
    classes: "bg-gl/15 text-gl border-gl/40 shadow-gl/20",
  },
  RL: {
    label: "RL",
    sub: "Red Light — Non conforme",
    icon: XCircle,
    classes: "bg-rl/15 text-rl border-rl/40 shadow-rl/20",
  },
  CHECK: {
    label: "CHECK",
    sub: "Incertain — Vérification requise",
    icon: HelpCircle,
    classes: "bg-check/15 text-check border-check/40 shadow-check/20",
  },
};

interface VerdictBadgeProps {
  decision: Decision;
  size?: "lg" | "md";
}

/**
 * Grand badge visuel affichant le verdict final (GL / RL / CHECK).
 */
export default function VerdictBadge({ decision, size = "lg" }: VerdictBadgeProps) {
  const cfg = CONFIG[decision] ?? CONFIG.CHECK;
  const Icon = cfg.icon;

  return (
    <div
      className={`animate-scale-in flex flex-col items-center justify-center gap-2 rounded-3xl border-2 px-8 shadow-xl ${cfg.classes} ${
        size === "lg" ? "py-8" : "py-5"
      }`}
    >
      <Icon className={size === "lg" ? "h-14 w-14" : "h-9 w-9"} strokeWidth={1.6} />
      <span className={`font-extrabold tracking-tight ${size === "lg" ? "text-4xl" : "text-2xl"}`}>
        {cfg.label}
      </span>
      <span className="text-sm font-medium opacity-90">{cfg.sub}</span>
    </div>
  );
}
