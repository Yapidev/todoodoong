import { COLUMNS, STATUSES, type Status, type Todo } from "./todo-types";
import SubtaskList from "./SubtaskList";
import TodoMeta from "./TodoMeta";

export default function TodoChecklist({
  todos,
  onToggle,
  onEdit,
  onStatusChange,
  expandedId,
  onExpand,
  onSubtaskAdd,
  onSubtaskToggle,
  onSubtaskDelete,
}: {
  todos: Todo[];
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onStatusChange: (id: string, status: Status) => void;
  expandedId: string | null;
  onExpand: (id: string) => void;
  onSubtaskAdd: (todoId: string, text: string) => void;
  onSubtaskToggle: (todoId: string, subtaskId: string) => void;
  onSubtaskDelete: (todoId: string, subtaskId: string) => void;
}) {
  return (
    <ul className="w-full space-y-2">
      {todos.map((todo) => {
        const expanded = expandedId === todo.id;
        return (
          <li
            key={todo.id}
            className="rounded-lg border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-center gap-3">
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
              <select
                value={todo.status}
                onChange={(e) => onStatusChange(todo.id, e.target.value as Status)}
                aria-label="Ubah status"
                className="shrink-0 cursor-pointer rounded-md border border-neutral-200 bg-white px-1.5 py-1 text-xs outline-none transition focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:focus:border-neutral-400"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {COLUMNS.find((c) => c.key === s)?.label ?? s}
                  </option>
                ))}
              </select>
              <button
                onClick={() => onExpand(todo.id)}
                aria-label={expanded ? "Tutup subtugas" : "Buka subtugas"}
                className="shrink-0 text-neutral-300 transition hover:text-neutral-900 dark:text-neutral-600 dark:hover:text-neutral-100"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`h-4 w-4 transition ${expanded ? "rotate-90" : ""}`}
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            {expanded && (
              <SubtaskList
                todo={todo}
                onAddSubtask={onSubtaskAdd}
                onToggleSubtask={onSubtaskToggle}
                onDeleteSubtask={onSubtaskDelete}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
