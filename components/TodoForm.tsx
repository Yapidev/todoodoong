"use client";

import { useId, useState } from "react";
import GlassSelect, { type GlassSelectOption } from "./GlassSelect";
import { StatusIcon } from "./StatusBadge";
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
  "glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 dark:text-white dark:placeholder:text-slate-300/60";

const STATUS_OPTIONS: GlassSelectOption<Status>[] = COLUMNS.map((c) => ({
  value: c.key,
  label: c.label,
  icon: <StatusIcon status={c.key} className="h-3.5 w-3.5" />,
}));

const PRIORITY_ACCENT: Record<Priority, string> = {
  low: "text-sky-700 dark:text-sky-300",
  medium: "text-amber-700 dark:text-amber-300",
  high: "text-rose-700 dark:text-rose-300",
};

const PRIORITY_OPTIONS: GlassSelectOption<PriorityChoice>[] = [
  { value: "none", label: "Tidak ada" },
  ...PRIORITIES.map((p) => ({
    value: p.key as PriorityChoice,
    label: p.label,
    accentClass: PRIORITY_ACCENT[p.key],
  })),
];

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
  const id = useId();
  const statusId = `todo-status-${id}`;
  const priorityId = `todo-priority-${id}`;
  const dueDateId = `todo-due-${id}`;

  return (
    <>
      <input
        type="text"
        name="text"
        value={text}
        autoFocus
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor={statusId}
            className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300"
          >
            Kolom
          </label>
          <GlassSelect
            id={statusId}
            value={status}
            options={STATUS_OPTIONS}
            onChange={onStatusChange}
            ariaLabel="Pilih kolom"
          />
        </div>
        <div>
          <label
            htmlFor={priorityId}
            className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300"
          >
            Prioritas
          </label>
          <GlassSelect
            id={priorityId}
            value={priority}
            options={PRIORITY_OPTIONS}
            onChange={onPriorityChange}
            ariaLabel="Pilih prioritas"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor={dueDateId}
          className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300"
        >
          Tenggat (opsional)
        </label>
        <input
          id={dueDateId}
          name="dueDate"
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
        className="glass-btn-primary rounded-full px-5 py-2 text-sm font-semibold transition active:scale-[0.98]"
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
