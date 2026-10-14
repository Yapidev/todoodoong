import { THEME_STORAGE_KEY, VIEW_STORAGE_KEY, type View } from "./todo-types";

export type Theme = "light" | "dark";

const VIEWS: View[] = ["kanban", "table", "list", "checklist"];

function readStored(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage tidak tersedia; abaikan.
  }
}

function initialTheme(): Theme {
  if (typeof window !== "undefined") {
    const stored = readStored(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  }
  return "light";
}

function initialView(): View {
  const stored = readStored(VIEW_STORAGE_KEY);
  return VIEWS.includes(stored as View) ? (stored as View) : "kanban";
}

let theme: Theme = initialTheme();
let view: View = initialView();

const themeListeners = new Set<() => void>();
const viewListeners = new Set<() => void>();

if (typeof document !== "undefined") {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function subscribeTheme(listener: () => void): () => void {
  themeListeners.add(listener);
  return () => themeListeners.delete(listener);
}

export function getTheme(): Theme {
  return theme;
}

export function getServerTheme(): Theme {
  return "light";
}

export function setTheme(next: Theme): void {
  theme = next;
  writeStored(THEME_STORAGE_KEY, next);
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", next === "dark");
  }
  for (const listener of themeListeners) listener();
}

export function toggleTheme(): void {
  setTheme(theme === "dark" ? "light" : "dark");
}

export function subscribeView(listener: () => void): () => void {
  viewListeners.add(listener);
  return () => viewListeners.delete(listener);
}

export function getView(): View {
  return view;
}

export function getServerView(): View {
  return "kanban";
}

export function setView(next: View): void {
  view = next;
  writeStored(VIEW_STORAGE_KEY, next);
  for (const listener of viewListeners) listener();
}
