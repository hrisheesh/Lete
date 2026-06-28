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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] bg-canvas shadow-2xl">
        <div className="flex items-center justify-between border-b border-hairline-soft bg-surface px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-stone">Document chunks</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">Generated Chunks</h2>
          </div>
          <button
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-full border border-hairline bg-canvas text-steel transition-colors hover:border-ink hover:text-ink"
            aria-label="Close chunks"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-surface/40 p-6">
          {loading ? (
            <div className="py-12 text-center text-sm font-semibold text-steel">Loading chunks...</div>
          ) : chunks.length === 0 ? (
            <div className="py-12 text-center text-sm font-semibold text-steel">
              No chunks found. Have you processed this document yet?
            </div>
          ) : (
            <div className="space-y-4">
              {chunks.map((chunk) => (
                <article key={chunk.id} className="rounded-2xl border border-hairline-soft bg-canvas p-5">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <h3 className="truncate text-sm font-bold text-ink">
                      {chunk.contextual_header || `Chunk ${chunk.chunk_index + 1}`}
                    </h3>
                    <span className="shrink-0 rounded-full bg-surface px-3 py-1 text-xs font-bold text-steel">
                      #{chunk.chunk_index + 1}
                    </span>
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
