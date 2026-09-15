import { useState } from 'react'
import { checkReadiness } from '../services/apiClient'
import type { ReadinessResponse } from '../types'

interface UseReadinessResult {
  data: ReadinessResponse | null
  loading: boolean
  error: string | null
  check: (file: File) => Promise<void>
  reset: () => void
}

export function useReadiness(): UseReadinessResult {
  const [data, setData] = useState<ReadinessResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const check = async (file: File) => {
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const result = await checkReadiness(file)
      setData(result)
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to check readiness. Is the backend running?'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setData(null)
    setError(null)
    setLoading(false)
  }

  return { data, loading, error, check, reset }
}
