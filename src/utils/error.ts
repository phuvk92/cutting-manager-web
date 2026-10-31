import axios, { AxiosError } from 'axios'
import { ErrorResponse } from '@/types/common'
import i18n from '@/i18n'

export interface ParsedApiError {
  message: string
  field?: string
  code?: string
  status?: number
}

/**
 * Sanitizes technical messages to prevent leaking raw Keycloak JSON, stack traces, or internal exceptions.
 */
function sanitizeRawMessage(rawMessage: string): string | null {
  if (!rawMessage || typeof rawMessage !== 'string') return null

  // If rawMessage contains raw Keycloak error JSON or internal exception signatures
  if (
    rawMessage.includes('Keycloak user creation failed') ||
    rawMessage.includes('Keycloak user update failed') ||
    rawMessage.includes('Keycloak username update failed') ||
    rawMessage.includes('HttpClientErrorException') ||
    rawMessage.includes('HttpServerErrorException') ||
    rawMessage.includes('errorMessage":') ||
    rawMessage.includes('error-username-invalid-character') ||
    rawMessage.trim().startsWith('{')
  ) {
    // Attempt to extract errorMessage or error from nested JSON
    const jsonMatch = rawMessage.match(/\{.*\}/s)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        const errKey = parsed.errorMessage || parsed.error || parsed.error_description
        if (errKey && i18n.exists(`codes.${errKey}`, { ns: 'errors' })) {
          return i18n.t(`codes.${errKey}`, { ns: 'errors' })
        }
        if (errKey === 'error-username-invalid-character') {
          return i18n.t('codes.USERNAME_INVALID_FORMAT', { ns: 'errors' })
        }
        if (errKey === 'User exists with same username' || errKey === 'error-username-must-be-unique') {
          return i18n.t('codes.USERNAME_ALREADY_EXISTS', { ns: 'errors' })
        }
        if (errKey === 'User exists with same email' || errKey === 'error-email-must-be-unique') {
          return i18n.t('codes.EMAIL_ALREADY_EXISTS', { ns: 'errors' })
        }
        if (errKey === 'error-email-invalid' || errKey === 'invalidEmailMessage') {
          return i18n.t('codes.EMAIL_INVALID_FORMAT', { ns: 'errors' })
        }
      } catch {
        // ignore parse error
      }
    }
    // Return friendly generic description instead of raw tech stack
    return i18n.t('generic.description', {
      ns: 'errors',
      defaultValue: 'Đã xảy ra lỗi trong quá trình xử lý. Vui lòng thử lại sau.',
    })
  }

  return rawMessage
}

export const extractApiError = (error: unknown, fallbackMessage?: string): ParsedApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>
    const data = axiosError.response?.data
    const status = axiosError.response?.status
    const code = data?.code
    const field = data?.field

    if (code) {
      const codeKey = `codes.${code}`
      if (i18n.exists(codeKey, { ns: 'errors' })) {
        return {
          message: i18n.t(codeKey, { ns: 'errors' }),
          field,
          code,
          status,
        }
      }
      if (i18n.exists(code, { ns: 'errors' })) {
        return {
          message: i18n.t(code, { ns: 'errors' }),
          field,
          code,
          status,
        }
      }
    }

    if (data?.message) {
      const sanitized = sanitizeRawMessage(data.message)
      if (sanitized) {
        return {
          message: sanitized,
          field,
          code,
          status,
        }
      }
    }

    if (data?.error) {
      const sanitized = sanitizeRawMessage(data.error)
      if (sanitized) {
        return {
          message: sanitized,
          field,
          code,
          status,
        }
      }
    }

    if (axiosError.message) {
      if (axiosError.message === 'Network Error') {
        return {
          message: i18n.t('network.message', {
            ns: 'errors',
            defaultValue: 'Network connection error. Please verify backend server is running.',
          }),
          field,
          code: 'NETWORK_ERROR',
          status,
        }
      }
      return {
        message: axiosError.message,
        field,
        code,
        status,
      }
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    }
  }

  if (fallbackMessage) {
    return {
      message: fallbackMessage,
    }
  }

  return {
    message: i18n.t('generic.description', {
      ns: 'errors',
      defaultValue: 'An unexpected error occurred',
    }),
  }
}

export const extractErrorMessage = (error: unknown, fallbackMessage?: string): string => {
  return extractApiError(error, fallbackMessage).message
}
