"use client";

import { useState } from "react";
import type { Todo } from "./todo-types";
import { subtaskProgress } from "./todo-logic";

export default function SubtaskList({
  todo,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
}: {
  todo: Todo;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onAddSubtask: (todoId: string, text: string) => void;
  onDeleteSubtask: (todoId: string, subtaskId: string) => void;
}) {
  const [input, setInput] = useState("");
  const { done, total } = subtaskProgress(todo);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    onAddSubtask(todo.id, text);
    setInput("");
  }

  return (
    <div className="mt-2 border-t border-neutral-100 pt-2 dark:border-neutral-800">
      <ul className="space-y-1">
        {(todo.subtasks ?? []).map((st) => (
          <li key={st.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={st.done}
              onChange={() => onToggleSubtask(todo.id, st.id)}
              aria-label={st.done ? "Tandai belum selesai" : "Tandai selesai"}
              className="h-3.5 w-3.5 cursor-pointer accent-neutral-900 dark:accent-neutral-100"
            />
            <span
              className={`flex-1 text-xs ${
                st.done ? "text-neutral-400 line-through dark:text-neutral-600" : ""
              }`}
            >
              {st.text}
            </span>
            <button
              onClick={() => onDeleteSubtask(todo.id, st.id)}
              aria-label="Hapus subtugas"
              className="text-xs text-neutral-400 transition hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-1.5 flex items-center gap-2">
        <form onSubmit={handleSubmit} className="flex flex-1 items-center gap-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tambah subtugas..."
            className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs outline-none transition focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:focus:border-neutral-400"
          />
          <button
            type="submit"
            aria-label="Tambah subtugas"
            className="shrink-0 text-xs font-medium text-neutral-500 transition hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            +
          </button>
        </form>
        {total > 0 && (
          <span className="shrink-0 text-[10px] text-neutral-400 dark:text-neutral-500">
            {done}/{total}
          </span>
        )}
      </div>
    </div>
  );
}
