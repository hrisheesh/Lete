import ProviderSettingsForm from "@/components/ProviderSettingsForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings - Lete",
};

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
        <section className="rounded-[2rem] bg-primary p-6 text-on-primary shadow-[0_26px_90px_rgba(17,17,17,0.2)] sm:p-8">
          <p className="text-sm font-bold uppercase tracking-wide text-white/48">Settings</p>
          <h1 className="mt-3 text-balance text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl">Provider configuration</h1>
          <p className="mt-5 max-w-xl text-base font-medium leading-7 text-white/66">
            Connect the model endpoint Lete should use for document answers and embeddings.
          </p>
        </section>

        <ProviderSettingsForm />
      </div>
    </div>
  );
}
