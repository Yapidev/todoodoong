"use client";

import { useState } from "react";
import TodoModal from "./TodoModal";
import {
  COLUMNS,
  PRIORITIES,
  type Priority,
  type Status,
  type Todo,
} from "./todo-types";
import {
  addTodoToList,
  generateId,
  updateTodoInList,
} from "./todo-logic";
import { updateTodos } from "./todo-store";

type PriorityChoice = "none" | Priority;

const inputClass =
  "glass-input w-full rounded-2xl px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 dark:text-white dark:placeholder:text-slate-300/60";

function TodoFormFields({
  text,
  onTextChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  dueDate,
  onDueDateChange,
  placeholder,
}: {
  text: string;
  onTextChange: (v: string) => void;
  status: Status;
  onStatusChange: (v: Status) => void;
  priority: PriorityChoice;
  onPriorityChange: (v: PriorityChoice) => void;
  dueDate: string;
  onDueDateChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <>
      <input
        type="text"
        value={text}
        autoFocus
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">
            Kolom
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as Status)}
            className={inputClass}
          >
            {COLUMNS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">
            Prioritas
          </label>
          <select
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value as PriorityChoice)}
            className={inputClass}
          >
            <option value="none">Tidak ada</option>
            {PRIORITIES.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">
          Tenggat (opsional)
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => onDueDateChange(e.target.value)}
          className={inputClass}
        />
      </div>
    </>
  );
}

function FormActions({
  onCancel,
  submitLabel,
}: {
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-full border border-slate-900/15 bg-white/55 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white/85 dark:border-white/20 dark:bg-white/14 dark:text-white dark:hover:bg-white/22"
      >
        Batal
      </button>
      <button
        type="submit"
        className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_-6px_rgb(14_165_233/0.6)] transition hover:bg-sky-400 dark:bg-sky-500 dark:text-white dark:hover:bg-sky-400"
      >
        {submitLabel}
      </button>
    </div>
  );
}

export function AddTodoForm({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (message: string) => void;
}) {
  const [input, setInput] = useState("");
  const [newStatus, setNewStatus] = useState<Status>("todo");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState<PriorityChoice>("none");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const todo: Todo = {
      id: generateId(),
      text,
      status: newStatus,
      createdAt: Date.now(),
      ...(newDueDate ? { dueDate: newDueDate } : {}),
      ...(newPriority !== "none" ? { priority: newPriority } : {}),
    };
    updateTodos((prev) => addTodoToList(prev, todo));
    onAdded("Tugas ditambahkan");
    onClose();
  }

  return (
    <TodoModal title="Tambah Tugas" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <TodoFormFields
          text={input}
          onTextChange={setInput}
          status={newStatus}
          onStatusChange={setNewStatus}
          priority={newPriority}
          onPriorityChange={setNewPriority}
          dueDate={newDueDate}
          onDueDateChange={setNewDueDate}
          placeholder="Tugas baru..."
        />
        <FormActions onCancel={onClose} submitLabel="Simpan" />
      </form>
    </TodoModal>
  );
}

export function EditTodoForm({
  todo,
  onClose,
  onSaved,
  onEmptyText,
}: {
  todo: Todo;
  onClose: () => void;
  onSaved: (message: string) => void;
  onEmptyText: (id: string) => void;
}) {
  const [editText, setEditText] = useState(todo.text);
  const [editStatus, setEditStatus] = useState<Status>(todo.status);
  const [editDueDate, setEditDueDate] = useState(todo.dueDate ?? "");
  const [editPriority, setEditPriority] = useState<PriorityChoice>(
    todo.priority ?? "none"
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = editText.trim();
    if (!text) {
      onClose();
      onEmptyText(todo.id);
      return;
    }
    updateTodos((prev) =>
      updateTodoInList(prev, todo.id, {
        text,
        status: editStatus,
        dueDate: editDueDate || undefined,
        priority: editPriority === "none" ? undefined : editPriority,
      })
    );
    onSaved("Tugas diperbarui");
  }

  return (
    <TodoModal title="Edit Tugas" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <TodoFormFields
          text={editText}
          onTextChange={setEditText}
          status={editStatus}
          onStatusChange={setEditStatus}
          priority={editPriority}
          onPriorityChange={setEditPriority}
          dueDate={editDueDate}
          onDueDateChange={setEditDueDate}
        />
        <FormActions onCancel={onClose} submitLabel="Simpan" />
      </form>
    </TodoModal>
  );
}
