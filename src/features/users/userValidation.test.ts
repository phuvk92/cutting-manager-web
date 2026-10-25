import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

const editSchema = z.object({
  email: z.string().email(),
  fullName: z.string().max(255).nullable().optional().or(z.literal('')),
  phone: z.string().max(50).nullable().optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'AGENT', 'USER'] as const),
  dealerId: z.number().nullable().optional(),
  enabled: z.boolean(),
  expirationDate: z.string().nullable().optional(),
  maxDevices: z.number().int().min(1).max(50).nullable().optional(),
})

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .regex(
        passwordRegex,
        'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt'
      ),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
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
})
