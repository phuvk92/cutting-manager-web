import { UserSummary } from './auth'
import { CategorySummary } from './category'

export interface SvgFile {
  id: number
  originalFilename: string
  fileSize: number
  contentType: string
  checksum: string
  category?: CategorySummary
  uploadedBy: UserSummary
  createdAt: string
  updatedAt: string
}

export interface SvgFilterParams {
  keyword?: string
  categoryId?: number
  uploadedBy?: number
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
}
