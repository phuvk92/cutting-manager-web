export interface PartLibraryCategory {
  id: number
  code: string
  name: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt?: string | null
  createdBy?: string | null
  updatedBy?: string | null
  usageCount?: number
}

export interface PartLibraryCategoryCreateRequest {
  code: string
  name: string
  status?: 'ACTIVE' | 'INACTIVE'
}

export interface PartLibraryCategoryUpdateRequest {
  code?: string
  name?: string
  status?: 'ACTIVE' | 'INACTIVE'
}

export interface PartLibraryCategoryFilterParams {
  status?: string
  search?: string
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  all?: boolean
}
