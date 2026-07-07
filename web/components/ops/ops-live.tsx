"use client";

/**
 * Subscribes to /api/ops/stream and refreshes the current console when another
 * staff member makes a change (design/10 §11). Debounced to avoid refresh storms.
 */
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function OpsLive() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/ops/stream");
    es.onmessage = (e) => {
      try {
        const { topic } = JSON.parse(e.data);
        if (topic === "hello") return;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => router.refresh(), 400);
      } catch {}
    };
    es.onerror = () => {}; // browser auto-reconnects
    return () => {
      es.close();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [router]);

  return null;
}
