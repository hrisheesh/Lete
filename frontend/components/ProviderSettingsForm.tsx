"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, SlidersHorizontal, XCircle } from "lucide-react";

type ProviderType = "local" | "openai" | "openrouter" | "anthropic" | "groq" | "mistral" | "huggingface" | "nvidia";

const API_BASE = "http://localhost:8000/api/v1";

export default function ProviderSettingsForm() {
  const [providerType, setProviderType] = useState<ProviderType>("openai");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState("");
  const [embeddingModelName, setEmbeddingModelName] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [envDefaults, setEnvDefaults] = useState<Record<string, { api_key: string | null; model_name: string | null }>>({});

  const showBaseUrl = providerType === "local" || providerType === "openrouter";

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const [settingsRes, defaultsRes] = await Promise.all([
          fetch(`${API_BASE}/settings`),
          fetch(`${API_BASE}/settings/env-defaults`),
        ]);
        
        let fetchedDefaults: Record<string, { api_key: string | null; model_name: string | null }> = {};
        if (defaultsRes.ok && mounted) {
          fetchedDefaults = await defaultsRes.json();
          setEnvDefaults(fetchedDefaults);
        }

        if (settingsRes.ok && mounted) {
          const data = await settingsRes.json();
          setProviderType(data.provider_type as ProviderType);
          setBaseUrl(data.base_url ?? "");
          
          const providerDefaults = fetchedDefaults[data.provider_type] || {};
          setApiKey(data.api_key || providerDefaults.api_key || "");
          setModelName(data.model_name || providerDefaults.model_name || "");
          setEmbeddingModelName(data.embedding_model_name ?? "");
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const settingsPayload = {
    provider_type: providerType,
    base_url: baseUrl || null,
    api_key: apiKey || null,
    model_name: modelName || null,
    embedding_model_name: embeddingModelName || null,
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setNotification(null);

    try {
      const res = await fetch(`${API_BASE}/settings/test-provider`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsPayload),
      });
      const data = await res.json();

      if (res.ok) {
        setNotification({ type: "success", message: data.message || "Connection successful" });
      } else {
        setNotification({ type: "error", message: data.detail || "Connection failed" });
      }
    } catch {
      setNotification({ type: "error", message: "Network error while testing provider" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setNotification(null);

    try {
      const res = await fetch(`${API_BASE}/settings/provider`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsPayload),
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
    "h-12 w-full rounded-2xl border border-hairline bg-white/80 px-4 text-base font-semibold text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition duration-200 ease-out placeholder:text-muted focus:border-brand-blue-deep focus:bg-white focus:shadow-[0_0_0_4px_rgba(20,86,240,0.08)]";
  const labelClass = "block text-sm font-bold text-charcoal";
  const isBusy = isTesting || isSaving;

  return (
    <div className="premium-panel flex max-h-full flex-col overflow-hidden rounded-[2rem]">
      <div className="border-b border-hairline-soft bg-white/75 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-primary text-on-primary shadow-[0_14px_28px_rgba(22,22,22,0.18)]">
              <SlidersHorizontal size={21} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">AI Provider</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-steel">Model, endpoint, and embedding settings.</p>
          </div>
          <span className="rounded-full border border-hairline bg-surface px-3 py-1 text-xs font-bold text-steel">BETA</span>
        </div>
      </div>

      <div className="internal-scroll flex-1 space-y-5 overflow-y-auto p-5 sm:p-6 lg:p-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-2">
            <label className={labelClass} htmlFor="provider-type">
              Provider Type
            </label>
            <select
              id="provider-type"
              value={providerType}
              onChange={(event) => {
                const newProvider = event.target.value as ProviderType;
                setProviderType(newProvider);
                
                const newDefaults = envDefaults[newProvider];
                if (newDefaults) {
                  const oldDefaults = envDefaults[providerType] || { api_key: null, model_name: null };
                  if (!apiKey || apiKey === oldDefaults.api_key) {
                    setApiKey(newDefaults.api_key || "");
                  }
                  if (!modelName || modelName === oldDefaults.model_name) {
                    setModelName(newDefaults.model_name || "");
                  }
                }
              }}
              className={`${inputClass} appearance-none`}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="openrouter">OpenRouter</option>
              <option value="groq">Groq</option>
              <option value="mistral">Mistral</option>
              <option value="huggingface">HuggingFace</option>
              <option value="nvidia">NVIDIA (NIM)</option>
              <option value="local">Local (Ollama / LM Studio)</option>
            </select>
          </div>

          {showBaseUrl && (
            <div className="space-y-2">
              <label className={labelClass} htmlFor="base-url">
                Base URL
              </label>
              <input
                id="base-url"
                type="url"
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder={providerType === "local" ? "http://localhost:11434/v1" : "https://openrouter.ai/api/v1"}
                className={inputClass}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className={labelClass} htmlFor="api-key">
            API Key
            {providerType === "local" && <span className="ml-1 font-semibold text-steel">(Optional for Local)</span>}
          </label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="sk-..."
            className={inputClass}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className={labelClass} htmlFor="model-name">
              Primary Model
            </label>
            <input
              id="model-name"
              type="text"
              value={modelName}
              onChange={(event) => setModelName(event.target.value)}
              placeholder="gpt-4o"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label className={labelClass} htmlFor="embedding-model">
              Embedding Model
            </label>
            <input
              id="embedding-model"
              type="text"
              value={embeddingModelName}
              onChange={(event) => setEmbeddingModelName(event.target.value)}
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
            {notification.type === "error" ? (
              <XCircle size={18} className="mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        <div className="flex flex-col justify-end gap-3 border-t border-hairline-soft pt-5 sm:flex-row">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isBusy}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-ink px-6 text-sm font-bold text-ink transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-ink hover:text-on-primary disabled:border-hairline disabled:text-muted"
          >
            {isTesting && <Loader2 size={16} className="animate-spin" />}
            {isTesting ? "Testing..." : "Test connection"}
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isBusy}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-on-primary shadow-[0_16px_32px_rgba(22,22,22,0.18)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-charcoal disabled:bg-hairline disabled:text-muted"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
