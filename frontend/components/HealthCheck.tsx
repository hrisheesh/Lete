"use client";

import { useEffect, useState } from "react";

type Status = "loading" | "connected" | "disconnected";

export default function HealthCheck() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let mounted = true;

    async function checkHealth() {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/v1/health");
        if (mounted) setStatus(response.ok ? "connected" : "disconnected");
      } catch {
        if (mounted) setStatus("disconnected");
      }
    }

    checkHealth();

    return () => {
      mounted = false;
    };
  }, []);

  const copy = {
    loading: "Connecting...",
    connected: "Connected",
    disconnected: "Disconnected",
  }[status];

  const statusClass = {
    loading: "border-hairline bg-canvas text-steel",
    connected: "border-success-text/20 bg-success-bg text-success-text",
    disconnected: "border-brand-coral/25 bg-brand-coral/10 text-brand-coral",
  }[status];

  const dotClass = {
    loading: "bg-stone",
    connected: "bg-success-text",
    disconnected: "bg-brand-coral",
  }[status];

  return (
    <div className={`inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-bold ${statusClass}`}>
      <span className={`size-2 rounded-full ${dotClass}`} />
      {copy}
    </div>
  );
}
