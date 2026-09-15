import type { ReadinessResponse, SignalResponse } from '../types'

const SIGNAL_KEY = 'drug-safety:last-signal-analysis'
const READINESS_KEY = 'drug-safety:last-readiness-analysis'

function read<T>(key: string): T | null {
  try {
    const value = sessionStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : null
  } catch {
    return null
  }
}

function write<T>(key: string, value: T) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Browser storage may be unavailable; in-memory state still works.
  }
}

function remove(key: string) {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // Ignore unavailable browser storage.
  }
}

export const reportStorage = {
  getSignal: () => read<SignalResponse>(SIGNAL_KEY),
  setSignal: (value: SignalResponse) => write(SIGNAL_KEY, value),
  clearSignal: () => remove(SIGNAL_KEY),
  getReadiness: () => read<ReadinessResponse>(READINESS_KEY),
  setReadiness: (value: ReadinessResponse) => write(READINESS_KEY, value),
  clearReadiness: () => remove(READINESS_KEY),
}