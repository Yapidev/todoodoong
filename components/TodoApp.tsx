"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import BrandLogo from "./BrandLogo";
import GlassSelect from "./GlassSelect";
import KanbanBoard from "./KanbanBoard";
import StatusBadge from "./StatusBadge";
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
  addTodoToColumnEnd,
  clearDoneFromList,
  deleteSubtaskFromList,
  deleteTodoFromList,
  generateId,
  isOverdue,
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

const VIEW_ICONS: Record<View, React.ReactNode> = {
  kanban: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <rect x="3" y="3" width="4" height="14" rx="1.5" />
      <rect x="8" y="3" width="4" height="9" rx="1.5" />
      <rect x="13" y="3" width="4" height="6" rx="1.5" />
    </svg>
  ),
  table: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <rect x="3" y="3" width="6" height="6" rx="1.5" />
      <rect x="11" y="3" width="6" height="6" rx="1.5" />
      <rect x="3" y="11" width="6" height="6" rx="1.5" />
      <rect x="11" y="11" width="6" height="6" rx="1.5" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <rect x="3" y="4" width="14" height="2.5" rx="1.25" />
      <rect x="3" y="8.75" width="14" height="2.5" rx="1.25" />
      <rect x="3" y="13.5" width="14" height="2.5" rx="1.25" />
    </svg>
  ),
  checklist: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M5.25 3A2.25 2.25 0 0 0 3 5.25v9.5A2.25 2.25 0 0 0 5.25 17h9.5A2.25 2.25 0 0 0 17 14.75v-9.5A2.25 2.25 0 0 0 14.75 3h-9.5Zm8.53 4.28a.75.75 0 0 0-1.06-1.06L9.25 9.69 7.53 7.97a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.06 0l4-4Z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

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

function ProgressRing({ percent }: { percent: number }) {
  const radius = 19;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
      <svg className="-rotate-90 h-11 w-11" viewBox="0 0 44 44" aria-hidden="true">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          strokeWidth="3.5"
          className="stroke-slate-900/10 dark:stroke-white/15"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-sky-500 transition-[stroke-dashoffset] duration-500 ease-out dark:stroke-sky-400"
        />
      </svg>
      <span className="absolute text-[11px] font-semibold tabular-nums tracking-tight text-slate-800 dark:text-white">
        {clamped}%
      </span>
    </div>
  );
}

export default function TodoApp() {
  const todos = useSyncExternalStore(subscribeTodos, getTodos, getServerTodos);
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme);
  const view = useSyncExternalStore(subscribeView, getView, getServerView);

  const [search, setSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
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
    if (isSearchOpen) {
      searchRef.current?.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isModalOpen && !isSearchOpen && editingTodo === null && confirmDelete === null)
      return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsModalOpen(false);
        setIsSearchOpen(false);
        setEditingTodo(null);
        setConfirmDelete(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isModalOpen, isSearchOpen, editingTodo, confirmDelete]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isModalOpen || isSearchOpen || editingTodo !== null || confirmDelete !== null)
        return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      )
        return;
      if (e.key === "n") {
        e.preventDefault();
        setIsModalOpen(true);
      } else if (e.key === "/") {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key >= "1" && e.key <= "4") {
        const next = VIEWS[Number(e.key) - 1];
        if (next) setView(next.key);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isModalOpen, isSearchOpen, editingTodo, confirmDelete]);

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

  function quickAddTodo(status: Status, text: string) {
    updateTodos((prev) =>
      addTodoToColumnEnd(prev, {
        id: generateId(),
        text,
        status,
        createdAt: Date.now(),
      })
    );
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
        className="shrink-0 rounded-full bg-sky-500/20 px-2.5 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-500/30 dark:bg-sky-400/25 dark:text-white dark:hover:bg-sky-400/35"
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

  const searchMatches = todos.filter((t) => matchesQuery(t, search));
  const visible = searchMatches.filter(
    (t) => view === "kanban" || statusFilter === "all" || t.status === statusFilter
  );
  // Urutan manual hasil drag di kanban harus dipertahankan;
  // sorting hanya berlaku untuk view tabel, list, dan checklist.
  const filtered = view === "kanban" ? visible : sortTodos(visible, sortKey);
  const doneCount = todos.filter((t) => t.status === "done").length;
  const doingCount = todos.filter((t) => t.status === "doing").length;
  const activeCount = todos.length - doneCount;
  const overdueCount = todos.filter((t) => isOverdue(t)).length;
  const highPriorityCount = todos.filter(
    (t) => t.status !== "done" && t.priority === "high"
  ).length;
  const completionPercent =
    todos.length > 0 ? Math.round((doneCount / todos.length) * 100) : 0;
  const hasSearch = search.trim() !== "";
  const isFiltering = hasSearch || statusFilter !== "all";
  const showCommandBar = hasSearch || view !== "kanban";

  return (
    <>
      <div className="spatial-bg" aria-hidden="true" />
      <input
        ref={importInputRef}
        type="file"
        accept="application/json"
        onChange={handleImport}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      <main className="mx-auto flex min-h-dvh w-full max-w-[1320px] items-start justify-center gap-4 px-3 pb-28 pt-4 sm:px-6 sm:pt-6 lg:h-dvh lg:pb-24 lg:pt-5">
        {/* Main Floating Glass Window */}
        <div className="glass-window flex w-full flex-1 flex-col rounded-[28px] p-4 sm:rounded-[32px] sm:p-5 lg:h-full lg:min-h-0 lg:overflow-hidden lg:p-6">
          {/* Header Row */}
          <header className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3 lg:flex-nowrap">
            <div className="flex min-w-0 items-center gap-3">
              <BrandLogo className="h-10 w-10 shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl font-semibold leading-tight tracking-[-0.025em] text-slate-900 sm:text-2xl dark:text-white">
                  Todoodoong
                </h1>
                <p className="mt-0.5 truncate text-[13px] leading-snug text-slate-600 dark:text-slate-300/80">
                  Catat tugas, atur urutan, pilih tampilan sesuai kebutuhanmu.
                </p>
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap sm:justify-end">
              {doneCount > 0 && (
                <button
                  onClick={requestClearDone}
                  className="whitespace-nowrap rounded-full bg-rose-500/12 px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-500/20 dark:bg-rose-500/25 dark:text-white dark:hover:bg-rose-500/35"
                >
                  Hapus selesai ({doneCount})
                </button>
              )}

              <button
                onClick={() => setIsModalOpen(true)}
                className="glass-btn-primary flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold tracking-[-0.01em] transition active:scale-[0.98] sm:flex-initial"
              >
                + Tambah Tugas
                <kbd
                  aria-hidden="true"
                  className="hidden rounded-full bg-white/20 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white sm:inline"
                >
                  N
                </kbd>
              </button>

              {/* Mobile / Tablet Utilities (shown when right sidebar is hidden) */}
              <div className="flex items-center gap-1 lg:hidden">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Buka pencarian"
                  title="Cari tugas (/)"
                  className="glass-panel flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/80 dark:text-white dark:hover:bg-white/20"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                <button
                  onClick={toggleTheme}
                  aria-label={theme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
                  title={theme === "dark" ? "Mode terang" : "Mode gelap"}
                  className="glass-panel flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/80 dark:text-white dark:hover:bg-white/20"
                >
                  {theme === "dark" ? (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                      <path d="M10 2a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0v-.75A.75.75 0 0 1 10 2Zm0 13a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0 2.25a.75.75 0 0 1-.75-.75v-.75a.75.75 0 0 1 1.5 0v.75a.75.75 0 0 1-.75.75ZM2 10a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75A.75.75 0 0 1 2 10Zm14.5 0a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75ZM4.343 4.343a.75.75 0 0 1 1.061 0l.53.53a.75.75 0 0 1-1.06 1.061l-.53-.53a.75.75 0 0 1 0-1.061Zm9.723 9.723a.75.75 0 0 1 1.06 0l.53.53a.75.75 0 1 1-1.06 1.061l-.53-.53a.75.75 0 0 1 0-1.061ZM15.657 4.343a.75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.061-1.06l.53-.53a.75.75 0 0 1 1.061 0ZM5.996 14.066a.75.75 0 0 1 0 1.06l-.53.53a.75.75 0 0 1-1.06-1.06l.53-.53a.75.75 0 0 1 1.06 0Z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M7.455 2.004a.75.75 0 0 1 .53.91 6 6 0 0 0 6.854 7.507.75.75 0 0 1 .845 1.054A7.5 7.5 0 1 1 6.4 2.07a.75.75 0 0 1 1.055-.066Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>

                <button
                  onClick={handleExport}
                  className="whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white/60 dark:text-white dark:hover:bg-white/14"
                >
                  Ekspor
                </button>
                <button
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                  className="whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white/60 dark:text-white dark:hover:bg-white/14"
                >
                  Impor
                </button>
              </div>
            </div>
          </header>

          {/* Unified Telemetry Strip */}
          <section
            aria-label="Ringkasan tugas"
            className="mb-4 grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4"
          >
            <div className="glass-panel flex flex-col justify-between rounded-2xl px-4 py-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-600 dark:text-slate-300/80">
                Tugas Aktif
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-semibold leading-none tracking-[-0.03em] tabular-nums text-slate-900 dark:text-white">
                  {activeCount}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-300/75">
                  dari {todos.length} total
                </span>
              </div>
            </div>

            <div className="glass-panel flex flex-col justify-between rounded-2xl px-4 py-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-600 dark:text-slate-300/80">
                Dalam Proses
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-semibold leading-none tracking-[-0.03em] tabular-nums text-slate-900 dark:text-white">
                  {doingCount}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-300/75">
                  sedang fokus
                </span>
              </div>
            </div>

            <div className="glass-panel flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5">
              <div>
                <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-600 dark:text-slate-300/80">
                  Progres
                </span>
                <p className="mt-1 text-lg font-semibold leading-none tracking-[-0.02em] tabular-nums text-slate-900 dark:text-white">
                  {doneCount} tuntas
                </p>
              </div>
              <ProgressRing percent={completionPercent} />
            </div>

            <div className="glass-panel flex flex-col justify-between rounded-2xl px-4 py-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-600 dark:text-slate-300/80">
                Perhatian
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                {overdueCount > 0 ? (
                  <>
                    <span className="text-2xl font-semibold leading-none tracking-[-0.03em] tabular-nums text-rose-600 dark:text-rose-300">
                      {overdueCount}
                    </span>
                    <span className="text-xs text-rose-700/85 dark:text-rose-200/85">
                      lewat tenggat
                    </span>
                  </>
                ) : highPriorityCount > 0 ? (
                  <>
                    <span className="text-2xl font-semibold leading-none tracking-[-0.03em] tabular-nums text-slate-900 dark:text-white">
                      {highPriorityCount}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-300/80">
                      prioritas tinggi
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    Semua terkendali
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Conditional Command Bar: Active Search Chip + Non-Kanban Filter & Sort */}
          {showCommandBar && (
            <div className="mb-4 flex w-full shrink-0 flex-wrap items-center gap-3">
              {hasSearch && (
                <div className="glass-panel inline-flex items-center gap-2 rounded-full py-1.5 pl-3.5 pr-2 text-xs text-slate-800 dark:text-white">
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(true)}
                    className="inline-flex items-center gap-1.5 font-medium text-slate-900 dark:text-white"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>&ldquo;{search}&rdquo;</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Hapus filter pencarian"
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/8 text-slate-600 transition hover:bg-slate-900/15 hover:text-slate-950 dark:bg-white/15 dark:text-white dark:hover:bg-white/25 dark:hover:text-white"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                  </button>
                </div>
              )}

              {view !== "kanban" && (
                <div className="glass-panel flex max-w-full gap-1 overflow-x-auto rounded-full p-1">
                  {STATUS_FILTERS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setStatusFilter(f.key)}
                      className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                        statusFilter === f.key
                          ? "bg-white/90 text-slate-900 shadow-sm dark:bg-white/22 dark:text-white"
                          : "text-slate-600 hover:bg-white/45 hover:text-slate-900 dark:text-white dark:hover:bg-white/14 dark:hover:text-white"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}

              {view !== "kanban" && (
                <div className="ml-auto flex shrink-0 items-center gap-2 text-xs text-slate-600 dark:text-slate-200">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  >
                    <path d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1-.75-.75Z" />
                  </svg>
                  <GlassSelect
                    size="sm"
                    value={sortKey}
                    options={SORTS.map((o) => ({ value: o.key, label: o.label }))}
                    onChange={setSortKey}
                    ariaLabel="Urutkan tugas"
                    className="min-w-[118px]"
                  />
                </div>
              )}
            </div>
          )}

          {/* Active Workspace View */}
          <div className="flex w-full flex-1 flex-col lg:min-h-0 lg:overflow-hidden">
            {view === "kanban" && (
              <KanbanBoard
                todos={filtered}
                onEdit={setEditingTodo}
                onDelete={requestDeleteTodo}
                onMove={moveTodo}
                onReorder={reorderTodo}
                onQuickAdd={quickAddTodo}
                onSubtaskAdd={addSubtask}
                onSubtaskToggle={toggleSubtask}
                onSubtaskDelete={deleteSubtask}
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
            <p className="mt-4 shrink-0 text-center text-xs text-slate-500 dark:text-slate-300/75">
              {EMPTY_HINTS[view]}
            </p>
          )}

          {todos.length > 0 && filtered.length === 0 && isFiltering && (
            <p className="mt-5 shrink-0 text-center text-xs text-slate-500 dark:text-slate-300/75">
              Tidak ada tugas yang cocok dengan pencarian/filter.
            </p>
          )}

          {todos.length > 0 && (
            <footer className="mt-4 flex shrink-0 items-center justify-between text-xs text-slate-600 dark:text-slate-300/75">
              <p className="tabular-nums">
                {activeCount} tugas aktif dari {todos.length} total
              </p>
              <p className="hidden sm:block">
                Tekan{" "}
                <kbd className="rounded bg-white/50 px-1.5 py-0.5 font-mono text-[10px] text-slate-700 dark:bg-white/12 dark:text-slate-200">
                  /
                </kbd>{" "}
                untuk cari,{" "}
                <kbd className="rounded bg-white/50 px-1.5 py-0.5 font-mono text-[10px] text-slate-700 dark:bg-white/12 dark:text-slate-200">
                  1–4
                </kbd>{" "}
                ganti tampilan
              </p>
            </footer>
          )}
        </div>

        {/* Floating Utility Sidebar on the Right */}
        <aside
          aria-label="Aksi cepat"
          className="glass-pill sticky top-8 hidden shrink-0 flex-col items-center gap-1.5 rounded-full p-2 lg:static lg:flex lg:self-start"
        >
          <button
            onClick={() => setIsSearchOpen(true)}
            title="Cari tugas (/)"
            aria-label="Cari tugas"
            className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
              hasSearch
                ? "glass-btn-primary"
                : "text-slate-700 hover:bg-white/60 hover:text-slate-950 dark:text-white dark:hover:bg-white/16 dark:hover:text-white"
            }`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <div className="my-0.5 h-px w-5 bg-slate-900/12 dark:bg-white/15" />

          <button
            onClick={handleExport}
            title="Ekspor JSON"
            aria-label="Ekspor tugas"
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/60 hover:text-slate-950 dark:text-white dark:hover:bg-white/16 dark:hover:text-white"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5" aria-hidden="true">
              <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
              <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
            </svg>
          </button>

          <button
            onClick={() => importInputRef.current?.click()}
            title="Impor JSON"
            aria-label="Impor tugas"
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/60 hover:text-slate-950 dark:text-white dark:hover:bg-white/16 dark:hover:text-white"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5" aria-hidden="true">
              <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
              <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
            </svg>
          </button>

          <div className="my-0.5 h-px w-5 bg-slate-900/12 dark:bg-white/15" />

          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Ubah ke mode terang" : "Ubah ke mode gelap"}
            title={theme === "dark" ? "Mode terang" : "Mode gelap"}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/60 hover:text-slate-950 dark:text-white dark:hover:bg-white/16 dark:hover:text-white"
          >
            {theme === "dark" ? (
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5" aria-hidden="true">
                <path d="M10 2a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0v-.75A.75.75 0 0 1 10 2Zm0 13a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0 2.25a.75.75 0 0 1-.75-.75v-.75a.75.75 0 0 1 1.5 0v.75a.75.75 0 0 1-.75.75ZM2 10a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75A.75.75 0 0 1 2 10Zm14.5 0a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75ZM4.343 4.343a.75.75 0 0 1 1.061 0l.53.53a.75.75 0 0 1-1.06 1.061l-.53-.53a.75.75 0 0 1 0-1.061Zm9.723 9.723a.75.75 0 0 1 1.06 0l.53.53a.75.75 0 1 1-1.06 1.061l-.53-.53a.75.75 0 0 1 0-1.061ZM15.657 4.343a.75.75 0 0 1 0 1.061l-.53.53a.75.75 0 0 1-1.061-1.06l.53-.53a.75.75 0 0 1 1.061 0ZM5.996 14.066a.75.75 0 0 1 0 1.06l-.53.53a.75.75 0 0 1-1.06-1.06l.53-.53a.75.75 0 0 1 1.06 0Z" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M7.455 2.004a.75.75 0 0 1 .53.91 6 6 0 0 0 6.854 7.507.75.75 0 0 1 .845 1.054A7.5 7.5 0 1 1 6.4 2.07a.75.75 0 0 1 1.055-.066Z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </aside>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          action={toast.action}
          onClose={() => setToast(null)}
        />
      )}
      <UpdatePrompt />

      {/* Glass Search Modal */}
      {isSearchOpen && (
        <TodoModal title="Cari Tugas" onClose={() => setIsSearchOpen(false)}>
          <div className="space-y-3">
            <div className="relative">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-300/75"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                ref={searchRef}
                type="search"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setIsSearchOpen(false);
                }}
                placeholder="Cari tugas atau subtugas... (tekan /)"
                className="glass-input w-full rounded-2xl py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 dark:text-white dark:placeholder:text-slate-300/65"
              />
            </div>

            {hasSearch && (
              <div className="max-h-56 space-y-1.5 overflow-y-auto pr-0.5">
                {searchMatches.length > 0 ? (
                  searchMatches.slice(0, 6).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(false);
                        setEditingTodo(item);
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-xl bg-white/45 px-3 py-2 text-left text-xs transition hover:bg-white/75 dark:bg-white/8 dark:hover:bg-white/16"
                    >
                      <span className="truncate font-medium text-slate-900 dark:text-white">
                        {item.text}
                      </span>
                      <StatusBadge status={item.status} />
                    </button>
                  ))
                ) : (
                  <p className="py-3 text-center text-xs text-slate-500 dark:text-slate-300/75">
                    Tidak ada tugas yang cocok.
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] tabular-nums text-slate-500 dark:text-slate-300/75">
                {hasSearch
                  ? `${searchMatches.length} hasil ditemukan`
                  : `${todos.length} total tugas`}
              </span>
              <div className="flex items-center gap-2">
                {hasSearch && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="rounded-full bg-slate-900/8 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-900/14 dark:bg-white/14 dark:text-white dark:hover:bg-white/22"
                  >
                    Bersihkan
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="glass-btn-primary rounded-full px-4 py-1.5 text-xs font-semibold transition active:scale-[0.98]"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </TodoModal>
      )}

      {confirmDelete && (
        <TodoModal title="Hapus Tugas?" onClose={() => setConfirmDelete(null)}>
          <p className="mb-5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            {confirmDelete.message}
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setConfirmDelete(null)}
              className="rounded-full border border-slate-900/15 bg-white/55 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white/85 dark:border-white/20 dark:bg-white/14 dark:text-white dark:hover:bg-white/22"
            >
              Batal
            </button>
            <button
              onClick={confirmDelete.confirm}
              className="glass-btn-danger rounded-full px-4 py-2 text-sm font-semibold transition active:scale-[0.98]"
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

      {/* Floating Bottom View Dock */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-3 pb-[env(safe-area-inset-bottom)]">
        <nav
          aria-label="Pilih tampilan"
          className="glass-pill pointer-events-auto flex max-w-full items-center gap-1 rounded-full p-1.5"
        >
          {VIEWS.map((v, i) => {
            const active = view === v.key;
            return (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium tracking-[-0.01em] transition sm:px-4 sm:text-[13px] ${
                  active
                    ? "bg-white/90 text-slate-900 shadow-sm dark:bg-white/22 dark:text-white"
                    : "text-slate-700 hover:bg-white/50 hover:text-slate-950 dark:text-white dark:hover:bg-white/14 dark:hover:text-white"
                }`}
              >
                {VIEW_ICONS[v.key]}
                <span>{v.label}</span>
                <kbd
                  aria-hidden="true"
                  className="hidden rounded-full bg-slate-900/8 px-1.5 py-0.5 font-mono text-[10px] font-normal text-slate-500 sm:inline dark:bg-white/14 dark:text-slate-200"
                >
                  {i + 1}
                </kbd>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
