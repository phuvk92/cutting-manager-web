export type VehicleLevel = 'BRAND' | 'SERIES' | 'MODEL' | 'SUBTYPE'

export interface VehicleNode {
  id: number
  level: VehicleLevel
  name: string
  childCount: number
  children?: VehicleNode[]
}

export interface CreateVehicleNodeRequest {
  parentId?: number | null
  name: string
}

export interface UpdateVehicleNodeRequest {
  name: string
}

export interface VehicleNodeImpact {
  /** Số node con sẽ bị xoá theo (không tính chính node) */
  nodes: number
  /** Số file mất liên kết mẫu xe — file vẫn còn trong kho (board Q4) */
  files: number
}

export interface DeleteVehicleNodeResult {
  deletedNodes: number
  unlinkedFiles: number
}
