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

  const handleProcess = async (docId: string) => {
    setIsProcessing(docId);
    try {
      const res = await fetch(`${API_BASE}/documents/${docId}/process`, { method: "POST" });
      if (res.ok) {
        await fetchDocuments();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      const res = await fetch(`${API_BASE}/documents/${docId}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-[1320px] px-4 py-12 text-sm font-bold text-steel sm:px-6 lg:px-8">Loading workspace...</div>;
  }

  if (!workspace) return null;

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-5 flex flex-col gap-4 lg:mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Link
            href="/workspaces"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-hairline bg-canvas px-4 text-sm font-bold text-steel transition duration-200 ease-out hover:border-ink hover:text-ink"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <h1 className="mt-5 break-words text-4xl font-bold leading-tight tracking-tight text-ink sm:text-6xl">{workspace.name}</h1>
          <p className="mt-2 text-sm font-bold text-steel">
            {documents.length} documents / {processingCount} processing
          </p>
        </div>

        <div className="grid w-full grid-cols-2 rounded-full border border-hairline bg-canvas p-1 shadow-[0_12px_36px_rgba(17,17,17,0.06)] sm:inline-grid sm:w-auto">
          <button
            onClick={() => setActiveTab("documents")}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold transition duration-200 ease-out hover:-translate-y-0.5 ${
              activeTab === "documents" ? "bg-primary text-on-primary" : "text-steel hover:bg-surface hover:text-ink"
            }`}
          >
            <FileText size={16} />
            Documents
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold transition duration-200 ease-out hover:-translate-y-0.5 ${
              activeTab === "chat" ? "bg-primary text-on-primary" : "text-steel hover:bg-surface hover:text-ink"
            }`}
          >
            <MessageSquare size={16} />
            Chat
          </button>
        </div>
      </div>

      <section className="grid gap-5 xl:grid-cols-[minmax(22rem,0.82fr)_minmax(0,1.18fr)]">
        <div className={`${activeTab === "documents" ? "block" : "hidden xl:block"} space-y-5`}>
          <FileUploadZone workspaceId={id} onUploadComplete={fetchDocuments} />
          <DocumentList
            documents={documents}
            onDelete={handleDelete}
            onProcess={handleProcess}
            onViewChunks={setSelectedChunkDocId}
            processingId={isProcessing}
          />
        </div>

        <div className={`${activeTab === "chat" ? "block" : "hidden xl:block"} min-h-[calc(100svh-13rem)]`}>
          <ChatPanel workspaceId={id} hasProcessedDocs={hasProcessedDocs} />
        </div>
      </section>

      {selectedChunkDocId && <ChunkPreviewModal documentId={selectedChunkDocId} onClose={() => setSelectedChunkDocId(null)} />}
    </div>
  );
}
