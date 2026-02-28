// 현휘 분석 타입 정의

export interface GlareResult {
  file: string
  average: number
  max: number
  min: number
  dgp: number
  dgi: number
  contrast: number
  disability: number
  dgp_rating: string
  dgi_rating: string
  viewp?: string
  month?: string
  time?: string
  date_label?: string
}

export interface GlareSummary {
  total: number
  disability_count: number
  average_dgp: number
  max_dgp: number
  average_luminance: number
  max_luminance: number
}

export interface GlareRatings {
  dgp: Record<string, number>
  dgi: Record<string, number>
}

export interface AnalysisResponse {
  results: GlareResult[]
  summary: GlareSummary
  ratings: GlareRatings
}
