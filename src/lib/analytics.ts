type AnalyticsEvent =
  | 'page_view'
  | 'signup_started'
  | 'signup_completed'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'program_generated'
  | 'workout_started'
  | 'workout_completed'
  | 'food_logged'
  | 'coach_message_sent'
  | 'upgrade_page_viewed'
  | 'checkout_started'
  | 'subscription_started'
  | 'subscription_cancelled'
  | 'pr_achieved'
  | 'streak_milestone'
  | 'app_installed'
  | 'strava_connected'

export async function track(event: AnalyticsEvent, properties?: Record<string, any>) {
  try {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, properties, timestamp: Date.now() })
    }).catch(() => {})
  } catch {}
}
