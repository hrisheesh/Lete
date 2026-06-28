"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChunkDocId, setSelectedChunkDocId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("documents");

  const hasProcessedDocs = documents.some((d) => d.status === "processed");

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
      if (res.ok) {
        setDocuments(await res.json());
      }
    } catch (e: any) {
      if (e.name !== "TypeError" || e.message !== "Failed to fetch") {
        console.error(e);
      }
    }
  }, [id]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchWorkspace();
      await fetchDocuments();
      setLoading(false);
    };
    load();
  }, [id, fetchWorkspace, fetchDocuments]);

  // Poll while any doc is processing
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === "processing");
    if (!hasProcessing) return;
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
      alert("An error occurred starting the process");
    } finally {
      setIsProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto px-8 py-12 text-steel text-[14px]">
        Loading…
      </div>
    );
  }

  if (!workspace) return null;

  return (
    <div className="max-w-[1280px] mx-auto px-8 py-10">
      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/workspaces"
          className="text-steel hover:text-ink transition-colors text-[13px] font-medium"
        >
          ← Back
        </Link>
        <h2 className="text-2xl font-bold text-ink tracking-tight">{workspace.name}</h2>
      </div>

      {/* ── Two-column layout ── */}
      <div className="flex gap-8 items-start">
        {/* ── LEFT: Documents panel ── */}
        <div className="w-[420px] flex-shrink-0 space-y-6">
          <FileUploadZone
            workspaceId={workspace.id}
            onUploadComplete={fetchDocuments}
          />

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-ink">Documents</h3>
              <span className="text-[12px] text-steel">{documents.length} file{documents.length !== 1 ? "s" : ""}</span>
            </div>

            {documents.length === 0 ? (
              <div className="text-steel bg-surface border border-hairline-soft rounded-2xl p-6 text-center text-[13px]">
                No documents uploaded yet.
              </div>
            ) : (
              <DocumentList
                documents={documents.map((d) => ({
                  ...d,
                  status: isProcessing === d.id ? "processing" : d.status,
                }))}
                onDelete={handleDeleteDocument}
                onProcess={handleProcessDocument}
                onViewChunks={setSelectedChunkDocId}
              />
            )}
          </div>
        </div>

        {/* ── RIGHT: Chat panel ── */}
        <div className="flex-1 min-w-0" style={{ height: "calc(100vh - 220px)", minHeight: "560px" }}>
          <ChatPanel
            workspaceId={workspace.id}
            hasProcessedDocs={hasProcessedDocs}
          />
        </div>
      </div>

      {/* ── Chunk Preview Modal ── */}
      {selectedChunkDocId && (
        <ChunkPreviewModal
          documentId={selectedChunkDocId}
          onClose={() => setSelectedChunkDocId(null)}
        />
      )}
    </div>
  );
}
