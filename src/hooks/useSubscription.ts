"use client";
import { useEffect, useState } from "react";
import { canAccess, type Feature, type SubscriptionTier } from "@/lib/subscription/tiers";

interface SubscriptionData {
  tier: SubscriptionTier;
  status: string;
  trialEnd: string | null;
}

export function useSubscription() {
  const [sub, setSub] = useState<SubscriptionData>({ tier: "free", status: "active", trialEnd: null });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile")
      .then(r => r.json())
      .then(d => {
        if (d.subscription) {
          setSub({
            tier: d.subscription.tier || "free",
            status: d.subscription.status || "active",
            trialEnd: d.subscription.trialEnd || null,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const isInTrial = sub.trialEnd !== null && new Date(sub.trialEnd) > new Date();
  const effectiveTier: SubscriptionTier = isInTrial ? "pro" : sub.tier;

  return {
    tier: effectiveTier,
    status: sub.status,
    isInTrial,
    trialEnd: sub.trialEnd,
    loaded,
    can: (feature: Feature) => canAccess(effectiveTier, feature),
  };
}
