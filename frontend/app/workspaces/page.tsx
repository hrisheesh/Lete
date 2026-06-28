"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, Search, Sparkles } from "lucide-react";

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
    <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="rounded-[2rem] bg-primary p-6 text-on-primary shadow-[0_26px_90px_rgba(17,17,17,0.2)] sm:p-8">
          <div className="mb-8 flex size-12 items-center justify-center rounded-full bg-white/12">
            <Sparkles size={22} />
          </div>
          <p className="text-sm font-bold uppercase tracking-wide text-white/48">Workspaces</p>
          <h1 className="mt-3 text-balance text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl">Choose the context before the answer.</h1>
          <p className="mt-5 max-w-xl text-base font-medium leading-7 text-white/66">
            Keep each knowledge base focused so uploads, retrieval, and citations stay easy to trust.
          </p>

          <form onSubmit={handleCreate} className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/8 p-3">
            <label htmlFor="workspace-name" className="sr-only">
              New workspace name
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="workspace-name"
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="New workspace name"
                className="min-h-12 flex-1 rounded-full border border-white/10 bg-white px-4 text-base font-semibold text-ink placeholder:text-muted"
              />
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-coral px-5 text-sm font-bold text-white transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#e94a28]"
              >
                <Plus size={17} />
                Create
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="soft-panel flex items-center gap-3 rounded-[1.5rem] px-4 py-3 text-sm font-bold text-steel">
            <Search size={17} />
            <span>{loading ? "Loading workspaces" : `${workspaces.length} workspace${workspaces.length === 1 ? "" : "s"} available`}</span>
          </div>

          {loading ? (
            <div className="premium-panel rounded-[2rem] p-8 text-sm font-bold text-steel">Loading workspaces...</div>
          ) : workspaces.length === 0 ? (
            <div className="soft-panel rounded-[2rem] border-dashed p-10 text-center">
              <p className="text-xl font-bold tracking-tight text-ink">No workspaces yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-6 text-steel">Create one to start uploading documents.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {workspaces.map((ws, index) => (
                <Link
                  key={ws.id}
                  href={`/workspaces/${ws.id}`}
                  className="group premium-panel flex min-h-44 flex-col justify-between rounded-[2rem] p-6 transition duration-200 ease-out hover:-translate-y-1 hover:border-ink"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={`flex size-12 shrink-0 items-center justify-center rounded-full text-base font-bold text-white ${
                        index % 3 === 0 ? "bg-brand-coral" : index % 3 === 1 ? "bg-brand-magenta" : "bg-brand-blue"
                      }`}
                    >
                      {ws.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-steel transition duration-200 ease-out group-hover:bg-primary group-hover:text-on-primary">
                      <ArrowRight size={17} />
                    </span>
                  </div>
                  <div className="min-w-0 pt-8">
                    <h3 className="truncate text-2xl font-bold tracking-tight text-ink">{ws.name}</h3>
                    <p className="mt-2 text-sm font-semibold text-steel">Created {new Date(ws.created_at).toLocaleDateString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
