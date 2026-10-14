"use client";

import { useEffect, useState } from "react";
import Toast from "./Toast";

export default function UpdatePrompt() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(registration.waiting);
        }
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              !cancelled &&
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setWaitingWorker(installing);
            }
          });
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!waitingWorker || dismissed) return null;

  return (
    <Toast
      message="Versi baru tersedia."
      onClose={() => setDismissed(true)}
      action={
        <button
          onClick={() => {
            waitingWorker.postMessage({ type: "SKIP_WAITING" });
            waitingWorker.addEventListener("statechange", () => {
              if (waitingWorker.state === "activated") {
                window.location.reload();
              }
            });
            setDismissed(true);
          }}
          className="shrink-0 text-xs font-medium text-neutral-700 underline underline-offset-2 dark:text-neutral-200"
        >
          Muat ulang
        </button>
      }
    />
  );
}
