export interface Category {
  id: number
  value: string
  label: string
  level: string
  parentId?: number | null
  displayOrder?: number
  brand?: string | null
  model?: string | null
  year?: string | null
  children?: Category[]
}

export interface CreateCategoryRequest {
  value: string
  label?: string
  parentId?: number | null
  displayOrder?: number
  brand?: string | null
  model?: string | null
  year?: string | null
}

export interface UpdateCategoryRequest {
  value: string
  label?: string
  parentId?: number | null
  displayOrder?: number
  brand?: string | null
  model?: string | null
  year?: string | null
}

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

export interface CatalogOption {
  value: string
  label: string
}
