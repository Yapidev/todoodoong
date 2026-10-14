import {
  PRIORITIES,
  STATUSES,
  STORAGE_KEY,
  type Status,
  type Todo,
} from "./todo-types";

function normalizeStatus(raw: Record<string, unknown>): Status | null {
  if (typeof raw.status === "string" && STATUSES.includes(raw.status as Status)) {
    return raw.status as Status;
  }
  if (typeof raw.completed === "boolean") {
    return raw.completed ? "done" : "todo";
  }
  return null;
}

export function normalizeTodo(raw: unknown): Todo | null {
  if (typeof raw !== "object" || raw === null) return null;
  const t = raw as Record<string, unknown>;
  if (typeof t.id !== "string" || typeof t.text !== "string") return null;
  const status = normalizeStatus(t);
  if (status === null) return null;

  const todo: Todo = {
    id: t.id,
    text: t.text,
    status,
    createdAt: typeof t.createdAt === "number" ? t.createdAt : Date.now(),
  };

  if (
    typeof t.dueDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate)
  ) {
    todo.dueDate = t.dueDate;
  }
  if (
    typeof t.priority === "string" &&
    PRIORITIES.some((p) => p.key === t.priority)
  ) {
    todo.priority = t.priority as Todo["priority"];
  }
  return todo;
}

export function loadTodos(): Todo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeTodo).filter((t): t is Todo => t !== null);
  } catch {
    return [];
  }
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `todo-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export function addTodoToList(prev: Todo[], todo: Todo): Todo[] {
  return [todo, ...prev];
}

export function updateTodoInList(
  prev: Todo[],
  id: string,
  patch: Partial<Omit<Todo, "id" | "createdAt">>
): Todo[] {
  return prev.map((t) => (t.id === id ? { ...t, ...patch } : t));
}

export function deleteTodoFromList(prev: Todo[], id: string): Todo[] {
  return prev.filter((t) => t.id !== id);
}

export function toggleDoneInList(prev: Todo[], id: string): Todo[] {
  return prev.map((t) =>
    t.id === id
      ? { ...t, status: t.status === "done" ? "todo" : "done" }
      : t
  );
}

export function clearDoneFromList(prev: Todo[]): Todo[] {
  return prev.filter((t) => t.status !== "done");
}

export function moveTodoInList(
  prev: Todo[],
  id: string,
  status: Status,
  beforeId?: string
): Todo[] {
  const dragged = prev.find((t) => t.id === id);
  if (!dragged || dragged.status === status) return prev;
  const moved = { ...dragged, status };
  const target = prev.filter((t) => t.status === status);
  let insertIndex = target.length;
  if (beforeId) {
    const idx = target.findIndex((t) => t.id === beforeId);
    if (idx !== -1) insertIndex = idx;
  }
  const newColumn = [
    ...target.slice(0, insertIndex),
    moved,
    ...target.slice(insertIndex),
  ];
  return [
    ...prev.filter((t) => t.status !== status && t.id !== id),
    ...newColumn,
  ];
}

export function reorderTodoInList(
  prev: Todo[],
  activeId: string,
  overId: string
): Todo[] {
  const dragged = prev.find((t) => t.id === activeId);
  if (!dragged) return prev;
  const column = prev.filter((t) => t.status === dragged.status);
  const oldIndex = column.findIndex((t) => t.id === activeId);
  const newIndex = column.findIndex((t) => t.id === overId);
  if (oldIndex === -1 || newIndex === -1) return prev;
  const reordered = column.toSpliced(oldIndex, 1).toSpliced(newIndex, 0, dragged);
  let i = 0;
  return prev.map((t) =>
    t.status === dragged.status ? reordered[i++] : t
  );
}

export function isOverdue(todo: Todo): boolean {
  if (!todo.dueDate || todo.status === "done") return false;
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return todo.dueDate < todayIso;
}

export function matchesQuery(todo: Todo, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return todo.text.toLowerCase().includes(q);
}
