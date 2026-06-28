import { useEffect, useState } from "react";
import { Plus, MessageSquare, Trash2, Pencil, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

const API_BASE = "http://127.0.0.1:8000/api/v1";

type Chat = {
  id: string;
  name: string;
  created_at: string;
};

interface ChatListProps {
  workspaceId: string;
  onSelectChat: (chatId: string) => void;
}

export default function ChatList({ workspaceId, onSelectChat }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
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
        setChats(chats.filter((c) => c.id !== chatId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRenameChat = async (e: React.FormEvent, chatId: string) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditingChatId(null);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/chats/${chatId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (res.ok) {
        const updatedChat = await res.json();
        setChats(chats.map((c) => (c.id === chatId ? updatedChat : c)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEditingChatId(null);
    }
  };

  const startEditing = (e: React.MouseEvent, chat: Chat) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditName(chat.name);
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] flex-1 items-center justify-center">
        <p className="text-sm font-medium tracking-wide text-steel animate-pulse">Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-2 lg:p-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Conversations</h2>
          <p className="mt-1 text-sm font-medium text-steel">Pick up where you left off or start a new thread.</p>
        </div>
        <button
          onClick={handleNewChat}
          className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-canvas shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:scale-[1.02] transition-all"
        >
          <Plus size={18} /> New Chat
        </button>
      </div>

      {chats.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-hairline bg-surface/30 p-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-surface text-steel mb-4">
            <MessageSquare size={24} />
          </div>
          <p className="text-lg font-bold tracking-tight text-ink">No conversations yet</p>
          <p className="mt-1 max-w-sm text-sm font-medium text-steel">Start a new chat to begin interacting with your workspace documents.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => {
                if (editingChatId !== chat.id) {
                  onSelectChat(chat.id);
                }
              }}
              className="group relative flex cursor-pointer flex-col justify-between rounded-[1.25rem] border border-hairline bg-canvas p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-steel/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-steel transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                    <MessageSquare size={14} />
                  </div>
                  
                  {editingChatId === chat.id ? (
                    <form onSubmit={(e) => handleRenameChat(e, chat.id)} className="flex w-full items-center gap-2" onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full min-w-0 rounded-md border border-hairline bg-surface px-2 py-1 text-sm font-bold text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      <div className="flex gap-1 shrink-0">
                        <button type="submit" className="rounded p-1 text-green-600 hover:bg-green-50 transition-colors">
                          <Check size={14} />
                        </button>
                        <button type="button" onClick={() => setEditingChatId(null)} className="rounded p-1 text-steel hover:bg-surface transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <h3 className="truncate text-base font-bold text-ink leading-snug">{chat.name}</h3>
                  )}
                </div>
                
                {editingChatId !== chat.id && (
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <button
                      onClick={(e) => startEditing(e, chat)}
                      className="rounded-full p-1.5 text-steel hover:bg-surface hover:text-ink transition-colors"
                      title="Rename chat"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      className="rounded-full p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete chat"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-5 flex items-center gap-2 text-xs font-semibold tracking-wide text-stone uppercase">
                <span>{new Date(chat.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
