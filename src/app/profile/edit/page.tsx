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
  const [originalUsername, setOriginalUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "error">("idle");

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => {
        const u = d.username || "";
        setForm({
          displayName: d.displayName || d.profile?.name || "",
          username: u,
          bio: d.bio || "",
          avatarUrl: d.avatarUrl || null,
        });
        setOriginalUsername(u);
      })
      .finally(() => setLoading(false));
  }, []);

  // Debounced username availability check
  useEffect(() => {
    if (!form.username || form.username === originalUsername) {
      setUsernameStatus("idle");
      return;
    }
    if (form.username.length < 3) {
      setUsernameStatus("error");
      return;
    }

    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/user/username?username=${encodeURIComponent(form.username)}`);
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
      } catch {
        setUsernameStatus("error");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.username, originalUsername]);

  async function save() {
    setSaving(true);

    // Save username separately if changed
    if (form.username && form.username !== originalUsername && usernameStatus === "available") {
      await fetch("/api/user/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.username }),
      });
    }

    // Save other profile fields
    await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: form.displayName || null,
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
          <div className="relative">
            <input
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
              className="mt-1.5 w-full p-3 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:outline-none focus:border-[#0066FF] pr-10"
              placeholder="username"
              autoCorrect="off"
              autoCapitalize="off"
            />
            <span className="absolute right-3 top-1/2 translate-y-0.5">
              {usernameStatus === "checking" && <span className="text-neutral-400 text-sm">...</span>}
              {usernameStatus === "available" && <span className="text-green-400">✓</span>}
              {usernameStatus === "taken" && <span className="text-red-400">✗</span>}
              {usernameStatus === "error" && <span className="text-yellow-400">!</span>}
            </span>
          </div>
          {usernameStatus === "taken" && <p className="text-red-400 text-xs mt-1">Username taken</p>}
          {usernameStatus === "available" && <p className="text-green-400 text-xs mt-1">Available!</p>}
          {usernameStatus === "error" && form.username.length > 0 && form.username.length < 3 && (
            <p className="text-yellow-400 text-xs mt-1">Min 3 characters</p>
          )}
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
          disabled={saving || usernameStatus === "taken"}
          className="w-full py-3 rounded-xl bg-[#0066FF] font-semibold disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </main>
  );
}
