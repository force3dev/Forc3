"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create the account
      const res = await fetch("/api/user/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }

      // 2. Auto sign-in immediately after account creation
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/onboarding");
      } else {
        // Account was created but auto-login failed — send to login
        router.push("/?created=1");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-1">
          <div className="text-xs font-semibold tracking-widest text-neutral-500">FORCE3</div>
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="text-sm text-neutral-500">Build your program in 2 minutes.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-sm text-neutral-400">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="mt-2 w-full p-4 bg-neutral-900 border border-neutral-800 rounded-xl focus:border-white focus:outline-none transition-colors"
              placeholder="Your name"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="text-sm text-neutral-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-2 w-full p-4 bg-neutral-900 border border-neutral-800 rounded-xl focus:border-white focus:outline-none transition-colors"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-sm text-neutral-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-2 w-full p-4 bg-neutral-900 border border-neutral-800 rounded-xl focus:border-white focus:outline-none transition-colors"
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-900/30 border border-red-800 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 font-semibold rounded-xl transition-all ${
              loading
                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                : "bg-white text-black hover:bg-neutral-200"
            }`}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-sm text-neutral-500 text-center">
          Already have an account?{" "}
          <Link href="/" className="text-white underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
