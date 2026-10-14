import type { Todo } from "./todo-types";
import TodoMeta from "./TodoMeta";

export default function TodoChecklist({
  todos,
  onToggle,
  onEdit,
}: {
  todos: Todo[];
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
}) {
  return (
    <ul className="w-full space-y-2">
      {todos.map((todo) => (
        <li
          key={todo.id}
          className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <input
            type="checkbox"
            checked={todo.status === "done"}
            onChange={() => onToggle(todo.id)}
            aria-label={
              todo.status === "done" ? "Tandai belum selesai" : "Tandai selesai"
            }
            className="h-4 w-4 shrink-0 cursor-pointer accent-neutral-900 dark:accent-neutral-100"
          />
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
        </li>
      ))}
    </ul>
  );
}
