import StatusBadge from "./StatusBadge";
import { COLUMNS, type Todo } from "./todo-types";
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
    <ul className="w-full space-y-2">
      {todos.map((todo) => {
        const dot = COLUMNS.find((c) => c.key === todo.status)?.dot;
        return (
          <li
            key={todo.id}
            className="item-in flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
            <span
              onDoubleClick={() => onEdit(todo)}
              title="Klik dua kali untuk edit"
              className={`flex-1 cursor-pointer text-sm select-none ${
                todo.status === "done"
                  ? "text-neutral-400 line-through dark:text-neutral-600"
                  : ""
              }`}
            >
              {todo.text}
              <TodoMeta todo={todo} />
            </span>
            <StatusBadge status={todo.status} />
            <button
              onClick={() => onDelete(todo.id)}
              aria-label="Hapus tugas"
              className="shrink-0 text-neutral-300 transition hover:text-red-500 dark:text-neutral-600 dark:hover:text-red-400"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
