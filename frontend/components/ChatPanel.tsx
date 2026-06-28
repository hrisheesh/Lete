"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

type MarkdownBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "code"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

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
        onClick={() => setOpen((value) => !value)}
        className="mx-1 inline-flex size-5 translate-y-[-2px] items-center justify-center rounded-full bg-primary text-[10px] font-bold text-on-primary transition-[background-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:bg-charcoal"
        title={`Source: ${citation.filename}`}
      >
        {citation.id.replace(/[\[\]]/g, "")}
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 z-50 mb-3 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl bg-primary p-4 text-left text-on-primary shadow-2xl">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-white/45">Source {citation.id}</div>
          <div className="mb-1 truncate text-sm font-bold text-white">{citation.filename}</div>
          {citation.contextual_header && (
            <div className="mb-2 truncate text-xs font-medium text-white/50">{citation.contextual_header}</div>
          )}
          <div className="line-clamp-3 text-xs font-medium leading-5 text-white/70">{citation.text_preview}</div>
          <div className="absolute left-1/2 top-full size-3 -translate-x-1/2 rotate-45 bg-primary" />
        </div>
      )}
    </span>
  );
}

function renderInlineText(text: string, citations?: Citation[]) {
  if (!citations || citations.length === 0) return text;

  const citationMap = new Map(citations.map((citation) => [citation.id, citation]));
  return text.split(/(\[\d+\])/g).map((part, index) => {
    const citation = citationMap.get(part);
    if (citation) return <CitationBadge key={`${part}-${index}`} citation={citation} />;
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let orderedList = false;
  let codeLines: string[] = [];
  let inCode = false;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ type: "paragraph", text: paragraph.join(" ").trim() });
    paragraph = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push({ type: "list", ordered: orderedList, items: listItems });
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCode) {
        blocks.push({ type: "code", text: codeLines.join("\n") });
        codeLines = [];
        inCode = false;
      } else {
        flushParagraph();
        flushList();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", text: heading[1] });
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (bullet || numbered) {
      flushParagraph();
      const nextOrdered = Boolean(numbered);
      if (listItems.length > 0 && nextOrdered !== orderedList) flushList();
      orderedList = nextOrdered;
      listItems.push((bullet?.[1] ?? numbered?.[1] ?? "").trim());
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  if (inCode) blocks.push({ type: "code", text: codeLines.join("\n") });
  flushParagraph();
  flushList();

  return blocks;
}

function MessageContent({ content, citations }: { content: string; citations?: Citation[] }) {
  const blocks = parseMarkdownBlocks(content);

  if (blocks.length === 0) return null;

  return (
    <div className="message-format">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h4 key={index} className="text-[15px] font-bold leading-6 text-ink">
              {renderInlineText(block.text, citations)}
            </h4>
          );
        }

        if (block.type === "code") {
          return (
            <pre key={index} className="overflow-x-auto rounded-xl bg-primary px-4 py-3 text-xs leading-5 text-on-primary">
              <code>{block.text}</code>
            </pre>
          );
        }

        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag key={index} className={block.ordered ? "list-decimal space-y-1 pl-5" : "list-disc space-y-1 pl-5"}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInlineText(item, citations)}</li>
              ))}
            </ListTag>
          );
        }

        return <p key={index}>{renderInlineText(block.text, citations)}</p>;
      })}
    </div>
  );
}

function StreamingCursor() {
  return <span className="ml-1 inline-block h-[1em] w-[2px] translate-y-[2px] animate-[blink_1s_step-end_infinite] bg-ink" />;
}

function EmptyState({ hasProcessedDocs }: { hasProcessedDocs: boolean }) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-5 py-12 text-center sm:px-6 sm:py-16">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary text-on-primary sm:size-16">
        <Bot size={28} />
      </div>
      <p className="mt-5 text-lg font-bold tracking-tight text-ink sm:mt-6">Ask anything about documents</p>
      <p className="mt-2 max-w-sm text-sm font-medium leading-6 text-steel">
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
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let citations: Citation[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          const data = line.slice(6);
          if (data === "{}") continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.citations) {
              citations = parsed.citations;
              setMessages((prev) => {
                const next = [...prev];
                const last = { ...next[next.length - 1], citations };
                next[next.length - 1] = last;
                return next;
              });
            }

            if (parsed.text) {
              setMessages((prev) => {
                const next = [...prev];
                const last = { ...next[next.length - 1] };
                last.content += parsed.text;
                next[next.length - 1] = last;
                return next;
              });
            }
          } catch {
            continue;
          }
        }
      }

      setMessages((prev) => {
        const next = [...prev];
        const last = { ...next[next.length - 1], isStreaming: false };
        next[next.length - 1] = last;
        return next;
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;

      setMessages((prev) => {
        const next = [...prev];
        const last = {
          ...next[next.length - 1],
          isStreaming: false,
          error: getErrorMessage(error),
          content: "I could not complete that answer.",
        };
        next[next.length - 1] = last;
        return next;
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [hasProcessedDocs, input, isLoading, workspaceId]);

  const stopGeneration = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex min-h-[620px] overflow-hidden rounded-[28px] border border-hairline-soft bg-canvas shadow-[0_18px_60px_rgba(10,10,10,0.05)] lg:h-[calc(100vh-180px)] lg:min-h-[560px]">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-hairline-soft bg-surface px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-stone">Workspace chat</p>
            <h3 className="mt-1 truncate text-lg font-bold tracking-tight text-ink">Grounded answers</h3>
          </div>
          <span className="shrink-0 rounded-full bg-canvas px-3 py-1 text-xs font-bold text-steel">
            {hasProcessedDocs ? "Ready" : "Needs documents"}
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-surface/35 px-3 py-4 sm:px-5 sm:py-6">
          {messages.length === 0 ? (
            <EmptyState hasProcessedDocs={hasProcessedDocs} />
          ) : (
            <div className="space-y-4 sm:space-y-5">
              {messages.map((message, index) => {
                const isUser = message.role === "user";

                return (
                  <div
                    key={index}
                    className={`flex animate-[messageIn_220ms_ease-out] gap-2 sm:gap-3 ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isUser && (
                      <span className="mt-1 hidden size-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary sm:flex">
                        <Bot size={17} />
                      </span>
                    )}
                    <div
                      className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm font-medium leading-7 sm:max-w-[82%] md:max-w-[76%] ${
                        isUser
                          ? "bg-primary text-on-primary"
                          : "border border-hairline-soft bg-canvas text-slate shadow-sm"
                      }`}
                    >
                      <MessageContent content={message.content} citations={message.citations} />
                      {message.isStreaming && <StreamingCursor />}
                      {message.error && <div className="mt-2 text-xs font-bold text-brand-coral">{message.error}</div>}
                    </div>
                    {isUser && (
                      <span className="mt-1 hidden size-9 shrink-0 items-center justify-center rounded-full bg-surface text-steel sm:flex">
                        <UserRound size={17} />
                      </span>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-hairline-soft bg-canvas p-3 sm:p-4">
          <div className="flex items-end gap-2 rounded-[22px] border border-hairline bg-surface p-2 transition-colors duration-200 ease-out focus-within:border-brand-blue-deep sm:gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!hasProcessedDocs || isLoading}
              placeholder={hasProcessedDocs ? "Ask about your documents..." : "Process a document to enable chat"}
              rows={1}
              className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-2 text-base font-medium leading-6 text-ink outline-none placeholder:text-stone disabled:cursor-not-allowed sm:text-sm"
            />

            {isLoading ? (
              <button
                onClick={stopGeneration}
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-[background-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:bg-charcoal sm:size-10"
                aria-label="Stop generation"
              >
                <Square size={16} />
              </button>
            ) : (
              <button
                onClick={sendMessage}
                disabled={!input.trim() || !hasProcessedDocs}
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-[background-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:bg-charcoal disabled:cursor-not-allowed disabled:bg-hairline disabled:text-muted disabled:hover:translate-y-0 sm:size-10"
                aria-label="Send message"
              >
                <Send size={17} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
