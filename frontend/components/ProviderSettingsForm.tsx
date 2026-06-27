"use client";

import { useState } from "react";

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
      await new Promise(resolve => setTimeout(resolve, 800));
      setNotification({
        type: 'error',
        message: 'Backend connection pending.'
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
      await new Promise(resolve => setTimeout(resolve, 800));
      setNotification({
        type: 'error',
        message: 'Backend connection pending.'
      });
    } catch (e) {
      setNotification({ type: 'error', message: 'Failed to save.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-canvas border border-hairline rounded-[16px] p-[24px]">
      <div className="flex items-center justify-between mb-[32px]">
        <h2 className="text-[24px] font-semibold text-ink leading-[1.30]">AI Provider</h2>
        <span className="bg-brand-blue-200 text-brand-blue-deep text-[13px] font-semibold rounded-full px-[10px] py-[4px]">
          BETA
        </span>
      </div>

      <div className="space-y-[24px]">
        {/* Provider Type */}
        <div className="space-y-[8px]">
          <label className="block text-[14px] font-medium text-charcoal">Provider Type</label>
          <select
            value={providerType}
            onChange={(e) => setProviderType(e.target.value as ProviderType)}
            className="w-full bg-canvas text-ink text-[16px] h-[40px] px-[16px] border border-hairline rounded-[8px] focus:border-[2px] focus:border-brand-blue-deep focus:outline-none appearance-none"
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="openrouter">OpenRouter</option>
            <option value="local">Local (Ollama / LM Studio)</option>
          </select>
        </div>

        {/* Base URL (Conditional) */}
        {showBaseUrl && (
          <div className="space-y-[8px]">
            <label className="block text-[14px] font-medium text-charcoal">Base URL</label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={providerType === 'local' ? 'http://localhost:11434/v1' : 'https://openrouter.ai/api/v1'}
              className="w-full bg-canvas text-ink text-[16px] h-[40px] px-[16px] border border-hairline rounded-[8px] focus:border-[2px] focus:border-brand-blue-deep focus:outline-none"
            />
          </div>
        )}

        {/* API Key */}
        <div className="space-y-[8px]">
          <label className="block text-[14px] font-medium text-charcoal">
            API Key
            {providerType === 'local' && <span className="text-steel ml-1 font-normal">(Optional for Local)</span>}
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full bg-canvas text-ink text-[16px] h-[40px] px-[16px] border border-hairline rounded-[8px] focus:border-[2px] focus:border-brand-blue-deep focus:outline-none"
          />
        </div>

        {/* Model Names */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
          <div className="space-y-[8px]">
            <label className="block text-[14px] font-medium text-charcoal">Primary Model</label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="gpt-4o"
              className="w-full bg-canvas text-ink text-[16px] h-[40px] px-[16px] border border-hairline rounded-[8px] focus:border-[2px] focus:border-brand-blue-deep focus:outline-none"
            />
          </div>

          <div className="space-y-[8px]">
            <label className="block text-[14px] font-medium text-charcoal">Embedding Model</label>
            <input
              type="text"
              value={embeddingModelName}
              onChange={(e) => setEmbeddingModelName(e.target.value)}
              placeholder="text-embedding-3-small"
              className="w-full bg-canvas text-ink text-[16px] h-[40px] px-[16px] border border-hairline rounded-[8px] focus:border-[2px] focus:border-brand-blue-deep focus:outline-none"
            />
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div className={`mt-[24px] px-[16px] py-[12px] rounded-[8px] border text-[14px] font-medium ${
            notification.type === 'error' 
              ? 'bg-[#fff5f5] text-[#d45656] border-[#d45656]' 
              : 'bg-success-bg text-success-text border-success-text'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Actions */}
        <div className="pt-[32px] mt-[32px] border-t border-hairline-soft flex flex-col sm:flex-row items-center gap-[16px] justify-end">
          <button
            onClick={handleTestConnection}
            disabled={isTesting || isSaving}
            className="px-[24px] py-[11px] bg-transparent text-ink border border-ink rounded-full text-[14px] font-semibold flex items-center justify-center min-w-[140px]"
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>
          
          <button
            onClick={handleSaveSettings}
            disabled={isTesting || isSaving}
            className="px-[24px] py-[11px] bg-primary text-on-primary rounded-full text-[14px] font-semibold flex items-center justify-center min-w-[140px]"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
