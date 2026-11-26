"use client";

export default function Toast({
  message,
  onClose,
  action,
}: {
  message: string;
  onClose: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="toast-in glass-pill fixed right-4 top-4 z-40 flex w-full max-w-xs items-center gap-3 rounded-2xl px-4 py-3"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 shadow-[0_0_12px_rgb(16_185_129/0.35)] dark:bg-emerald-400/20 dark:text-emerald-300">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
          <path
            fillRule="evenodd"
            d="M16.704 5.69a.75.75 0 0 1 .011 1.06l-7.301 7.5a.75.75 0 0 1-1.073.012L3.3 9.77a.75.75 0 1 1 1.06-1.06l4.36 4.42 6.983-7.16a.75.75 0 0 1 1.06-.02Z"
            clipRule="evenodd"
          />
        </svg>
      </span>
      <span className="flex-1 text-sm font-medium text-slate-900 dark:text-white">
        {message}
      </span>
      {action}
      <button
        onClick={onClose}
        aria-label="Tutup notifikasi"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-900/8 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/15 dark:hover:text-white"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
        </svg>
      </button>
    </div>
  );
}
