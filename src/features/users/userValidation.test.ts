import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import dayjs from 'dayjs'
import { isNotPastDate } from '@/utils/dateRules'
import { trimPassword, PASSWORD_REGEX } from '@/utils/passwordRules'

const createEditSchema = (initialExpirationDate?: string | null) =>
  z.object({
    email: z.string().email(),
    fullName: z.string().max(255).nullable().optional().or(z.literal('')),
    phone: z.string().max(50).nullable().optional().or(z.literal('')),
    role: z.enum(['ADMIN', 'AGENT', 'USER'] as const),
    dealerId: z.number().nullable().optional(),
    enabled: z.boolean(),
    expirationDate: z
      .string()
      .nullable()
      .optional()
      .refine((val) => isNotPastDate(val, initialExpirationDate), {
        message: 'Không được chọn ngày trong quá khứ.',
      }),
    maxDevices: z.number().int().min(1).max(50).nullable().optional(),
  })

const editSchema = createEditSchema()

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .transform(trimPassword)
      .refine(val => val.length >= 8, {
        message: 'Mật khẩu phải có ít nhất 8 ký tự',
      })
      .refine(val => PASSWORD_REGEX.test(val), {
        message: 'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt',
      }),
    confirmPassword: z
      .string()
      .transform(trimPassword)
      .refine(val => val.length > 0, {
        message: 'Vui lòng xác nhận mật khẩu mới',
      }),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không trùng khớp với mật khẩu mới',
    path: ['confirmPassword'],
  })

describe('User Edit Schema Validation', () => {
  it('accepts null dealerId (default for users without dealer)', () => {
    const validData = {
      email: 'cutter@example.com',
      fullName: 'Thợ Cắt',
      phone: null,
      role: 'USER',
      dealerId: null,
      enabled: true,
      expirationDate: null,
      maxDevices: null,
    }
    const result = editSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('accepts undefined dealerId', () => {
    const validData = {
      email: 'admin@example.com',
      fullName: '',
      role: 'ADMIN',
      enabled: true,
    }
    const result = editSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const invalidData = {
      email: 'not-an-email',
      role: 'USER',
      enabled: true,
    }
    const result = editSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('rejects past expiration date when creating or changing', () => {
    const pastDate = dayjs().subtract(5, 'day').format('YYYY-MM-DD')
    const data = {
      email: 'test@example.com',
      role: 'USER',
      enabled: true,
      expirationDate: pastDate,
    }
    const result = editSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Không được chọn ngày trong quá khứ.')
    }
  })

  it('accepts today and future expiration date', () => {
    const today = dayjs().format('YYYY-MM-DD')
    const future = dayjs().add(30, 'day').format('YYYY-MM-DD')

    expect(editSchema.safeParse({ email: 't@e.com', role: 'USER', enabled: true, expirationDate: today }).success).toBe(true)
    expect(editSchema.safeParse({ email: 't@e.com', role: 'USER', enabled: true, expirationDate: future }).success).toBe(true)
  })

  it('allows preserving existing past expiration date in edit mode', () => {
    const oldPast = '2023-05-01'
    const schemaWithOldPast = createEditSchema(oldPast)
    const result = schemaWithOldPast.safeParse({
      email: 'old@user.com',
      role: 'USER',
      enabled: true,
      expirationDate: oldPast,
    })
    expect(result.success).toBe(true)
  })

  it('rejects changing past date to another past date in edit mode', () => {
    const oldPast = '2023-05-01'
    const newPast = '2023-06-01'
    const schemaWithOldPast = createEditSchema(oldPast)
    const result = schemaWithOldPast.safeParse({
      email: 'old@user.com',
      role: 'USER',
      enabled: true,
      expirationDate: newPast,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Không được chọn ngày trong quá khứ.')
    }
  })
})

describe('Reset Password Schema Validation', () => {
  it('accepts matching strong passwords', () => {
    const validData = {
      newPassword: 'StrongPassword123!@#',
      confirmPassword: 'StrongPassword123!@#',
    }
    const result = resetPasswordSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects passwords shorter than 8 characters', () => {
    const invalidData = {
      newPassword: 'Short1!',
      confirmPassword: 'Short1!',
    }
    const result = resetPasswordSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('rejects passwords without special characters', () => {
    const invalidData = {
      newPassword: 'NoSpecialChar123',
      confirmPassword: 'NoSpecialChar123',
    }
    const result = resetPasswordSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('rejects when confirmPassword does not match newPassword', () => {
    const mismatchData = {
      newPassword: 'StrongPassword123!@#',
      confirmPassword: 'DifferentPassword123!@#',
    }
    const result = resetPasswordSchema.safeParse(mismatchData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Mật khẩu xác nhận không trùng khớp với mật khẩu mới'
      )
    }
  })

  it('accepts matching passwords with different leading/trailing spaces and trims output', () => {
    const dataWithSpaces = {
      newPassword: '   StrongPassword123!@#   ',
      confirmPassword: ' StrongPassword123!@#  ',
    }
    const result = resetPasswordSchema.safeParse(dataWithSpaces)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.newPassword).toBe('StrongPassword123!@#')
      expect(result.data.confirmPassword).toBe('StrongPassword123!@#')
    }
  })

  it('rejects whitespace-only password', () => {
    const blankData = {
      newPassword: '        ',
      confirmPassword: '        ',
    }
    const result = resetPasswordSchema.safeParse(blankData)
    expect(result.success).toBe(false)
  })

  it('preserves internal whitespace in passwords', () => {
    const validInternalSpaces = {
      newPassword: '  Strong Pass 123!@#  ',
      confirmPassword: 'Strong Pass 123!@#  ',
    }
    const result = resetPasswordSchema.safeParse(validInternalSpaces)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.newPassword).toBe('Strong Pass 123!@#')
    }
  })
})

import { createUsernameZodSchema } from '@/utils/usernameRules'

describe('Username Schema Validation', () => {
  const dummyT = (_k: string, opts?: any) => opts?.defaultValue || _k
  const createSchema = createUsernameZodSchema(dummyT, false)
  const editSchemaWithUsername = createUsernameZodSchema(dummyT, true)

  it('accepts valid usernames in create mode', () => {
    expect(createSchema.safeParse('cutter_01').success).toBe(true)
    expect(createSchema.safeParse('  cutter-01  ').success).toBe(true)
    expect(createSchema.safeParse('AGENT123').success).toBe(true)
  })

  it('rejects invalid usernames in create mode', () => {
    expect(createSchema.safeParse('').success).toBe(false)
    expect(createSchema.safeParse('   ').success).toBe(false)
    expect(createSchema.safeParse('cutter 01').success).toBe(false)
    expect(createSchema.safeParse('cutter@01').success).toBe(false)
    expect(createSchema.safeParse('cutter.01').success).toBe(false)
    expect(createSchema.safeParse('thợ_cắt').success).toBe(false)
    expect(createSchema.safeParse('ab').success).toBe(false)
  })

  it('accepts optional/empty username in edit mode', () => {
    expect(editSchemaWithUsername.safeParse('').success).toBe(true)
    expect(editSchemaWithUsername.safeParse('   ').success).toBe(true)
    // empty string
    expect(editSchemaWithUsername.safeParse('').success).toBe(true)
  })

  it('strictly validates non-empty username in edit mode', () => {
    expect(editSchemaWithUsername.safeParse('valid_edit_user').success).toBe(true)
    expect(editSchemaWithUsername.safeParse('invalid user').success).toBe(false)
    expect(editSchemaWithUsername.safeParse('invalid@user').success).toBe(false)
  })
})
