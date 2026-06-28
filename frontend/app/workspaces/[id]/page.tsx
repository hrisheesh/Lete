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
    let mounted = true;

    async function loadWorkspace() {
      await Promise.all([fetchWorkspace(), fetchDocuments()]);
      if (mounted) setLoading(false);
    }

    loadWorkspace();

    return () => {
      mounted = false;
    };
  }, [fetchDocuments, fetchWorkspace]);

  useEffect(() => {
    if (!documents.some((document) => document.status === "processing")) return;
    const interval = setInterval(fetchDocuments, 2000);
    return () => clearInterval(interval);
  }, [documents, fetchDocuments]);

  const handleDeleteDocument = async (docId: string) => {
    try {
      const res = await fetch(`${API_BASE}/documents/${docId}`, { method: "DELETE" });
      if (res.ok) fetchDocuments();
    } catch (e) {
      console.error(e);
    }
  };

  const handleProcessDocument = async (docId: string) => {
    if (isProcessing) return;
    setIsProcessing(docId);
    try {
      await fetch(`${API_BASE}/documents/${docId}/process`, { method: "POST" });
      fetchDocuments();
    } catch (e) {
      console.error(e);
      alert("An error occurred starting process");
    } finally {
      setIsProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1280px] px-5 py-12 text-sm font-semibold text-steel sm:px-8">
        Loading workspace...
      </div>
    );
  }

  if (!workspace) return null;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="mb-6 flex flex-col gap-5 lg:mb-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Link
            href="/workspaces"
            className="inline-flex items-center gap-2 rounded-full border border-hairline bg-canvas px-4 py-2 text-sm font-bold text-steel transition-colors hover:border-ink hover:text-ink"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <h1 className="mt-5 break-words text-3xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">{workspace.name}</h1>
          <p className="mt-3 text-sm font-semibold text-steel">
            {documents.length} documents · {processingCount} processing
          </p>
        </div>

        <div className="grid w-full grid-cols-2 rounded-full border border-hairline bg-canvas p-1 shadow-sm sm:inline-flex sm:w-auto">
          <button
            onClick={() => setActiveTab("documents")}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold transition-[background-color,color,transform] duration-200 ease-out hover:-translate-y-0.5 ${
              activeTab === "documents" ? "bg-primary text-on-primary" : "text-steel hover:bg-surface hover:text-ink"
            }`}
          >
            <FileText size={16} />
            Documents
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold transition-[background-color,color,transform] duration-200 ease-out hover:-translate-y-0.5 ${
              activeTab === "chat" ? "bg-primary text-on-primary" : "text-steel hover:bg-surface hover:text-ink"
            }`}
          >
            <MessageSquare size={16} />
            Chat
          </button>
        </div>
      </div>

      {activeTab === "documents" ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(300px,380px)_1fr] xl:items-start">
          <aside className="space-y-5">
            <FileUploadZone workspaceId={workspace.id} onUploadComplete={fetchDocuments} />
            <div className="rounded-[28px] border border-hairline-soft bg-canvas p-6">
              <p className="text-sm font-bold uppercase tracking-wide text-stone">Readiness</p>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-steel">Processed</span>
                  <span className="text-ink">
                    {documents.filter((document) => document.status === "processed").length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-steel">Pending</span>
                  <span className="text-ink">
                    {documents.filter((document) => document.status !== "processed").length}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          <section>
            {documents.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-hairline bg-surface p-12 text-center">
                <p className="text-lg font-bold text-ink">No documents yet</p>
                <p className="mt-2 text-sm font-medium text-steel">Upload files to build this workspace context.</p>
              </div>
            ) : (
              <DocumentList
                documents={documents}
                onDelete={handleDeleteDocument}
                onProcess={handleProcessDocument}
                onViewChunks={setSelectedChunkDocId}
              />
            )}
          </section>
        </div>
      ) : (
        <ChatPanel workspaceId={workspace.id} hasProcessedDocs={hasProcessedDocs} />
      )}

      {selectedChunkDocId && <ChunkPreviewModal documentId={selectedChunkDocId} onClose={() => setSelectedChunkDocId(null)} />}
    </div>
  );
}
