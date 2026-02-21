"use client";
import { useState } from "react";
import axios from "axios";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await axios.post("/api/user/signup", { email, name, password });
      if (res.data.ok) setOk(true);
    } catch (e:any) { setError(e?.response?.data?.error || "Signup failed"); }
  }

  if (ok) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-bold">Account created</h1>
          <p>Continue to onboarding.</p>
          <a href="/onboarding" className="underline">Start onboarding →</a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold">Create your account</h1>
        <form onSubmit={handleSignup} className="space-y-3">
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full p-2 rounded bg-gray-900 border border-gray-700" />
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className="w-full p-2 rounded bg-gray-900 border border-gray-700" />
          <input value={password} type="password" onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full p-2 rounded bg-gray-900 border border-gray-700" />
          <button className="w-full p-2 rounded bg-white text-black font-semibold">Create account</button>
        </form>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    </main>
  );
}
