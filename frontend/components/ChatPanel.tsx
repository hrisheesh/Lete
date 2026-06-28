"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Bot, Send, Square, UserRound } from "lucide-react";
import mermaid from "mermaid";
import ReactMarkdown from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";

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

function CitationBadge({ citation }: { citation: Citation }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <span ref={ref} className="relative inline-block align-baseline">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mx-1 inline-flex size-5 translate-y-[-2px] items-center justify-center rounded-full bg-primary text-[10px] font-bold text-on-primary transition duration-200 ease-out hover:-translate-y-1 hover:bg-charcoal"
        title={`Source: ${citation.filename}`}
      >
        {citation.id.replace(/[\[\]]/g, "")}
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 z-50 mb-3 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl bg-primary p-4 text-left text-on-primary shadow-2xl">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-white/45">Source {citation.id}</div>
          <div className="mb-1 truncate text-sm font-bold text-white">{citation.filename}</div>
          {citation.contextual_header && (
            <div className="mb-2 truncate text-xs font-semibold text-white/50">{citation.contextual_header}</div>
          )}
          <div className="line-clamp-3 text-xs font-medium leading-5 text-white/70">{citation.text_preview}</div>
          <div className="absolute left-1/2 top-full size-3 -translate-x-1/2 rotate-45 bg-primary" />
        </div>
      )}
    </span>
  );
}

function getCitationMap(citations?: Citation[]) {
  const citationMap = new Map<string, Citation>();

  citations?.forEach((citation) => {
    const cleanId = citation.id.replace(/[\[\]]/g, "");
    citationMap.set(citation.id, citation);
    citationMap.set(cleanId, citation);
    citationMap.set(`[${cleanId}]`, citation);
  });

  return citationMap;
}

function InlineWithCitations({ children, citations }: { children: React.ReactNode; citations?: Citation[] }) {
  const citationMap = useMemo(() => getCitationMap(citations), [citations]);

  const renderNode = (node: React.ReactNode, keyPrefix: string): React.ReactNode => {
    if (typeof node === "string") {
      return node
        .split(/(\[\d+\]|\b\d+\b)/g)
        .filter(Boolean)
        .map((part, index) => {
          const citation = citationMap.get(part) ?? citationMap.get(part.replace(/[\[\]]/g, ""));
          if (citation) {
            return <CitationBadge key={`${keyPrefix}-citation-${part}-${index}`} citation={citation} />;
          }

          return <React.Fragment key={`${keyPrefix}-text-${index}`}>{part}</React.Fragment>;
        });
    }

    if (Array.isArray(node)) {
      return node.map((child, index) => renderNode(child, `${keyPrefix}-${index}`));
    }

    if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
      return React.cloneElement(node, {
        children: renderNode(node.props.children, `${keyPrefix}-child`),
      });
    }

    return node;
  };

  return <>{renderNode(children, "inline")}</>;
}

function MermaidDiagram({ chart }: { chart: string }) {
  const generatedId = useId();
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const id = `mermaid-${generatedId.replace(/:/g, "")}`;

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      themeVariables: {
        primaryColor: "#ffffff",
        primaryTextColor: "#161616",
        primaryBorderColor: "#ded8d0",
        lineColor: "#3f6df6",
        secondaryColor: "#f6f1ea",
        tertiaryColor: "#ff6b5f",
        fontFamily: "DM Sans, Inter, sans-serif",
      },
    });

    mermaid
      .render(id, chart)
      .then(({ svg: renderedSvg }) => {
        if (mounted) {
          setSvg(renderedSvg);
          setError("");
        }
      })
      .catch(() => {
        if (mounted) {
          setSvg("");
          setError("Unable to render Mermaid diagram. Check the diagram syntax.");
        }
      });

    return () => {
      mounted = false;
    };
  }, [chart, generatedId]);

  if (error) {
    return (
      <div className="rounded-2xl border border-brand-coral/25 bg-brand-coral/10 p-3 text-sm font-bold text-brand-coral">
        {error}
      </div>
    );
  }

  if (!svg) {
    return <div className="rounded-2xl border border-dashed border-hairline bg-white/70 p-4 text-sm font-bold text-steel">Rendering diagram...</div>;
  }

  return (
    <div className="internal-scroll overflow-x-auto rounded-2xl border border-hairline bg-white p-4">
      <div className="min-w-max [&_svg]:h-auto [&_svg]:max-w-none" dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}

const markdownSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ["className"]],
    input: [["type"], ["checked"], ["disabled"]],
  },
};

function FormattedMessage({ content, citations }: { content: string; citations?: Citation[] }) {
  return (
    <div className="chat-markdown text-sm font-medium leading-7 text-charcoal">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, markdownSchema]]}
        components={{
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-brand-blue-deep underline decoration-brand-blue-deep/25 underline-offset-4 transition hover:decoration-brand-blue-deep"
            >
              <InlineWithCitations citations={citations}>{children}</InlineWithCitations>
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-brand-blue bg-white/70 py-2 pl-4 pr-3 text-steel">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const language = /language-(\w+)/.exec(className || "")?.[1];
            const code = String(children).replace(/\n$/, "");

            if (language === "mermaid") {
              return <MermaidDiagram chart={code} />;
            }

            if (!className) {
              return <code className="rounded-md bg-surface px-1.5 py-0.5 text-[0.92em] font-bold text-ink">{children}</code>;
            }

            return (
              <pre className="internal-scroll my-4 overflow-x-auto rounded-2xl bg-primary p-4 text-xs leading-6 text-on-primary">
                <code className={className}>{code}</code>
              </pre>
            );
          },
          h1: ({ children }) => (
            <h3 className="mb-3 mt-5 text-xl font-bold leading-7 tracking-tight text-ink first:mt-0">
              <InlineWithCitations citations={citations}>{children}</InlineWithCitations>
            </h3>
          ),
          h2: ({ children }) => (
            <h3 className="mb-3 mt-5 border-b border-hairline-soft pb-2 text-lg font-bold leading-7 tracking-tight text-ink first:mt-0">
              <InlineWithCitations citations={citations}>{children}</InlineWithCitations>
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="mb-2 mt-4 text-base font-bold leading-6 tracking-tight text-ink first:mt-0">
              <InlineWithCitations citations={citations}>{children}</InlineWithCitations>
            </h4>
          ),
          hr: () => <hr className="my-5 border-hairline-soft" />,
          li: ({ children }) => (
            <li className="pl-1">
              <InlineWithCitations citations={citations}>{children}</InlineWithCitations>
            </li>
          ),
          ol: ({ children }) => <ol className="my-3 list-decimal space-y-2 pl-5 marker:font-bold marker:text-stone">{children}</ol>,
          p: ({ children }) => (
            <p className="my-3 first:mt-0 last:mb-0">
              <InlineWithCitations citations={citations}>{children}</InlineWithCitations>
            </p>
          ),
          table: ({ children }) => (
            <div className="internal-scroll my-4 overflow-x-auto rounded-2xl border border-hairline bg-white shadow-[0_14px_32px_rgba(38,31,27,0.05)]">
              <table className="w-full min-w-[36rem] border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          tbody: ({ children }) => <tbody className="divide-y divide-hairline-soft">{children}</tbody>,
          td: ({ children }) => (
            <td className="align-top px-4 py-3 text-charcoal">
              <InlineWithCitations citations={citations}>{children}</InlineWithCitations>
            </td>
          ),
          th: ({ children }) => (
            <th className="bg-surface px-4 py-3 text-xs font-bold uppercase tracking-wide text-stone">
              <InlineWithCitations citations={citations}>{children}</InlineWithCitations>
            </th>
          ),
          thead: ({ children }) => <thead>{children}</thead>,
          ul: ({ children }) => <ul className="my-3 list-disc space-y-2 pl-5 marker:text-stone">{children}</ul>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function StreamingCursor() {
  return <span className="ml-1 inline-block h-[1em] w-[2px] translate-y-[2px] animate-[blink_1s_step-end_infinite] bg-ink" />;
}

function EmptyState({ hasProcessedDocs }: { hasProcessedDocs: boolean }) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-5 py-12 text-center sm:px-6 sm:py-16">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary text-on-primary shadow-[0_16px_40px_rgba(17,17,17,0.18)]">
        <Bot size={29} />
      </div>
      <p className="mt-6 text-xl font-bold tracking-tight text-ink">Ask anything about documents</p>
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
    <div className="premium-panel flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[1.5rem]">
      <div className="flex shrink-0 items-center justify-between border-b border-hairline-soft bg-white/70 px-4 py-3 sm:px-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-stone">Grounded chat</p>
          <h2 className="mt-0.5 text-lg font-bold tracking-tight text-ink">Ask your workspace</h2>
        </div>
        <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-on-primary">
          {hasProcessedDocs ? "Ready" : "Needs docs"}
        </span>
      </div>

      <div className="internal-scroll min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
        {messages.length === 0 ? (
          <EmptyState hasProcessedDocs={hasProcessedDocs} />
        ) : (
          <div className="space-y-5">
            {messages.map((message, index) => {
              const isUser = message.role === "user";

              return (
                <div key={index} className={`animate-message-in flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser && (
                    <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                      <Bot size={18} />
                    </div>
                  )}

                  <div
                    className={`max-w-[min(48rem,calc(100%-3rem))] overflow-hidden rounded-[1.5rem] px-4 py-3 sm:px-5 sm:py-4 ${
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
                    <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-surface text-ink">
                      <UserRound size={17} />
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-hairline-soft bg-white/80 p-3 sm:p-4">
        <div
          className={`flex items-end gap-3 rounded-[1.25rem] border bg-surface px-3 py-3 transition duration-200 ${
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
            className="max-h-40 min-h-9 flex-1 resize-none overflow-y-auto bg-transparent py-2 text-sm font-semibold leading-6 text-ink outline-none placeholder:text-steel disabled:cursor-not-allowed"
          />

          {isLoading ? (
            <button
              type="button"
              onClick={stopStreaming}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-charcoal"
              title="Stop generating"
            >
              <Square size={15} fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              onClick={sendMessage}
              disabled={!input.trim() || !hasProcessedDocs}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-charcoal disabled:opacity-30"
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
