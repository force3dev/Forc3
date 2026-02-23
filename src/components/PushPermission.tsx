"use client";

import { useEffect, useState } from "react";

export default function PushPermission() {
  const [visible, setVisible] = useState(false);
  const [denied, setDenied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const asked = localStorage.getItem("push_permission_asked");
    if (!asked) setVisible(true);
  }, []);

  if (!visible) return null;

  async function handleEnable() {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });
        const p256dh = btoa(
          String.fromCharCode(
            ...new Uint8Array(subscription.getKey("p256dh") as ArrayBuffer)
          )
        );
        const auth = btoa(
          String.fromCharCode(
            ...new Uint8Array(subscription.getKey("auth") as ArrayBuffer)
          )
        );
        await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint, p256dh, auth }),
        });
      } else {
        setDenied(true);
      }
    } catch {
      setDenied(true);
    } finally {
      localStorage.setItem("push_permission_asked", "true");
      setLoading(false);
      if (!denied) setVisible(false);
    }
  }

  function handleDismiss() {
    localStorage.setItem("push_permission_asked", "true");
    setVisible(false);
  }

  return (
    <div
      className="animate-fade-in rounded-2xl border border-[#262626] bg-[#141414] p-6 shadow-lg"
      style={{ animation: "fadeIn 0.4s ease both" }}
    >
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <h2 className="mb-1 text-lg font-semibold text-white">
        Never miss a workout 💪
      </h2>
      <p className="mb-5 text-sm text-gray-400">
        Get your daily coaching brief every morning
      </p>

      {denied ? (
        <p className="text-xs text-gray-500">
          You can enable notifications in browser settings anytime.
        </p>
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={handleEnable}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#0066FF] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
          >
            {loading && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Enable Notifications
          </button>
          <button
            onClick={handleDismiss}
            className="text-sm text-gray-500 hover:text-gray-300"
          >
            Not now
          </button>
        </div>
      )}
    </div>
  );
}
