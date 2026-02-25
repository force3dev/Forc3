"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface CheckResult {
  status: string;
  message?: string;
  note?: string;
}

interface NutritionChecks {
  openFoodFacts: CheckResult;
  usda: CheckResult;
  nutritionix: CheckResult;
  edamam: CheckResult;
  calorieNinjas: CheckResult;
  fatSecret: CheckResult;
}

interface HealthData {
  overall: string;
  timestamp: string;
  checks: {
    database: CheckResult;
    claude: CheckResult;
    supabase: CheckResult;
    stripe: CheckResult;
    nutrition: NutritionChecks;
    exerciseDB: CheckResult;
    strava: CheckResult;
    pushNotifications: CheckResult;
    email: CheckResult;
  };
}

function StatusBadge({ status }: { status: string }) {
  const isOk = status === "ok";
  const isMissing = status === "missing";
  const isInvalid = status === "invalid";
  const isError = status === "error";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
        isOk
          ? "bg-green-500/20 text-green-400"
          : isMissing
          ? "bg-yellow-500/20 text-yellow-400"
          : isError || isInvalid
          ? "bg-red-500/20 text-red-400"
          : "bg-neutral-500/20 text-neutral-400"
      }`}
    >
      {isOk ? "✓" : isMissing ? "⚠" : "✕"} {status.toUpperCase()}
    </span>
  );
}

function CheckRow({
  label,
  check,
  icon,
}: {
  label: string;
  check: CheckResult;
  icon: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a] last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          {check.message && (
            <p className="text-xs text-neutral-500 mt-0.5">{check.message}</p>
          )}
          {check.note && (
            <p className="text-xs text-neutral-600 mt-0.5 italic">{check.note}</p>
          )}
        </div>
      </div>
      <StatusBadge status={check.status} />
    </div>
  );
}

export default function ApiStatusPage() {
  const router = useRouter();
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/system-health");
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const overallOk = data?.overall === "HEALTHY";

  return (
    <main className="min-h-screen bg-black text-white pb-10">
      <header className="px-5 pt-8 pb-4 border-b border-[#1a1a1a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <div>
            <p className="text-xs text-[#0066FF] font-bold tracking-widest uppercase">
              Admin
            </p>
            <h1 className="text-lg font-bold">API Status Dashboard</h1>
          </div>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="px-4 py-2 bg-[#141414] border border-[#262626] text-sm font-semibold rounded-xl disabled:opacity-50 hover:border-[#0066FF]/50 transition-colors"
        >
          {loading ? "Checking..." : "↻ Refresh"}
        </button>
      </header>

      <div className="px-5 py-5 space-y-5">
        {/* Overall status banner */}
        <div
          className={`rounded-2xl p-4 border ${
            loading
              ? "bg-[#141414] border-[#262626]"
              : overallOk
              ? "bg-green-500/10 border-green-500/30"
              : "bg-yellow-500/10 border-yellow-500/30"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">
              {loading ? "⏳" : overallOk ? "✅" : "⚠️"}
            </span>
            <div>
              <p className="font-black text-lg">
                {loading
                  ? "Checking systems..."
                  : overallOk
                  ? "All Core Systems Healthy"
                  : "Some APIs Need Configuration"}
              </p>
              {lastRefresh && (
                <p className="text-xs text-neutral-500 mt-0.5">
                  Last checked:{" "}
                  {lastRefresh.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {data && !loading && (
          <>
            {/* Core services */}
            <section className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1a1a1a]">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                  Core Services
                </p>
              </div>
              <div className="px-4">
                <CheckRow label="Database" check={data.checks.database} icon="🗄️" />
                <CheckRow label="Claude AI Coach" check={data.checks.claude} icon="🤖" />
                <CheckRow label="Supabase Storage" check={data.checks.supabase} icon="☁️" />
                <CheckRow label="Stripe Payments" check={data.checks.stripe} icon="💳" />
              </div>
            </section>

            {/* Nutrition APIs */}
            <section className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1a1a1a]">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                  Nutrition APIs (6 sources)
                </p>
              </div>
              <div className="px-4">
                <CheckRow
                  label="Open Food Facts"
                  check={data.checks.nutrition.openFoodFacts}
                  icon="🥫"
                />
                <CheckRow
                  label="USDA FoodData Central"
                  check={data.checks.nutrition.usda}
                  icon="🥗"
                />
                <CheckRow
                  label="Nutritionix (NLP)"
                  check={data.checks.nutrition.nutritionix}
                  icon="🍔"
                />
                <CheckRow
                  label="Edamam (Recipes)"
                  check={data.checks.nutrition.edamam}
                  icon="🍽️"
                />
                <CheckRow
                  label="CalorieNinjas"
                  check={data.checks.nutrition.calorieNinjas}
                  icon="🥦"
                />
                <CheckRow
                  label="FatSecret (Restaurants)"
                  check={data.checks.nutrition.fatSecret}
                  icon="🍕"
                />
              </div>
            </section>

            {/* Integrations */}
            <section className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1a1a1a]">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                  Integrations
                </p>
              </div>
              <div className="px-4">
                <CheckRow
                  label="ExerciseDB (GIFs)"
                  check={data.checks.exerciseDB}
                  icon="💪"
                />
                <CheckRow label="Strava" check={data.checks.strava} icon="🏃" />
                <CheckRow
                  label="Push Notifications"
                  check={data.checks.pushNotifications}
                  icon="🔔"
                />
                <CheckRow label="Email (Resend)" check={data.checks.email} icon="📧" />
              </div>
            </section>

            {/* Setup guide link */}
            <div className="bg-[#0066FF]/10 border border-[#0066FF]/30 rounded-2xl p-4">
              <p className="text-sm font-bold text-[#0066FF] mb-1">
                Missing keys?
              </p>
              <p className="text-xs text-neutral-400">
                Check{" "}
                <span className="font-mono text-neutral-300">
                  API_KEYS_NEEDED.md
                </span>{" "}
                in the project root for exact setup instructions for every API.
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
