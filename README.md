# Todoodoong

[![CI](https://github.com/Yapidev/todoodoong/actions/workflows/ci.yml/badge.svg)](https://github.com/Yapidev/todoodoong/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-informational.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A free, offline-first todo app with a Kanban board, drag-and-drop, and switchable views — your tasks, your device, no account required.

**Try the live demo: [todoodoong.vercel.app](https://todoodoong.vercel.app)**

All data is stored locally in your browser (`localStorage`). No backend, no tracking, works offline as an installable PWA.

<!-- TODO: add a screenshot here, e.g. docs/screenshot.png -->
<!-- ![Todoodoong screenshot](docs/screenshot.png) -->

## Features

- **Kanban board** — three columns (Not Started / In Progress / Done) with drag-and-drop powered by [dnd-kit](https://dndkit.com/). Works with mouse, touch, and keyboard.
- **Reordering** — rearrange cards within a column, or drop them at an exact position in another column.
- **Multiple views** — switch between Kanban, Table, List, and Checklist; the choice is remembered.
- **Due dates & priorities** — optional per-task; overdue dates are highlighted.
- **Search & status filter** — quickly narrow down what you are looking for.
- **Sorting** — order tasks by newest, oldest, priority, or due date.
- **Sub-tasks** — break a task down and check off its steps.
- **Undo delete** — an "Urungkan" (undo) action appears right after deleting.
- **Cross-tab sync** — changes in one tab instantly appear in another.
- **Light/dark theme** — manual toggle, follows system preference by default.
- **Import/export** — back up or migrate your tasks as JSON.
- **PWA** — install it on your phone or desktop and keep working offline.
- **Automatic migration** — older localStorage formats are upgraded on load.

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm

### Install & Run

```bash
git clone https://github.com/<your-username>/todoodoong.git
cd todoodoong
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Scripts

| Command             | Description                       |
| ------------------- | --------------------------------- |
| `npm run dev`       | Start the dev server              |
| `npm run build`     | Create a production build         |
| `npm run start`     | Serve the production build        |
| `npm run lint`      | Run ESLint                        |
| `npm run typecheck` | Run TypeScript checks             |
| `npm test`          | Run unit tests (Vitest)           |

## Tech Stack

- [Next.js](https://nextjs.org) (App Router) + React 19
- [Tailwind CSS](https://tailwindcss.com) v4
- [dnd-kit](https://dndkit.com/) for drag-and-drop
- [Vitest](https://vitest.dev) for unit tests

## Project Structure

```
app/                # Next.js App Router (layout, page, styles)
components/         # UI components, stores, and pure logic
  todo-types.ts     # Types & constants
  todo-logic.ts     # Pure functions (move, reorder, normalize, ...)
  todo-store.ts     # localStorage-backed store (useSyncExternalStore)
  prefs.ts          # Theme & view preferences
tests/              # Unit tests for todo-logic
public/             # PWA manifest, icon, service worker
```

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
