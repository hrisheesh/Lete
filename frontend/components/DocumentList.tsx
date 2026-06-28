"use client";

import { Eye, FileText, Loader2, Play, Trash2 } from "lucide-react";

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
  processingId?: string | null;
}

export default function DocumentList({ documents, onDelete, onProcess, onViewChunks, processingId }: DocumentListProps) {
  if (documents.length === 0) return null;

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
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-bold tracking-tight text-ink">Documents</h2>
        <span className="text-xs font-bold uppercase tracking-wide text-stone">{documents.length} total</span>
      </div>

      <div className="grid gap-3">
        {documents.map((doc) => {
          const isProcessing = processingId === doc.id || doc.status === "processing";
          return (
            <article key={doc.id} className="premium-panel animate-soft-rise rounded-[1.5rem] p-4 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-ink sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                  <FileText size={19} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-bold tracking-tight text-ink" title={doc.filename}>
                    {doc.filename}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-steel">
                    <span>{formatSize(doc.file_size)}</span>
                    <span className="text-muted">/</span>
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    <span className={`rounded-full px-2.5 py-1 ${statusClass(doc.status)}`}>{doc.status}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  onClick={() => onProcess(doc.id)}
                  disabled={isProcessing}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-hairline bg-canvas text-steel transition duration-200 ease-out hover:border-brand-blue hover:text-brand-blue disabled:opacity-50"
                  aria-label="Process document"
                  title="Process document"
                >
                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                </button>
                <button
                  onClick={() => onViewChunks(doc.id)}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-hairline bg-canvas text-steel transition duration-200 ease-out hover:border-ink hover:text-ink"
                  aria-label="View chunks"
                  title="View chunks"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => onDelete(doc.id)}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-hairline bg-canvas text-steel transition duration-200 ease-out hover:border-brand-coral hover:text-brand-coral"
                  aria-label="Delete document"
                  title="Delete document"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
