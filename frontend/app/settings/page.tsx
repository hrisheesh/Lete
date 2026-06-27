import ProviderSettingsForm from "@/components/ProviderSettingsForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings - Lete",
};

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-gray-400 mt-2">Manage your AI provider connections and system preferences.</p>
      </div>
      
      <ProviderSettingsForm />
    </div>
  );
}
