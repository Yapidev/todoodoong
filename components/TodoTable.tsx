import StatusBadge from "./StatusBadge";
import { isOverdue, subtaskProgress } from "./todo-logic";
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
    <div className="w-full overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/50 dark:text-neutral-400">
            <th className="sticky top-0 z-10 bg-neutral-50 px-4 py-3 font-medium dark:bg-neutral-950">Tugas</th>
            <th className="sticky top-0 z-10 bg-neutral-50 px-4 py-3 font-medium dark:bg-neutral-950">Status</th>
            <th className="sticky top-0 z-10 bg-neutral-50 px-4 py-3 font-medium dark:bg-neutral-950">Tenggat</th>
            <th className="sticky top-0 z-10 bg-neutral-50 px-4 py-3 font-medium dark:bg-neutral-950">Prioritas</th>
            <th className="sticky top-0 z-10 bg-neutral-50 px-4 py-3 font-medium dark:bg-neutral-950">Subtugas</th>
            <th className="sticky top-0 z-10 bg-neutral-50 px-4 py-3 font-medium dark:bg-neutral-950">Dibuat</th>
            <th className="sticky top-0 z-10 bg-neutral-50 px-4 py-3 text-right font-medium dark:bg-neutral-950">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {todos.map((todo) => (
            <tr
              key={todo.id}
              className="border-b border-neutral-100 transition last:border-0 hover:bg-neutral-50 dark:border-neutral-800/60 dark:hover:bg-neutral-900/50"
            >
              <td
                onDoubleClick={() => onEdit(todo)}
                title="Klik dua kali untuk edit"
                className={`cursor-pointer select-none px-4 py-3 ${
                  todo.status === "done"
                    ? "text-neutral-400 line-through dark:text-neutral-600"
                    : ""
                }`}
              >
                {todo.text}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={todo.status} />
              </td>
              <td
                className={`whitespace-nowrap px-4 py-3 ${
                  isOverdue(todo)
                    ? "font-medium text-red-500 dark:text-red-400"
                    : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {todo.dueDate ? formatDue(todo.dueDate) : "-"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-neutral-500 dark:text-neutral-400">
                {todo.priority ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${priorityDot(todo.priority)}`}
                    />
                    {priorityLabel(todo.priority)}
                  </span>
                ) : (
                  "-"
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-neutral-500 dark:text-neutral-400">
                {todo.subtasks?.length ? (
                  (() => {
                    const { done, total } = subtaskProgress(todo);
                    return (
                      <span
                        className={`inline-flex items-center gap-1.5 ${
                          done === total ? "text-green-600 dark:text-green-400" : ""
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
              <td className="whitespace-nowrap px-4 py-3 text-neutral-500 dark:text-neutral-400">
                {formatDate(todo.createdAt)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <button
                  onClick={() => onEdit(todo)}
                  className="rounded-md px-2 py-1 text-xs text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(todo.id)}
                  className="rounded-md px-2 py-1 text-xs text-neutral-500 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
