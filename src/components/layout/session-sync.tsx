"use client";

import { useEffect, useRef } from "react";

/** Syncs stale session cookie with the canonical user in the database. */
export function SessionSync() {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void fetch("/api/auth/refresh-session", { method: "POST" }).catch(() => {});
  }, []);

  return null;
}
