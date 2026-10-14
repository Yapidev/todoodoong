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
      className="toast-in fixed right-4 top-4 z-40 flex w-full max-w-xs items-start gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3.5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-600 dark:text-green-400">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
          <path
            fillRule="evenodd"
            d="M16.704 5.69a.75.75 0 0 1 .011 1.06l-7.301 7.5a.75.75 0 0 1-1.073.012L3.3 9.77a.75.75 0 1 1 1.06-1.06l4.36 4.42 6.983-7.16a.75.75 0 0 1 1.06-.02Z"
            clipRule="evenodd"
          />
        </svg>
      </span>
      <span className="flex-1 pt-px text-sm font-medium text-neutral-800 dark:text-neutral-100">
        {message}
      </span>
      {action}
      <button
        onClick={onClose}
        aria-label="Tutup notifikasi"
        className="shrink-0 rounded-md p-0.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
        </svg>
      </button>
    </div>
  );
}
