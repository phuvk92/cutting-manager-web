import { UserSummary } from './auth'

/**
 * File SVG trả về từ `/api/svg` (dashboard, xem trước, tải xuống).
 * Màn Kho mẫu & part file dùng `AdminFile` (types/adminFile.ts) với `/api/admin/files`.
 */
export interface SvgFile {
  id: number
  originalFilename: string
  storedFilename?: string
  fileSize: number
  contentType: string
  checksum: string
  status?: string
  fileCategory?: string | null
  modelYear?: number | null
  source?: string
  canDownload: boolean
  canView: boolean
  uploadedBy: UserSummary
  createdAt: string
  updatedAt: string
}

export interface SvgFilterParams {
  keyword?: string
  productGroup?: string
  year?: number
  status?: string
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
}
