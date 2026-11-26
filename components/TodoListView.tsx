import StatusBadge from "./StatusBadge";
import type { Todo } from "./todo-types";
import TodoMeta from "./TodoMeta";

export default function TodoListView({
  todos,
  onEdit,
  onDelete,
}: {
  todos: Todo[];
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <ul className="w-full space-y-2.5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
      {todos.map((todo) => (
        <li
          key={todo.id}
          className="item-in glass-card flex items-center gap-3.5 rounded-2xl px-4 py-3.5 transition duration-200 hover:-translate-y-0.5"
        >
          <span
            onDoubleClick={() => onEdit(todo)}
            title="Klik dua kali untuk edit"
            className={`flex-1 cursor-pointer text-sm font-medium select-none ${
              todo.status === "done"
                ? "text-slate-500 line-through dark:text-slate-400/70"
                : "text-slate-900 dark:text-white"
            }`}
          >
            {todo.text}
            <TodoMeta todo={todo} />
          </span>
          <StatusBadge status={todo.status} />
          <button
            onClick={() => onEdit(todo)}
            aria-label="Edit tugas"
            className="shrink-0 rounded-full bg-slate-900/6 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-900/12 hover:text-slate-950 dark:bg-white/12 dark:text-white dark:hover:bg-white/22 dark:hover:text-white"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            aria-label="Hapus tugas"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900/6 text-slate-500 transition hover:bg-rose-500/15 hover:text-rose-600 dark:bg-white/12 dark:text-white dark:hover:bg-rose-500/25 dark:hover:text-rose-100"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );
}
