import axios, { AxiosError } from 'axios'
import { ErrorResponse } from '@/types/common'

export const extractErrorMessage = (error: unknown, fallbackMessage = 'An unexpected error occurred'): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message
    }
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error
    }
    if (axiosError.message) {
      if (axiosError.message === 'Network Error') {
        return 'Network connection error. Please verify backend server is running.'
      }
      return axiosError.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallbackMessage
}
