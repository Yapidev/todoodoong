export type Status = "todo" | "doing" | "done";

export type Priority = "low" | "medium" | "high";

export type Todo = {
  id: string;
  text: string;
  status: Status;
  createdAt: number;
  dueDate?: string;
  priority?: Priority;
};

export type View = "kanban" | "table" | "list" | "checklist";

export type StatusFilter = "all" | Status;

export const STORAGE_KEY = "todo-app.todos";
export const VIEW_STORAGE_KEY = "todo-app.view";
export const THEME_STORAGE_KEY = "todo-app.theme";

export const STATUSES: Status[] = ["todo", "doing", "done"];

export const COLUMNS: { key: Status; label: string; dot: string }[] = [
  { key: "todo", label: "Belum Mulai", dot: "bg-neutral-400" },
  { key: "doing", label: "Sedang Berjalan", dot: "bg-amber-400" },
  { key: "done", label: "Selesai", dot: "bg-green-500" },
];

export const PRIORITIES: { key: Priority; label: string; dot: string }[] = [
  { key: "low", label: "Rendah", dot: "bg-sky-500" },
  { key: "medium", label: "Sedang", dot: "bg-amber-400" },
  { key: "high", label: "Tinggi", dot: "bg-red-500" },
];

export function statusLabel(status: Status): string {
  return COLUMNS.find((c) => c.key === status)?.label ?? status;
}

export function priorityLabel(priority: Priority): string {
  return PRIORITIES.find((p) => p.key === priority)?.label ?? priority;
}

export function priorityDot(priority: Priority): string {
  return PRIORITIES.find((p) => p.key === priority)?.dot ?? "bg-neutral-400";
}
