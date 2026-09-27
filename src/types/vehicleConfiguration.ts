export type ProductGroup = 'PPF_EXTERIOR' | 'PPF_INTERIOR' | 'WINDOW_FILM'

export interface CarBrand {
  id: number
  code: string
  name: string
  logoUrl?: string
  status: string
  displayOrder?: number
}

export interface CarModel {
  id: number
  brandId: number
  brandName?: string
  code: string
  name: string
  status: string
  displayOrder?: number
}

export interface VehicleConfiguration {
  id: number
  category: {
    id: number
    name: string
  }
  productGroup: ProductGroup
  productGroupName: string
  brand: {
    id: number
    code: string
    name: string
  }
  model: {
    id: number
    code: string
    name: string
  }
  yearFrom: number
  yearTo: number
  generationCode: string
  status: string
  createdAt?: string
  updatedAt?: string
}

export interface VehicleConfigurationFilter {
  categoryId?: number
  productGroup?: ProductGroup
  brandId?: number
  modelId?: number
  year?: number
  status?: string
  search?: string
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}

export interface CreateVehicleConfigurationPayload {
  categoryId?: number
  productGroup?: ProductGroup
  brandId: number
  modelId: number
  yearFrom: number
  yearTo: number
  generationCode: string
  status?: string
}

export interface UpdateVehicleConfigurationPayload {
  categoryId?: number
  productGroup?: ProductGroup
  brandId: number
  modelId: number
  yearFrom: number
  yearTo: number
  generationCode: string
  status?: string
}
