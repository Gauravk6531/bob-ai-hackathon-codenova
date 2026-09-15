import axios from 'axios'
import type {
  SignalRequest,
  SignalResponse,
  ReadinessResponse,
  AIExplainRequest,
  AIExplainResponse,
} from '../types'

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function detectSignals(request: SignalRequest): Promise<SignalResponse> {
  const { data } = await apiClient.post<SignalResponse>('/signals', request)
  return data
}

export async function checkReadiness(file: File): Promise<ReadinessResponse> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await apiClient.post<ReadinessResponse>('/readiness', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function getAIExplanation(request: AIExplainRequest): Promise<AIExplainResponse> {
  const { data } = await apiClient.post<AIExplainResponse>('/ai/explain', request)
  return data
}

export default apiClient
