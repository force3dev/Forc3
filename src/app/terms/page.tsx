import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — FORC3',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-3xl font-black block mb-12">
          <span className="text-[#0066FF]">FORC</span>3
        </Link>
        <h1 className="text-4xl font-black mb-4">Terms of Service</h1>
        <p className="text-gray-400 mb-12">Last updated: January 2025</p>

        {[
          {
            title: 'Acceptance of Terms',
            content: 'By using FORC3, you agree to these Terms of Service. If you do not agree to these terms, please do not use the service.'
          },
          {
            title: 'Service Description',
            content: 'FORC3 is an AI-powered fitness coaching application. We provide AI-generated training programs, nutrition guidance, and coaching conversations. FORC3 is not a medical service and does not provide medical advice.'
          },
          {
            title: 'Acceptable Use',
            content: 'You agree to use FORC3 only for lawful purposes. You must not share your account, attempt to access other users\' data, or use the service to generate harmful content. Violation of these terms may result in immediate account termination.'
          },
          {
            title: 'Health Disclaimer',
            content: 'FORC3 provides general fitness and nutrition information. This is NOT medical advice. Consult with a qualified healthcare professional before starting any new exercise program, especially if you have existing medical conditions, injuries, or health concerns. You exercise at your own risk.'
          },
          {
            title: 'Subscriptions and Billing',
            content: 'Free accounts are available with limited features. Premium subscriptions are billed monthly or annually. You may cancel at any time from Settings. Cancellation takes effect at the end of the current billing period. We do not provide partial refunds. Annual plan refunds are available within 14 days of purchase.'
          },
          {
            title: 'Free Trial',
            content: 'New users receive a 7-day free trial of premium features. No credit card is required. After the trial, access reverts to the free plan unless you choose to subscribe.'
          },
          {
            title: 'Intellectual Property',
            content: 'The FORC3 application, including all AI models, training algorithms, and software code, is owned by FORC3. Your personal data and workout history remains yours. You grant FORC3 a license to use anonymized, aggregated data to improve the service.'
          },
          {
            title: 'Limitation of Liability',
            content: 'FORC3 is provided "as is". We are not liable for any injuries, health issues, or damages resulting from use of our service. Our maximum liability to you for any claim shall not exceed the amount you paid in the 12 months prior to the claim.'
          },
          {
            title: 'Changes to Terms',
            content: 'We may update these terms from time to time. We will notify you of significant changes via email or in-app notification. Continued use of FORC3 after changes constitutes acceptance of the new terms.'
          },
          {
            title: 'Contact',
            content: 'For questions about these terms, contact us at legal@forc3.app'
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
