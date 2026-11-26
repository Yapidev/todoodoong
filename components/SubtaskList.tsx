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
    <div className="mt-3 rounded-xl border border-slate-900/8 bg-white/35 p-2.5 dark:border-white/12 dark:bg-slate-950/25">
      <ul className="space-y-1.5">
        {(todo.subtasks ?? []).map((st) => (
          <li key={st.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={st.done}
              onChange={() => onToggleSubtask(todo.id, st.id)}
              aria-label={st.done ? "Tandai belum selesai" : "Tandai selesai"}
              className="h-3.5 w-3.5 cursor-pointer accent-sky-500 dark:accent-sky-400"
            />
            <span
              className={`flex-1 text-xs ${
                st.done
                  ? "text-slate-500 line-through dark:text-slate-400/70"
                  : "text-slate-800 dark:text-slate-100"
              }`}
            >
              {st.text}
            </span>
            <button
              onClick={() => onDeleteSubtask(todo.id, st.id)}
              aria-label="Hapus subtugas"
              className="flex h-5 w-5 items-center justify-center rounded-full text-slate-500 transition hover:bg-rose-500/15 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-400/20 dark:hover:text-rose-200"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center gap-2">
        <form onSubmit={handleSubmit} className="flex flex-1 items-center gap-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tambah subtugas..."
            className="glass-input w-full rounded-lg px-2.5 py-1.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-500 dark:text-white dark:placeholder:text-slate-300/60"
          />
          <button
            type="submit"
            aria-label="Tambah subtugas"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-xs font-semibold text-sky-700 transition hover:bg-sky-500/30 dark:bg-sky-500/25 dark:text-white dark:hover:bg-sky-500/35"
          >
            +
          </button>
        </form>
        {total > 0 && (
          <span className="shrink-0 text-[10px] font-medium tabular-nums text-slate-500 dark:text-slate-300/75">
            {done}/{total}
          </span>
        )}
      </div>
    </div>
  );
}
