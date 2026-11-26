import { statusLabel, type Status } from "./todo-types";

const STYLES: Record<Status, string> = {
  todo: "border-slate-900/12 bg-white/55 text-slate-700 dark:border-white/15 dark:bg-white/10 dark:text-slate-200",
  doing:
    "border-amber-500/25 bg-amber-400/20 text-amber-900 dark:border-amber-300/25 dark:bg-amber-400/18 dark:text-amber-200",
  done: "border-emerald-500/25 bg-emerald-400/20 text-emerald-900 dark:border-emerald-300/25 dark:bg-emerald-400/18 dark:text-emerald-200",
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm ${STYLES[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}
