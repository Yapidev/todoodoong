import { describe, expect, it } from "vitest";
import {
  addTodoToList,
  clearDoneFromList,
  deleteTodoFromList,
  isOverdue,
  matchesQuery,
  moveTodoInList,
  normalizeTodo,
  reorderTodoInList,
  setStatusInPlace,
  toggleDoneInList,
  updateTodoInList,
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
  };
}

describe("normalizeTodo", () => {
  it("menerima format status baru", () => {
    const t = normalizeTodo({ id: "a", text: "x", status: "doing", createdAt: 5 });
    expect(t).toEqual({ id: "a", text: "x", status: "doing", createdAt: 5 });
  });

  it("migrasi format lama dengan completed boolean", () => {
    expect(normalizeTodo({ id: "a", text: "x", completed: true })?.status).toBe("done");
    expect(normalizeTodo({ id: "a", text: "x", completed: false })?.status).toBe("todo");
  });

  it("menolak data tidak valid", () => {
    expect(normalizeTodo(null)).toBeNull();
    expect(normalizeTodo("x")).toBeNull();
    expect(normalizeTodo({ id: 1, text: "x" })).toBeNull();
    expect(normalizeTodo({ id: "a", text: "x", status: "bogus" })).toBeNull();
  });

  it("menolak data tanpa status maupun completed", () => {
    expect(normalizeTodo({ id: "a", text: "x" })).toBeNull();
  });

  it("mengisi createdAt bila tidak ada, menjaga bila ada", () => {
    expect(normalizeTodo({ id: "a", text: "x", status: "todo" })?.createdAt).toBeGreaterThan(0);
    expect(normalizeTodo({ id: "a", text: "x", status: "todo", createdAt: 42 })?.createdAt).toBe(42);
    expect(normalizeTodo({ id: "a", text: "x", status: "todo", createdAt: "42" })?.createdAt).not.toBe("42");
  });

  it("mengabaikan dueDate dengan format salah", () => {
    expect(normalizeTodo({ id: "a", text: "x", status: "todo", dueDate: "2026/10/01" })?.dueDate).toBeUndefined();
    expect(normalizeTodo({ id: "a", text: "x", status: "todo", dueDate: "" })?.dueDate).toBeUndefined();
  });

  it("menjaga dueDate/priority valid dan membuang yang tidak valid", () => {
    const t = normalizeTodo({
      id: "a",
      text: "x",
      status: "todo",
      dueDate: "2026-10-01",
      priority: "high",
    });
    expect(t?.dueDate).toBe("2026-10-01");
    expect(t?.priority).toBe("high");

    const t2 = normalizeTodo({
      id: "a",
      text: "x",
      status: "todo",
      dueDate: "bukan-tanggal",
      priority: "urgent",
    });
    expect(t2?.dueDate).toBeUndefined();
    expect(t2?.priority).toBeUndefined();
  });
});

describe("moveTodoInList", () => {
  it("memindahkan antar kolom dan menyisipkan sebelum kartu target", () => {
    const list = [
      make({ id: "a", status: "todo" }),
      make({ id: "b", status: "done" }),
      make({ id: "c", status: "done" }),
    ];
    const next = moveTodoInList(list, "a", "done", "c");
    expect(next.map((t) => t.id)).toEqual(["b", "a", "c"]);
    expect(next.find((t) => t.id === "a")?.status).toBe("done");
  });

  it("menaruh di akhir kolom saat beforeId tidak ada", () => {
    const list = [
      make({ id: "a", status: "todo" }),
      make({ id: "b", status: "done" }),
    ];
    const next = moveTodoInList(list, "a", "done");
    expect(next.map((t) => t.id)).toEqual(["b", "a"]);
  });

  it("tidak berubah bila kartu tidak ada atau status sama", () => {
    const list = [
      make({ id: "a", status: "todo" }),
      make({ id: "b", status: "done" }),
    ];
    expect(moveTodoInList(list, "zzz", "done")).toBe(list);
    expect(moveTodoInList(list, "a", "todo")).toBe(list);
  });
});

describe("setStatusInPlace", () => {
  it("mengubah status tanpa memindahkan posisi dalam list", () => {
    const list = [
      make({ id: "a", status: "todo" }),
      make({ id: "b", status: "todo" }),
      make({ id: "c", status: "done" }),
    ];
    const next = setStatusInPlace(list, "b", "doing");
    expect(next.map((t) => t.id)).toEqual(["a", "b", "c"]);
    expect(next.find((t) => t.id === "b")?.status).toBe("doing");
  });

  it("tidak berubah bila kartu tidak ada atau status sama", () => {
    const list = [make({ id: "a", status: "todo" })];
    expect(setStatusInPlace(list, "zzz", "done")).toBe(list);
    expect(setStatusInPlace(list, "a", "todo")).toBe(list);
  });
});

describe("reorderTodoInList", () => {
  it("menukar posisi dalam kolom yang sama", () => {
    const list = [
      make({ id: "a", status: "todo" }),
      make({ id: "b", status: "todo" }),
      make({ id: "c", status: "done" }),
    ];
    const next = reorderTodoInList(list, "b", "a");
    expect(next.map((t) => t.id)).toEqual(["b", "a", "c"]);
  });

  it("tidat berubah bila kartu target tidak ada", () => {
    const list = [make({ id: "a", status: "todo" })];
    expect(reorderTodoInList(list, "a", "zzz")).toBe(list);
  });
});

describe("operasi lain", () => {
  it("addTodoToList menambah di depan", () => {
    const list = [make({ id: "a" })];
    const t = make({ id: "b" });
    expect(addTodoToList(list, t).map((x) => x.id)).toEqual(["b", "a"]);
  });

  it("updateTodoInList membuat patch", () => {
    const list = [make({ id: "a", text: "lama", status: "todo" })];
    const next = updateTodoInList(list, "a", { text: "baru", status: "done" });
    expect(next[0]).toMatchObject({ id: "a", text: "baru", status: "done" });
  });

  it("deleteTodoFromList menghapus", () => {
    const list = [make({ id: "a" }), make({ id: "b" })];
    expect(deleteTodoFromList(list, "a").map((t) => t.id)).toEqual(["b"]);
  });

  it("toggleDoneInList membalik status selesai", () => {
    const list = [make({ id: "a", status: "todo" })];
    expect(toggleDoneInList(list, "a")[0].status).toBe("done");
    expect(toggleDoneInList(toggleDoneInList(list, "a"), "a")[0].status).toBe("todo");
  });

  it("clearDoneFromList hanya menyisakan yang belum selesai", () => {
    const list = [
      make({ id: "a", status: "todo" }),
      make({ id: "b", status: "done" }),
    ];
    expect(clearDoneFromList(list).map((t) => t.id)).toEqual(["a"]);
  });
});

describe("pencarian dan tenggat", () => {
  it("matchesQuery mencocokkan teks tanpa peduli kapital", () => {
    const t = make({ text: "Belanja mingguan" });
    expect(matchesQuery(t, "belanja")).toBe(true);
    expect(matchesQuery(t, "  MINGGUAN ")).toBe(true);
    expect(matchesQuery(t, "olahraga")).toBe(false);
    expect(matchesQuery(t, "")).toBe(true);
  });

  it("matchesQuery mencocokkan teks subtugas", () => {
    const t = {
      ...make({ text: "Pindahan rumah" }),
      subtasks: [{ id: "s1", text: "Sewa truk", done: false }],
    };
    expect(matchesQuery(t, "sewa truk")).toBe(true);
    expect(matchesQuery(t, "kemas")).toBe(false);
  });

  it("isOverdue hanya untuk tenggat lewat dan belum selesai", () => {
    const past = make({ dueDate: "2020-01-01" });
    const pastDone = make({ dueDate: "2020-01-01", status: "done" });
    const future = make({ dueDate: "2999-12-31" });
    expect(isOverdue(past)).toBe(true);
    expect(isOverdue(pastDone)).toBe(false);
    expect(isOverdue(future)).toBe(false);
    expect(isOverdue(make())).toBe(false);
  });
});
