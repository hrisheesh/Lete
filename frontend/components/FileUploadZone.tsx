"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

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
    <div className="rounded-[28px] border border-hairline-soft bg-canvas p-3 shadow-[0_18px_60px_rgba(10,10,10,0.06)] sm:p-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed px-4 py-8 text-center transition-[background-color,border-color,transform] duration-200 ease-out hover:-translate-y-0.5 sm:px-6 sm:py-10 ${
          isDragging ? "border-brand-blue bg-brand-blue/5" : "border-hairline bg-surface hover:border-ink"
        }`}
      >
        <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" />
        <div className="flex size-12 items-center justify-center rounded-full bg-primary text-on-primary">
          <UploadCloud size={22} />
        </div>
        <p className="mt-5 text-base font-bold tracking-tight text-ink">
          {isUploading ? "Uploading..." : "Drop files here"}
        </p>
        <p className="mt-2 max-w-52 text-sm font-medium leading-6 text-steel sm:max-w-none">or click to choose documents</p>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-brand-coral/25 bg-brand-coral/10 px-4 py-3 text-sm font-semibold text-brand-coral">
          {error}
        </div>
      )}
    </div>
  );
}
