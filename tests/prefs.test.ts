import { afterEach, describe, expect, it, vi } from "vitest";

type StorageMap = Map<string, string>;

function stubLocalStorage(initial: Record<string, string> = {}): StorageMap {
  const map: StorageMap = new Map(Object.entries(initial));
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => void map.clear(),
  });
  return map;
}

function stubWindow({
  prefersDark = false,
}: { prefersDark?: boolean } = {}) {
  vi.stubGlobal("window", {
    matchMedia: (q: string) => ({ matches: q.includes("dark") && prefersDark }),
  });
}

function freshPrefs() {
  vi.resetModules();
  return import("../components/prefs");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("initial theme", () => {
  it("memakai tema tersimpan bila valid", async () => {
    stubLocalStorage({ "todo-app.theme": "dark" });
    stubWindow({ prefersDark: false });
    const prefs = await freshPrefs();
    expect(prefs.getTheme()).toBe("dark");
  });

  it("mengikuti preferensi sistem saat belum ada pilihan", async () => {
    stubLocalStorage();
    stubWindow({ prefersDark: true });
    const prefs = await freshPrefs();
    expect(prefs.getTheme()).toBe("dark");
  });

  it("default terang untuk preferensi sistem terang", async () => {
    stubLocalStorage();
    stubWindow({ prefersDark: false });
    const prefs = await freshPrefs();
    expect(prefs.getTheme()).toBe("light");
  });

  it("mengabaikan nilai tersimpan yang tidak valid", async () => {
    stubLocalStorage({ "todo-app.theme": "neon" });
    stubWindow({ prefersDark: false });
    const prefs = await freshPrefs();
    expect(prefs.getTheme()).toBe("light");
  });
});

describe("theme toggle & persist", () => {
  it("toggleTheme membalik tema dan menyimpannya", async () => {
    const storage = stubLocalStorage();
    stubWindow({ prefersDark: false });
    const prefs = await freshPrefs();
    prefs.toggleTheme();
    expect(prefs.getTheme()).toBe("dark");
    expect(storage.get("todo-app.theme")).toBe("dark");
    prefs.setTheme("light");
  });
});

describe("initial view", () => {
  it("memakai view tersimpan bila valid", async () => {
    stubLocalStorage({ "todo-app.view": "table" });
    stubWindow();
    const prefs = await freshPrefs();
    expect(prefs.getView()).toBe("table");
  });

  it("default kanban untuk nilai tidak valid", async () => {
    stubLocalStorage({ "todo-app.view": "gantt" });
    stubWindow();
    const prefs = await freshPrefs();
    expect(prefs.getView()).toBe("kanban");
  });

  it("setView menyimpan pilihan", async () => {
    const storage = stubLocalStorage();
    stubWindow();
    const prefs = await freshPrefs();
    prefs.setView("checklist");
    expect(prefs.getView()).toBe("checklist");
    expect(storage.get("todo-app.view")).toBe("checklist");
  });
});
