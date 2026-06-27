"use client";

import { useState, useEffect } from "react";

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
    const fetchChunks = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/documents/${documentId}/chunks`);
        if (res.ok) {
          setChunks(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChunks();
  }, [documentId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-hairline-soft flex justify-between items-center bg-surface rounded-t-3xl">
          <h2 className="text-xl font-bold text-ink tracking-tight">Generated Chunks</h2>
          <button 
            onClick={onClose}
            className="text-steel hover:text-ink font-semibold transition-colors"
          >
            Close
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 bg-surface/30">
          {loading ? (
            <div className="text-steel text-center py-12">Loading chunks...</div>
          ) : chunks.length === 0 ? (
            <div className="text-steel text-center py-12">No chunks found. Have you processed this document yet?</div>
          ) : (
            <div className="space-y-6">
              {chunks.map((chunk) => (
                <div key={chunk.id} className="bg-white border border-hairline-soft rounded-2xl p-6 shadow-sm">
                  <div className="text-xs font-mono text-steel mb-4 bg-surface p-2 rounded-lg break-all">
                    {chunk.contextual_header}
                  </div>
                  <div className="text-ink text-sm leading-relaxed whitespace-pre-wrap">
                    {chunk.text}
                  </div>
                  <div className="mt-4 text-xs font-semibold text-steel/60 uppercase tracking-widest text-right">
                    Chunk #{chunk.chunk_index}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
