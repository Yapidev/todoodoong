import { statusLabel, type Status } from "./todo-types";

const STYLES: Record<Status, string> = {
  todo: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  doing: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  done: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}
