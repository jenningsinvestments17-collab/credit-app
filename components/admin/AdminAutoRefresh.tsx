"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AdminAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      router.refresh();
    };

    const interval = window.setInterval(() => {
      refresh();
    }, 4000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [router]);

  return null;
}
