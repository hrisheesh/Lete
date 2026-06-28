"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, MessageSquare, Pencil, Trash2, Check, X } from "lucide-react";
import FileUploadZone from "@/components/FileUploadZone";
import DocumentList from "@/components/DocumentList";
import ChunkPreviewModal from "@/components/ChunkPreviewModal";
import ChatList from "@/components/ChatList";

const API_BASE = "http://127.0.0.1:8000/api/v1";

interface Workspace {
  id: string;
  name: string;
}

interface Document {
  id: string;
  filename: string;
  file_size: number;
  status: string;
  created_at: string;
}

type ActiveTab = "documents" | "chat";

export default function WorkspaceDashboard() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChunkDocId, setSelectedChunkDocId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("chat");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");

  const hasProcessedDocs = documents.some((document) => document.status === "processed");
  const processingCount = documents.filter((document) => document.status === "processing").length;

  const fetchWorkspace = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/workspaces/${id}`);
      if (res.ok) {
        const ws = await res.json();
        setWorkspace(ws);
        setEditName(ws.name);
      } else {
        router.push("/workspaces");
      }
    } catch (e) {
      console.error(e);
    }
  }, [id, router]);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/workspaces/${id}/documents`);
      if (res.ok) setDocuments(await res.json());
    } catch (e) {
      console.error(e);
    }
  }, [id]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([fetchWorkspace(), fetchDocuments()]);
      setLoading(false);
    }

    load();
  }, [fetchWorkspace, fetchDocuments]);

  const handleDelete = async (docId: string) => {
    if (!confirm("Delete this document?")) return;
    await fetch(`${API_BASE}/documents/${docId}`, { method: "DELETE" });
    setDocuments((docs) => docs.filter((doc) => doc.id !== docId));
  };

  const handleDeleteWorkspace = async () => {
    if (!confirm("Are you sure you want to delete this workspace forever? This will delete all documents and chat history.")) return;
    try {
      const res = await fetch(`${API_BASE}/workspaces/${id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        router.push("/workspaces");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRenameWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !workspace) return;
    try {
      const res = await fetch(`${API_BASE}/workspaces/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      if (res.ok) {
        const updated = await res.json();
        setWorkspace(updated);
        setIsEditing(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleProcess = async (docId: string) => {
    setIsProcessing(docId);
    try {
      const res = await fetch(`${API_BASE}/documents/${docId}/process`, { method: "POST" });
      if (!res.ok) return;

      // Poll until status leaves the processing state
      const poll = async () => {
        await fetchDocuments();
        const updated = await fetch(`${API_BASE}/workspaces/${id}/documents`);
        if (!updated.ok) return;
        const docs: Document[] = await updated.json();
        setDocuments(docs);
        const doc = docs.find((d) => d.id === docId);
        if (doc && (doc.status === "processing" || doc.status === "embedding" || doc.status === "chunking" || doc.status === "parsing")) {
          setTimeout(poll, 1500);
        } else {
          setIsProcessing(null);
        }
      };
      setTimeout(poll, 1000);
    } catch (e) {
      console.error(e);
      setIsProcessing(null);
    }
  };

  if (loading || !workspace) {
    return (
      <main className="app-screen">
        <div className="mx-auto flex h-full max-w-[1320px] items-center justify-center">
          <div className="premium-panel rounded-[1.5rem] px-5 py-4 text-sm font-bold text-steel">Loading workspace...</div>
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
              href="/workspaces"
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-hairline bg-canvas text-steel transition duration-200 ease-out hover:border-ink hover:text-ink"
              aria-label="Back to workspaces"
            >
              <ArrowLeft size={17} />
            </Link>
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <form onSubmit={handleRenameWorkspace} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 rounded-lg border border-black/10 bg-white px-2 py-0.5 text-lg font-bold tracking-tight text-ink outline-none focus:border-brand-blue sm:text-xl"
                    autoFocus
                  />
                  <button type="submit" className="flex size-7 shrink-0 items-center justify-center rounded bg-brand-blue text-white hover:bg-brand-blue/90">
                    <Check size={14} />
                  </button>
                  <button type="button" onClick={() => { setIsEditing(false); setEditName(workspace.name); }} className="flex size-7 shrink-0 items-center justify-center rounded bg-surface text-steel hover:bg-black/5">
                    <X size={14} />
                  </button>
                </form>
              ) : (
                <div className="group flex items-center gap-2">
                  <h1 className="truncate text-lg font-bold leading-tight tracking-tight text-ink sm:text-xl">{workspace.name}</h1>
                  <button onClick={() => setIsEditing(true)} className="opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-steel hover:text-ink">
                    <Pencil size={14} />
                  </button>
                </div>
              )}
              <p className="mt-0.5 flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-stone">
                <span>{documents.length} documents</span>
                {processingCount > 0 && <span className="text-brand-coral">{processingCount} processing</span>}
                <button onClick={handleDeleteWorkspace} className="flex items-center gap-1 text-red-500 hover:text-red-700 transition">
                  <Trash2 size={12} /> Delete Workspace
                </button>
              </p>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 rounded-full border border-hairline bg-canvas p-0.5 shadow-[0_12px_36px_rgba(17,17,17,0.06)] sm:w-auto">
            <button
              onClick={() => setActiveTab("documents")}
              className={`inline-flex h-9 items-center justify-center gap-2 rounded-full px-3 text-sm font-bold transition duration-200 ease-out ${
                activeTab === "documents" ? "bg-primary text-on-primary" : "text-steel hover:bg-surface hover:text-ink"
              }`}
            >
              <FileText size={16} />
              Documents
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`inline-flex h-9 items-center justify-center gap-2 rounded-full px-3 text-sm font-bold transition duration-200 ease-out ${
                activeTab === "chat" ? "bg-primary text-on-primary" : "text-steel hover:bg-surface hover:text-ink"
              }`}
            >
              <MessageSquare size={16} />
              Chat
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-2 xl:grid-cols-[minmax(14.75rem,17rem)_minmax(0,1fr)] 2xl:grid-cols-[16rem_minmax(0,1fr)]">
          <section className={`${activeTab === "documents" ? "flex" : "hidden xl:flex"} min-h-0 min-w-0 flex-col gap-2`}>
            <FileUploadZone workspaceId={id} onUploadComplete={fetchDocuments} />
            {documents.length === 0 ? (
              <div className="soft-panel flex min-h-0 flex-1 items-center justify-center rounded-[1.5rem] p-6 text-center">
                <div>
                  <p className="text-xl font-bold tracking-tight text-ink">No documents yet</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-steel">Upload a file to begin indexing this workspace.</p>
                </div>
              </div>
            ) : (
              <DocumentList
                documents={documents}
                onDelete={handleDelete}
                onProcess={handleProcess}
                onViewChunks={setSelectedChunkDocId}
                processingId={isProcessing}
              />
            )}
          </section>

          <section className={`${activeTab === "chat" ? "block" : "hidden"} min-h-0 min-w-0 flex-1 overflow-y-auto`}>
            <ChatList workspaceId={id} />
          </section>
        </div>
      </section>

      {selectedChunkDocId && <ChunkPreviewModal documentId={selectedChunkDocId} onClose={() => setSelectedChunkDocId(null)} />}
    </main>
  );
}
