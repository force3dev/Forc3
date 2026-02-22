"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SetUsernamePage() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const checkUsername = async (value: string) => {
    if (value.length < 3) { setAvailable(null); return; }
    setChecking(true);
    const res = await fetch(`/api/user/check-username?username=${encodeURIComponent(value)}`);
    const data = await res.json();
    setAvailable(data.available);
    setChecking(false);
  };

  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    setUsername(cleaned);
    setAvailable(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => checkUsername(cleaned), 500);
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handleSubmit = async () => {
    if (!available) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/user/set-username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, displayName }),
    });
    if (res.ok) {
      router.push("/onboarding");
    } else {
      const d = await res.json();
      setError(d.error || "Failed to save");
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full"
      >
        <div className="text-xs font-bold tracking-widest text-[#0066FF] mb-6">FORC3</div>
        <h1 className="text-3xl font-bold mb-2">Create your profile</h1>
        <p className="text-neutral-500 mb-8">Choose a unique username for your FORC3 handle.</p>

        {/* Display Name */}
        <div className="mb-5">
          <label className="text-sm text-neutral-400 mb-2 block">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="John Doe"
            className="w-full bg-[#141414] border border-[#262626] rounded-xl px-4 py-4 text-lg focus:border-[#0066FF] focus:outline-none"
          />
        </div>

        {/* Username */}
        <div className="mb-6">
          <label className="text-sm text-neutral-400 mb-2 block">Username</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">@</span>
            <input
              type="text"
              value={username}
              onChange={e => handleUsernameChange(e.target.value)}
              placeholder="username"
              autoFocus
              className="w-full bg-[#141414] border border-[#262626] rounded-xl pl-9 pr-12 py-4 text-lg focus:border-[#0066FF] focus:outline-none"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl">
              {checking && <span className="text-neutral-500 text-sm">...</span>}
              {!checking && available === true && <span className="text-[#00C853]">✓</span>}
              {!checking && available === false && <span className="text-red-500">✗</span>}
            </span>
          </div>
          {available === false && username.length >= 3 && (
            <p className="text-red-500 text-sm mt-2">Username is taken</p>
          )}
          <p className="text-neutral-600 text-xs mt-2">3–20 characters, letters, numbers, underscores only</p>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <p className="text-neutral-600 text-sm mb-8">
          Your username is how others will find and follow you.
        </p>
      </motion.div>

      <div className="max-w-sm mx-auto w-full">
        <button
          onClick={handleSubmit}
          disabled={!available || !displayName.trim() || saving}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            available && displayName.trim() && !saving
              ? "bg-[#0066FF] text-white hover:bg-[#0052CC]"
              : "bg-[#141414] text-neutral-600 cursor-not-allowed border border-[#262626]"
          }`}
        >
          {saving ? "Saving..." : "Continue"}
        </button>
        <button
          onClick={() => router.push("/onboarding")}
          className="w-full py-3 text-neutral-600 text-sm mt-2"
        >
          Skip for now
        </button>
      </div>
    </main>
  );
}
