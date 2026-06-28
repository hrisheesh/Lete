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
    <div className="premium-panel flex h-full min-h-0 flex-col overflow-hidden rounded-[1.25rem]">
      <div className="flex shrink-0 items-center justify-between border-b border-hairline-soft bg-white/70 px-3 py-2.5">
        <h2 className="text-sm font-extrabold tracking-tight text-ink">Documents</h2>
        <span className="text-xs font-bold uppercase tracking-wide text-stone">{documents.length} total</span>
      </div>

      <div className="internal-scroll grid min-h-0 flex-1 auto-rows-max gap-2 overflow-y-auto p-2">
        {documents.map((doc) => {
          const isProcessing = processingId === doc.id || doc.status === "processing";
          return (
            <article
              key={doc.id}
              className="animate-soft-rise rounded-2xl border border-hairline-soft bg-white p-2.5 transition duration-200 ease-out hover:border-ink hover:shadow-[0_14px_32px_rgba(17,17,17,0.05)]"
            >
              <div className="flex items-start gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-ink">
                  <FileText size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-xs font-extrabold leading-5 text-ink" title={doc.filename}>
                    {doc.filename}
                  </h3>
                  <p className="text-[11px] font-semibold text-steel">
                    {formatSize(doc.file_size)} / {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusClass(doc.status)}`}>
                  {doc.status}
                </span>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => onProcess(doc.id)}
                  disabled={isProcessing}
                  className="inline-flex h-8 items-center justify-center rounded-full border border-hairline bg-canvas text-steel transition duration-200 ease-out hover:border-brand-blue hover:text-brand-blue disabled:opacity-50"
                  aria-label="Process document"
                  title="Process document"
                >
                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                </button>
                <button
                  onClick={() => onViewChunks(doc.id)}
                  className="inline-flex h-8 items-center justify-center rounded-full border border-hairline bg-canvas text-steel transition duration-200 ease-out hover:border-ink hover:text-ink"
                  aria-label="View chunks"
                  title="View chunks"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => onDelete(doc.id)}
                  className="inline-flex h-8 items-center justify-center rounded-full border border-hairline bg-canvas text-steel transition duration-200 ease-out hover:border-brand-coral hover:text-brand-coral"
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
