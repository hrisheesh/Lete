"use client";

import { useRef, useState } from "react";
import { FileUp, UploadCloud } from "lucide-react";

interface FileUploadZoneProps {
  workspaceId: string;
  onUploadComplete: () => void;
}

export default function FileUploadZone({ workspaceId, onUploadComplete }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    setIsUploading(true);
    setError(null);
    let successCount = 0;

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/workspaces/${workspaceId}/documents/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.detail || `Failed to upload ${file.name}`);
        } else {
          successCount++;
        }
      } catch {
        setError("Network error occurred during upload.");
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (successCount > 0) {
      onUploadComplete();
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`shrink-0 overflow-hidden rounded-[1.1rem] border px-3 py-2.5 transition duration-200 ease-out ${
        isDragging
          ? "border-brand-blue bg-brand-blue/8 shadow-[0_16px_42px_rgba(20,86,240,0.12)]"
          : "border-hairline-soft bg-white shadow-[0_12px_34px_rgba(17,17,17,0.045)]"
      }`}
    >
      <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" />

      <div className="flex min-w-0 items-center gap-2.5">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
            isDragging ? "bg-brand-blue text-white" : "bg-surface text-ink"
          }`}
        >
          <FileUp size={17} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-sm font-extrabold leading-5 tracking-tight text-ink">
              {isDragging ? "Drop to upload" : "Upload files"}
            </h2>
            <span className="hidden shrink-0 rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone min-[390px]:inline-flex">
              PDF CSV TXT
            </span>
          </div>
          <p className="truncate text-[11px] font-semibold leading-4 text-steel">
            {isUploading ? "Uploading documents..." : "Drag here or choose from your device"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-charcoal disabled:opacity-50"
          aria-label={isUploading ? "Uploading files" : "Choose files"}
          title={isUploading ? "Uploading files" : "Choose files"}
        >
          <UploadCloud size={16} />
        </button>
      </div>

      {error && <p className="mt-2 rounded-xl bg-brand-coral/10 px-3 py-2 text-xs font-bold text-brand-coral">{error}</p>}
    </div>
  );
}
