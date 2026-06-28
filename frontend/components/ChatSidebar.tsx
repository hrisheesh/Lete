import { useEffect, useState } from "react";
import { Plus, MessageSquare, Trash2 } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000/api/v1";

type Chat = {
  id: string;
  name: string;
  created_at: string;
};

interface ChatSidebarProps {
  workspaceId: string;
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

export default function ChatSidebar({ workspaceId, activeChatId, onSelectChat }: ChatSidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChats();
  }, [workspaceId]);

  const fetchChats = async () => {
    try {
      const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/chats`);
      if (res.ok) {
        const data = await res.json();
        setChats(data);
        if (data.length > 0 && !activeChatId) {
          onSelectChat(data[0].id);
        } else if (data.length === 0) {
          handleNewChat();
        }
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
        setChats([newChat, ...chats]);
        onSelectChat(newChat.id);
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
        const remaining = chats.filter((c) => c.id !== chatId);
        setChats(remaining);
        if (activeChatId === chatId) {
          onSelectChat(remaining.length > 0 ? remaining[0].id : "");
        }
        if (remaining.length === 0) {
          handleNewChat();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="w-64 border-r border-hairline bg-canvas p-4 text-sm text-stone font-medium">Loading chats...</div>;
  }

  return (
    <div className="flex w-64 flex-col border-r border-hairline bg-canvas/50">
      <div className="p-3">
        <button
          onClick={handleNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink py-2 text-sm font-bold text-canvas transition-opacity hover:opacity-90"
        >
          <Plus size={16} /> New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 pt-0">
        <div className="flex flex-col gap-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`group relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                activeChatId === chat.id ? "bg-surface text-ink shadow-sm" : "text-steel hover:bg-black/5 hover:text-ink"
              }`}
            >
              <MessageSquare size={16} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold leading-tight">{chat.name}</div>
                <div className="text-[10px] font-semibold tracking-wide text-stone uppercase mt-0.5">
                  {new Date(chat.created_at).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={(e) => handleDeleteChat(e, chat.id)}
                className="opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
