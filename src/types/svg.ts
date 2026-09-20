import { UserSummary } from './auth'

export interface SvgFile {
  id: number
  originalFilename: string
  fileSize: number
  contentType: string
  checksum: string
  uploadedBy: UserSummary
  createdAt: string
  updatedAt: string
}

export interface SvgFilterParams {
  keyword?: string
  uploadedBy?: number
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
}
