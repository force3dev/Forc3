import webpush from "web-push";

// Lazy-init VAPID so missing keys don't crash the build
let vapidInitialized = false;
function ensureVapid() {
  if (vapidInitialized) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) throw new Error("VAPID keys not configured");
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:support@forc3.app",
    pub,
    priv
  );
  vapidInitialized = true;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<void> {
  ensureVapid();
  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    },
    JSON.stringify({ ...payload, icon: payload.icon ?? "/icon-192.png" })
  );
}
