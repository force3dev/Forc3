"use client";
import { useState } from "react";
import axios from "axios";
import Link from "next/link";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setOk(null);
    try {
      const res = await axios.post("/api/user/login", { email, password });
      if (res.data.ok) {
        window.location.href = "/dashboard";
      } else setError("Invalid credentials");
    } catch (e:any) { setError(e?.response?.data?.error || "Login failed"); }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold">FORC3</h1>
        <form onSubmit={handleLogin} className="space-y-3">
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full p-2 rounded bg-gray-900 border border-gray-700" />
          <input value={password} type="password" onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full p-2 rounded bg-gray-900 border border-gray-700" />
          <button className="w-full p-2 rounded bg-white text-black font-semibold">Sign in</button>
        </form>
        <p className="text-sm text-gray-400">No account? <Link href="/signup" className="underline">Create one</Link></p>
      </div>
    </main>
  );
}
