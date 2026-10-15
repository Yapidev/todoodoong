"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import KanbanBoard from "./KanbanBoard";
import Toast from "./Toast";
import UpdatePrompt from "./UpdatePrompt";
import { AddTodoForm, EditTodoForm } from "./TodoForm";
import TodoChecklist from "./TodoChecklist";
import TodoListView from "./TodoListView";
import TodoModal from "./TodoModal";
import TodoTable from "./TodoTable";
import {
  STATUSES,
  statusLabel,
  type SortKey,
  type Status,
  type StatusFilter,
  type Todo,
  type View,
} from "./todo-types";
import {
  addSubtaskToList,
  clearDoneFromList,
  deleteSubtaskFromList,
  deleteTodoFromList,
  matchesQuery,
  moveTodoInList,
  reorderTodoInList,
  setStatusInPlace,
  sortTodos,
  toggleDoneInList,
  toggleSubtaskInList,
} from "./todo-logic";
import {
  exportTodos,
  getServerTodos,
  getTodos,
  importTodos,
  subscribeStorageError,
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

const SORTS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Terbaru" },
  { key: "created", label: "Terlama" },
  { key: "priority", label: "Prioritas" },
  { key: "due", label: "Tenggat" },
];

const EMPTY_HINTS: Record<View, string> = {
  kanban: "Belum ada tugas. Tambahkan tugas pertamamu, lalu tarik kartu antar kolom!",
  table: "Belum ada tugas untuk ditampilkan dalam tabel.",
  list: "Belum ada tugas untuk ditampilkan dalam daftar.",
  checklist: "Belum ada tugas. Cocokkan tugas sehari-harimu di sini.",
};

export default function TodoApp() {
  const todos = useSyncExternalStore(subscribeTodos, getTodos, getServerTodos);
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme);
  const view = useSyncExternalStore(subscribeView, getView, getServerView);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    message: string;
    confirm: () => void;
  } | null>(null);
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    action?: React.ReactNode;
  } | null>(null);

  function showToast(message: string, action?: React.ReactNode) {
    const id = Date.now();
    setToast({ id, message, action });
    setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 5000);
  }

  useEffect(() => {
    return subscribeStorageError((message) => showToast(message));
  }, []);

  useEffect(() => {
    if (!isModalOpen && editingTodo === null && confirmDelete === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsModalOpen(false);
        setEditingTodo(null);
        setConfirmDelete(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isModalOpen, editingTodo, confirmDelete]);


  function setTodoStatus(id: string, status: Status) {
    updateTodos((prev) => setStatusInPlace(prev, id, status));
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

  function addSubtask(todoId: string, text: string) {
    updateTodos((prev) => addSubtaskToList(prev, todoId, text));
  }

  function toggleSubtask(todoId: string, subtaskId: string) {
    updateTodos((prev) => toggleSubtaskInList(prev, todoId, subtaskId));
  }

  function deleteSubtask(todoId: string, subtaskId: string) {
    updateTodos((prev) => deleteSubtaskFromList(prev, todoId, subtaskId));
  }

  function undoRestore(snapshot: Todo[]) {
    updateTodos(() => snapshot);
  }

  function requestDeleteTodo(id: string) {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    setConfirmDelete({
      message: `"${todo.text}" akan dihapus permanen.`,
      confirm: () => {
        const snapshot = todos;
        updateTodos((prev) => deleteTodoFromList(prev, id));
        setConfirmDelete(null);
        showToast("Tugas dihapus", renderUndo(snapshot));
      },
    });
  }

  function renderUndo(snapshot: Todo[]) {
    return (
      <button
        onClick={() => {
          undoRestore(snapshot);
          setToast(null);
        }}
        className="shrink-0 text-xs font-medium text-neutral-700 underline underline-offset-2 dark:text-neutral-200"
      >
        Urungkan
      </button>
    );
  }

  function requestClearDone() {
    setConfirmDelete({
      message: `${doneCount} tugas selesai akan dihapus permanen.`,
      confirm: () => {
        const snapshot = todos;
        updateTodos(clearDoneFromList);
        setConfirmDelete(null);
        showToast(`${doneCount} tugas selesai dihapus`, renderUndo(snapshot));
      },
    });
  }

  function handleExport() {
    const blob = new Blob([exportTodos()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `todoodoong-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${todos.length} tugas diekspor`);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const added = importTodos(String(reader.result));
        showToast(
          added > 0 ? `${added} tugas diimpor` : "Tidak ada tugas baru untuk diimpor"
        );
      } catch {
        window.alert("Gagal mengimpor: format file tidak dikenali.");
      }
    };
    reader.readAsText(file);
  }

  const filtered = sortTodos(
    todos.filter(
      (t) =>
        matchesQuery(t, search) &&
        (view === "kanban" || statusFilter === "all" || t.status === statusFilter)
    ),
    sortKey
  );
  const doneCount = todos.filter((t) => t.status === "done").length;
  const activeCount = todos.length - doneCount;
  const isFiltering = search.trim() !== "" || statusFilter !== "all";

  return (
    <main className="mx-auto flex h-dvh w-full max-w-5xl flex-col items-center px-4 py-6 sm:py-8">
      <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">Todoodoong</h1>
      <p className="mb-8 text-sm text-neutral-500 dark:text-neutral-400">
        Catat tugas, atur urutan, pilih tampilan sesuai kebutuhanmu.
      </p>

      <div className="mb-4 flex w-full flex-wrap items-center gap-3">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full rounded-lg bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-700 sm:w-auto sm:py-2.5 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          + Tambah Tugas
        </button>

        <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-neutral-200 p-1 dark:border-neutral-800">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm transition sm:py-1.5 ${
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

        <div className="ml-auto flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
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
              onClick={requestClearDone}
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
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm outline-none transition focus:border-neutral-900 sm:max-w-xs dark:border-neutral-700 dark:bg-neutral-950 dark:focus:border-neutral-400"
        />
        {view !== "kanban" && (
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-neutral-200 p-1 dark:border-neutral-800">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition ${
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
        {view !== "kanban" && (
          <label className="ml-auto flex shrink-0 items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1-.75-.75Z" />
            </svg>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label="Urutkan tugas"
              className="cursor-pointer rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm outline-none transition focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:focus:border-neutral-400"
            >
              {SORTS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col">
      {view === "kanban" && (
        <KanbanBoard
          todos={filtered}
          onEdit={setEditingTodo}
          onDelete={requestDeleteTodo}
          onMove={moveTodo}
          onReorder={reorderTodo}
        />
      )}
      {view === "table" && (
        <TodoTable todos={filtered} onEdit={setEditingTodo} onDelete={requestDeleteTodo} />
      )}
      {view === "list" && (
        <TodoListView todos={filtered} onEdit={setEditingTodo} onDelete={requestDeleteTodo} />
      )}
      {view === "checklist" && (
        <TodoChecklist
          todos={filtered}
          onToggle={toggleDone}
          onEdit={setEditingTodo}
          onDelete={requestDeleteTodo}
          onStatusChange={setTodoStatus}
          expandedId={expandedId}
          onExpand={(id) => setExpandedId((cur) => (cur === id ? null : id))}
          onSubtaskAdd={addSubtask}
          onSubtaskToggle={toggleSubtask}
          onSubtaskDelete={deleteSubtask}
        />
      )}

      </div>
      {todos.length === 0 && (
        <p className="mt-8 text-center text-sm text-neutral-400 dark:text-neutral-500">
          {EMPTY_HINTS[view]}
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

      {toast && (
        <Toast
          message={toast.message}
          action={toast.action}
          onClose={() => setToast(null)}
        />
      )}
      <UpdatePrompt />

      {confirmDelete && (
        <TodoModal title="Hapus Tugas?" onClose={() => setConfirmDelete(null)}>
          <p className="mb-5 text-sm text-neutral-600 dark:text-neutral-300">
            {confirmDelete.message}
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setConfirmDelete(null)}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Batal
            </button>
            <button
              onClick={confirmDelete.confirm}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Hapus
            </button>
          </div>
        </TodoModal>
      )}

      {isModalOpen && (
        <AddTodoForm
          onClose={() => setIsModalOpen(false)}
          onAdded={(m) => showToast(m)}
        />
      )}

      {editingTodo && (
        <EditTodoForm
          todo={editingTodo}
          onClose={() => setEditingTodo(null)}
          onSaved={(m) => {
            setEditingTodo(null);
            showToast(m);
          }}
          onEmptyText={(id) => requestDeleteTodo(id)}
        />
      )}
    </main>
  );
}
