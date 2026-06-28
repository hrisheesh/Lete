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
    body: "Upload documents and watch ingestion status without losing workspace context.",
    icon: FileText,
    tone: "bg-brand-magenta",
  },
  {
    title: "Ask",
    body: "Get grounded answers with citations surfaced where trust matters.",
    icon: MessageSquare,
    tone: "bg-brand-blue",
  },
];

export default function Home() {
  return (
    <main className="app-screen">
      <section className="mx-auto grid h-full max-w-[1320px] min-h-0 gap-4 lg:grid-cols-[1.04fr_0.96fr] lg:gap-5">
        <div className="flex min-h-0 flex-col justify-between overflow-hidden rounded-[1.75rem] bg-primary p-5 text-on-primary shadow-[0_26px_90px_rgba(17,17,17,0.22)] sm:p-7 lg:p-8">
          <div className="min-h-0">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/78 sm:mb-7 sm:text-sm">
              <Sparkles size={15} />
              Local-first document intelligence
            </div>
            <h1 className="max-w-4xl text-balance text-4xl font-bold leading-[0.98] tracking-tight sm:text-6xl lg:text-[76px]">
              Answers stay attached to source.
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-white/66 sm:mt-5 sm:text-base sm:leading-7">
              Lete turns document collections into focused workspaces with clean retrieval, visible processing, and cited chat.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/workspaces"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-ink transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-surface"
            >
              Open workspaces
              <ArrowRight size={17} />
            </Link>
            <HealthCheck />
          </div>
        </div>

        <div className="grid min-h-0 gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className={`${item.tone} flex min-h-0 flex-col justify-between rounded-[1.5rem] p-5 text-white shadow-[0_18px_60px_rgba(17,17,17,0.12)] lg:p-6`}
              >
                <Icon size={25} />
                <div className="mt-5">
                  <h2 className="text-2xl font-bold tracking-tight">{item.title}</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/78">{item.body}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
