"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, SlidersHorizontal } from "lucide-react";

type ProviderType = "local" | "openai" | "openrouter" | "anthropic";

export default function ProviderSettingsForm() {
  const [providerType, setProviderType] = useState<ProviderType>("openai");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState("");
  const [embeddingModelName, setEmbeddingModelName] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showBaseUrl = providerType === "local" || providerType === "openrouter";

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const res = await fetch("http://localhost:8000/api/v1/settings");
        if (res.ok && mounted) {
          const data = await res.json();
          setProviderType(data.provider_type as ProviderType);
          if (data.base_url) setBaseUrl(data.base_url);
          if (data.api_key) setApiKey(data.api_key);
          if (data.model_name) setModelName(data.model_name);
          if (data.embedding_model_name) setEmbeddingModelName(data.embedding_model_name);
        }
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    }

    loadSettings();
    return () => {
      mounted = false;
    };
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setNotification(null);
    try {
      const res = await fetch("http://localhost:8000/api/v1/settings/test-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_type: providerType,
          base_url: baseUrl || null,
          api_key: apiKey || null,
          model_name: modelName || null,
          embedding_model_name: embeddingModelName || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({ type: "success", message: data.message || "Connection successful" });
      } else {
        setNotification({ type: "error", message: data.detail || "Connection failed" });
      }
    } catch {
      setNotification({ type: "error", message: "Network error while testing connection" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setNotification(null);
    try {
      const res = await fetch("http://localhost:8000/api/v1/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_type: providerType,
          base_url: baseUrl || null,
          api_key: apiKey || null,
          model_name: modelName || null,
          embedding_model_name: embeddingModelName || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({ type: "success", message: "Settings saved" });
      } else {
        setNotification({ type: "error", message: data.detail || "Failed to save settings" });
      }
    } catch {
      setNotification({ type: "error", message: "Network error while saving settings" });
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "h-12 w-full rounded-2xl border border-hairline bg-canvas px-4 text-base font-semibold text-ink transition duration-200 ease-out placeholder:text-muted focus:border-brand-blue-deep focus:shadow-[0_0_0_4px_rgba(20,86,240,0.08)]";
  const labelClass = "block text-sm font-bold text-charcoal";

  return (
    <div className="premium-panel overflow-hidden rounded-[2rem]">
      <div className="border-b border-hairline-soft bg-white/70 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-primary text-on-primary">
              <SlidersHorizontal size={21} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-ink">AI Provider</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-steel">Model, endpoint, and embedding settings.</p>
          </div>
          <span className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-steel">BETA</span>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6 lg:p-8">
        <div className="space-y-2">
          <label className={labelClass}>Provider Type</label>
          <select value={providerType} onChange={(e) => setProviderType(e.target.value as ProviderType)} className={`${inputClass} appearance-none`}>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="openrouter">OpenRouter</option>
            <option value="local">Local (Ollama / LM Studio)</option>
          </select>
        </div>

        {showBaseUrl && (
          <div className="space-y-2">
            <label className={labelClass}>Base URL</label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={providerType === "local" ? "http://localhost:11434/v1" : "https://openrouter.ai/api/v1"}
              className={inputClass}
            />
          </div>
        )}

        <div className="space-y-2">
          <label className={labelClass}>
            API Key
            {providerType === "local" && <span className="ml-1 font-semibold text-steel">(Optional for Local)</span>}
          </label>
          <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." className={inputClass} />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className={labelClass}>Primary Model</label>
            <input type="text" value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder="gpt-4o" className={inputClass} />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Embedding Model</label>
            <input
              type="text"
              value={embeddingModelName}
              onChange={(e) => setEmbeddingModelName(e.target.value)}
              placeholder="text-embedding-3-small"
              className={inputClass}
            />
          </div>
        </div>

        {notification && (
          <div
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-bold ${
              notification.type === "error"
                ? "border-brand-coral/25 bg-brand-coral/10 text-brand-coral"
                : "border-success-text/20 bg-success-bg text-success-text"
            }`}
          >
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            {notification.message}
          </div>
        )}

        <div className="flex flex-col justify-end gap-3 border-t border-hairline-soft pt-6 sm:flex-row">
          <button
            onClick={handleTestConnection}
            disabled={isTesting || isSaving}
            className="inline-flex h-12 items-center justify-center rounded-full border border-ink px-6 text-sm font-bold text-ink transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-ink hover:text-on-primary disabled:border-hairline disabled:text-muted"
          >
            {isTesting ? "Testing..." : "Test connection"}
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={isTesting || isSaving}
            className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-on-primary transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-charcoal disabled:bg-hairline disabled:text-muted"
          >
            {isSaving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
