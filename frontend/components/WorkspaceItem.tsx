import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Pencil, Trash2, X, Check } from "lucide-react";

export function WorkspaceItem({
  ws,
  index,
  onUpdate,
  onDelete,
}: {
  ws: { id: string; name: string; created_at: string };
  index: number;
  onUpdate: (id: string, newName: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(ws.name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim() && editName !== ws.name) {
      await onUpdate(ws.id, editName);
    }
    setIsEditing(false);
  };

  return (
    <div className="group relative flex min-h-36 flex-col justify-between rounded-[1.5rem] border border-hairline-soft bg-white p-5 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-ink hover:shadow-[0_18px_48px_rgba(17,17,17,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-full text-base font-bold text-white ${
            index % 3 === 0 ? "bg-brand-coral" : index % 3 === 1 ? "bg-brand-magenta" : "bg-brand-blue"
          }`}
        >
          {ws.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <button
            onClick={() => {
              setIsEditing(true);
              setEditName(ws.name);
            }}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-steel transition hover:bg-black/5 hover:text-ink"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => {
              if (confirm("Delete this workspace forever?")) {
                onDelete(ws.id);
              }
            }}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-brand-coral transition hover:bg-brand-coral/10"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      
      <div className="min-w-0 pt-6">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-1 text-lg font-bold tracking-tight text-ink outline-none focus:border-brand-blue"
              autoFocus
            />
            <button type="submit" className="flex size-8 shrink-0 items-center justify-center rounded bg-brand-blue text-white hover:bg-brand-blue/90">
              <Check size={14} />
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className="flex size-8 shrink-0 items-center justify-center rounded bg-surface text-steel hover:bg-black/5">
              <X size={14} />
            </button>
          </form>
        ) : (
          <Link href={`/workspaces/${ws.id}`} className="block">
            <h3 className="truncate text-2xl font-bold tracking-tight text-ink hover:underline">{ws.name}</h3>
          </Link>
        )}
        <p className="mt-1.5 text-sm font-semibold text-steel">
          Created {new Date(ws.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
