import {
  PRIORITIES,
  STATUSES,
  STORAGE_KEY,
  type SortKey,
  type Status,
  type Subtask,
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
  if (Array.isArray(t.subtasks)) {
    const subtasks = t.subtasks
      .map((raw) => {
        if (typeof raw !== "object" || raw === null) return null;
        const st = raw as Record<string, unknown>;
        if (typeof st.id !== "string" || typeof st.text !== "string") return null;
        return { id: st.id, text: st.text, done: st.done === true } satisfies Subtask;
      })
      .filter((st): st is Subtask => st !== null);
    if (subtasks.length > 0) todo.subtasks = subtasks;
  }
  return todo;
}

const PRIORITY_WEIGHT: Record<Todo["priority"] & string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function sortTodos(todos: Todo[], key: SortKey): Todo[] {
  const list = [...todos];
  switch (key) {
    case "newest":
      return list.sort((a, b) => b.createdAt - a.createdAt);
    case "created":
      return list.sort((a, b) => a.createdAt - b.createdAt);
    case "priority":
      return list.sort(
        (a, b) =>
          (PRIORITY_WEIGHT[a.priority ?? "low"] ?? 3) -
          (PRIORITY_WEIGHT[b.priority ?? "low"] ?? 3)
      );
    case "due":
      return list.sort((a, b) => {
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      });
  }
}

export function subtaskProgress(todo: Todo): { done: number; total: number } {
  const list = todo.subtasks ?? [];
  return { done: list.filter((st) => st.done).length, total: list.length };
}

export function addSubtaskToList(prev: Todo[], todoId: string, text: string): Todo[] {
  const st: Subtask = { id: generateId(), text, done: false };
  return prev.map((t) =>
    t.id === todoId ? { ...t, subtasks: [...(t.subtasks ?? []), st] } : t
  );
}

export function toggleSubtaskInList(
  prev: Todo[],
  todoId: string,
  subtaskId: string
): Todo[] {
  return prev.map((t) =>
    t.id === todoId
      ? {
          ...t,
          subtasks: (t.subtasks ?? []).map((st) =>
            st.id === subtaskId ? { ...st, done: !st.done } : st
          ),
        }
      : t
  );
}

export function deleteSubtaskFromList(
  prev: Todo[],
  todoId: string,
  subtaskId: string
): Todo[] {
  return prev.map((t) =>
    t.id === todoId
      ? { ...t, subtasks: (t.subtasks ?? []).filter((st) => st.id !== subtaskId) }
      : t
  );
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

export function setStatusInPlace(
  prev: Todo[],
  id: string,
  status: Status
): Todo[] {
  const moved = prev.find((t) => t.id === id);
  if (!moved || moved.status === status) return prev;
  return prev.map((t) => (t.id === id ? { ...t, status } : t));
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
