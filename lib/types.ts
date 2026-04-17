export interface Entry {
  id: string
  session_id: string
  raw_text: string
  structured: {
    what: string
    body_part: string | null
    when_it_happened: string
    confirmed_tags: string[]
  } | null
  summary: string | null
  follow_up: string | null
  tags: string[]
  intensity: number | null
  time_of_day: string | null
  supplement_image: string | null
  supplement_assessment: SupplementAssessment | null
  created_at: string
}

export interface SupplementAssessment {
  product_name: string | null
  manufacturer_quality: 'good' | 'concerns' | 'unknown'
  ingredients_summary: string
  red_flags: string[]
  plain_assessment: string
}

export interface AIEntryResponse {
  summary: string
  follow_up: string
  structured: {
    what: string
    body_part: string | null
    when_it_happened: string
    confirmed_tags: string[]
  }
  supplement_assessment?: SupplementAssessment
}

export interface PatternAnalysis {
  overview: string
  recurring_themes: Array<{
    theme: string
    frequency: string
    trend: 'increasing' | 'decreasing' | 'stable'
  }>
  body_areas: Array<{ area: string; count: number }>
  flags: Array<{ message: string; severity: 'info' | 'gentle' }>
  computed_at: string
}

// Export format — PDF for v1. UD export slots in here when ready.
export type ExportFormat = 'pdf' // | 'ud' (coming when Universal Document is live)
