"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type GlassSelectOption<T extends string> = {
  value: T;
  label: string;
  icon?: React.ReactNode;
  accentClass?: string;
};

export default function GlassSelect<T extends string>({
  id,
  value,
  options,
  onChange,
  ariaLabel,
  className = "",
  size = "md",
}: {
  id?: string;
  value: T;
  options: GlassSelectOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      options.findIndex((o) => o.value === value)
    )
  );
  const [menuStyle, setMenuStyle] = useState<{
    top: number;
    left: number;
    width: number;
    openUp: boolean;
  } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selected = options.find((o) => o.value === value) ?? options[0];

  function updatePosition() {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const estimatedHeight = Math.min(240, options.length * 40 + 16);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < estimatedHeight && rect.top > spaceBelow;
    const minWidth = Math.max(rect.width, size === "sm" ? 152 : 168);
    const left = Math.min(
      Math.max(8, rect.left),
      Math.max(8, window.innerWidth - minWidth - 8)
    );
    setMenuStyle({
      top: openUp ? rect.top - 6 : rect.bottom + 6,
      left,
      width: minWidth,
      openUp,
    });
  }

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % options.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + options.length) % options.length);
      } else if (e.key === "Home") {
        e.preventDefault();
        setActiveIndex(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setActiveIndex(options.length - 1);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const opt = options[activeIndex];
        if (opt) {
          onChange(opt.value);
          setOpen(false);
          triggerRef.current?.focus();
        }
      }
    }

    function onViewportChange() {
      updatePosition();
    }

    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeIndex, options]);

  function toggleOpen() {
    if (!open) {
      setActiveIndex(
        Math.max(
          0,
          options.findIndex((o) => o.value === value)
        )
      );
    }
    setOpen((prev) => !prev);
  }

  function handleTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (open) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setActiveIndex(
        Math.max(
          0,
          options.findIndex((o) => o.value === value)
        )
      );
      setOpen(true);
    }
  }

  const sizeClasses =
    size === "sm"
      ? "rounded-full px-3 py-1.5 text-xs"
      : "w-full rounded-xl px-3.5 py-2.5 text-sm";

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={toggleOpen}
        onKeyDown={handleTriggerKeyDown}
        className={`glass-input inline-flex cursor-pointer items-center justify-between gap-2 text-left font-medium text-slate-900 outline-none transition dark:text-white ${sizeClasses} ${className}`}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {selected?.icon}
          <span className={`truncate ${selected?.accentClass ?? ""}`}>
            {selected?.label}
          </span>
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-150 dark:text-slate-300 ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open &&
        menuStyle &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
            style={{
              position: "fixed",
              top: menuStyle.top,
              left: menuStyle.left,
              width: menuStyle.width,
              transform: menuStyle.openUp ? "translateY(-100%)" : undefined,
            }}
            className="glass-dropdown dropdown-in z-[60] max-h-60 overflow-y-auto rounded-2xl p-1.5"
          >
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isActive = idx === activeIndex;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-[13px] transition ${
                    isActive
                      ? "bg-sky-500/15 text-slate-950 dark:bg-sky-400/22 dark:text-white"
                      : isSelected
                        ? "bg-slate-900/[0.05] text-slate-900 dark:bg-white/[0.08] dark:text-white"
                        : "text-slate-700 hover:bg-slate-900/[0.05] dark:text-slate-200 dark:hover:bg-white/[0.08]"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2 truncate">
                    {opt.icon}
                    <span
                      className={`truncate ${isSelected ? "font-semibold" : "font-medium"} ${
                        opt.accentClass ?? ""
                      }`}
                    >
                      {opt.label}
                    </span>
                  </span>
                  {isSelected && (
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
