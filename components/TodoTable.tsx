import StatusBadge from "./StatusBadge";
import { isOverdue, relativeDueLabel, subtaskProgress } from "./todo-logic";
import { priorityDot, priorityLabel, type Todo } from "./todo-types";

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDue(dueDate: string): string {
  return new Date(`${dueDate}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TodoTable({
  todos,
  onEdit,
  onDelete,
}: {
  todos: Todo[];
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="glass-panel w-full overflow-x-auto rounded-3xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-900/10 bg-white/45 text-left text-[11px] uppercase tracking-[0.07em] text-slate-600 dark:border-white/12 dark:bg-slate-950/35 dark:text-slate-300">
            <th className="sticky top-0 z-10 min-w-[220px] px-4 py-3 font-semibold backdrop-blur-md">Tugas</th>
            <th className="sticky top-0 z-10 whitespace-nowrap px-4 py-3 font-semibold backdrop-blur-md">Status</th>
            <th className="sticky top-0 z-10 whitespace-nowrap px-4 py-3 font-semibold backdrop-blur-md">Tenggat</th>
            <th className="sticky top-0 z-10 whitespace-nowrap px-4 py-3 font-semibold backdrop-blur-md">Prioritas</th>
            <th className="sticky top-0 z-10 whitespace-nowrap px-4 py-3 font-semibold backdrop-blur-md">Subtugas</th>
            <th className="sticky top-0 z-10 whitespace-nowrap px-4 py-3 font-semibold backdrop-blur-md">Dibuat</th>
            <th className="sticky top-0 z-10 whitespace-nowrap px-4 py-3 text-right font-semibold backdrop-blur-md">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {todos.map((todo) => (
            <tr
              key={todo.id}
              className="border-b border-slate-900/8 transition last:border-0 hover:bg-white/45 dark:border-white/10 dark:hover:bg-white/8"
            >
              <td
                onDoubleClick={() => onEdit(todo)}
                title="Klik dua kali untuk edit"
                className={`cursor-pointer select-none px-4 py-3.5 font-medium ${
                  todo.status === "done"
                    ? "text-slate-500 line-through dark:text-slate-400/70"
                    : "text-slate-900 dark:text-white"
                }`}
              >
                {todo.text}
              </td>
              <td className="px-4 py-3.5">
                <StatusBadge status={todo.status} />
              </td>
              <td
                className={`whitespace-nowrap px-4 py-3.5 ${
                  isOverdue(todo)
                    ? "font-semibold text-rose-600 dark:text-rose-300"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                {todo.dueDate
                  ? (relativeDueLabel(todo.dueDate) ?? formatDue(todo.dueDate))
                  : "-"}
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-slate-600 dark:text-slate-300">
                {todo.priority ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${priorityDot(todo.priority)}`}
                    />
                    {priorityLabel(todo.priority)}
                  </span>
                ) : (
                  "-"
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-slate-600 dark:text-slate-300">
                {todo.subtasks?.length ? (
                  (() => {
                    const { done, total } = subtaskProgress(todo);
                    return (
                      <span
                        className={`inline-flex items-center gap-1.5 tabular-nums ${
                          done === total ? "font-medium text-emerald-700 dark:text-emerald-300" : ""
                        }`}
                      >
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        >
                          <path d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1-.75-.75Z" />
                        </svg>
                        {done}/{total}
                      </span>
                    );
                  })()
                ) : (
                  "-"
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-slate-600 dark:text-slate-300">
                {formatDate(todo.createdAt)}
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-right">
                <div className="inline-flex items-center gap-1">
                  <button
                    onClick={() => onEdit(todo)}
                    className="rounded-full bg-slate-900/6 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-900/12 hover:text-slate-950 dark:bg-white/12 dark:text-white dark:hover:bg-white/22 dark:hover:text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(todo.id)}
                    className="rounded-full bg-slate-900/6 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-rose-500/15 hover:text-rose-700 dark:bg-white/12 dark:text-white dark:hover:bg-rose-500/25 dark:hover:text-rose-100"
                  >
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
