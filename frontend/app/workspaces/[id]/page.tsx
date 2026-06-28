"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, MessageSquare } from "lucide-react";
import FileUploadZone from "@/components/FileUploadZone";
import DocumentList from "@/components/DocumentList";
import ChunkPreviewModal from "@/components/ChunkPreviewModal";
import ChatPanel from "@/components/ChatPanel";

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
  const [activeTab, setActiveTab] = useState<ActiveTab>("documents");

  const hasProcessedDocs = documents.some((document) => document.status === "processed");
  const processingCount = documents.filter((document) => document.status === "processing").length;

  const fetchWorkspace = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/workspaces/${id}`);
      if (res.ok) {
        setWorkspace(await res.json());
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

  const handleProcess = async (docId: string) => {
    setIsProcessing(docId);
    try {
      const res = await fetch(`${API_BASE}/documents/${docId}/process`, { method: "POST" });
      if (res.ok) await fetchDocuments();
    } catch (e) {
      console.error(e);
    } finally {
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
      <section className="mx-auto flex h-full max-w-[1440px] min-h-0 flex-col gap-3">
        <div className="premium-panel flex shrink-0 flex-col gap-3 rounded-[1.5rem] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/workspaces"
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-hairline bg-canvas text-steel transition duration-200 ease-out hover:border-ink hover:text-ink"
              aria-label="Back to workspaces"
            >
              <ArrowLeft size={17} />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">{workspace.name}</h1>
              <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-stone">
                {documents.length} documents / {processingCount} processing
              </p>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 rounded-full border border-hairline bg-canvas p-1 shadow-[0_12px_36px_rgba(17,17,17,0.06)] sm:w-auto">
            <button
              onClick={() => setActiveTab("documents")}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold transition duration-200 ease-out ${
                activeTab === "documents" ? "bg-primary text-on-primary" : "text-steel hover:bg-surface hover:text-ink"
              }`}
            >
              <FileText size={16} />
              Documents
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold transition duration-200 ease-out ${
                activeTab === "chat" ? "bg-primary text-on-primary" : "text-steel hover:bg-surface hover:text-ink"
              }`}
            >
              <MessageSquare size={16} />
              Chat
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(21rem,0.82fr)_minmax(0,1.18fr)]">
          <section className={`${activeTab === "documents" ? "flex" : "hidden xl:flex"} min-h-0 flex-col gap-3`}>
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

          <section className={`${activeTab === "chat" ? "flex" : "hidden xl:flex"} min-h-0`}>
            <ChatPanel workspaceId={id} hasProcessedDocs={hasProcessedDocs} />
          </section>
        </div>
      </section>

      {selectedChunkDocId && <ChunkPreviewModal documentId={selectedChunkDocId} onClose={() => setSelectedChunkDocId(null)} />}
    </main>
  );
}
