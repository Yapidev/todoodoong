import { describe, expect, it } from "vitest";
import {
  addSubtaskToList,
  deleteSubtaskFromList,
  normalizeTodo,
  sortTodos,
  subtaskProgress,
  toggleSubtaskInList,
} from "../components/todo-logic";
import type { Todo } from "../components/todo-types";

let seq = 0;
function make(partial: Partial<Todo> = {}): Todo {
  return {
    id: partial.id ?? `t${++seq}`,
    text: partial.text ?? `Tugas ${seq}`,
    status: partial.status ?? "todo",
    createdAt: partial.createdAt ?? 1_000,
    ...(partial.dueDate ? { dueDate: partial.dueDate } : {}),
    ...(partial.priority ? { priority: partial.priority } : {}),
    ...(partial.subtasks ? { subtasks: partial.subtasks } : {}),
  };
}

describe("sortTodos", () => {
  it("mengurutkan terbaru / terlama berdasarkan createdAt", () => {
    const list = [
      make({ id: "a", createdAt: 1 }),
      make({ id: "b", createdAt: 3 }),
      make({ id: "c", createdAt: 2 }),
    ];
    expect(sortTodos(list, "newest").map((t) => t.id)).toEqual(["b", "c", "a"]);
    expect(sortTodos(list, "created").map((t) => t.id)).toEqual(["a", "c", "b"]);
  });

  it("mengurutkan berdasarkan prioritas high ke low", () => {
    const list = [
      make({ id: "a", priority: "low" }),
      make({ id: "b", priority: "high" }),
      make({ id: "c", priority: "medium" }),
      make({ id: "d" }),
    ];
    expect(sortTodos(list, "priority").map((t) => t.id)).toEqual(["b", "c", "a", "d"]);
  });

  it("mengurutkan berdasarkan tenggat, tanpa tenggat di akhir", () => {
    const list = [
      make({ id: "a", dueDate: "2026-12-31" }),
      make({ id: "b" }),
      make({ id: "c", dueDate: "2026-01-01" }),
    ];
    expect(sortTodos(list, "due").map((t) => t.id)).toEqual(["c", "a", "b"]);
  });

  it("tidak mengubah list asli", () => {
    const list = [make({ id: "a", createdAt: 1 }), make({ id: "b", createdAt: 2 })];
    const snapshot = [...list];
    sortTodos(list, "newest");
    expect(list).toEqual(snapshot);
  });
});

describe("subtask", () => {
  it("normalizeTodo menerima subtasks valid dan membuang yang rusak", () => {
    const t = normalizeTodo({
      id: "a",
      text: "x",
      status: "todo",
      subtasks: [
        { id: "s1", text: "langkah 1", done: true },
        { id: "s2", text: "langkah 2" },
        "rusak",
        { id: 5, text: "tanpa id string" },
      ],
    });
    expect(t?.subtasks).toEqual([
      { id: "s1", text: "langkah 1", done: true },
      { id: "s2", text: "langkah 2", done: false },
    ]);
  });

  it("addSubtaskToList menambah di akhir", () => {
    const list = [make({ id: "a" })];
    const next = addSubtaskToList(list, "a", "baru");
    expect(next[0].subtasks).toHaveLength(1);
    expect(next[0].subtasks?.[0].text).toBe("baru");
    expect(next[0].subtasks?.[0].done).toBe(false);
  });

  it("toggleSubtaskInList membalik done", () => {
    const list = [make({ id: "a", subtasks: [{ id: "s1", text: "x", done: false }] })];
    expect(toggleSubtaskInList(list, "a", "s1")[0].subtasks?.[0].done).toBe(true);
    expect(
      toggleSubtaskInList(toggleSubtaskInList(list, "a", "s1"), "a", "s1")[0].subtasks?.[0].done
    ).toBe(false);
  });

  it("deleteSubtaskFromList menghapus subtugas tertentu", () => {
    const list = [
      make({
        id: "a",
        subtasks: [
          { id: "s1", text: "x", done: false },
          { id: "s2", text: "y", done: false },
        ],
      }),
    ];
    const next = deleteSubtaskFromList(list, "a", "s1");
    expect(next[0].subtasks?.map((st) => st.id)).toEqual(["s2"]);
  });

  it("subtaskProgress menghitung done/total", () => {
    const list = [
      make({
        id: "a",
        subtasks: [
          { id: "s1", text: "x", done: true },
          { id: "s2", text: "y", done: false },
        ],
      }),
    ];
    expect(subtaskProgress(list[0])).toEqual({ done: 1, total: 2 });
    expect(subtaskProgress(make({ id: "b" }))).toEqual({ done: 0, total: 0 });
  });
});
