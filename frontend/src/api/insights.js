import { supabase } from './supabase'

export async function getPersonalizedInsight(model) {
  if (import.meta.env.VITE_ENABLE_AI_INSIGHTS !== 'true') {
    throw new Error('AI insights are paused while you test the app.')
  }
  const endpoint = import.meta.env.VITE_PERSONALIZED_INSIGHT_URL
  if (!endpoint) throw new Error('AI insights will be available after the secure insight service is configured.')

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Please sign in before requesting an insight.')

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || 'The insight service is temporarily unavailable.')
  return payload
}
