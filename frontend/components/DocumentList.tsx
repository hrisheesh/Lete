"use client";

import { Eye, FileText, Play, Trash2 } from "lucide-react";

interface Document {
  id: string;
  filename: string;
  file_size: number;
  status: string;
  created_at: string;
}

interface DocumentListProps {
  documents: Document[];
  onDelete: (id: string) => void;
  onProcess: (id: string) => void;
  onViewChunks: (id: string) => void;
}

export default function DocumentList({ documents, onDelete, onProcess, onViewChunks }: DocumentListProps) {
  if (documents.length === 0) {
    return null;
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const statusClass = (status: string) => {
    if (status === "processed") return "bg-success-bg text-success-text";
    if (status === "processing") return "bg-brand-blue/10 text-brand-blue-deep";
    if (status === "failed") return "bg-brand-coral/10 text-brand-coral";
    return "bg-surface text-steel";
  };

  return (
    <div className="overflow-hidden rounded-[28px] border border-hairline-soft bg-canvas shadow-[0_18px_60px_rgba(10,10,10,0.05)]">
      <div className="hidden grid-cols-[1fr_96px_112px_auto] gap-3 border-b border-hairline-soft bg-surface px-5 py-4 text-xs font-bold uppercase tracking-wide text-stone md:grid">
        <span>Name</span>
        <span>Size</span>
        <span>Status</span>
        <span className="text-right">Actions</span>
      </div>
      <div className="divide-y divide-hairline-soft">
        {documents.map((doc) => (
          <div key={doc.id} className="grid gap-4 px-4 py-4 md:grid-cols-[1fr_96px_112px_auto] md:items-center md:px-5">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-steel">
                <FileText size={18} />
              </span>
              <div className="min-w-0">
                <p className="break-words text-sm font-bold text-ink md:truncate">{doc.filename}</p>
                <p className="mt-1 text-xs font-medium text-stone">{new Date(doc.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:block">
              <span className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-steel md:bg-transparent md:px-0 md:py-0">
                {formatSize(doc.file_size)}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize md:hidden ${statusClass(doc.status)}`}>
                {doc.status}
              </span>
            </div>

            <span className={`hidden rounded-full px-3 py-1 text-center text-xs font-bold capitalize md:inline-flex ${statusClass(doc.status)}`}>
              {doc.status}
            </span>

            <div className="grid grid-cols-3 gap-2 md:flex md:justify-end">
              <button
                onClick={() => onViewChunks(doc.id)}
                className="inline-flex h-10 items-center justify-center rounded-full border border-hairline bg-canvas text-steel transition-[border-color,color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-ink hover:text-ink md:size-10"
                aria-label="View chunks"
                title="View chunks"
              >
                <Eye size={16} />
              </button>
              {doc.status !== "processed" && doc.status !== "processing" && (
                <button
                  onClick={() => onProcess(doc.id)}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-primary text-on-primary transition-[background-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:bg-charcoal md:size-10"
                  aria-label="Process document"
                  title="Process document"
                >
                  <Play size={16} />
                </button>
              )}
              <button
                onClick={() => onDelete(doc.id)}
                className="inline-flex h-10 items-center justify-center rounded-full border border-hairline bg-canvas text-brand-coral transition-[border-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-coral md:size-10"
                aria-label="Delete document"
                title="Delete document"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
