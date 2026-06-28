"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, Search } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  created_at: string;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function fetchWorkspaces() {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/workspaces");
        if (res.ok && mounted) {
          const data = await res.json();
          setWorkspaces(data);
        }
      } catch (e) {
        console.error("Failed fetch workspaces:", getErrorMessage(e));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchWorkspaces();

    return () => {
      mounted = false;
    };
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
      console.error("Failed create workspace:", getErrorMessage(e));
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 sm:py-16">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <section className="rounded-[32px] bg-primary p-8 text-on-primary lg:sticky lg:top-24">
          <p className="text-sm font-bold uppercase tracking-wide text-white/50">Workspaces</p>
          <h1 className="mt-4 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">Your Workspaces</h1>
          <p className="mt-5 text-base font-medium leading-7 text-white/64">
            Keep each knowledge base clean, focused, and ready for document-grounded answers.
          </p>

          <form onSubmit={handleCreate} className="mt-8 rounded-[24px] bg-white p-3 text-ink shadow-2xl">
            <label className="sr-only" htmlFor="workspace-name">
              Workspace name
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="workspace-name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="New workspace name"
                className="h-12 min-w-0 flex-1 rounded-full border border-hairline bg-surface px-5 text-sm font-semibold text-ink placeholder:text-stone focus:border-brand-blue-deep"
              />
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-on-primary transition-colors hover:bg-charcoal"
              >
                <Plus size={17} />
                Create
              </button>
            </div>
          </form>
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-stone">{workspaces.length} total</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">Knowledge bases</h2>
            </div>
            <div className="hidden h-11 items-center gap-2 rounded-full border border-hairline bg-canvas px-4 text-sm font-semibold text-steel sm:flex">
              <Search size={16} />
              Browse
            </div>
          </div>

          {loading ? (
            <div className="rounded-[28px] border border-hairline-soft bg-canvas p-8 text-sm font-semibold text-steel">
              Loading workspaces...
            </div>
          ) : workspaces.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-hairline bg-surface p-10 text-center">
              <p className="text-lg font-bold text-ink">No workspaces found</p>
              <p className="mt-2 text-sm font-medium text-steel">Create one to start uploading documents.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {workspaces.map((ws, index) => (
                <Link
                  key={ws.id}
                  href={`/workspaces/${ws.id}`}
                  className="group flex min-h-44 flex-col justify-between rounded-[28px] border border-hairline-soft bg-canvas p-6 shadow-[0_18px_60px_rgba(10,10,10,0.05)] transition-colors hover:border-ink"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={`flex size-11 items-center justify-center rounded-full text-sm font-bold text-white ${
                        index % 3 === 0
                          ? "bg-brand-coral"
                          : index % 3 === 1
                            ? "bg-brand-magenta"
                            : "bg-brand-blue"
                      }`}
                    >
                      {ws.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="flex size-10 items-center justify-center rounded-full bg-surface text-steel transition-colors group-hover:bg-primary group-hover:text-on-primary">
                      <ArrowRight size={17} />
                    </span>
                  </div>
                  <div>
                    <h3 className="truncate text-xl font-bold tracking-tight text-ink">{ws.name}</h3>
                    <p className="mt-2 text-sm font-medium text-steel">
                      Created {new Date(ws.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
