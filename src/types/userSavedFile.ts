export interface SavedFileCategory {
  id: number
  name: string
}

export interface SavedFileVehicleConfiguration {
  id?: number | null
  productGroup?: string | null
  productGroupName?: string | null
  brandName?: string | null
  modelName?: string | null
  yearFrom?: number | null
  yearTo?: number | null
  generationCode?: string | null
}

export interface SavedFileCutSize {
  filmWidth?: number | null
  filmWidthUnit?: string | null
  rollLength?: number | null
  rollLengthUnit?: string | null
  axisX?: number | null
  axisY?: number | null
}

export interface SavedFileCreator {
  id: number
  username: string
  displayName: string
}

export interface SavedFileDealer {
  id: number
  name: string
}

export interface UserSavedFile {
  id: number
  fileName: string
  originalFileName?: string | null
  category?: SavedFileCategory | null
  vehicleConfiguration?: SavedFileVehicleConfiguration | null
  cutSize?: SavedFileCutSize | null
  description?: string | null
  createdAt: string
  updatedAt?: string | null
  createdBy: SavedFileCreator
  dealer?: SavedFileDealer | null
  fileSize: number
  mimeType: string
  checksum: string
  status: string
}

export interface UserSavedFileListResponse {
  content: UserSavedFile[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first?: boolean
  last?: boolean
}

export interface UserSavedFileFilterParams {
  page?: number
  size?: number
  keyword?: string
  categoryId?: number
  vehicleConfigurationId?: number
  vehicleNodeId?: number
  brandId?: number
  modelId?: number
  dealerId?: number
  userId?: number
  createdFrom?: string
  createdTo?: string
  status?: string
  sort?: string
}

export interface UserSvgFileShareItem {
  userId: number
  username: string
  displayName?: string | null
  dealerId?: number | null
  dealerName?: string | null
  sharedAt?: string | null
  sharedBy?: {
    userId: number
    username: string
  } | null
  status: string
}

export interface FileSharesResponse {
  fileId: number
  shares: UserSvgFileShareItem[]
}
