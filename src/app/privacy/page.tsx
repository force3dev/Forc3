import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — FORC3',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-3xl font-black block mb-12">
          <span className="text-[#0066FF]">FORC</span>3
        </Link>
        <h1 className="text-4xl font-black mb-4">Privacy Policy</h1>
        <p className="text-gray-400 mb-12">Last updated: January 2025</p>

        {[
          {
            title: 'What we collect',
            content: 'We collect information you provide (name, email, fitness data) and data from connected services (Apple Health, Strava) only with your explicit permission. We collect usage analytics to improve the product.'
          },
          {
            title: 'How we use your data',
            content: 'Your health and fitness data is used exclusively to power your AI coaching experience. We never sell your personal data to third parties. AI coaching is powered by Anthropic\'s Claude API — your conversations are processed to generate responses but are not used to train AI models.'
          },
          {
            title: 'Data storage',
            content: 'Your data is stored securely in our database hosted by Supabase. Passwords are hashed with bcrypt and never stored in plain text. We use industry-standard encryption for data in transit and at rest.'
          },
          {
            title: 'Third-party services',
            content: 'We use Stripe for payment processing, Resend for emails, and Anthropic\'s Claude for AI features. Each of these services has their own privacy policy which we encourage you to review.'
          },
          {
            title: 'Your rights',
            content: 'You can export all your data or delete your account at any time from Settings. Upon deletion, all personal data is permanently removed from our systems within 30 days. We will respond to all data requests within 30 days.'
          },
          {
            title: 'Cookies',
            content: 'We use a single session cookie (forc3_session) for authentication. We do not use tracking cookies or third-party advertising cookies.'
          },
          {
            title: 'Contact',
            content: 'For any privacy questions, contact us at privacy@forc3.app'
          },
        ].map(section => (
          <div key={section.title} className="mb-10">
            <h2 className="text-xl font-bold mb-3">{section.title}</h2>
            <p className="text-gray-400 leading-relaxed">{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
