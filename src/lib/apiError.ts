import axios from 'axios'

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ error?: string; message?: string }>(error)) {
    return error.response?.data?.error || error.response?.data?.message || fallback
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}
