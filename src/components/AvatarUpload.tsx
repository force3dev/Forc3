"use client";

import { useRef, useState } from "react";
import Avatar from "@/components/Avatar";

interface AvatarUploadProps {
  name: string;
  value?: string | null;
  onUploaded: (url: string | null) => void;
}

export default function AvatarUpload({ name, value, onUploaded }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState("");

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) return;

    setUploading(true);
    setProgressText("Uploading...");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      const res = await fetch("/api/user/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");

      setPreviewUrl(data.avatarUrl || null);
      onUploaded(data.avatarUrl || null);
      setProgressText("Uploaded");
    } catch {
      setProgressText("Failed");
    } finally {
      setUploading(false);
      setTimeout(() => setProgressText(""), 1200);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative mx-auto block"
      >
        <Avatar user={{ name, avatarUrl: previewUrl }} size="xl" />
        <span className="absolute right-1 bottom-1 w-8 h-8 rounded-full bg-[#0066FF] border border-[#1a1a1a] flex items-center justify-center text-sm">
          📷
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/webp"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
        }}
      />

      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="px-3 py-1.5 text-xs rounded-lg bg-[#1a1a1a] border border-[#262626]"
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Camera"}
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="px-3 py-1.5 text-xs rounded-lg bg-[#1a1a1a] border border-[#262626]"
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Photo Library"}
        </button>
        {!!previewUrl && (
          <button
            type="button"
            onClick={() => {
              setPreviewUrl(null);
              onUploaded(null);
            }}
            className="px-3 py-1.5 text-xs rounded-lg bg-[#1a1a1a] border border-[#262626] text-red-300"
            disabled={uploading}
          >
            Remove
          </button>
        )}
      </div>

      {progressText && <p className="text-center text-xs text-neutral-500">{progressText}</p>}
    </div>
  );
}
