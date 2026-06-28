"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface Chunk {
  id: string;
  text: string;
  contextual_header: string;
  chunk_index: number;
}

interface ChunkPreviewModalProps {
  documentId: string;
  onClose: () => void;
}

export default function ChunkPreviewModal({ documentId, onClose }: ChunkPreviewModalProps) {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchChunks() {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/documents/${documentId}/chunks`);
        if (res.ok && mounted) setChunks(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchChunks();
    return () => {
      mounted = false;
    };
  }, [documentId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-3 backdrop-blur-sm sm:p-4">
      <div className="premium-panel flex max-h-[88svh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-canvas shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-hairline-soft bg-white/78 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-stone">Document chunks</p>
            <h2 className="mt-1 truncate text-2xl font-bold tracking-tight text-ink">Generated chunks</h2>
          </div>
          <button
            onClick={onClose}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-hairline bg-canvas text-steel transition duration-200 ease-out hover:border-ink hover:text-ink"
            aria-label="Close chunks"
            title="Close chunks"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <p className="text-sm font-bold text-steel">Loading chunks...</p>
          ) : chunks.length === 0 ? (
            <p className="text-sm font-bold text-steel">No chunks found.</p>
          ) : (
            <div className="space-y-3">
              {chunks.map((chunk) => (
                <article key={chunk.id} className="rounded-[1.5rem] border border-hairline-soft bg-surface/70 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-on-primary">Chunk {chunk.chunk_index + 1}</span>
                    {chunk.contextual_header && <span className="max-w-full truncate text-xs font-bold text-stone">{chunk.contextual_header}</span>}
                  </div>
                  <p className="whitespace-pre-wrap text-sm font-medium leading-7 text-slate">{chunk.text}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
