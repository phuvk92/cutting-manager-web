import axios, { AxiosError } from 'axios'
import { ErrorResponse } from '@/types/common'
import i18n from '@/i18n'

export const extractErrorMessage = (error: unknown, fallbackMessage?: string): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>
    const code = axiosError.response?.data?.code
    if (code) {
      const codeKey = `codes.${code}`
      if (i18n.exists(codeKey, { ns: 'errors' })) {
        return i18n.t(codeKey, { ns: 'errors' })
      }
    }
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message
    }
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error
    }
    if (axiosError.message) {
      if (axiosError.message === 'Network Error') {
        return i18n.t('network.message', {
          ns: 'errors',
          defaultValue: 'Network connection error. Please verify backend server is running.',
        })
      }
      return axiosError.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  if (fallbackMessage) {
    return fallbackMessage
  }

  return i18n.t('generic.description', {
    ns: 'errors',
    defaultValue: 'An unexpected error occurred',
  })
}
