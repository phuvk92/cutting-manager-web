import { describe, it, expect } from 'vitest'
import { formatCutArea, normalizeSvgFilename } from './formatters'

describe('formatCutArea', () => {
  it('dài tròn mét và khổ phim mm', () => {
    expect(formatCutArea(15000, 700)).toBe('15 m × 700')
    expect(formatCutArea(25000, 1520)).toBe('25 m × 1520')
  })

  it('dài lẻ đổi một số thập phân theo dấu phẩy vi-VN', () => {
    expect(formatCutArea(15200, 760)).toBe('15,2 m × 760')
  })
})


describe('normalizeSvgFilename', () => {
  it('tên không đuôi -> thêm đuôi .svg', () => {
    expect(normalizeSvgFilename('Nắp capo', 1)).toBe('Nắp capo.svg')
    expect(normalizeSvgFilename('Audi Q6', 10)).toBe('Audi Q6.svg')
  })

  it('tên có .svg -> giữ nguyên .svg, không nối thêm', () => {
    expect(normalizeSvgFilename('Nắp capo.svg', 1)).toBe('Nắp capo.svg')
    expect(normalizeSvgFilename('audi_q6.svg', 2)).toBe('audi_q6.svg')
  })

  it('tên có .SVG -> giữ nguyên .SVG không phân biệt hoa thường, không nối thêm', () => {
    expect(normalizeSvgFilename('Nắp capo.SVG', 1)).toBe('Nắp capo.SVG')
    expect(normalizeSvgFilename('model_x.Svg', 2)).toBe('model_x.Svg')
  })

  it('tên có dấu chấm giữa -> không bị cắt mất phần sau dấu chấm, kết thúc bằng .svg', () => {
    expect(normalizeSvgFilename('Audi Q6 2024 v1.2', 1)).toBe('Audi Q6 2024 v1.2.svg')
    expect(normalizeSvgFilename('Audi Q6 2024 v1.2.svg', 1)).toBe('Audi Q6 2024 v1.2.svg')
    expect(normalizeSvgFilename('file.part.1.final', 5)).toBe('file.part.1.final.svg')
  })

  it('tên rỗng / chỉ khoảng trắng / null / undefined -> dùng tên dự phòng có đuôi file-<id>.svg', () => {
    expect(normalizeSvgFilename('', 12)).toBe('file-12.svg')
    expect(normalizeSvgFilename('   ', 42)).toBe('file-42.svg')
    expect(normalizeSvgFilename(null, 99)).toBe('file-99.svg')
    expect(normalizeSvgFilename(undefined, 7)).toBe('file-7.svg')
    expect(normalizeSvgFilename('', null)).toBe('file.svg')
    expect(normalizeSvgFilename('.svg', 15)).toBe('file-15.svg')
  })

  it('bỏ ký tự không hợp lệ cho tên file Windows (\\ / : * ? " < > |)', () => {
    expect(normalizeSvgFilename('Audi: Q6 / 2024*v1.2? <test> "hi" | path\\file', 1)).toBe(
      'Audi Q6  2024v1.2 test hi  pathfile.svg'
    )
    expect(normalizeSvgFilename('file:name*.svg', 1)).toBe('filename.svg')
    expect(normalizeSvgFilename('***', 5)).toBe('file-5.svg')
  })
})
