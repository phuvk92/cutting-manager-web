export interface AdminFileVehicleRef {
  nodeId: number
  path: string
}

export interface AdminFile {
  id: number
  fileKey: string
  name: string
  originalFilename: string
  category: string | null
  year: number | null
  vehicles: AdminFileVehicleRef[]
  source: string
  partCount: number
  updatedAt: string
  thumbnailUrl: string | null
}

export interface AdminFileStats {
  total: number
  modelsWithFiles: number
  fromDealers: number
  unlinked: number
}

export interface AdminFileFilterParams {
  q?: string
  categoryId?: number
  year?: number
  brandId?: number
  seriesId?: number
  modelId?: number
  page?: number
  size?: number
}

export interface VehicleNode {
  id: number
  level: 'BRAND' | 'SERIES' | 'MODEL' | 'SUBTYPE'
  name: string
  childCount: number
  children: VehicleNode[]
}
