"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
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
    <div className="item-in rounded-lg border border-neutral-200 bg-white px-3 py-2.5 shadow-sm transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
      <p
        className={`text-sm select-none ${
          todo.status === "done"
            ? "text-neutral-400 line-through dark:text-neutral-600"
            : ""
        }`}
      >
        {todo.text}
      </p>
      <TodoMeta todo={todo} />
      <div
        className="mt-1 flex flex-wrap items-center gap-3"
        onPointerDownCapture={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onEdit(todo)}
          aria-label="Edit tugas"
          className="text-xs text-neutral-300 transition hover:text-neutral-900 dark:text-neutral-600 dark:hover:text-neutral-100"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          aria-label="Hapus tugas"
          className="text-xs text-neutral-300 transition hover:text-red-500 dark:text-neutral-600 dark:hover:text-red-400"
        >
          Hapus
        </button>
        {hasSubtasks && onExpand && (
          <button
            onClick={() => onExpand(todo.id)}
            aria-label={expanded ? "Tutup subtugas" : "Buka subtugas"}
            title={expanded ? "Tutup subtugas" : "Buka subtugas"}
            className="text-xs text-neutral-300 transition hover:text-neutral-900 dark:text-neutral-600 dark:hover:text-neutral-100"
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`h-3 w-3 transition ${expanded ? "rotate-90" : ""}`}
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
      className={`cursor-grab touch-none ${isDragging ? "opacity-40" : ""}`}
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

function Column({
  status,
  todos,
  onEdit,
  onDelete,
  expandedId,
  onExpand,
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
  onSubtaskAdd: (todoId: string, text: string) => void;
  onSubtaskToggle: (todoId: string, subtaskId: string) => void;
  onSubtaskDelete: (todoId: string, subtaskId: string) => void;
}) {
  const column = COLUMNS.find((c) => c.key === status)!;
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section className="flex w-[85vw] max-w-[320px] shrink-0 snap-start flex-col rounded-xl border border-neutral-200 bg-neutral-50 p-3 min-h-0 sm:w-auto sm:max-w-none sm:flex-1 dark:border-neutral-800 dark:bg-neutral-950/50">
      <header className="mb-3 flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${column.dot}`} />
        <h2 className="text-sm font-semibold">{column.label}</h2>
        <span className="ml-auto rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          {todos.length}
        </span>
      </header>
      <div
        ref={setNodeRef}
        className={`flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-lg p-1 transition ${
          isOver
            ? "bg-neutral-200/60 ring-2 ring-neutral-400 dark:bg-neutral-800/40 dark:ring-neutral-600"
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
          <p className="py-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
            Tarik kartu ke sini
          </p>
        )}
      </div>
    </section>
  );
}

export default function KanbanBoard({
  todos,
  onEdit,
  onDelete,
  onMove,
  onReorder,
  onSubtaskAdd,
  onSubtaskToggle,
  onSubtaskDelete,
}: {
  todos: Todo[];
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: Status, beforeId?: string) => void;
  onReorder: (activeId: string, overId: string) => void;
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
      <div className="flex w-full min-h-0 flex-1 gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
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
            onSubtaskAdd={onSubtaskAdd}
            onSubtaskToggle={onSubtaskToggle}
            onSubtaskDelete={onSubtaskDelete}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTodo ? (
          <div className="cursor-grabbing rotate-2">
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
