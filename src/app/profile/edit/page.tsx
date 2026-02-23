"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvatarUpload from "@/components/AvatarUpload";

type FormState = {
  displayName: string;
  username: string;
  bio: string;
  avatarUrl: string | null;
};

export default function EditPublicProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    displayName: "",
    username: "",
    bio: "",
    avatarUrl: null,
  });

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) =>
        setForm({
          displayName: d.displayName || d.profile?.name || "",
          username: d.username || "",
          bio: d.bio || "",
          avatarUrl: d.avatarUrl || null,
        })
      )
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: form.displayName || null,
        username: form.username?.replace(/^@/, "") || null,
        bio: form.bio?.slice(0, 150) || null,
        avatarUrl: form.avatarUrl || null,
      }),
    });
    setSaving(false);
    router.push("/profile");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white pb-10">
      <header className="px-6 pt-8 pb-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1a1a] text-neutral-400">
          ←
        </button>
        <h1 className="text-xl font-bold">Edit Profile</h1>
      </header>

      <div className="px-6 space-y-5">
        <AvatarUpload
          name={form.displayName || form.username || "Athlete"}
          value={form.avatarUrl}
          onUploaded={(avatarUrl) => setForm((prev) => ({ ...prev, avatarUrl }))}
        />

        <div>
          <label className="text-xs text-neutral-500">Name</label>
          <input
            value={form.displayName}
            onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
            className="mt-1.5 w-full p-3 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:outline-none focus:border-[#0066FF]"
            placeholder="Ricky Garcia"
          />
        </div>

        <div>
          <label className="text-xs text-neutral-500">Username</label>
          <input
            value={form.username}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
            className="mt-1.5 w-full p-3 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:outline-none focus:border-[#0066FF]"
            placeholder="@ricky"
          />
        </div>

        <div>
          <label className="text-xs text-neutral-500">Bio (150 chars max)</label>
          <textarea
            value={form.bio}
            maxLength={150}
            onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
            className="mt-1.5 w-full p-3 bg-[#0a0a0a] border border-[#262626] rounded-xl min-h-[110px] focus:outline-none focus:border-[#0066FF]"
            placeholder="Hybrid athlete. Training for Ironman."
          />
          <p className="text-xs text-neutral-500 mt-1 text-right">{form.bio.length}/150</p>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-[#0066FF] font-semibold disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </main>
  );
}
