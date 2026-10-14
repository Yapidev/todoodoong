import { STORAGE_KEY, type Todo } from "./todo-types";
import { loadTodos, normalizeTodo } from "./todo-logic";

const EMPTY: Todo[] = [];

let todos: Todo[] = loadTodos();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // Storage penuh atau tidak tersedia; abaikan.
  }
}

function notify() {
  for (const listener of listeners) listener();
}

export function subscribeTodos(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTodos(): Todo[] {
  return todos;
}

export function getServerTodos(): Todo[] {
  return EMPTY;
}

export function setTodos(next: Todo[]): void {
  todos = next;
  persist();
  notify();
}

export function updateTodos(updater: (prev: Todo[]) => Todo[]): void {
  setTodos(updater(todos));
}

export function exportTodos(): string {
  return JSON.stringify(
    { app: "todoodoong", version: 1, exportedAt: new Date().toISOString(), todos },
    null,
    2
  );
}

export function importTodos(raw: string): number {
  const parsed = JSON.parse(raw);
  const list = Array.isArray(parsed) ? parsed : parsed?.todos;
  if (!Array.isArray(list)) throw new Error("Format tidak dikenali");
  const imported = list
    .map(normalizeTodo)
    .filter((t): t is Todo => t !== null);
  let added = 0;
  updateTodos((prev) => {
    const existing = new Set(prev.map((t) => t.id));
    const fresh = imported.filter((t) => !existing.has(t.id));
    added = fresh.length;
    return [...fresh, ...prev];
  });
  return added;
}
