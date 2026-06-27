"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import FileUploadZone from "@/components/FileUploadZone";
import DocumentList from "@/components/DocumentList";
import ChunkPreviewModal from "@/components/ChunkPreviewModal";

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

export default function WorkspaceDashboard() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChunkDocId, setSelectedChunkDocId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const fetchWorkspace = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/workspaces/${id}`);
      if (res.ok) {
        setWorkspace(await res.json());
      } else {
        router.push("/workspaces");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/workspaces/${id}/documents`);
      if (res.ok) {
        setDocuments(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await fetchWorkspace();
    await fetchDocuments();
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDeleteDocument = async (docId: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/documents/${docId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchDocuments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleProcessDocument = async (docId: string) => {
    if (isProcessing) return;
    setIsProcessing(docId);
    try {
      // Step 1: Process raw text
      const processRes = await fetch(`http://127.0.0.1:8000/api/v1/documents/${docId}/process`, {
        method: "POST"
      });
      
      if (!processRes.ok) {
        alert("Failed to extract text from document");
        return;
      }
      
      // Step 2: Chunk the extracted text
      const chunkRes = await fetch(`http://127.0.0.1:8000/api/v1/documents/${docId}/chunk`, {
        method: "POST"
      });
      
      if (!chunkRes.ok) {
        alert("Failed to chunk document text");
        return;
      }
      
      alert("Document successfully processed and chunked!");
      fetchDocuments();
    } catch (e) {
      console.error(e);
      alert("An error occurred during processing");
    } finally {
      setIsProcessing(null);
    }
  };

  if (loading) {
    return <div className="max-w-[1000px] mx-auto px-8 py-12 text-steel">Loading...</div>;
  }

  if (!workspace) return null;

  return (
    <div className="max-w-[1000px] mx-auto px-8 py-12 relative">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/workspaces" className="text-steel hover:text-ink transition-colors">
          &larr; Back
        </Link>
        <h2 className="text-3xl font-bold text-ink tracking-tight">{workspace.name}</h2>
      </div>

      <FileUploadZone 
        workspaceId={workspace.id} 
        onUploadComplete={fetchDocuments} 
      />

      <div className="mt-12">
        <h3 className="text-xl font-bold text-ink mb-6">Documents</h3>
        {documents.length === 0 ? (
          <div className="text-steel bg-surface border border-hairline-soft rounded-2xl p-8 text-center">
            No documents uploaded yet.
          </div>
        ) : (
          <DocumentList 
            documents={documents.map(d => ({
              ...d, 
              status: isProcessing === d.id ? 'Processing...' : d.status 
            }))} 
            onDelete={handleDeleteDocument} 
            onProcess={handleProcessDocument}
            onViewChunks={setSelectedChunkDocId}
          />
        )}
      </div>

      {selectedChunkDocId && (
        <ChunkPreviewModal 
          documentId={selectedChunkDocId} 
          onClose={() => setSelectedChunkDocId(null)} 
        />
      )}
    </div>
  );
}
