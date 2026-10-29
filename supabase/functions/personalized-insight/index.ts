import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') ?? 'http://localhost:5174',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders })

function safeModelSummary(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const input = value as Record<string, unknown>
  const metrics = input.metrics && typeof input.metrics === 'object' ? input.metrics : {}
  const recommendations = Array.isArray(input.recommendations)
    ? input.recommendations.filter((item): item is string => typeof item === 'string').slice(0, 5)
    : []

  return {
    score: Number.isFinite(Number(input.score)) ? Number(input.score) : 0,
    focus: String(input.focus ?? '').slice(0, 120),
    primaryGoal: String(input.primaryGoal ?? '').slice(0, 120),
    metrics,
    recommendations,
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authorization } } },
  )
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return json({ error: 'Authentication required' }, 401)

  const payload = await request.json().catch(() => null)
  const model = safeModelSummary(payload?.model)
  if (!model) return json({ error: 'A valid model summary is required' }, 400)

  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) return json({ error: 'AI insights are not configured yet' }, 503)

  const prompt = [
    'You are Paisa, a personal finance reflection assistant.',
    'Use only the supplied, already-aggregated user model. Do not invent transactions, income, balances, or risks.',
    'Give a concise, plain-language reflection with 2 practical next steps.',
    'Do not provide investment, tax, lending, or other regulated financial advice. Remind the user this is educational guidance based on incomplete records.',
    `Model summary: ${JSON.stringify(model)}`,
  ].join('\n')

  const openAIResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_INSIGHT_MODEL') ?? 'gpt-4o-mini',
      input: prompt,
      max_output_tokens: 220,
    }),
  })

  if (!openAIResponse.ok) {
    console.error('OpenAI insight request failed', openAIResponse.status)
    return json({ error: 'The insight service is temporarily unavailable' }, 502)
  }

  const result = await openAIResponse.json()
  const insight = result.output
    ?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content ?? [])
    .map((part: { text?: string }) => part.text ?? '')
    .join(' ')
    .trim()

  if (!insight) return json({ error: 'The insight service returned no usable text' }, 502)
  return json({ insight, generated_by: 'openai', model_score: model.score })
})
