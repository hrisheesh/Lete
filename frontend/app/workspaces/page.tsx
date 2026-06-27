"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Workspace {
  id: string;
  name: string;
  created_at: string;
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const router = useRouter();

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/workspaces");
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data);
      }
    } catch (e) {
      console.error("Failed to fetch workspaces");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWorkspaceName }),
      });
      if (res.ok) {
        const newWorkspace = await res.json();
        setWorkspaces([...workspaces, newWorkspace]);
        setNewWorkspaceName("");
        router.push(`/workspaces/${newWorkspace.id}`);
      }
    } catch (e) {
      console.error("Failed to create workspace");
    }
  };

  return (
    <div className="max-w-[800px] mx-auto px-8 py-12">
      <h2 className="text-3xl font-bold text-ink mb-8 tracking-tight">Your Workspaces</h2>

      <div className="bg-white border border-hairline-soft rounded-2xl p-8 mb-8">
        <form onSubmit={handleCreate} className="flex gap-4">
          <input
            type="text"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            placeholder="New Workspace Name..."
            className="flex-1 bg-surface border border-hairline-soft rounded-full px-6 py-3 text-ink focus:outline-none focus:border-hairline-hard transition-colors"
          />
          <button
            type="submit"
            disabled={!newWorkspaceName.trim()}
            className="bg-primary text-on-primary font-semibold px-8 py-3 rounded-full disabled:opacity-50 transition-opacity"
          >
            Create
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="text-steel p-4">Loading workspaces...</div>
        ) : workspaces.length === 0 ? (
          <div className="text-steel p-4">No workspaces found. Create one above.</div>
        ) : (
          workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/workspaces/${ws.id}`}
              className="bg-white border border-hairline-soft rounded-2xl p-6 hover:border-hairline-hard transition-colors group flex flex-col justify-between h-32"
            >
              <h3 className="font-semibold text-lg text-ink group-hover:text-primary transition-colors">
                {ws.name}
              </h3>
              <p className="text-steel text-sm">
                Created {new Date(ws.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
