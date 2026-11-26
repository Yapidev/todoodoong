import { isOverdue, relativeDueLabel, subtaskProgress } from "./todo-logic";
import { priorityLabel, type Priority, type Todo } from "./todo-types";

const PRIORITY_STYLES: Record<Priority, string> = {
  low: "bg-sky-500/12 text-sky-700 dark:bg-sky-400/16 dark:text-sky-200",
  medium: "bg-amber-500/14 text-amber-800 dark:bg-amber-400/18 dark:text-amber-200",
  high: "bg-rose-500/14 text-rose-700 dark:bg-rose-400/18 dark:text-rose-200",
};

function formatDue(dueDate: string): string {
  return new Date(`${dueDate}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TodoMeta({ todo }: { todo: Todo }) {
  const hasSubtasks = (todo.subtasks?.length ?? 0) > 0;
  if (!todo.dueDate && !todo.priority && !hasSubtasks) return null;
  const progress = subtaskProgress(todo);
  return (
    <span className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
      {hasSubtasks && (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/6 px-2 py-0.5 font-medium tabular-nums text-slate-600 dark:bg-white/10 dark:text-slate-200">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden="true">
            <path d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1-.75-.75Z" />
          </svg>
          {progress.done}/{progress.total}
        </span>
      )}
      {todo.priority && (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${PRIORITY_STYLES[todo.priority]}`}
        >
          {priorityLabel(todo.priority)}
        </span>
      )}
      {todo.dueDate && (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
            isOverdue(todo)
              ? "bg-rose-500/15 text-rose-700 dark:bg-rose-400/20 dark:text-rose-200"
              : "bg-slate-900/6 text-slate-600 dark:bg-white/10 dark:text-slate-200"
          }`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M5.75 2a.75.75 0 0 1 .75.75v.75h7V2.75a.75.75 0 0 1 1.5 0v.75h.75A2.25 2.25 0 0 1 18 5.75v10.5A2.25 2.25 0 0 1 15.75 18.5H4.25A2.25 2.25 0 0 1 2 16.25V5.75A2.25 2.25 0 0 1 4.25 3.5h.75V2.75A.75.75 0 0 1 5.75 2Zm10 5.5H4.25v8.75a.25.25 0 0 0 .25.25h11.5a.25.25 0 0 0 .25-.25V7.5Z"
              clipRule="evenodd"
            />
          </svg>
          {relativeDueLabel(todo.dueDate) ?? formatDue(todo.dueDate)}
        </span>
      )}
    </span>
  );
}
