import { z } from 'zod'
import {
  CUT_AREA_LENGTH_RANGE_MM,
  FILM_WIDTH_RANGE_MM,
} from '@/constants/cutArea'

/**
 * Khổ cắt trên form upload/sửa part file — hai ô luôn có giá trị,
 * giới hạn khớp server (CUT_AREA_OUT_OF_RANGE): dài 100–50.000, phim 100–2.000.
 */
export const cutAreaSchema = z.object({
  lengthMm: z
    .number('Nhập dài dọc cuộn')
    .int('Dài dọc cuộn phải là số nguyên mm')
    .min(CUT_AREA_LENGTH_RANGE_MM.min, `Dài dọc cuộn tối thiểu ${CUT_AREA_LENGTH_RANGE_MM.min.toLocaleString('vi-VN')} mm`)
    .max(CUT_AREA_LENGTH_RANGE_MM.max, `Dài dọc cuộn tối đa ${CUT_AREA_LENGTH_RANGE_MM.max.toLocaleString('vi-VN')} mm`),
  widthMm: z
    .number('Nhập khổ phim')
    .int('Khổ phim phải là số nguyên mm')
    .min(FILM_WIDTH_RANGE_MM.min, `Khổ phim tối thiểu ${FILM_WIDTH_RANGE_MM.min.toLocaleString('vi-VN')} mm`)
    .max(FILM_WIDTH_RANGE_MM.max, `Khổ phim tối đa ${FILM_WIDTH_RANGE_MM.max.toLocaleString('vi-VN')} mm`),
})

export type CutAreaInput = z.input<typeof cutAreaSchema>

export interface CutAreaErrors {
  length?: string
  width?: string
}

/**
 * Validate và gom lỗi theo từng ô để hiện ngay dưới ô tương ứng.
 * `NaN` (ô trống/không phải số) rơi vào required_error của zod.
 */
export const validateCutArea = (lengthMm: number, widthMm: number): CutAreaErrors => {
  const result = cutAreaSchema.safeParse({ lengthMm, widthMm })
  if (result.success) return {}
  const errors: CutAreaErrors = {}
  for (const issue of result.error.issues) {
    if (issue.path[0] === 'lengthMm' && !errors.length) errors.length = issue.message
    if (issue.path[0] === 'widthMm' && !errors.width) errors.width = issue.message
  }
  return errors
}
