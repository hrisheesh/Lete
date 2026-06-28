"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2, X } from "lucide-react";

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
        if (res.ok && mounted) {
          setChunks(await res.json());
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
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
        <div className="flex items-center justify-between gap-4 border-b border-hairline-soft bg-white/80 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-stone">Document chunks</p>
            <h2 className="mt-1 truncate text-2xl font-bold tracking-tight text-ink">Generated chunks</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chunks"
            title="Close chunks"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-hairline bg-white text-charcoal transition duration-200 ease-out hover:-translate-y-0.5 hover:border-ink hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="internal-scroll flex-1 overflow-y-auto p-5 sm:p-6">
          {loading ? (
            <div className="flex min-h-[18rem] items-center justify-center gap-3 rounded-3xl border border-dashed border-hairline bg-white/55 text-sm font-bold text-steel">
              <Loader2 size={18} className="animate-spin" />
              Loading chunks...
            </div>
          ) : chunks.length === 0 ? (
            <div className="flex min-h-[18rem] items-center justify-center rounded-3xl border border-dashed border-hairline bg-white/55 text-sm font-bold text-steel">
              No chunks found.
            </div>
          ) : (
            <div className="space-y-3">
              {chunks.map((chunk) => (
                <article
                  key={chunk.id}
                  className="rounded-[1.5rem] border border-hairline bg-white/82 p-4 shadow-[0_16px_30px_rgba(38,31,27,0.06)]"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                        <FileText size={15} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide text-stone">Chunk {chunk.chunk_index + 1}</p>
                        {chunk.contextual_header && (
                          <h3 className="truncate text-sm font-bold text-ink">{chunk.contextual_header}</h3>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-charcoal">{chunk.text}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
