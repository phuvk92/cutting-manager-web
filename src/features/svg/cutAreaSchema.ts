import { z } from "zod"
import {
  CUT_AREA_LENGTH_RANGE_MM,
  FILM_WIDTH_RANGE_MM,
} from "@/constants/cutArea"
import i18n from "@/i18n"

export const getCutAreaSchema = (lang = i18n.language) => {
  const isEn = lang === "en"
  const lengthRequired = isEn ? "Enter roll length" : "Nhập dài dọc cuộn"
  const lengthInt = isEn ? "Roll length must be an integer (mm)" : "Dài dọc cuộn phải là số nguyên mm"
  const lengthMin = isEn
    ? `Minimum roll length is ${CUT_AREA_LENGTH_RANGE_MM.min.toLocaleString("en-US")} mm`
    : `Dài dọc cuộn tối thiểu ${CUT_AREA_LENGTH_RANGE_MM.min.toLocaleString("vi-VN")} mm`
  const lengthMax = isEn
    ? `Maximum roll length is ${CUT_AREA_LENGTH_RANGE_MM.max.toLocaleString("en-US")} mm`
    : `Dài dọc cuộn tối đa ${CUT_AREA_LENGTH_RANGE_MM.max.toLocaleString("vi-VN")} mm`

  const widthRequired = isEn ? "Enter film width" : "Nhập khổ phim"
  const widthInt = isEn ? "Film width must be an integer (mm)" : "Khổ phim phải là số nguyên mm"
  const widthMin = isEn
    ? `Minimum film width is ${FILM_WIDTH_RANGE_MM.min.toLocaleString("en-US")} mm`
    : `Khổ phim tối thiểu ${FILM_WIDTH_RANGE_MM.min.toLocaleString("vi-VN")} mm`
  const widthMax = isEn
    ? `Maximum film width is ${FILM_WIDTH_RANGE_MM.max.toLocaleString("en-US")} mm`
    : `Khổ phim tối đa ${FILM_WIDTH_RANGE_MM.max.toLocaleString("vi-VN")} mm`

  return z.object({
    lengthMm: z
      .number(lengthRequired)
      .int(lengthInt)
      .min(CUT_AREA_LENGTH_RANGE_MM.min, lengthMin)
      .max(CUT_AREA_LENGTH_RANGE_MM.max, lengthMax),
    widthMm: z
      .number(widthRequired)
      .int(widthInt)
      .min(FILM_WIDTH_RANGE_MM.min, widthMin)
      .max(FILM_WIDTH_RANGE_MM.max, widthMax),
  })
}

export const cutAreaSchema = getCutAreaSchema("vi")

export type CutAreaInput = z.input<typeof cutAreaSchema>

export interface CutAreaErrors {
  length?: string
  width?: string
}

export const validateCutArea = (lengthMm: number, widthMm: number, lang = i18n.language): CutAreaErrors => {
  const schema = getCutAreaSchema(lang)
  const result = schema.safeParse({ lengthMm, widthMm })
  if (result.success) return {}
  const errors: CutAreaErrors = {}
  for (const issue of result.error.issues) {
    if (issue.path[0] === "lengthMm" && !errors.length) errors.length = issue.message
    if (issue.path[0] === "widthMm" && !errors.width) errors.width = issue.message
  }
  return errors
}
