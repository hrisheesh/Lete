import { useEffect, useState } from "react";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

const API_BASE = "http://127.0.0.1:8000/api/v1";

type Chat = {
  id: string;
  name: string;
  created_at: string;
};

interface ChatListProps {
  workspaceId: string;
}

export default function ChatList({ workspaceId }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchChats();
  }, [workspaceId]);

  const fetchChats = async () => {
    try {
      const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/chats`);
      if (res.ok) {
        setChats(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Chat" }),
      });
      if (res.ok) {
        const newChat = await res.json();
        router.push(`/workspaces/${workspaceId}/chats/${newChat.id}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (!confirm("Delete this chat?")) return;
    try {
      const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/chats/${chatId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setChats(chats.filter((c) => c.id !== chatId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="soft-panel flex min-h-0 flex-1 items-center justify-center rounded-[1.5rem] p-6 text-center">
        <p className="text-sm font-semibold leading-6 text-steel">Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-ink">Chat Sessions</h2>
          <p className="text-sm text-steel">Pick up where you left off or start a new thread.</p>
        </div>
        <button
          onClick={handleNewChat}
          className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-bold text-canvas transition-opacity hover:opacity-90"
        >
          <Plus size={16} /> New Chat
        </button>
      </div>

      {chats.length === 0 ? (
        <div className="soft-panel flex min-h-0 flex-1 items-center justify-center rounded-[1.5rem] p-6 text-center">
          <div>
            <p className="text-xl font-bold tracking-tight text-ink">No chats yet</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-steel">Create a new chat to start exploring your workspace.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => router.push(`/workspaces/${workspaceId}/chats/${chat.id}`)}
              className="group relative flex cursor-pointer flex-col justify-between rounded-[1rem] border border-hairline bg-canvas p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-ink hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-ink">
                    <MessageSquare size={14} />
                  </div>
                  <h3 className="truncate font-bold text-ink">{chat.name}</h3>
                </div>
                <button
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  className="opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="mt-4 text-[11px] font-semibold tracking-wide text-stone uppercase">
                {new Date(chat.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
