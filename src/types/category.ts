/** File vẫn gắn danh mục cũ của kho SVG — giữ tối thiểu cho tới khi màn Kho mẫu v2 thay thế. */
export interface CategorySummary {
  id: number
  name: string
  value: string
  level: string
  fullPath: string
  brand?: string | null
  model?: string | null
  year?: string | null
}

/** Một lựa chọn của ô chọn nối tầng / danh mục file — khuôn `{value,label}` của API (SA-DanhMucXe-v2 §3.3). */
export interface CatalogOption {
  value: string
  label: string
}
