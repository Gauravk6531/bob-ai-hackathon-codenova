// Shared TypeScript interfaces for the Drug Safety application

export interface TrendPoint {
  quarter: string
  count: number
}

export interface Signal {
  drug: string
  adverse_event: string
  report_count: number
  prr: number
  chi_square: number
  signal_level: 'signal' | 'weak_signal' | 'no_signal'
  trend: TrendPoint[]
}

export interface SignalResponse {
  drug_name: string
  total_reports: number
  signals: Signal[]
}

export interface ModuleCompleteness {
  module: string
  title: string
  completeness_pct: number
  matched: number
  total_required: number
}

export interface GapItem {
  section_id: string
  module: string
  title: string
  required: boolean
  priority: 'high' | 'medium' | 'low'
}

export interface ReadinessResponse {
  filename: string
  overall_completeness_pct: number
  module_scores: ModuleCompleteness[]
  gaps: GapItem[]
  matched_sections: string[]
}

export interface AIExplainRequest {
  mode: 'signals' | 'readiness'
  context: string
}

export interface AIExplainResponse {
  explanation: string
  disclaimer: string
  source: 'watsonx' | 'fallback'
}

export interface SignalRequest {
  drug_name: string
  start_year?: number
  end_year?: number
}
