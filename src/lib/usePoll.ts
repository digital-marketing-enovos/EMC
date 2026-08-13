"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Poll a JSON endpoint. No websockets: 3 seconds is well inside the 5-second
 * acceptance window and survives conference wifi dropping a request.
 * A failed poll keeps the last good value on screen rather than blanking it.
 */
export function usePoll<T>(url: string, intervalMs = 3000) {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<"loading" | "live" | "stale" | "gone">("loading");
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!alive.current) return;
        if (res.status === 404) {
          setStatus("gone");
          return; // stop polling: the code or key is wrong
        }
        if (!res.ok) throw new Error(String(res.status));
        setData((await res.json()) as T);
        setStatus("live");
      } catch {
        if (!alive.current) return;
        // Keep showing the last good data; just flag it.
        setStatus((s) => (s === "loading" ? "loading" : "stale"));
      }
      if (alive.current) timer = setTimeout(tick, intervalMs);
    };

    void tick();
    return () => {
      alive.current = false;
      clearTimeout(timer);
    };
  }, [url, intervalMs]);

  return { data, status, setData };
}
