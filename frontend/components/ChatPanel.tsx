"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Send, Square, UserRound } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000/api/v1";

interface Citation {
  id: string;
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




import RichMarkdown from "./markdown/RichMarkdown";

function FormattedMessage({ content, citations }: { content: string; citations?: Citation[] }) {
  return <RichMarkdown content={content} citations={citations} />;
}

function StreamingCursor() {
  return <span className="ml-1 inline-block h-[1em] w-[2px] translate-y-[2px] animate-[blink_1s_step-end_infinite] bg-ink" />;
}

function EmptyState({ hasProcessedDocs }: { hasProcessedDocs: boolean }) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-5 py-8 text-center sm:px-6">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-[0_16px_40px_rgba(17,17,17,0.16)]">
        <Bot size={25} />
      </div>
      <p className="mt-5 text-lg font-bold tracking-tight text-ink">Ask anything about documents</p>
      <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-steel">
        {hasProcessedDocs
          ? "Type a question below. Answers stay grounded in your documents with inline citations."
          : "Upload and process at least one document to start asking questions."}
      </p>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

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

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [input]);

  const sendMessage = useCallback(async () => {
    const query = input.trim();
    if (!query || isLoading || !hasProcessedDocs) return;

    setInput("");
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setMessages((prev) => [...prev, { role: "assistant", content: "", citations: [], isStreaming: true }]);
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

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let citations: Citation[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const eventType = event
            .split("\n")
            .find((line) => line.startsWith("event:"))
            ?.replace("event:", "")
            .trim();
          const dataLine = event.split("\n").find((line) => line.startsWith("data:"));
          if (!dataLine) continue;

          try {
            const data = JSON.parse(dataLine.replace("data:", "").trim());

            if (eventType === "metadata" && Array.isArray(data.citations)) {
              citations = data.citations;
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "assistant") {
                  next[next.length - 1] = { ...last, citations };
                }
                return next;
              });
            }

            const textChunk =
              eventType === "content" && typeof data.text === "string"
                ? data.text
                : eventType === "token" && typeof data.token === "string"
                  ? data.token
                  : "";

            if (textChunk) {
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "assistant") {
                  next[next.length - 1] = {
                    ...last,
                    content: `${last.content}${textChunk}`,
                    citations,
                  };
                }
                return next;
              });
            }

            if (eventType === "done") {
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "assistant") {
                  next[next.length - 1] = { ...last, isStreaming: false, citations };
                }
                return next;
              });
            }
          } catch {
            continue;
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant") {
            next[next.length - 1] = {
              ...last,
              isStreaming: false,
              error: getErrorMessage(error),
              content: last.content || "I could not complete that response.",
            };
          }
          return next;
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [hasProcessedDocs, input, isLoading, workspaceId]);

  const stopStreaming = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === "assistant") {
        next[next.length - 1] = { ...last, isStreaming: false };
      }
      return next;
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="premium-panel flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[1.1rem]">
      <div className="flex shrink-0 items-center justify-between border-b border-hairline-soft bg-white/78 px-3.5 py-2 sm:px-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-stone">Grounded chat</p>
          <h2 className="mt-0.5 text-base font-bold tracking-tight text-ink sm:text-lg">Ask your workspace</h2>
        </div>
        <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-on-primary">
          {hasProcessedDocs ? "Ready" : "Needs docs"}
        </span>
      </div>

      <div className="internal-scroll min-h-0 flex-1 overflow-y-auto px-2.5 py-3 sm:px-4">
        {messages.length === 0 ? (
          <EmptyState hasProcessedDocs={hasProcessedDocs} />
        ) : (
          <div className="space-y-5">
            {messages.map((message, index) => {
              const isUser = message.role === "user";

              return (
              <div key={index} className={`animate-message-in flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && (
                  <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                    <Bot size={16} />
                  </div>
                )}

                <div
                  className={`max-w-[min(72rem,calc(100%-2.5rem))] overflow-hidden rounded-[1.15rem] px-3.5 py-3 sm:px-4 sm:py-3.5 ${
                    isUser
                      ? "bg-primary text-on-primary shadow-[0_16px_42px_rgba(17,17,17,0.16)]"
                      : "border border-hairline-soft bg-canvas text-slate shadow-[0_14px_44px_rgba(17,17,17,0.05)]"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap text-sm font-semibold leading-6">{message.content}</p>
                    ) : (
                      <>
                        {message.content ? <FormattedMessage content={message.content} citations={message.citations} /> : null}
                        {message.isStreaming && !message.content && (
                          <div className="flex items-center gap-1 py-2">
                            <span className="size-2 animate-bounce rounded-full bg-steel [animation-delay:0ms]" />
                            <span className="size-2 animate-bounce rounded-full bg-steel [animation-delay:150ms]" />
                            <span className="size-2 animate-bounce rounded-full bg-steel [animation-delay:300ms]" />
                          </div>
                        )}
                        {message.isStreaming && message.content && <StreamingCursor />}
                        {message.error && (
                          <p className="mt-3 rounded-xl bg-brand-coral/10 px-3 py-2 text-sm font-bold text-brand-coral">
                            {message.error}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {isUser && (
                  <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-ink">
                    <UserRound size={15} />
                  </div>
                )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-hairline-soft bg-white/82 p-2.5 sm:p-3">
        <div
          className={`flex items-end gap-2.5 rounded-[1rem] border bg-surface px-3 py-2.5 transition duration-200 ${
            hasProcessedDocs ? "border-hairline-soft focus-within:border-ink" : "border-hairline-soft opacity-60"
          }`}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasProcessedDocs ? "Ask question..." : "Process at least one document to enable chat"}
            disabled={!hasProcessedDocs || isLoading}
            rows={1}
          className="max-h-36 min-h-8 flex-1 resize-none overflow-y-auto bg-transparent py-1.5 text-sm font-semibold leading-6 text-ink outline-none placeholder:text-steel disabled:cursor-not-allowed"
        />

          {isLoading ? (
            <button
              type="button"
              onClick={stopStreaming}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-charcoal"
              title="Stop generating"
            >
              <Square size={15} fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              onClick={sendMessage}
              disabled={!input.trim() || !hasProcessedDocs}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-charcoal disabled:opacity-30"
              title="Send"
            >
              <Send size={17} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
