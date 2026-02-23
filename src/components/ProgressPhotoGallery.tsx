"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ProgressPhotoCompare = dynamic(
  () => import("@/components/ProgressPhotoCompare"),
  { ssr: false }
);

interface Photo {
  id: string;
  imageUrl: string;
  date: string;
  weight?: number;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function ProgressPhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Photo | null>(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    fetch("/api/progress-photos")
      .then((r) => r.json())
      .then((data: Photo[]) => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setPhotos(sorted);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (comparing) {
    return (
      <ProgressPhotoCompare
        photos={photos}
        onClose={() => setComparing(false)}
      />
    );
  }

  return (
    <div className="rounded-2xl border border-[#262626] bg-[#141414] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Progress Photos</h2>
        {photos.length >= 2 && (
          <button
            onClick={() => setComparing(true)}
            className="rounded-lg bg-[#0066FF] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500"
          >
            Compare
          </button>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#0066FF] border-t-transparent" />
        </div>
      )}

      {!loading && photos.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-500">
          No progress photos yet. Add your first one above!
        </p>
      )}

      {!loading && photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setSelected(photo)}
              className="group overflow-hidden rounded-xl border border-[#262626] text-left transition hover:border-[#0066FF]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.imageUrl}
                alt={formatDate(photo.date)}
                className="aspect-square w-full object-cover"
              />
              <div className="p-2">
                <p className="text-xs font-medium text-gray-300">
                  {formatDate(photo.date)}
                </p>
                {photo.weight != null && (
                  <p className="text-xs text-gray-500">{photo.weight} kg</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Full-screen modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-h-screen max-w-screen-sm w-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute right-6 top-6 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black"
            >
              ✕
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected.imageUrl}
              alt={formatDate(selected.date)}
              className="max-h-[80vh] w-full rounded-2xl object-contain"
            />
            <div className="mt-3 text-center">
              <p className="text-sm font-medium text-white">
                {formatDate(selected.date)}
              </p>
              {selected.weight != null && (
                <p className="text-xs text-gray-400">{selected.weight} kg</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
