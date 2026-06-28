"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, SlidersHorizontal, XCircle } from "lucide-react";

type ProviderType = "local" | "openai" | "openrouter" | "anthropic" | "groq" | "mistral" | "huggingface" | "nvidia";

const API_BASE = "http://localhost:8000/api/v1";

export default function ProviderSettingsForm() {
  const [chatProvider, setChatProvider] = useState<ProviderType>("openai");
  const [chatBaseUrl, setChatBaseUrl] = useState("");
  const [chatApiKey, setChatApiKey] = useState("");
  const [chatModel, setChatModel] = useState("");
  
  const [embedProvider, setEmbedProvider] = useState<ProviderType>("openai");
  const [embedBaseUrl, setEmbedBaseUrl] = useState("");
  const [embedApiKey, setEmbedApiKey] = useState("");
  const [embedModel, setEmbedModel] = useState("");

  const [isTestingChat, setIsTestingChat] = useState(false);
  const [isTestingEmbed, setIsTestingEmbed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [envDefaults, setEnvDefaults] = useState<Record<string, { api_key: string | null; model_name: string | null; embedding_model_name?: string | null; base_url?: string | null }>>({});

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const [settingsRes, defaultsRes] = await Promise.all([
          fetch(`${API_BASE}/settings`),
          fetch(`${API_BASE}/settings/env-defaults`),
        ]);
        
        let fetchedDefaults: Record<string, { api_key: string | null; model_name: string | null; embedding_model_name?: string | null }> = {};
        if (defaultsRes.ok && mounted) {
          fetchedDefaults = await defaultsRes.json();
          setEnvDefaults(fetchedDefaults);
        }

        if (settingsRes.ok && mounted) {
          const data = await settingsRes.json();
          
          setChatProvider(data.chat_provider as ProviderType || "openai");
          setChatBaseUrl(data.chat_base_url || "");
          
          setEmbedProvider(data.embedding_provider as ProviderType || data.chat_provider as ProviderType || "openai");
          setEmbedBaseUrl(data.embedding_base_url || "");

          const cDefaults = fetchedDefaults[data.chat_provider] || {};
          const eDefaults = fetchedDefaults[data.embedding_provider || data.chat_provider] || {};
          
          setChatApiKey(data.chat_api_key || cDefaults.api_key || "");
          setChatModel(data.chat_model || cDefaults.model_name || "");
          
          setEmbedApiKey(data.embedding_api_key || eDefaults.api_key || "");
          setEmbedModel(data.embedding_model || eDefaults.embedding_model_name || "");
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
    chat_provider: chatProvider,
    chat_base_url: chatBaseUrl || null,
    chat_api_key: chatApiKey || null,
    chat_model: chatModel || null,
    
    embedding_provider: embedProvider,
    embedding_base_url: embedBaseUrl || null,
    embedding_api_key: embedApiKey || null,
    embedding_model: embedModel || null,
  };

  const handleTestConnection = async (mode: "chat" | "embedding") => {
    if (mode === "chat") setIsTestingChat(true);
    if (mode === "embedding") setIsTestingEmbed(true);
    setNotification(null);

    try {
      const res = await fetch(`${API_BASE}/settings/test-provider?mode=${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsPayload),
      });
      const data = await res.json();

      if (res.ok) {
        setNotification({ type: "success", message: `${mode === 'chat' ? 'Chat' : 'Embedding'} connection successful` });
      } else {
        setNotification({ type: "error", message: data.detail || "Connection failed" });
      }
    } catch {
      setNotification({ type: "error", message: "Network error while testing provider" });
    } finally {
      if (mode === "chat") setIsTestingChat(false);
      if (mode === "embedding") setIsTestingEmbed(false);
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
        setNotification({ type: "success", message: "Settings saved successfully" });
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
  const isBusy = isTestingChat || isTestingEmbed || isSaving;

  return (
    <div className="premium-panel flex max-h-full flex-col overflow-hidden rounded-[2rem]">
      <div className="border-b border-hairline-soft bg-white/75 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-primary text-on-primary shadow-[0_14px_28px_rgba(22,22,22,0.18)]">
              <SlidersHorizontal size={21} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">AI Provider Settings</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-steel">Configure your Chat and Embedding models independently.</p>
          </div>
          <span className="rounded-full border border-hairline bg-surface px-3 py-1 text-xs font-bold text-steel">BETA</span>
        </div>
      </div>

      <div className="internal-scroll flex-1 space-y-8 overflow-y-auto p-5 sm:p-6 lg:p-8">
        
        {/* Chat Section */}
        <section className="space-y-5 rounded-2xl border border-hairline bg-white/50 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-charcoal">Chat Configuration</h3>
            <button
              type="button"
              onClick={() => handleTestConnection("chat")}
              disabled={isBusy}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-ink px-4 text-xs font-bold text-ink transition duration-200 ease-out hover:bg-ink hover:text-on-primary disabled:border-hairline disabled:text-muted"
            >
              {isTestingChat && <Loader2 size={14} className="animate-spin" />}
              {isTestingChat ? "Testing..." : "Test Chat"}
            </button>
          </div>
          
          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-2">
              <label className={labelClass} htmlFor="chat-provider">Provider</label>
              <select
                id="chat-provider"
                value={chatProvider}
                onChange={(event) => {
                  const newProvider = event.target.value as ProviderType;
                  setChatProvider(newProvider);
                  const defs = envDefaults[newProvider];
                  if (defs) {
                    setChatApiKey(defs.api_key || "");
                    setChatModel(defs.model_name || "");
                  }
                  if (newProvider !== "local" && newProvider !== "openrouter") {
                    setChatBaseUrl("");
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
            <div className="space-y-2">
              <label className={labelClass} htmlFor="chat-base-url">Base URL</label>
              <input
                id="chat-base-url"
                type="url"
                value={chatBaseUrl}
                onChange={(e) => setChatBaseUrl(e.target.value)}
                placeholder={
                  chatProvider === "local" ? "http://localhost:11434/v1" :
                  chatProvider === "openrouter" ? "https://openrouter.ai/api/v1" :
                  chatProvider === "nvidia" ? "https://integrate.api.nvidia.com/v1" :
                  chatProvider === "groq" ? "https://api.groq.com/openai/v1" :
                  "https://api.openai.com/v1"
                }
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-2">
              <label className={labelClass} htmlFor="chat-api-key">API Key</label>
              <input
                id="chat-api-key"
                type="password"
                value={chatApiKey}
                onChange={(e) => setChatApiKey(e.target.value)}
                placeholder="sk-..."
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass} htmlFor="chat-model-name">Model Name</label>
              <input
                id="chat-model-name"
                type="text"
                value={chatModel}
                onChange={(e) => setChatModel(e.target.value)}
                placeholder="gpt-4o"
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* Embeddings Section */}
        <section className="space-y-5 rounded-2xl border border-hairline bg-white/50 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-charcoal">Embedding Configuration</h3>
            <button
              type="button"
              onClick={() => handleTestConnection("embedding")}
              disabled={isBusy}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-ink px-4 text-xs font-bold text-ink transition duration-200 ease-out hover:bg-ink hover:text-on-primary disabled:border-hairline disabled:text-muted"
            >
              {isTestingEmbed && <Loader2 size={14} className="animate-spin" />}
              {isTestingEmbed ? "Testing..." : "Test Embeddings"}
            </button>
          </div>
          
          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-2">
              <label className={labelClass} htmlFor="embed-provider">Provider</label>
              <select
                id="embed-provider"
                value={embedProvider}
                onChange={(event) => {
                  const newProvider = event.target.value as ProviderType;
                  setEmbedProvider(newProvider);
                  const defs = envDefaults[newProvider];
                  if (defs) {
                    setEmbedApiKey(defs.api_key || "");
                    setEmbedModel(defs.embedding_model_name || "");
                  }
                  if (newProvider !== "local" && newProvider !== "openrouter") {
                    setEmbedBaseUrl("");
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
            <div className="space-y-2">
              <label className={labelClass} htmlFor="embed-base-url">Base URL</label>
              <input
                id="embed-base-url"
                type="url"
                value={embedBaseUrl}
                onChange={(e) => setEmbedBaseUrl(e.target.value)}
                placeholder={
                  embedProvider === "local" ? "http://localhost:11434/v1" :
                  embedProvider === "openrouter" ? "https://openrouter.ai/api/v1" :
                  embedProvider === "nvidia" ? "https://integrate.api.nvidia.com/v1" :
                  embedProvider === "groq" ? "https://api.groq.com/openai/v1" :
                  "https://api.openai.com/v1"
                }
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-2">
              <label className={labelClass} htmlFor="embed-api-key">API Key</label>
              <input
                id="embed-api-key"
                type="password"
                value={embedApiKey}
                onChange={(e) => setEmbedApiKey(e.target.value)}
                placeholder="sk-..."
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass} htmlFor="embed-model-name">Model Name</label>
              <input
                id="embed-model-name"
                type="text"
                value={embedModel}
                onChange={(e) => setEmbedModel(e.target.value)}
                placeholder="text-embedding-3-small"
                className={inputClass}
              />
            </div>
          </div>
        </section>

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
