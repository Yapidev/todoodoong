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
  "w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:focus:border-neutral-400";

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
          <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
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
          <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
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
        <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
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
        className="rounded-lg border border-neutral-300 px-4 py-2 text-sm transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        Batal
      </button>
      <button
        type="submit"
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
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
      <form onSubmit={handleSubmit} className="space-y-3">
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
      <form onSubmit={handleSubmit} className="space-y-3">
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
