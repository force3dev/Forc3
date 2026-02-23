import { Resend } from 'resend'

// Lazy-init so missing key doesn't crash the build
let resend: Resend | null = null;
function getResend(): Resend {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set, skipping email to', to)
    return
  }
  await getResend().emails.send({
    from: process.env.FROM_EMAIL || 'coach@forc3.app',
    to,
    subject,
    html,
  })
}
