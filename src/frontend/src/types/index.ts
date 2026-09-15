// Shared TypeScript interfaces for the Drug Safety application

export interface TrendPoint {
  quarter: string
  count: number
}

export interface Signal {
  drug: string
  adverse_event: string
  /** Contingency table cell: reports with target drug AND target event */
  a: number
  /** Contingency table cell: reports with target drug AND other events */
  b: number
  /** Contingency table cell: reports with other drugs AND target event */
  c: number
  /** Contingency table cell: reports with other drugs AND other events */
  d: number
  /** Number of reports with both this drug and this adverse event (= a) */
  report_count: number
  /** Proportional Reporting Ratio */
  prr: number | null
  prr_status: 'defined' | 'undefined_zero_background'
  /** Yates-corrected chi-square */
  chi_square: number
  /** Proportion of drug-X reports that include this AE: a / (a + b) */
  drug_event_proportion: number
  /** Proportion of other-drug reports that include this AE: c / (c + d) */
  comparison_proportion: number
  /**
   * Signal classification: 'signal' | 'weak_signal' | 'no_signal'
   *
   * IMPORTANT: A "signal" is a **Potential Safety Signal** — a statistical
   * association only.  It is NOT a confirmed adverse reaction, confirmed
   * causality, or proof that the drug caused the event.
   */
  signal_level: 'signal' | 'weak_signal' | 'no_signal'
  trend: TrendPoint[]
}

export interface DataQuality {
  total_rows: number
  unique_reports: number
  unique_drugs: number
  unique_adverse_events: number
  unique_drug_event_pairs: number
  missing_date_pct: number
  serious_pct: number
  date_range: Record<string, string>
}

export interface SignalResponse {
  drug_name: string
  total_reports: number
  /**
  * 'faers_processed_csv' = downloaded processed FDA FAERS dataset
   */
  data_source: 'faers_processed_csv' | string
  disclaimer: string
  data_quality?: DataQuality
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

export interface SignalRequest {
  drug_name: string
}
