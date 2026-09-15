import { useState } from 'react'
import { detectSignals } from '../services/apiClient'
import { reportStorage } from '../services/reportStorage'
import type { SignalResponse, SignalRequest } from '../types'

interface UseSignalsResult {
  data: SignalResponse | null
  loading: boolean
  error: string | null
  fetch: (request: SignalRequest) => Promise<void>
  reset: () => void
}

export function useSignals(): UseSignalsResult {
  const [data, setData] = useState<SignalResponse | null>(() => reportStorage.getSignal())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = async (request: SignalRequest) => {
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const result = await detectSignals(request)
      setData(result)
      reportStorage.setSignal(result)
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to fetch signal data. Is the backend running?'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setData(null)
    reportStorage.clearSignal()
    setError(null)
    setLoading(false)
  }

  return { data, loading, error, fetch, reset }
}
