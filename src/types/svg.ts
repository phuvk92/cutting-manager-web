import { UserSummary } from './auth'
import { CategorySummary } from './category'

export interface SvgVehicleConfigurationSummary {
  id: number
  productGroup: string
  productGroupName: string
  brandName: string
  modelName: string
  yearFrom: number
  yearTo: number
  generationCode?: string
  fullName: string
}

export interface SvgFileDealerPermission {
  id?: number
  dealerId: number
  dealerCode?: string
  dealerName?: string
  canView: boolean
  canDownload: boolean
  createdAt?: string
  updatedAt?: string
}

export interface SvgFile {
  id: number
  originalFilename: string
  storedFilename?: string
  fileSize: number
  contentType: string
  checksum: string
  status?: string
  category?: CategorySummary
  vehicleConfigurations: SvgVehicleConfigurationSummary[]
  dealerPermissionCount: number
  dealerPermissions?: SvgFileDealerPermission[]
  canDownload: boolean
  canView: boolean
  uploadedBy: UserSummary
  createdAt: string
  updatedAt: string
}

export interface SvgFilterParams {
  keyword?: string
  productGroup?: string
  brandId?: number
  modelId?: number
  year?: number
  generationCode?: string
  dealerId?: number
  status?: string
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
}

export interface BatchSvgUploadResponse {
  files: SvgFile[]
  totalUploaded: number
}
