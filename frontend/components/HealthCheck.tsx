"use client";

import { useEffect, useState } from "react";

export default function HealthCheck() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch("http://localhost:8000/health", {
          signal: AbortSignal.timeout(3000),
        });
        if (response.ok) {
          setStatus("success");
        } else {
          setStatus("error");
        }
      } catch (error) {
        setStatus("error");
      }
    };
    
    checkHealth();
  }, []);

  return (
    <div className="inline-block px-4 py-2 rounded-full border bg-white shadow-sm">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Backend Status:</span>
        {status === "loading" && <span className="text-sm text-gray-500">Connecting...</span>}
        {status === "success" && (
          <span className="flex items-center text-sm text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            Connected
          </span>
        )}
        {status === "error" && (
          <span className="flex items-center text-sm text-red-600">
            <span className="w-2 h-2 rounded-full bg-red-500 mr-2" />
            Disconnected
          </span>
        )}
      </div>
    </div>
  );
}
