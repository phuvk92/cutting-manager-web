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
  /** Khổ cắt đã khai, mm — null trên file cũ chưa khai (client dùng mặc định 15000 × 700) */
  cutAreaLengthMm: number | null
  cutAreaWidthMm: number | null
  /** Có bản đã xếp (vào vùng cắt) — SA-DanhMucXe-v2 §8 */
  hasNested?: boolean
  /** Có bản chưa xếp (vào khu chưa cắt) */
  hasRaw?: boolean
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
