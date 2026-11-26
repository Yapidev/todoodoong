import { statusLabel, type Status } from "./todo-types";

const BADGE_STYLES: Record<Status, string> = {
  todo: "border-slate-900/12 bg-white/55 text-slate-700 dark:border-white/15 dark:bg-white/10 dark:text-slate-200",
  doing:
    "border-amber-500/25 bg-amber-400/20 text-amber-900 dark:border-amber-300/25 dark:bg-amber-400/18 dark:text-amber-200",
  done: "border-emerald-500/25 bg-emerald-400/20 text-emerald-900 dark:border-emerald-300/25 dark:bg-emerald-400/18 dark:text-emerald-200",
};

const ICON_COLORS: Record<Status, string> = {
  todo: "text-slate-500 dark:text-slate-300",
  doing: "text-amber-600 dark:text-amber-300",
  done: "text-emerald-600 dark:text-emerald-400",
};

export function StatusIcon({
  status,
  className = "h-3.5 w-3.5",
}: {
  status: Status;
  className?: string;
}) {
  if (status === "todo") {
    return (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className={`shrink-0 ${ICON_COLORS.todo} ${className}`}
      >
        <circle cx="8" cy="8" r="5.75" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }

  if (status === "doing") {
    return (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className={`shrink-0 ${ICON_COLORS.doing} ${className}`}
      >
        <circle cx="8" cy="8" r="5.75" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4.25A3.75 3.75 0 0 1 8 11.75Z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 ${ICON_COLORS.done} ${className}`}
    >
      <circle cx="8" cy="8" r="5.75" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.5 8.15 7.2 9.85 10.75 6.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${BADGE_STYLES[status]}`}
    >
      <StatusIcon status={status} className="h-3 w-3" />
      {statusLabel(status)}
    </span>
  );
}
