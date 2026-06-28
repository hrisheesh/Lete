import ProviderSettingsForm from "@/components/ProviderSettingsForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings - Lete",
};

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-stone">Settings</p>
        <h1 className="mt-3 text-5xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
          Provider Configuration
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-8 text-slate">
          Connect Lete to the models that should power document answers and embeddings.
        </p>
      </div>

      <div className="mx-auto max-w-[760px]">
        <ProviderSettingsForm />
      </div>
    </div>
  );
}
