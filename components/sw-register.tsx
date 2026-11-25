"use client";

import { useEffect } from "react";

export function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker.register("/sw.js").catch(() => undefined);
      } else {
        // In development, unregister service workers and clear caches to prevent stale chunk errors
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
          }
        }).catch(() => {});
        if (typeof window !== "undefined" && "caches" in window) {
          caches.keys().then((keys) => {
            keys.forEach((key) => caches.delete(key));
          }).catch(() => {});
        }
      }
    }
  }, []);
  return null;
}
