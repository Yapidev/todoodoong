"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import KanbanBoard from "./KanbanBoard";
import TodoChecklist from "./TodoChecklist";
import TodoListView from "./TodoListView";
import TodoModal from "./TodoModal";
import TodoTable from "./TodoTable";
import {
  COLUMNS,
  PRIORITIES,
  STATUSES,
  statusLabel,
  type Priority,
  type Status,
  type StatusFilter,
  type Todo,
  type View,
} from "./todo-types";
import {
  addTodoToList,
  clearDoneFromList,
  deleteTodoFromList,
  matchesQuery,
  moveTodoInList,
  reorderTodoInList,
  toggleDoneInList,
  updateTodoInList,
} from "./todo-logic";
import {
  exportTodos,
  getServerTodos,
  getTodos,
  importTodos,
  subscribeTodos,
  updateTodos,
} from "./todo-store";
import {
  getServerTheme,
  getServerView,
  getTheme,
  getView,
  setView,
  subscribeTheme,
  subscribeView,
  toggleTheme,
} from "./prefs";

const VIEWS: { key: View; label: string }[] = [
  { key: "kanban", label: "Kanban" },
  { key: "table", label: "Tabel" },
  { key: "list", label: "List" },
  { key: "checklist", label: "Checkbox" },
];

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Semua" },
  ...STATUSES.map((s) => ({ key: s as StatusFilter, label: statusLabel(s) })),
];

export default function TodoApp() {
  const todos = useSyncExternalStore(subscribeTodos, getTodos, getServerTodos);
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme);
  const view = useSyncExternalStore(subscribeView, getView, getServerView);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [input, setInput] = useState("");
  const [newStatus, setNewStatus] = useState<Status>("todo");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState<"none" | Priority>("none");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editStatus, setEditStatus] = useState<Status>("todo");
  const [editDueDate, setEditDueDate] = useState("");
  const [editPriority, setEditPriority] = useState<"none" | Priority>("none");

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!isModalOpen && editingId === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsModalOpen(false);
        setEditingId(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isModalOpen, editingId]);

  function addTodo(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const todo: Todo = {
      id: crypto.randomUUID(),
      text,
      status: newStatus,
      createdAt: Date.now(),
      ...(newDueDate ? { dueDate: newDueDate } : {}),
      ...(newPriority !== "none" ? { priority: newPriority } : {}),
    };
    updateTodos((prev) => addTodoToList(prev, todo));
    setInput("");
    setNewStatus("todo");
    setNewDueDate("");
    setNewPriority("none");
    setIsModalOpen(false);
  }

  function startEdit(todo: Todo) {
    setEditingId(todo.id);
    setEditText(todo.text);
    setEditStatus(todo.status);
    setEditDueDate(todo.dueDate ?? "");
    setEditPriority(todo.priority ?? "none");
  }

  function saveEdit(id: string) {
    const text = editText.trim();
    if (!text) {
      deleteTodo(id);
    } else {
      updateTodos((prev) =>
        updateTodoInList(prev, id, {
          text,
          status: editStatus,
          dueDate: editDueDate || undefined,
          priority: editPriority === "none" ? undefined : editPriority,
        })
      );
    }
    setEditingId(null);
  }

  function moveTodo(id: string, status: Status, beforeId?: string) {
    updateTodos((prev) => moveTodoInList(prev, id, status, beforeId));
  }

  function reorderTodo(activeId: string, overId: string) {
    updateTodos((prev) => reorderTodoInList(prev, activeId, overId));
  }

  function toggleDone(id: string) {
    updateTodos((prev) => toggleDoneInList(prev, id));
  }

  function deleteTodo(id: string) {
    updateTodos((prev) => deleteTodoFromList(prev, id));
  }

  function clearDone() {
    updateTodos(clearDoneFromList);
  }

  function handleExport() {
    const blob = new Blob([exportTodos()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `todo-kanban-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importTodos(String(reader.result));
      } catch {
        window.alert("Gagal mengimpor: format file tidak dikenali.");
      }
    };
    reader.readAsText(file);
  }

  const filtered = todos.filter(
    (t) =>
      matchesQuery(t, search) &&
      (view === "kanban" || statusFilter === "all" || t.status === statusFilter)
  );
  const doneCount = todos.filter((t) => t.status === "done").length;
  const activeCount = todos.length - doneCount;
  const isFiltering = search.trim() !== "" || statusFilter !== "all";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center px-4 py-12">
      <h1 className="mb-2 text-4xl font-bold tracking-tight">Todo Kanban</h1>
      <p className="mb-8 text-sm text-neutral-500 dark:text-neutral-400">
        Catat tugas, atur urutan, pilih tampilan sesuai kebutuhanmu.
      </p>

      <div className="mb-4 flex w-full flex-wrap items-center gap-3">
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          + Tambah Tugas
        </button>

        <div className="flex gap-1 rounded-lg border border-neutral-200 p-1 dark:border-neutral-800">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                view === v.key
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <button
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Ubah ke mode terang" : "Ubah ke mode gelap"}
          title={theme === "dark" ? "Mode terang" : "Mode gelap"}
          className="rounded-lg border border-neutral-200 p-2.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        >
          {theme === "dark" ? (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10 2a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0v-.75A.75.75 0 0 1 10 2Zm0 13a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0 2.25a.75.75 0 0 1-.75-.75v-.75a.75.75 0 0 1 1.5 0v.75a.75.75 0 0 1-.75.75ZM2 10a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75A.75.75 0 0 1 2 10Zm14.5 0a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75ZM4.343 4.343a.75.75 0 0 1 1.061 0l.53.53a.75.75 0 0 1-1.06 1.061l-.53-.53a.75.75 0 0 1 0-1.061Zm9.723 9.723a.75.75 0 0 1 1.06 0l.53.53a.75.75 0 1 1-1.06 1.061l-.53-.53a.75.75 0 0 1 0-1.061ZM15.657 4.343a.75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.061-1.06l.53-.53a.75.75 0 0 1 1.061 0ZM5.996 14.066a.75.75 0 0 1 0 1.06l-.53.53a.75.75 0 0 1-1.06-1.06l.53-.53a.75.75 0 0 1 1.06 0Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M7.455 2.004a.75.75 0 0 1 .53.91 6 6 0 0 0 6.854 7.507.75.75 0 0 1 .845 1.054A7.5 7.5 0 1 1 6.4 2.07a.75.75 0 0 1 1.055-.066Z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={handleExport}
            className="text-sm text-neutral-500 underline-offset-4 transition hover:text-neutral-900 hover:underline dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            Ekspor
          </button>
          <label className="cursor-pointer text-sm text-neutral-500 underline-offset-4 transition hover:text-neutral-900 hover:underline dark:text-neutral-400 dark:hover:text-neutral-100">
            Impor
            <input
              type="file"
              accept="application/json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          {doneCount > 0 && (
            <button
              onClick={clearDone}
              className="text-sm text-neutral-500 underline-offset-4 transition hover:text-red-500 hover:underline dark:text-neutral-400"
            >
              Hapus selesai ({doneCount})
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 flex w-full flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari tugas..."
          className="w-full max-w-xs rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm outline-none transition focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:focus:border-neutral-400"
        />
        {view !== "kanban" && (
          <div className="flex gap-1 rounded-lg border border-neutral-200 p-1 dark:border-neutral-800">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`rounded-md px-3 py-1 text-sm transition ${
                  statusFilter === f.key
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {view === "kanban" && (
        <KanbanBoard
          todos={filtered}
          onEdit={startEdit}
          onDelete={deleteTodo}
          onMove={moveTodo}
          onReorder={reorderTodo}
        />
      )}
      {view === "table" && (
        <TodoTable todos={filtered} onEdit={startEdit} onDelete={deleteTodo} />
      )}
      {view === "list" && (
        <TodoListView todos={filtered} onEdit={startEdit} onDelete={deleteTodo} />
      )}
      {view === "checklist" && (
        <TodoChecklist todos={filtered} onToggle={toggleDone} onEdit={startEdit} />
      )}

      {todos.length === 0 && (
        <p className="mt-8 text-sm text-neutral-400 dark:text-neutral-500">
          Belum ada tugas. Tambahkan tugas pertamamu!
        </p>
      )}
      {todos.length > 0 && filtered.length === 0 && isFiltering && (
        <p className="mt-8 text-sm text-neutral-400 dark:text-neutral-500">
          Tidak ada tugas yang cocok dengan pencarian/filter.
        </p>
      )}

      {todos.length > 0 && (
        <p className="mt-6 text-xs text-neutral-400 dark:text-neutral-500">
          {activeCount} tugas aktif dari {todos.length} total
        </p>
      )}

      {isModalOpen && (
        <TodoModal title="Tambah Tugas" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={addTodo} className="space-y-3">
            <input
              type="text"
              value={input}
              autoFocus
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tugas baru..."
              className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:focus:border-neutral-400"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Kolom
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as Status)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:focus:border-neutral-400"
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
                  value={newPriority}
                  onChange={(e) =>
                    setNewPriority(e.target.value as "none" | Priority)
                  }
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:focus:border-neutral-400"
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
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:focus:border-neutral-400"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
              >
                Simpan
              </button>
            </div>
          </form>
        </TodoModal>
      )}

      {editingId !== null && (
        <TodoModal title="Edit Tugas" onClose={() => setEditingId(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveEdit(editingId);
            }}
            className="space-y-3"
          >
            <input
              type="text"
              value={editText}
              autoFocus
              onChange={(e) => setEditText(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:focus:border-neutral-400"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Kolom
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Status)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:focus:border-neutral-400"
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
                  value={editPriority}
                  onChange={(e) =>
                    setEditPriority(e.target.value as "none" | Priority)
                  }
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:focus:border-neutral-400"
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
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:focus:border-neutral-400"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
              >
                Simpan
              </button>
            </div>
          </form>
        </TodoModal>
      )}
    </main>
  );
}
