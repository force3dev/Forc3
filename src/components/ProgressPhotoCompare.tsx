"use client";

import { useState } from "react";

interface Photo {
  id: string;
  imageUrl: string;
  date: string;
  weight?: number;
}

interface Props {
  photos: Photo[];
  onClose: () => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysBetween(a: string, b: string) {
  const diff = Math.abs(new Date(b).getTime() - new Date(a).getTime());
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export default function ProgressPhotoCompare({ photos, onClose }: Props) {
  const sorted = [...photos].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const [beforeId, setBeforeId] = useState(sorted[0]?.id ?? "");
  const [afterId, setAfterId] = useState(sorted[sorted.length - 1]?.id ?? "");

  const before = photos.find((p) => p.id === beforeId);
  const after = photos.find((p) => p.id === afterId);

  const weightDiff =
    before?.weight != null && after?.weight != null
      ? (after.weight - before.weight).toFixed(1)
      : null;

  const days =
    before && after ? daysBetween(before.date, after.date) : null;

  return (
    <div className="rounded-2xl border border-[#262626] bg-[#141414] p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Compare Photos</h2>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#262626] text-gray-400 hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Before */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-400">
            Before
          </label>
          <select
            value={beforeId}
            onChange={(e) => setBeforeId(e.target.value)}
            className="w-full rounded-xl border border-[#262626] bg-black px-3 py-2 text-sm text-white focus:border-[#0066FF] focus:outline-none"
          >
            {sorted.map((p) => (
              <option key={p.id} value={p.id}>
                {formatDate(p.date)}
                {p.weight != null ? ` · ${p.weight}kg` : ""}
              </option>
            ))}
          </select>
          {before ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={before.imageUrl}
              alt="Before"
              className="aspect-square w-full rounded-xl object-cover"
            />
          ) : (
            <div className="aspect-square w-full rounded-xl border border-dashed border-[#262626]" />
          )}
        </div>

        {/* After */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-400">
            After
          </label>
          <select
            value={afterId}
            onChange={(e) => setAfterId(e.target.value)}
            className="w-full rounded-xl border border-[#262626] bg-black px-3 py-2 text-sm text-white focus:border-[#0066FF] focus:outline-none"
          >
            {sorted.map((p) => (
              <option key={p.id} value={p.id}>
                {formatDate(p.date)}
                {p.weight != null ? ` · ${p.weight}kg` : ""}
              </option>
            ))}
          </select>
          {after ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={after.imageUrl}
              alt="After"
              className="aspect-square w-full rounded-xl object-cover"
            />
          ) : (
            <div className="aspect-square w-full rounded-xl border border-dashed border-[#262626]" />
          )}
        </div>
      </div>

      {(weightDiff !== null || days !== null) && (
        <div className="mt-5 flex gap-4 rounded-xl border border-[#262626] bg-black px-5 py-4">
          {weightDiff !== null && (
            <div className="flex-1 text-center">
              <p className="text-xs text-gray-500">Weight change</p>
              <p
                className={`mt-0.5 text-lg font-semibold ${
                  parseFloat(weightDiff) <= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {parseFloat(weightDiff) > 0 ? "+" : ""}
                {weightDiff} kg
              </p>
            </div>
          )}
          {days !== null && (
            <div className="flex-1 text-center">
              <p className="text-xs text-gray-500">Days apart</p>
              <p className="mt-0.5 text-lg font-semibold text-white">{days}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
