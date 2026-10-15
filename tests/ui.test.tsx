import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
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
  store.clear();
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

    await user.type(screen.getByPlaceholderText(/Cari tugas/), "belanja");
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

describe("Urutan tampilan", () => {
  it("menjaga urutan manual di kanban (tidak di-sort ulang)", async () => {
    store.set(
      "todo-app.todos",
      JSON.stringify([
        { id: "old", text: "Tugas lama", status: "todo", createdAt: 1 },
        { id: "new", text: "Tugas baru", status: "todo", createdAt: 2 },
      ])
    );
    await renderApp();

    const column = screen.getByText("Belum Mulai").closest("section")!;
    const first = within(column).getByText("Tugas lama");
    const second = within(column).getByText("Tugas baru");
    expect(
      first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("tetap mengurutkan terbaru dulu di view tabel", async () => {
    store.set(
      "todo-app.todos",
      JSON.stringify([
        { id: "old", text: "Tugas lama", status: "todo", createdAt: 1 },
        { id: "new", text: "Tugas baru", status: "todo", createdAt: 2 },
      ])
    );
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getAllByRole("button", { name: "Tabel" })[0]);
    const first = screen.getByText("Tugas baru");
    const second = screen.getByText("Tugas lama");
    expect(
      first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});

describe("Shortcut keyboard", () => {
  it("n membuka form tambah tugas", async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.keyboard("n");
    expect(screen.getByPlaceholderText("Tugas baru...")).toBeInTheDocument();
  });

  it("slash memfokuskan kolom pencarian", async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.keyboard("/");
    expect(document.activeElement).toBe(
      screen.getByPlaceholderText(/Cari tugas/)
    );
  });

  it("angka mengganti view", async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.keyboard("2");
    expect(
      screen.getByRole("columnheader", { name: "Tugas" })
    ).toBeInTheDocument();
  });
});

describe("Tambah cepat di kolom kanban", () => {
  it("menambah tugas langsung ke kolom yang dituju", async () => {
    const user = userEvent.setup();
    await renderApp();

    const column = screen.getByText("Sedang Berjalan").closest("section")!;
    const input = within(column).getByPlaceholderText("+ Tambah tugas");
    await user.type(input, "Kirim proposal{Enter}");

    expect(within(column).getByText("Kirim proposal")).toBeInTheDocument();
    const stored = store.get("todo-app.todos")!;
    expect(JSON.parse(stored)[0]).toMatchObject({
      text: "Kirim proposal",
      status: "doing",
    });
  });
});

describe("Navigasi bawah di mobile", () => {
  it("berpindah view lewat nav bawah", async () => {
    const user = userEvent.setup();
    await renderApp();

    const nav = screen.getByRole("navigation", { name: "Pilih tampilan" });
    await user.click(within(nav).getByRole("button", { name: "Tabel" }));

    expect(
      screen.getByRole("columnheader", { name: "Tugas" })
    ).toBeInTheDocument();
  });
});
