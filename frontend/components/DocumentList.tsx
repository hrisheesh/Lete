"use client";

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
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="bg-white border border-hairline-soft rounded-3xl overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-hairline-soft bg-surface">
            <th className="px-6 py-4 text-xs font-semibold text-steel uppercase tracking-wider">Name</th>
            <th className="px-6 py-4 text-xs font-semibold text-steel uppercase tracking-wider">Size</th>
            <th className="px-6 py-4 text-xs font-semibold text-steel uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-xs font-semibold text-steel uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline-soft">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-surface/50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-ink">
                {doc.filename}
              </td>
              <td className="px-6 py-4 text-sm text-steel">
                {formatSize(doc.file_size)}
              </td>
              <td className="px-6 py-4 text-sm">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                  doc.status === 'processed' ? 'bg-green-100 text-green-700' :
                  doc.status === 'failed' ? 'bg-red-100 text-red-700' :
                  doc.status === 'processing' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                  'bg-surface-hover text-steel'
                }`}>
                  {doc.status === 'processing' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                  )}
                  {doc.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right space-x-4">
                <button
                  onClick={() => onProcess(doc.id)}
                  disabled={doc.status === 'processing'}
                  className="text-primary hover:text-primary/80 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {doc.status === 'processing' ? 'Processing...' : 'Process'}
                </button>
                <button
                  onClick={() => onViewChunks(doc.id)}
                  className="text-ink hover:text-steel font-semibold text-sm transition-colors"
                >
                  View Chunks
                </button>
                <button
                  onClick={() => onDelete(doc.id)}
                  className="text-red-500 hover:text-red-700 font-semibold text-sm transition-colors"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
