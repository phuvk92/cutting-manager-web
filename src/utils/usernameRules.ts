/**
 * Shared utility functions for username validation and sanitization.
 * Enforces business rules:
 * - Allowed: A-Z, a-z, 0-9, _, - (Regex: ^[A-Za-z0-9_-]+$)
 * - Must contain at least one alphanumeric character
 * - Forbidden: spaces (beginning, end, or inside), special chars, Vietnamese accents, Unicode outside whitelist
 * - Length: 3 to 50 characters
 * - Trims leading and trailing whitespace
 */

import { z } from 'zod'

export const USERNAME_REGEX = /^[A-Za-z0-9_-]+$/
export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 50

/**
 * Trims leading and trailing whitespace from username.
 */
export const trimUsername = (username?: string | null): string => {
  if (username == null) {
    return ''
  }
  return String(username).trim()
}

/**
 * Normalizes optional username for edit scenarios.
 */
export const trimOptionalUsername = (username?: string | null): string | undefined => {
  if (username == null) {
    return undefined
  }
  const trimmed = String(username).trim()
  return trimmed.length > 0 ? trimmed : undefined
}

/**
 * Creates a reusable Zod schema for username validation matching system standard.
 * Accepts string input and outputs trimmed string.
 *
 * @param t i18n translation function
 * @param isOptional boolean flag whether field is optional (e.g., during edit if empty)
 */
export const createUsernameZodSchema = (
  t: (key: string, options?: any) => string,
  isOptional: boolean = false
) => {
  return z
    .string()
    .transform((val) => val.trim())
    .superRefine((val, ctx) => {
      if (!isOptional && !val) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('errors:USERNAME_REQUIRED', {
            defaultValue: 'Tên đăng nhập không được để trống',
          }),
        })
        return
      }
      if (val) {
        if (/\s/.test(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('errors:USERNAME_CONTAINS_WHITESPACE', {
              defaultValue: 'Tên đăng nhập không được chứa khoảng trắng',
            }),
          })
        }
        if (val.length < USERNAME_MIN_LENGTH || val.length > USERNAME_MAX_LENGTH) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('errors:USERNAME_LENGTH_INVALID', {
              defaultValue: `Tên đăng nhập phải từ ${USERNAME_MIN_LENGTH} đến ${USERNAME_MAX_LENGTH} ký tự`,
            }),
          })
        }
        if (!USERNAME_REGEX.test(val) || !/[A-Za-z0-9]/.test(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('errors:USERNAME_INVALID_FORMAT', {
              defaultValue: 'Chỉ được sử dụng chữ cái tiếng Anh, số, dấu gạch dưới (_) và dấu gạch ngang (-)',
            }),
          })
        }
      }
    })
}
