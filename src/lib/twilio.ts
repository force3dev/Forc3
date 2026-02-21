export function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  // @ts-ignore - twilio types not installed to keep deps light
  const twilio = require("twilio");
  return twilio(sid, token);
}

export async function sendSms(to: string, body: string) {
  const client = getTwilioClient();
  if (!client || !process.env.TWILIO_FROM_NUMBER) {
    console.warn("Twilio not configured; skipping SMS:", body);
    return;
  }
  await client.messages.create({ to, from: process.env.TWILIO_FROM_NUMBER, body });
}
