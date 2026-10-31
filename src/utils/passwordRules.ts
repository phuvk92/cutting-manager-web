/**
 * Shared utility functions for password input handling and sanitization.
 * Enforces business rules:
 * - Trims leading and trailing whitespace from passwords.
 * - Retains internal whitespace, casing, and special characters.
 * - Never logs passwords.
 */

/**
 * Standard password complexity regex:
 * At least 8 characters, at least 1 lowercase, 1 uppercase, 1 digit, 1 special character.
 */
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

/**
 * Normalizes password by trimming leading and trailing whitespaces.
 * Retains internal spaces, casing, and special characters.
 *
 * @param password raw password input
 * @returns trimmed password string
 */
export const trimPassword = (password?: string | null): string => {
  if (password == null) {
    return ''
  }
  return String(password).trim()
}

/**
 * Normalizes optional password for edit/update scenarios:
 * - Returns undefined if input is null, undefined, empty, or whitespace-only (indicating unchanged password).
 * - Returns trimmed password if non-blank.
 *
 * @param password raw password input
 * @returns trimmed password or undefined
 */
export const trimOptionalPassword = (password?: string | null): string | undefined => {
  if (password == null) {
    return undefined
  }
  const trimmed = String(password).trim()
  return trimmed.length > 0 ? trimmed : undefined
}
