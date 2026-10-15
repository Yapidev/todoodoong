import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const store = new Map<string, string>();

function stubLocalStorage() {
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => void store.clear(),
  });
}

async function renderApp() {
  vi.resetModules();
  stubLocalStorage();
  const { default: TodoApp } = await import("../components/TodoApp");
  return render(<TodoApp />);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("TodoApp alur inti", () => {
  it("menambah tugas lewat form", async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getByRole("button", { name: "+ Tambah Tugas" }));
    await user.type(screen.getByPlaceholderText("Tugas baru..."), "Belanja");
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() =>
      expect(screen.getByText("Tugas ditambahkan")).toBeInTheDocument()
    );
    expect(screen.getByText("Belanja")).toBeInTheDocument();
    expect(store.get("todo-app.todos")).toContain("Belanja");
    expect(
      screen.queryByRole("button", { name: "Simpan" })
    ).not.toBeInTheDocument();
  });

  it("menghapus tugas dengan konfirmasi lalu mengurungkannya", async () => {
    store.set(
      "todo-app.todos",
      JSON.stringify([{ id: "a", text: "Rapat", status: "todo", createdAt: 1 }])
    );
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getByRole("button", { name: "Hapus tugas" }));
    await user.click(screen.getByRole("button", { name: /^Hapus$/ }));
    await waitFor(() => expect(screen.getByText("Tugas dihapus")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Urungkan" }));
    expect(screen.getByText("Rapat")).toBeInTheDocument();
  });

  it("mengedit tugas lewat tombol edit", async () => {
    store.set(
      "todo-app.todos",
      JSON.stringify([{ id: "a", text: "Lama", status: "todo", createdAt: 1 }])
    );
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getByRole("button", { name: "Edit tugas" }));
    const input = screen.getByDisplayValue("Lama");
    await user.clear(input);
    await user.type(input, "Baru");
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() =>
      expect(screen.getByText("Tugas diperbarui")).toBeInTheDocument()
    );
    expect(screen.getByText("Baru")).toBeInTheDocument();
  });

  it("memfilter tugas lewat pencarian", async () => {
    store.set(
      "todo-app.todos",
      JSON.stringify([
        { id: "a", text: "Belanja", status: "todo", createdAt: 1 },
        { id: "b", text: "Olahraga", status: "todo", createdAt: 2 },
      ])
    );
    const user = userEvent.setup();
    await renderApp();

    await user.type(screen.getByPlaceholderText("Cari tugas..."), "belanja");
    expect(screen.getByText("Belanja")).toBeInTheDocument();
    expect(screen.queryByText("Olahraga")).not.toBeInTheDocument();
  });
});

describe("Subtugas di kartu kanban", () => {
  it("menampilkan progres, expand, dan menambah subtugas", async () => {
    store.set(
      "todo-app.todos",
      JSON.stringify([
        {
          id: "a",
          text: "Pindahan rumah",
          status: "todo",
          createdAt: 1,
          subtasks: [
            { id: "s1", text: "Kemas dapur", done: true },
            { id: "s2", text: "Sewa truk", done: false },
          ],
        },
      ])
    );
    const user = userEvent.setup();
    await renderApp();

    expect(screen.getAllByText("1/2").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Buka subtugas" }));
    expect(screen.getByText("Kemas dapur")).toBeInTheDocument();
    expect(screen.getByText("Sewa truk")).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Tambah subtugas..."),
      "Catat meteran"
    );
    await user.click(screen.getByRole("button", { name: "Tambah subtugas" }));

    await waitFor(() =>
      expect(screen.getAllByText("1/3").length).toBeGreaterThan(0)
    );
    expect(store.get("todo-app.todos")).toContain("Catat meteran");
  });
});
