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
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (successCount > 0) onUploadComplete();
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative overflow-hidden rounded-[2rem] border p-5 transition duration-300 ease-out sm:p-6 ${
        isDragging
          ? "border-brand-blue bg-brand-blue/8 shadow-[0_22px_70px_rgba(20,86,240,0.14)]"
          : "border-hairline-soft bg-primary text-on-primary shadow-[0_24px_80px_rgba(17,17,17,0.18)]"
      }`}
    >
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className={`mb-5 flex size-12 items-center justify-center rounded-full ${isDragging ? "bg-brand-blue text-white" : "bg-white/12 text-white"}`}>
            <FileUp size={22} />
          </div>
          <h2 className={`text-2xl font-bold tracking-tight ${isDragging ? "text-ink" : "text-white"}`}>Drop documents here</h2>
          <p className={`mt-2 max-w-md text-sm font-semibold leading-6 ${isDragging ? "text-steel" : "text-white/62"}`}>
            Upload PDFs, CSVs, and text files into this workspace.
          </p>
          {error && <p className="mt-4 rounded-2xl bg-brand-coral/15 px-4 py-3 text-sm font-bold text-brand-coral">{error}</p>}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={`inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition duration-200 ease-out hover:-translate-y-0.5 disabled:opacity-60 ${
            isDragging ? "bg-primary text-on-primary" : "bg-white text-primary hover:bg-surface"
          }`}
        >
          <UploadCloud size={17} />
          {isUploading ? "Uploading..." : "Choose files"}
        </button>
      </div>
    </div>
  );
}
