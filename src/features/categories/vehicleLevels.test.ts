import { describe, it, expect } from 'vitest'
import { LEVEL_ORDER, LEVEL_META, nextLevel } from './vehicleLevels'
import { VehicleLevel } from '@/types/vehicleNode'

describe('vehicleLevels hierarchy and metadata', () => {
  it('định nghĩa đúng thứ tự 4 cấp BRAND › SERIES › MODEL › SUBTYPE', () => {
    const codes = LEVEL_ORDER.map(l => l.code)
    expect(codes).toEqual(['BRAND', 'SERIES', 'MODEL', 'SUBTYPE'])
  })

  it('nextLevel trả về cấp tiếp theo tương ứng', () => {
    expect(nextLevel('BRAND')?.code).toBe('SERIES')
    expect(nextLevel('SERIES')?.code).toBe('MODEL')
    expect(nextLevel('MODEL')?.code).toBe('SUBTYPE')
    expect(nextLevel('SUBTYPE')).toBeNull()
  })

  it('LEVEL_META chứa đầy đủ nhãn tiếng Việt và placeholder cho từng cấp', () => {
    expect(LEVEL_META.BRAND.vi).toBe('Hãng')
    expect(LEVEL_META.SERIES.vi).toBe('Dòng xe')
    expect(LEVEL_META.MODEL.vi).toBe('Model')
    expect(LEVEL_META.SUBTYPE.vi).toBe('Phiên bản')

    expect(LEVEL_META.BRAND.ph).toContain('Toyota')
    expect(LEVEL_META.SERIES.ph).toContain('Camry')
    expect(LEVEL_META.MODEL.ph).toContain('Camry 2.5Q')
    expect(LEVEL_META.SUBTYPE.ph).toContain('nhập')
  })

  it('kiểm tra điều kiện mở form thêm theo thứ tự phân cấp cha con', () => {
    const validateCanAdd = (
      targetLevel: VehicleLevel,
      current: { brandId?: number; seriesId?: number; modelId?: number }
    ): { allowed: boolean; message?: string } => {
      if (targetLevel === 'BRAND') {
        return { allowed: true }
      }
      if (targetLevel === 'SERIES') {
        if (!current.brandId) {
          return { allowed: false, message: 'Vui lòng chọn Hãng xe (BRAND) trước khi thêm dòng xe' }
        }
        return { allowed: true }
      }
      if (targetLevel === 'MODEL') {
        if (!current.brandId) {
          return { allowed: false, message: 'Vui lòng chọn Hãng xe (BRAND) trước khi thêm model xe' }
        }
        if (!current.seriesId) {
          return { allowed: false, message: 'Vui lòng chọn Dòng xe (SERIES) trước khi thêm model xe' }
        }
        return { allowed: true }
      }
      if (targetLevel === 'SUBTYPE') {
        if (!current.brandId) {
          return { allowed: false, message: 'Vui lòng chọn Hãng xe (BRAND) trước khi thêm phiên bản xe' }
        }
        if (!current.seriesId) {
          return { allowed: false, message: 'Vui lòng chọn Dòng xe (SERIES) trước khi thêm phiên bản xe' }
        }
        if (!current.modelId) {
          return { allowed: false, message: 'Vui lòng chọn Model xe trước khi thêm phiên bản xe' }
        }
        return { allowed: true }
      }
      return { allowed: false }
    }

    // BRAND: luôn cho phép
    expect(validateCanAdd('BRAND', {}).allowed).toBe(true)

    // SERIES: cần BRAND
    expect(validateCanAdd('SERIES', {}).allowed).toBe(false)
    expect(validateCanAdd('SERIES', { brandId: 1 }).allowed).toBe(true)

    // MODEL: cần BRAND và SERIES
    expect(validateCanAdd('MODEL', { brandId: 1 }).allowed).toBe(false)
    expect(validateCanAdd('MODEL', { brandId: 1, seriesId: 10 }).allowed).toBe(true)

    // SUBTYPE: cần BRAND, SERIES, MODEL
    expect(validateCanAdd('SUBTYPE', { brandId: 1, seriesId: 10 }).allowed).toBe(false)
    expect(validateCanAdd('SUBTYPE', { brandId: 1, seriesId: 10, modelId: 100 }).allowed).toBe(true)
  })

  it('cập nhật chọn cấp cha reset đúng các cấp con theo logic cascaded dropdown', () => {
    interface VehicleRowState {
      brandId?: number
      seriesId?: number
      modelId?: number
      subtypeId?: number
    }

    const applySelection = (
      prev: VehicleRowState,
      levelIdx: number,
      newValue?: number
    ): VehicleRowState => {
      const next = { ...prev }
      if (levelIdx === 0) {
        next.brandId = newValue
        next.seriesId = next.modelId = next.subtypeId = undefined
      } else if (levelIdx === 1) {
        next.seriesId = newValue
        next.modelId = next.subtypeId = undefined
      } else if (levelIdx === 2) {
        next.modelId = newValue
        next.subtypeId = undefined
      } else {
        next.subtypeId = newValue
      }
      return next
    }

    const initial: VehicleRowState = { brandId: 1, seriesId: 10, modelId: 100, subtypeId: 1000 }

    // Đổi BRAND -> reset series, model, subtype
    expect(applySelection(initial, 0, 2)).toEqual({
      brandId: 2,
      seriesId: undefined,
      modelId: undefined,
      subtypeId: undefined,
    })

    // Đổi SERIES -> giữ brand, reset model, subtype
    expect(applySelection(initial, 1, 20)).toEqual({
      brandId: 1,
      seriesId: 20,
      modelId: undefined,
      subtypeId: undefined,
    })

    // Đổi MODEL -> giữ brand, series, reset subtype
    expect(applySelection(initial, 2, 200)).toEqual({
      brandId: 1,
      seriesId: 10,
      modelId: 200,
      subtypeId: undefined,
    })

    // Đổi SUBTYPE -> giữ brand, series, model
    expect(applySelection(initial, 3, 2000)).toEqual({
      brandId: 1,
      seriesId: 10,
      modelId: 100,
      subtypeId: 2000,
    })
  })
})
