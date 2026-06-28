import HealthCheck from "@/components/HealthCheck";
import Link from "next/link";
import { ArrowRight, Database, FileText, MessageSquare } from "lucide-react";

const highlights = [
  {
    title: "Organize sources",
    body: "Create focused workspaces for each project, client, or research stream.",
    icon: Database,
    tone: "bg-brand-coral text-white",
  },
  {
    title: "Process documents",
    body: "Upload files and keep ingestion status visible without crowding the workspace.",
    icon: FileText,
    tone: "bg-brand-magenta text-white",
  },
  {
    title: "Ask with context",
    body: "Chat against processed documents and keep citations close to each answer.",
    icon: MessageSquare,
    tone: "bg-brand-blue text-white",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 sm:py-16">
      <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center rounded-full border border-hairline bg-canvas px-4 py-2 text-sm font-semibold text-steel shadow-sm">
            Local-first document intelligence
          </div>
          <h1 className="text-5xl font-bold leading-[1.02] tracking-tight text-ink sm:text-7xl lg:text-[80px]">
            Welcome to Lete
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate">
            A focused context engine for turning private documents into searchable, cited answers.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/workspaces"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-on-primary transition-colors hover:bg-charcoal"
            >
              Open workspaces
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/settings"
              className="inline-flex h-12 items-center justify-center rounded-full border border-ink px-6 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-on-primary"
            >
              Configure provider
            </Link>
          </div>
        </div>

        <div className="rounded-[28px] border border-hairline-soft bg-canvas p-5 shadow-[0_24px_80px_rgba(10,10,10,0.08)]">
          <div className="rounded-[22px] bg-primary p-6 text-on-primary">
            <div className="flex items-center justify-between border-b border-white/15 pb-5">
              <div>
                <p className="text-sm font-semibold text-white/62">Engine status</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">Ready to index</p>
              </div>
              <HealthCheck />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-2xl font-bold">01</p>
                <p className="mt-1 text-xs font-semibold text-white/62">Workspace</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-2xl font-bold">02</p>
                <p className="mt-1 text-xs font-semibold text-white/62">Documents</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-2xl font-bold">03</p>
                <p className="mt-1 text-xs font-semibold text-white/62">Answers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-5 md:grid-cols-3">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className={`${item.tone} rounded-[28px] p-7`}>
              <Icon size={28} />
              <h2 className="mt-8 text-2xl font-bold tracking-tight">{item.title}</h2>
              <p className="mt-3 text-sm font-medium leading-6 text-white/78">{item.body}</p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
