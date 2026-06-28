"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const API_BASE = "http://127.0.0.1:8000/api/v1";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Citation {
  id: string;           // e.g. "[1]"
  chunk_id: string;
  document_id: string;
  filename: string;
  contextual_header: string;
  text_preview: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  isStreaming?: boolean;
  error?: string;
}

interface ChatPanelProps {
  workspaceId: string;
  hasProcessedDocs: boolean;
}

// ─── Citation Tooltip ─────────────────────────────────────────────────────────

function CitationBadge({ citation }: { citation: Citation }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <span ref={ref} className="relative inline-block align-baseline">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-ink text-on-primary text-[10px] font-bold cursor-pointer hover:bg-charcoal transition-colors mx-[2px] translate-y-[-2px]"
        title={`Source: ${citation.filename}`}
      >
        {citation.id.replace(/[\[\]]/g, "")}
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-ink text-on-primary rounded-2xl p-4 shadow-2xl z-50 text-left">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Source {citation.id}
          </div>
          <div className="text-[13px] font-semibold text-white mb-1 truncate">
            {citation.filename}
          </div>
          {citation.contextual_header && (
            <div className="text-[11px] text-gray-400 mb-2 truncate">
              {citation.contextual_header}
            </div>
          )}
          <div className="text-[12px] text-gray-300 leading-relaxed line-clamp-3">
            {citation.text_preview}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-ink" />
        </div>
      )}
    </span>
  );
}

// ─── Render message content with inline citation badges ───────────────────────

function MessageContent({
  content,
  citations,
}: {
  content: string;
  citations?: Citation[];
}) {
  if (!citations || citations.length === 0) {
    return <span className="whitespace-pre-wrap">{content}</span>;
  }

  // Replace [N] markers with React nodes
  const citationMap = new Map(citations.map((c) => [c.id, c]));
  const parts = content.split(/(\[\d+\])/g);

  return (
    <span className="whitespace-pre-wrap leading-relaxed">
      {parts.map((part, i) => {
        const citation = citationMap.get(part);
        if (citation) {
          return <CitationBadge key={i} citation={citation} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

// ─── Streaming cursor ─────────────────────────────────────────────────────────

function StreamingCursor() {
  return (
    <span className="inline-block w-[2px] h-[1em] bg-ink ml-[1px] translate-y-[2px] animate-[blink_1s_step-end_infinite]" />
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasProcessedDocs }: { hasProcessedDocs: boolean }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
      <div className="w-16 h-16 rounded-3xl bg-surface border border-hairline-soft flex items-center justify-center mb-6">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-steel">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="text-[15px] font-semibold text-ink mb-2">Ask anything about your documents</p>
      <p className="text-[13px] text-steel max-w-xs leading-relaxed">
        {hasProcessedDocs
          ? "Type a question below. Answers are grounded in your documents with inline citations."
          : "Upload and process at least one document to start asking questions."}
      </p>
    </div>
  );
}

// ─── Main ChatPanel ───────────────────────────────────────────────────────────

export default function ChatPanel({ workspaceId, hasProcessedDocs }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  const sendMessage = useCallback(async () => {
    const query = input.trim();
    if (!query || isLoading || !hasProcessedDocs) return;

    setInput("");
    setIsLoading(true);

    // Add user message
    const userMsg: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);

    // Add placeholder assistant message
    const assistantMsg: Message = {
      role: "assistant",
      content: "",
      citations: [],
      isStreaming: true,
    };
    setMessages((prev) => [...prev, assistantMsg]);

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let citations: Citation[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("event: metadata")) continue;
          if (line.startsWith("event: content")) continue;
          if (line.startsWith("event: done")) continue;

          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (!data || data === "{}") continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.citations !== undefined) {
                // Metadata event
                citations = parsed.citations as Citation[];
                setMessages((prev) => {
                  const next = [...prev];
                  const last = { ...next[next.length - 1] };
                  last.citations = citations;
                  next[next.length - 1] = last;
                  return next;
                });
              } else if (parsed.text !== undefined) {
                // Content chunk
                setMessages((prev) => {
                  const next = [...prev];
                  const last = { ...next[next.length - 1] };
                  last.content += parsed.text;
                  next[next.length - 1] = last;
                  return next;
                });
              }
            } catch {
              // Non-JSON data line, skip
            }
          }
        }
      }

      // Mark streaming done
      setMessages((prev) => {
        const next = [...prev];
        const last = { ...next[next.length - 1] };
        last.isStreaming = false;
        next[next.length - 1] = last;
        return next;
      });
    } catch (err: any) {
      if (err.name === "AbortError") return;

      setMessages((prev) => {
        const next = [...prev];
        const last = { ...next[next.length - 1] };
        last.isStreaming = false;
        last.error = err.message || "An error occurred. Please try again.";
        last.content = "";
        next[next.length - 1] = last;
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, hasProcessedDocs, workspaceId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setMessages((prev) => {
      const next = [...prev];
      const last = { ...next[next.length - 1] };
      last.isStreaming = false;
      next[next.length - 1] = last;
      return next;
    });
  };

  const handleClear = () => {
    if (isLoading) handleStop();
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-full border border-hairline-soft rounded-3xl overflow-hidden bg-canvas">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-hairline-soft bg-surface/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-ink" />
          <span className="text-[14px] font-semibold text-ink">Chat</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="text-[12px] text-steel hover:text-ink transition-colors font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {messages.length === 0 ? (
          <EmptyState hasProcessedDocs={hasProcessedDocs} />
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "user" ? (
                // User bubble
                <div className="max-w-[80%] bg-ink text-on-primary rounded-3xl rounded-br-lg px-5 py-3 text-[14px] leading-relaxed">
                  {msg.content}
                </div>
              ) : (
                // Assistant bubble
                <div className="max-w-[90%] space-y-3">
                  {msg.error ? (
                    <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-[13px] text-red-700">
                      <span className="font-semibold">Error: </span>{msg.error}
                    </div>
                  ) : (
                    <div className="text-[14px] text-ink leading-relaxed">
                      {msg.content ? (
                        <>
                          <MessageContent content={msg.content} citations={msg.citations} />
                          {msg.isStreaming && <StreamingCursor />}
                        </>
                      ) : msg.isStreaming ? (
                        // Thinking dots
                        <div className="flex items-center gap-1 py-2">
                          <span className="w-2 h-2 rounded-full bg-steel animate-bounce [animation-delay:0ms]" />
                          <span className="w-2 h-2 rounded-full bg-steel animate-bounce [animation-delay:150ms]" />
                          <span className="w-2 h-2 rounded-full bg-steel animate-bounce [animation-delay:300ms]" />
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Citation source list */}
                  {!msg.isStreaming && msg.citations && msg.citations.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.citations.map((c) => (
                        <div
                          key={c.chunk_id}
                          className="inline-flex items-center gap-1.5 bg-surface border border-hairline-soft rounded-full px-3 py-1"
                        >
                          <span className="w-4 h-4 rounded-full bg-ink text-on-primary text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                            {c.id.replace(/[\[\]]/g, "")}
                          </span>
                          <span className="text-[11px] text-steel truncate max-w-[140px]" title={c.filename}>
                            {c.filename}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-hairline-soft p-4">
        <div className={`flex items-end gap-3 bg-surface rounded-2xl px-4 py-3 border transition-colors ${
          hasProcessedDocs ? "border-hairline-soft focus-within:border-ink" : "border-hairline-soft opacity-60"
        }`}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              hasProcessedDocs
                ? "Ask a question… (Enter to send, Shift+Enter for newline)"
                : "Process at least one document to enable chat"
            }
            disabled={!hasProcessedDocs || isLoading}
            rows={1}
            className="flex-1 bg-transparent resize-none text-[14px] text-ink placeholder-steel outline-none disabled:cursor-not-allowed leading-relaxed max-h-[160px] overflow-y-auto"
          />

          {isLoading ? (
            <button
              onClick={handleStop}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-ink text-on-primary flex items-center justify-center hover:bg-charcoal transition-colors"
              title="Stop generating"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <rect x="1" y="1" width="10" height="10" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={sendMessage}
              disabled={!input.trim() || !hasProcessedDocs}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-ink text-on-primary flex items-center justify-center hover:bg-charcoal transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Send (Enter)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"/>
                <polyline points="5,12 12,5 19,12"/>
              </svg>
            </button>
          )}
        </div>
        <p className="text-[11px] text-steel text-center mt-2">
          Answers are grounded in your documents · Citations shown inline
        </p>
      </div>
    </div>
  );
}
