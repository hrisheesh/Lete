import HealthCheck from "@/components/HealthCheck";
import Link from "next/link";
import { ArrowRight, Database, FileText, MessageSquare, Sparkles } from "lucide-react";

const highlights = [
  {
    title: "Organize",
    body: "Focused workspaces keep research streams, clients, and projects cleanly separated.",
    icon: Database,
    tone: "bg-brand-coral",
  },
  {
    title: "Process",
    body: "Upload documents and watch ingestion status without losing the shape of the work.",
    icon: FileText,
    tone: "bg-brand-magenta",
  },
  {
    title: "Ask",
    body: "Get grounded answers with citations surfaced inline instead of buried afterward.",
    icon: MessageSquare,
    tone: "bg-brand-blue",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <section className="grid min-h-[calc(100svh-9rem)] gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        <div className="flex flex-col justify-between rounded-[2rem] bg-primary p-6 text-on-primary shadow-[0_26px_90px_rgba(17,17,17,0.22)] sm:p-8 lg:p-10">
          <div>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white/80">
              <Sparkles size={16} />
              Local-first document intelligence
            </div>
            <h1 className="max-w-4xl text-balance text-5xl font-bold leading-[0.98] tracking-tight sm:text-7xl lg:text-[84px]">
              Welcome to Lete
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-white/68 sm:text-xl">
              A calm context engine for turning private documents into searchable, cited answers.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/workspaces"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-primary transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-surface"
            >
              Open workspaces
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/settings"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 px-6 text-sm font-bold text-white transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/10"
            >
              Configure provider
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="premium-panel rounded-[2rem] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-stone">Engine status</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">Ready when your docs are</h2>
              </div>
              <HealthCheck />
            </div>
            <div className="mt-8 grid grid-cols-3 gap-2 rounded-[1.5rem] bg-surface p-2">
              {["Upload", "Index", "Answer"].map((step, index) => (
                <div key={step} className="rounded-[1.1rem] bg-canvas px-3 py-4 text-center">
                  <p className="text-2xl font-bold tracking-tight text-ink">0{index + 1}</p>
                  <p className="mt-1 truncate text-xs font-bold text-steel">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className={`${item.tone} rounded-[2rem] p-6 text-white shadow-[0_18px_60px_rgba(17,17,17,0.12)]`}>
                  <Icon size={26} />
                  <h2 className="mt-8 text-2xl font-bold tracking-tight">{item.title}</h2>
                  <p className="mt-3 text-sm font-semibold leading-6 text-white/78">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
