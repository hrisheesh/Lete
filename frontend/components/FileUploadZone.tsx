"use client";

import { useState, useRef } from "react";

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
      } catch (err) {
        setError("Network error occurred during upload.");
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (successCount > 0) {
      onUploadComplete();
    }
  };

  return (
    <div className="mb-8">
      <div
        className={`border-2 border-dashed rounded-3xl p-12 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-hairline-hard bg-surface"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p className="text-ink font-medium mb-4">
          {isUploading ? "Uploading..." : "Drag and drop your documents here"}
        </p>
        {!isUploading && (
          <>
            <p className="text-steel text-sm mb-6">Supports PDF, TXT, MD, DOCX</p>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-block bg-white border border-hairline-soft text-ink font-semibold px-8 py-3 rounded-full cursor-pointer hover:border-hairline-hard transition-colors"
            >
              Browse Files
            </label>
          </>
        )}
      </div>
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
