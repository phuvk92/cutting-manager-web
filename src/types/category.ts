export interface Category {
  id: number
  value: string
  label: string
  level: string
  parentId?: number | null
  displayOrder?: number
  children?: Category[]
}

export interface CreateCategoryRequest {
  value: string
  label?: string
  parentId?: number | null
  displayOrder?: number
}

export interface UpdateCategoryRequest {
  value: string
  label?: string
  parentId?: number | null
  displayOrder?: number
}

export interface CategorySummary {
  id: number
  name: string
  value: string
  level: string
  fullPath: string
}

export interface CatalogOption {
  value: string
  label: string
}
