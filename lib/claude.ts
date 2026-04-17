import Anthropic from '@anthropic-ai/sdk'
import type { AIEntryResponse, PatternAnalysis, Entry } from './types'

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export async function processEntry(
  rawText: string,
  tags: string[],
  intensity: number | null,
  timeOfDay: string | null,
  supplementImageBase64: string | null
): Promise<AIEntryResponse> {
  const basePrompt = `You are a calm, non-diagnostic health story assistant. A person has logged a health experience.

Raw input: "${rawText}"
Tags selected: ${tags.length > 0 ? tags.join(', ') : 'none'}
Intensity: ${intensity !== null ? `${intensity}/10` : 'not specified'}
Time of day: ${timeOfDay || 'not specified'}
Logged at: ${new Date().toISOString()}

Return ONLY valid JSON with these exact fields:
{
  "summary": "One calm sentence describing what/where/when. Under 20 words. No medical jargon.",
  "follow_up": "One gentle open question to help them log better next time. Under 15 words.",
  "structured": {
    "what": "brief description of the symptom or experience",
    "body_part": "primary body area or null",
    "when_it_happened": "relative time description",
    "confirmed_tags": ["relevant tags from the input"]
  }
}

Rules: Never diagnose. Never suggest treatments. Never use alarming language. Tone: calm, warm, factual.`

  const supplementPrompt = `\n\nA supplement photo is attached. Also include a "supplement_assessment" field in your JSON:
{
  "product_name": "product name if visible, or null",
  "manufacturer_quality": "good | concerns | unknown",
  "ingredients_summary": "plain language: what is in it and at what doses",
  "red_flags": ["any concerning ingredients, excessive dosages, or labeling issues — empty array if none"],
  "plain_assessment": "2-3 sentences plain-language quality assessment. Non-prescriptive. Manufacturing and ingredient quality only."
}`

  let content: Anthropic.MessageParam['content']

  if (supplementImageBase64) {
    content = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: supplementImageBase64,
        },
      },
      { type: 'text', text: basePrompt + supplementPrompt },
    ]
  } else {
    content = basePrompt
  }

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in Claude response')
  return JSON.parse(jsonMatch[0]) as AIEntryResponse
}

export async function analyzePatterns(entries: Entry[]): Promise<PatternAnalysis> {
  const summaries = entries.slice(0, 60).map(e => ({
    date: new Date(e.created_at).toLocaleDateString('en-GB'),
    summary: e.summary || e.raw_text.slice(0, 120),
    tags: e.tags,
    intensity: e.intensity,
    body_part: e.structured?.body_part ?? null,
  }))

  const response = await getClient().messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `You are analyzing a person's health log for patterns. This is purely for pattern literacy — not diagnosis, not treatment.

Entries (newest first):
${JSON.stringify(summaries, null, 2)}

Return ONLY valid JSON:
{
  "overview": "2-3 calm sentences summarizing what their health story shows overall",
  "recurring_themes": [
    { "theme": "string", "frequency": "e.g. most days, twice a week", "trend": "increasing|decreasing|stable" }
  ],
  "body_areas": [
    { "area": "string", "count": number }
  ],
  "flags": [
    { "message": "gentle flag e.g. 'Gut discomfort has come up most days this week — might be worth mentioning to your doctor'", "severity": "info" }
  ]
}

Rules: Maximum 3 flags. Only flag genuine patterns (3+ occurrences or clear trend). Never diagnose. Never suggest specific treatments. Phrase flags as 'might be worth...' or 'could be useful to mention...'. Tone: warm, curious, supportive.`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in Claude response')
  const analysis = JSON.parse(jsonMatch[0]) as Omit<PatternAnalysis, 'computed_at'>
  return { ...analysis, computed_at: new Date().toISOString() }
}
