import { describe, it, expect } from 'vitest'
import {
  trimUsername,
  trimOptionalUsername,
  createUsernameZodSchema,
  USERNAME_REGEX,
} from './usernameRules'

describe('usernameRules', () => {
  const dummyT = (_key: string, opts?: any) => opts?.defaultValue || _key

  describe('trimUsername', () => {
    it('trims leading and trailing spaces', () => {
      expect(trimUsername('  admin123  ')).toBe('admin123')
      expect(trimUsername('admin123')).toBe('admin123')
    })

    it('returns empty string for null or undefined', () => {
      expect(trimUsername(null)).toBe('')
      expect(trimUsername(undefined)).toBe('')
    })
  })

  describe('trimOptionalUsername', () => {
    it('returns undefined for empty or blank strings', () => {
      expect(trimOptionalUsername('')).toBeUndefined()
      expect(trimOptionalUsername('   ')).toBeUndefined()
      expect(trimOptionalUsername(null)).toBeUndefined()
      expect(trimOptionalUsername(undefined)).toBeUndefined()
    })

    it('returns trimmed string for non-blank', () => {
      expect(trimOptionalUsername('  admin123  ')).toBe('admin123')
    })
  })

  describe('USERNAME_REGEX', () => {
    it('matches valid usernames', () => {
      expect(USERNAME_REGEX.test('admin123')).toBe(true)
      expect(USERNAME_REGEX.test('Admin123')).toBe(true)
      expect(USERNAME_REGEX.test('admin_123')).toBe(true)
      expect(USERNAME_REGEX.test('admin-123')).toBe(true)
      expect(USERNAME_REGEX.test('AGENT_001')).toBe(true)
    })

    it('rejects invalid usernames', () => {
      expect(USERNAME_REGEX.test('user 123')).toBe(false)
      expect(USERNAME_REGEX.test('user@123')).toBe(false)
      expect(USERNAME_REGEX.test('user#123')).toBe(false)
      expect(USERNAME_REGEX.test('user.name')).toBe(false)
      expect(USERNAME_REGEX.test('người_dùng')).toBe(false)
      expect(USERNAME_REGEX.test('user!123')).toBe(false)
    })
  })

  describe('createUsernameZodSchema (mandatory)', () => {
    const schema = createUsernameZodSchema(dummyT, false)

    it('accepts valid usernames', () => {
      expect(schema.safeParse('admin123').success).toBe(true)
      expect(schema.safeParse('  admin123  ').success).toBe(true)
      expect(schema.safeParse('Admin_123').success).toBe(true)
      expect(schema.safeParse('user-test').success).toBe(true)
    })

    it('rejects empty or whitespace-only', () => {
      expect(schema.safeParse('').success).toBe(false)
      expect(schema.safeParse('   ').success).toBe(false)
    })

    it('rejects internal whitespace', () => {
      const res = schema.safeParse('user 123')
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('khoảng trắng')
      }
    })

    it('rejects length < 3 or > 50', () => {
      expect(schema.safeParse('ab').success).toBe(false)
      expect(schema.safeParse('a'.repeat(51)).success).toBe(false)
    })

    it('rejects special characters, dots, and accents', () => {
      expect(schema.safeParse('user@123').success).toBe(false)
      expect(schema.safeParse('user#123').success).toBe(false)
      expect(schema.safeParse('user.name').success).toBe(false)
      expect(schema.safeParse('người_dùng').success).toBe(false)
    })

    it('rejects symbols only (no alphanumeric)', () => {
      expect(schema.safeParse('___').success).toBe(false)
      expect(schema.safeParse('---').success).toBe(false)
      expect(schema.safeParse('_-_').success).toBe(false)
    })
  })

  describe('createUsernameZodSchema (optional)', () => {
    const schema = createUsernameZodSchema(dummyT, true)

    it('accepts empty/omitted username', () => {
      expect(schema.safeParse('').success).toBe(true)
      expect(schema.safeParse('   ').success).toBe(true)
      // empty string
      expect(schema.safeParse('').success).toBe(true)
    })

    it('validates strictly if username is provided', () => {
      expect(schema.safeParse('valid_user').success).toBe(true)
      expect(schema.safeParse('user@123').success).toBe(false)
      expect(schema.safeParse('user 123').success).toBe(false)
      expect(schema.safeParse('___').success).toBe(false)
    })
  })
})
