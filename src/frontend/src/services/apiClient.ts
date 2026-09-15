import axios from 'axios'
import type {
  SignalRequest,
  SignalResponse,
  ReadinessResponse,
} from '../types'

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
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

export default apiClient
