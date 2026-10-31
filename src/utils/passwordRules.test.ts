import { describe, it, expect } from 'vitest'
import {
  trimPassword,
  trimOptionalPassword,
  PASSWORD_REGEX,
} from './passwordRules'

describe('passwordRules utility', () => {
  describe('trimPassword', () => {
    it('returns empty string for null or undefined', () => {
      expect(trimPassword(null)).toBe('')
      expect(trimPassword(undefined)).toBe('')
      expect(trimPassword('')).toBe('')
    })

    it('trims leading and trailing spaces', () => {
      expect(trimPassword('  Abc@123  ')).toBe('Abc@123')
      expect(trimPassword('Abc@123  ')).toBe('Abc@123')
      expect(trimPassword('  Abc@123')).toBe('Abc@123')
      expect(trimPassword('\tAbc@123\n')).toBe('Abc@123')
    })

    it('preserves internal whitespace', () => {
      expect(trimPassword('  Abc 123 !@#  ')).toBe('Abc 123 !@#')
      expect(trimPassword('A B C 1 2 3 ! @ #')).toBe('A B C 1 2 3 ! @ #')
    })

    it('preserves case and special characters', () => {
      expect(trimPassword('  pAsSwOrD!@#$%^&*()_+{}[]:;  ')).toBe('pAsSwOrD!@#$%^&*()_+{}[]:;')
    })

    it('returns empty string for whitespace-only strings', () => {
      expect(trimPassword('   ')).toBe('')
      expect(trimPassword(' \t \n ')).toBe('')
    })
  })

  describe('trimOptionalPassword', () => {
    it('returns undefined for null, undefined, empty, or whitespace-only', () => {
      expect(trimOptionalPassword(null)).toBeUndefined()
      expect(trimOptionalPassword(undefined)).toBeUndefined()
      expect(trimOptionalPassword('')).toBeUndefined()
      expect(trimOptionalPassword('   ')).toBeUndefined()
      expect(trimOptionalPassword(' \t \r \n ')).toBeUndefined()
    })

    it('returns trimmed string when non-blank', () => {
      expect(trimOptionalPassword('  NewPassword123!  ')).toBe('NewPassword123!')
      expect(trimOptionalPassword('  New Pass 123!  ')).toBe('New Pass 123!')
    })
  })

  describe('PASSWORD_REGEX validation', () => {
    it('accepts valid complex passwords', () => {
      expect(PASSWORD_REGEX.test('Password123!')).toBe(true)
      expect(PASSWORD_REGEX.test('Abc 123 !@#')).toBe(true)
    })

    it('rejects passwords without special character', () => {
      expect(PASSWORD_REGEX.test('Password123')).toBe(false)
    })

    it('rejects passwords without uppercase', () => {
      expect(PASSWORD_REGEX.test('password123!')).toBe(false)
    })

    it('rejects passwords without lowercase', () => {
      expect(PASSWORD_REGEX.test('PASSWORD123!')).toBe(false)
    })

    it('rejects passwords without digit', () => {
      expect(PASSWORD_REGEX.test('Password!!!!')).toBe(false)
    })

    it('rejects passwords shorter than 8 characters', () => {
      expect(PASSWORD_REGEX.test('P1!a')).toBe(false)
    })
  })
})
