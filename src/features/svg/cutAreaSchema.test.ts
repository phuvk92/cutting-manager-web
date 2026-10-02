import { describe, it, expect } from 'vitest'
import { validateCutArea } from './cutAreaSchema'

describe('validateCutArea', () => {
  it('mặc định 15000 × 700 hợp lệ', () => {
    expect(validateCutArea(15000, 700)).toEqual({})
  })

  it('trả lỗi đúng ô khi một ô thiếu (NaN)', () => {
    expect(validateCutArea(NaN, 700).length).toBeTruthy()
    expect(validateCutArea(15000, NaN).width).toBeTruthy()
    // ô còn lại không bị báo nhầm
    expect(validateCutArea(NaN, 700).width).toBeUndefined()
  })

  it('ngoài giới hạn: dài 100–50.000, phim 100–2.000', () => {
    expect(validateCutArea(99, 700).length).toContain('100')
    expect(validateCutArea(50001, 700).length).toContain('50.000')
    expect(validateCutArea(15000, 99).width).toContain('100')
    expect(validateCutArea(15000, 2001).width).toContain('2.000')
  })

  it('số lẻ bị từ chối', () => {
    expect(validateCutArea(15000.5, 700).length).toBeTruthy()
    expect(validateCutArea(15000, 700.5).width).toBeTruthy()
  })
})
