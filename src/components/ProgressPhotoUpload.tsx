"use client";

import { useRef, useState } from "react";

interface Props {
  onUploaded?: () => void;
}

export default function ProgressPhotoUpload({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setSuccess(false);
  }

  async function handleSave() {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/progress-photos/upload", {
        method: "POST",
        body: formData,
      });
      const { imageUrl } = await uploadRes.json();

      await fetch("/api/progress-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          weight: weight ? parseFloat(weight) : undefined,
          notes: notes || undefined,
          date: new Date().toISOString(),
        }),
      });

      setSuccess(true);
      setPreview(null);
      setFile(null);
      setWeight("");
      setNotes("");
      if (inputRef.current) inputRef.current.value = "";
      onUploaded?.();
    } catch {
      // silently fail; user can retry
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#262626] bg-[#141414] p-6">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,image/heic"
        className="hidden"
        onChange={handleFileChange}
      />

      {!preview && !success && (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-3 rounded-xl border border-dashed border-[#262626] py-10 text-gray-400 transition hover:border-[#0066FF] hover:text-[#0066FF]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 9a2 2 0 012-2h.172a2 2 0 001.414-.586l.828-.828A2 2 0 018.828 5h6.344a2 2 0 011.414.586l.828.828A2 2 0 0018.828 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-sm font-medium">Add Progress Photo</span>
        </button>
      )}

      {success && (
        <p className="text-center text-sm font-medium text-green-400">
          Photo saved! Keep up the great work 📸
        </p>
      )}

      {preview && (
        <div className="space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="max-h-72 w-full rounded-xl object-cover"
          />

          <input
            type="number"
            placeholder="Weight (optional)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full rounded-xl border border-[#262626] bg-black px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#0066FF] focus:outline-none"
          />

          <textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl border border-[#262626] bg-black px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#0066FF] focus:outline-none"
          />

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0066FF] py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              Save Progress Photo
            </button>
            <button
              onClick={() => {
                setPreview(null);
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="rounded-xl border border-[#262626] px-4 py-2.5 text-sm text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
