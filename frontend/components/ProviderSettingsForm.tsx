"use client";

import { useState } from "react";
import { Server, KeyRound, Box, Loader2, Link2, CheckCircle2 } from "lucide-react";

type ProviderType = "local" | "openai" | "openrouter" | "anthropic";

export default function ProviderSettingsForm() {
  const [providerType, setProviderType] = useState<ProviderType>("openai");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState("");
  const [embeddingModelName, setEmbeddingModelName] = useState("");
  
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showBaseUrl = providerType === "local" || providerType === "openrouter";

  const handleTestConnection = async () => {
    setIsTesting(true);
    setNotification(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setNotification({
        type: 'error',
        message: 'Backend is not connected yet (Phase 2 Backend pending). UI is fully wired.'
      });
    } catch (e) {
      setNotification({ type: 'error', message: 'Failed to connect.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setNotification(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNotification({
        type: 'error',
        message: 'Backend is not connected yet (Phase 2 Backend pending). Configuration was not saved.'
      });
    } catch (e) {
      setNotification({ type: 'error', message: 'Failed to save.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
      <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-6">
        <div className="p-3 bg-indigo-500/10 rounded-xl">
          <Server className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-white">Provider Configuration</h2>
          <p className="text-gray-400 text-sm mt-1">Connect Lete to your preferred AI models.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Provider Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Provider Type</label>
          <div className="relative">
            <select
              value={providerType}
              onChange={(e) => setProviderType(e.target.value as ProviderType)}
              className="w-full bg-black/20 border border-white/10 rounded-lg py-3 px-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="openrouter">OpenRouter</option>
              <option value="local">Local (Ollama / LM Studio)</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              ▼
            </div>
          </div>
        </div>

        {/* Base URL (Conditional) */}
        <div className={`space-y-2 overflow-hidden transition-all duration-300 ${showBaseUrl ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Link2 className="w-4 h-4" /> Base URL
          </label>
          <input
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder={providerType === 'local' ? 'http://localhost:11434/v1' : 'https://openrouter.ai/api/v1'}
            className="w-full bg-black/20 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <KeyRound className="w-4 h-4" /> API Key
            {providerType === 'local' && <span className="text-gray-500 text-xs ml-2">(Optional for Local)</span>}
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full bg-black/20 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Model Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Box className="w-4 h-4" /> Primary Model
            </label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="gpt-4o"
              className="w-full bg-black/20 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>

          {/* Embedding Model */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Box className="w-4 h-4" /> Embedding Model
            </label>
            <input
              type="text"
              value={embeddingModelName}
              onChange={(e) => setEmbeddingModelName(e.target.value)}
              placeholder="text-embedding-3-small"
              className="w-full bg-black/20 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div className={`p-4 rounded-lg flex items-start gap-3 border ${notification.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
            <div className="mt-0.5">
              {notification.type === 'error' ? '⚠️' : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <p className="text-sm">{notification.message}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-6 mt-6 border-t border-white/10 flex flex-col sm:flex-row items-center gap-4 justify-end">
          <button
            onClick={handleTestConnection}
            disabled={isTesting || isSaving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Test Connection
          </button>
          
          <button
            onClick={handleSaveSettings}
            disabled={isTesting || isSaving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
