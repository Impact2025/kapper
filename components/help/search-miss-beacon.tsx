"use client";

import { useEffect } from "react";

/** Reports a zero-result search once, so unanswered questions become new articles. */
export function SearchMissBeacon({ query }: { query: string }) {
  useEffect(() => {
    fetch("/api/help/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "search_miss", query }),
      keepalive: true,
    }).catch(() => {});
  }, [query]);
  return null;
}
