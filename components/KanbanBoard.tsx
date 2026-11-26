"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDndContext,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  COLUMNS,
  STATUSES,
  type Status,
  type Todo,
} from "./todo-types";
import SubtaskList from "./SubtaskList";
import TodoMeta from "./TodoMeta";

const DOT_GLOW: Record<Status, string> = {
  todo: "bg-slate-400 shadow-[0_0_8px_rgb(148_163_184/0.75)] dark:bg-slate-300",
  doing: "bg-amber-400 shadow-[0_0_10px_rgb(251_191_36/0.85)]",
  done: "bg-emerald-400 shadow-[0_0_10px_rgb(52_211_153/0.85)]",
};

function CardBody({
  todo,
  onEdit,
  onDelete,
  expanded = false,
  onExpand,
  onSubtaskAdd,
  onSubtaskToggle,
  onSubtaskDelete,
}: {
  todo: Todo;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  expanded?: boolean;
  onExpand?: (id: string) => void;
  onSubtaskAdd?: (todoId: string, text: string) => void;
  onSubtaskToggle?: (todoId: string, subtaskId: string) => void;
  onSubtaskDelete?: (todoId: string, subtaskId: string) => void;
}) {
  const hasSubtasks = (todo.subtasks?.length ?? 0) > 0;

  return (
    <div className="item-in glass-card group rounded-2xl px-3.5 py-3 transition duration-200 hover:-translate-y-0.5">
      <div className="flex items-start gap-2">
        <p
          className={`flex-1 text-[14px] font-medium leading-[1.45] tracking-[-0.01em] select-none ${
            todo.status === "done"
              ? "text-slate-500 line-through dark:text-slate-400/75"
              : "text-slate-900 dark:text-white"
          }`}
        >
          {todo.text}
        </p>
        <span
          aria-hidden="true"
          title="Tarik untuk memindahkan / mengurutkan"
          className="mt-0.5 shrink-0 cursor-grab text-slate-400 transition group-hover:text-slate-600 dark:text-white/30 dark:group-hover:text-white/70"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <circle cx="7.5" cy="4.5" r="1.3" />
            <circle cx="12.5" cy="4.5" r="1.3" />
            <circle cx="7.5" cy="10" r="1.3" />
            <circle cx="12.5" cy="10" r="1.3" />
            <circle cx="7.5" cy="15.5" r="1.3" />
            <circle cx="12.5" cy="15.5" r="1.3" />
          </svg>
        </span>
      </div>
      <TodoMeta todo={todo} />
      <div
        className="mt-2.5 flex flex-wrap items-center gap-1.5"
        onPointerDownCapture={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onEdit(todo)}
          aria-label="Edit tugas"
          className="rounded-full bg-slate-900/6 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-900/12 hover:text-slate-950 dark:bg-white/12 dark:text-white dark:hover:bg-white/22 dark:hover:text-white"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          aria-label="Hapus tugas"
          className="rounded-full bg-slate-900/6 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-rose-500/15 hover:text-rose-700 dark:bg-white/12 dark:text-white dark:hover:bg-rose-500/25 dark:hover:text-rose-100"
        >
          Hapus
        </button>
        {hasSubtasks && onExpand && (
          <button
            onClick={() => onExpand(todo.id)}
            aria-label={expanded ? "Tutup subtugas" : "Buka subtugas"}
            title={expanded ? "Tutup subtugas" : "Buka subtugas"}
            className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/6 text-slate-600 transition hover:bg-slate-900/12 hover:text-slate-950 dark:bg-white/12 dark:text-white dark:hover:bg-white/22 dark:hover:text-white"
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`h-3.5 w-3.5 transition ${expanded ? "rotate-90" : ""}`}
            >
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
      {expanded && onSubtaskAdd && onSubtaskToggle && onSubtaskDelete && (
        <div
          onPointerDownCapture={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <SubtaskList
            todo={todo}
            onAddSubtask={onSubtaskAdd}
            onToggleSubtask={onSubtaskToggle}
            onDeleteSubtask={onSubtaskDelete}
          />
        </div>
      )}
    </div>
  );
}

function SortableCard({
  todo,
  onEdit,
  onDelete,
  expanded,
  onExpand,
  onSubtaskAdd,
  onSubtaskToggle,
  onSubtaskDelete,
}: {
  todo: Todo;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  expanded: boolean;
  onExpand: (id: string) => void;
  onSubtaskAdd: (todoId: string, text: string) => void;
  onSubtaskToggle: (todoId: string, subtaskId: string) => void;
  onSubtaskDelete: (todoId: string, subtaskId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: todo.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...listeners}
      {...attributes}
      onDoubleClick={() => onEdit(todo)}
      title="Klik dua kali untuk edit, tarik untuk pindah / mengurutkan"
      className={`cursor-grab touch-none ${isDragging ? "opacity-35" : ""}`}
    >
      <CardBody
        todo={todo}
        onEdit={onEdit}
        onDelete={onDelete}
        expanded={expanded}
        onExpand={onExpand}
        onSubtaskAdd={onSubtaskAdd}
        onSubtaskToggle={onSubtaskToggle}
        onSubtaskDelete={onSubtaskDelete}
      />
    </div>
  );
}

function QuickAdd({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState("");

  function submit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText("");
  }

  return (
    <input
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") submit();
      }}
      placeholder="+ Tambah tugas"
      aria-label="Tambah tugas di kolom ini"
      className="mt-3 w-full rounded-xl border border-slate-900/10 bg-white/35 px-3 py-2 text-xs text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-sky-500 focus:bg-white/75 focus:ring-2 focus:ring-sky-400/20 dark:border-white/12 dark:bg-white/6 dark:text-white dark:placeholder:text-slate-300/65 dark:focus:border-sky-400 dark:focus:bg-white/14"
    />
  );
}

function Column({
  status,
  todos,
  onEdit,
  onDelete,
  expandedId,
  onExpand,
  onQuickAdd,
  onSubtaskAdd,
  onSubtaskToggle,
  onSubtaskDelete,
}: {
  status: Status;
  todos: Todo[];
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  expandedId: string | null;
  onExpand: (id: string) => void;
  onQuickAdd: (status: Status, text: string) => void;
  onSubtaskAdd: (todoId: string, text: string) => void;
  onSubtaskToggle: (todoId: string, subtaskId: string) => void;
  onSubtaskDelete: (todoId: string, subtaskId: string) => void;
}) {
  const column = COLUMNS.find((c) => c.key === status)!;
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const { active, over } = useDndContext();
  const activeId = active ? String(active.id) : null;
  const overId = over ? String(over.id) : null;
  const overCardInThisColumn = todos.some((t) => t.id === overId);
  const draggingFromOtherColumn =
    activeId !== null && !todos.some((t) => t.id === activeId);
  const showDropHint =
    isOver || (overCardInThisColumn && draggingFromOtherColumn);

  return (
    <section
      className={`flex w-[84vw] max-w-[330px] shrink-0 snap-start flex-col rounded-3xl p-3.5 sm:w-auto sm:max-w-none sm:flex-1 ${
        status === "done" ? "glass-panel-deep" : "glass-panel"
      }`}
    >
      <header className="mb-3 flex items-center gap-2.5 px-1">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT_GLOW[status]}`} />
        <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">
          {column.label}
        </h2>
        <span className="ml-auto rounded-full bg-slate-900/8 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-slate-700 dark:bg-white/14 dark:text-white">
          {todos.length}
        </span>
      </header>
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-2.5 rounded-2xl p-1 transition ${
          showDropHint
            ? "bg-sky-400/15 ring-2 ring-sky-400/75 shadow-[inset_0_0_24px_rgb(56_189_248/0.18)]"
            : ""
        }`}
      >
        <SortableContext
          items={todos.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {todos.map((todo) => (
            <SortableCard
              key={todo.id}
              todo={todo}
              onEdit={onEdit}
              onDelete={onDelete}
              expanded={expandedId === todo.id}
              onExpand={onExpand}
              onSubtaskAdd={onSubtaskAdd}
              onSubtaskToggle={onSubtaskToggle}
              onSubtaskDelete={onSubtaskDelete}
            />
          ))}
        </SortableContext>
        {todos.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-2xl bg-slate-900/[0.03] px-4 py-8 dark:bg-white/[0.03]">
            <p className="text-center text-xs text-slate-500 dark:text-slate-300/65">
              Tarik kartu ke sini
            </p>
          </div>
        )}
      </div>
      <QuickAdd onAdd={(text) => onQuickAdd(status, text)} />
    </section>
  );
}

export default function KanbanBoard({
  todos,
  onEdit,
  onDelete,
  onMove,
  onReorder,
  onQuickAdd,
  onSubtaskAdd,
  onSubtaskToggle,
  onSubtaskDelete,
}: {
  todos: Todo[];
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: Status, beforeId?: string) => void;
  onReorder: (activeId: string, overId: string) => void;
  onQuickAdd: (status: Status, text: string) => void;
  onSubtaskAdd: (todoId: string, text: string) => void;
  onSubtaskToggle: (todoId: string, subtaskId: string) => void;
  onSubtaskDelete: (todoId: string, subtaskId: string) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const id = String(active.id);
    const overId = String(over.id);

    const columnStatus = STATUSES.find((s) => s === overId);
    if (columnStatus) {
      onMove(id, columnStatus);
      return;
    }

    const dragged = todos.find((t) => t.id === id);
    const overTodo = todos.find((t) => t.id === overId);
    if (!dragged || !overTodo) return;
    if (dragged.status === overTodo.status) {
      onReorder(id, overId);
    } else {
      onMove(id, overTodo.status, overId);
    }
  }

  const activeTodo = todos.find((t) => t.id === activeId) ?? null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex w-full min-h-[380px] gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
        {STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            todos={todos.filter((t) => t.status === status)}
            onEdit={onEdit}
            onDelete={onDelete}
            expandedId={expandedId}
            onExpand={(id) =>
              setExpandedId((cur) => (cur === id ? null : id))
            }
            onQuickAdd={onQuickAdd}
            onSubtaskAdd={onSubtaskAdd}
            onSubtaskToggle={onSubtaskToggle}
            onSubtaskDelete={onSubtaskDelete}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTodo ? (
          <div className="cursor-grabbing rotate-1 scale-[1.03] drop-shadow-[0_22px_36px_rgb(15_23_42/0.45)]">
            <CardBody
              todo={activeTodo}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
