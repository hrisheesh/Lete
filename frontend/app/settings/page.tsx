import ProviderSettingsForm from "@/components/ProviderSettingsForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings - Lete",
};

export default function SettingsPage() {
  return (
    <main className="app-screen">
      <section className="mx-auto grid h-full max-w-[1320px] min-h-0 gap-4 lg:grid-cols-[0.76fr_1.24fr]">
        <div className="flex min-h-0 flex-col justify-between overflow-hidden rounded-[1.75rem] bg-primary p-6 text-on-primary shadow-[0_26px_90px_rgba(17,17,17,0.2)] sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-white/48">Settings</p>
            <h1 className="mt-3 text-balance text-4xl font-bold leading-[1.02] tracking-tight sm:text-5xl">
              Provider configuration
            </h1>
            <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-white/66 sm:text-base sm:leading-7">
              Connect the model endpoint Lete uses for document answers and embeddings.
            </p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-[1.25rem] bg-white/8 p-2 text-center">
            <div className="rounded-2xl bg-white px-3 py-3 text-ink">
              <p className="text-xs font-bold uppercase tracking-wide text-steel">Model</p>
              <p className="mt-1 text-lg font-bold">Chat</p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-3 text-ink">
              <p className="text-xs font-bold uppercase tracking-wide text-steel">Index</p>
              <p className="mt-1 text-lg font-bold">Embeddings</p>
            </div>
          </div>
        </div>

        <ProviderSettingsForm />
      </section>
    </main>
  );
}
