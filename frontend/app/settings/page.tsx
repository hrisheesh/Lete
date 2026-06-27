import ProviderSettingsForm from "@/components/ProviderSettingsForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings - Lete",
};

export default function SettingsPage() {
  return (
    <div className="max-w-[1280px] mx-auto pt-[96px] px-8">
      <div className="text-center mb-[80px]">
        <h1 className="text-[80px] font-semibold leading-[1.10] tracking-[-2px] text-ink">
          Provider Configuration
        </h1>
        <p className="text-[18px] font-medium leading-[1.50] text-steel mt-[16px]">
          Connect Lete to your preferred AI models.
        </p>
      </div>
      
      <div className="max-w-[720px] mx-auto">
        <ProviderSettingsForm />
      </div>
    </div>
  );
}
