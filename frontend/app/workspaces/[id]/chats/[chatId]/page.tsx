"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ChatPanel from "@/components/ChatPanel";

const API_BASE = "http://127.0.0.1:8000/api/v1";

interface Chat {
  id: string;
  name: string;
  created_at: string;
}

interface Workspace {
  id: string;
  name: string;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.id as string;
  const chatId = params?.chatId as string;

  const [chat, setChat] = useState<Chat | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [hasProcessedDocs, setHasProcessedDocs] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId || !chatId) return;

    const fetchData = async () => {
      try {
        const [wsRes, docsRes, chatsRes] = await Promise.all([
          fetch(`${API_BASE}/workspaces/${workspaceId}`),
          fetch(`${API_BASE}/workspaces/${workspaceId}/documents`),
          fetch(`${API_BASE}/workspaces/${workspaceId}/chats`),
        ]);

        if (wsRes.ok) setWorkspace(await wsRes.json());
        if (docsRes.ok) {
          const docs = await docsRes.json();
          setHasProcessedDocs(docs.some((d: any) => d.status === "processed"));
        }
        if (chatsRes.ok) {
          const chats: Chat[] = await chatsRes.json();
          const currentChat = chats.find(c => c.id === chatId);
          if (currentChat) {
            setChat(currentChat);
          } else {
            router.push(`/workspaces/${workspaceId}`);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [workspaceId, chatId, router]);

  if (loading || !workspace || !chat) {
    return (
      <main className="app-screen">
        <div className="mx-auto flex h-full max-w-[1320px] items-center justify-center">
          <div className="premium-panel rounded-[1.5rem] px-5 py-4 text-sm font-bold text-steel">Loading chat...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-screen">
      <section className="mx-auto flex h-full min-h-0 w-full max-w-[1680px] flex-col gap-2">
        <div className="premium-panel flex shrink-0 flex-col gap-2 rounded-[1.05rem] p-2 sm:flex-row sm:items-center sm:justify-between sm:px-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={`/workspaces/${workspaceId}`}
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-hairline bg-canvas text-steel transition duration-200 ease-out hover:border-ink hover:text-ink"
              aria-label="Back to workspace"
            >
              <ArrowLeft size={17} />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold leading-tight tracking-tight text-ink sm:text-xl">
                {chat.name}
              </h1>
              <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-stone">
                {workspace.name} • {new Date(chat.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <section className="flex min-h-0 min-w-0 flex-1">
          <ChatPanel workspaceId={workspaceId} chatId={chatId} hasProcessedDocs={hasProcessedDocs} />
        </section>
      </section>
    </main>
  );
}
