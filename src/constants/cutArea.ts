/**
 * Khổ cắt (vùng cắt) khai theo part file — epic NGO-399.
 * Board 02/10: cuộn PPF thường gặp 15 m × 700 mm; khổ phim là danh sách chuẩn
 * của cuộn, chiều dài cuộn để admin quyết (khổ to thì cuộn dài hơn).
 */

/** Khổ phim chuẩn (trục Y) của cuộn PPF, mm. */
export const FILM_WIDTH_PRESETS_MM: readonly number[] = [700, 760, 1220, 1520]

/** File cũ chưa khai khổ thì bản cắt nhận mặc định này (board 02/10). */
export const DEFAULT_FILM_WIDTH_MM = 700
export const DEFAULT_CUT_AREA_LENGTH_MM = 15000

/** Khổ chọn sẵn trong form tải lên / sửa part file (board 08/10). Khác mặc định của file cũ ở trên. */
export const FORM_DEFAULT_FILM_WIDTH_MM = 1520

/** Giới hạn server (NGO-400): dài dọc cuộn 100–50000, khổ phim 100–2000. */
export const CUT_AREA_LENGTH_RANGE_MM = { min: 100, max: 50000 } as const
export const FILM_WIDTH_RANGE_MM = { min: 100, max: 2000 } as const
