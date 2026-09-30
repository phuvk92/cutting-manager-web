import { axiosClient } from '@/services/api/axiosClient'
import { API_ENDPOINTS } from '@/constants/api'
import { PageResponse } from '@/types/common'
import {
  VehicleNode,
  CreateVehicleNodeRequest,
  UpdateVehicleNodeRequest,
  VehicleNodeImpact,
  DeleteVehicleNodeResult,
} from '@/types/vehicleNode'

export const vehicleNodeService = {
  getTree: async (params?: {
    q?: string
    page?: number
    size?: number
  }): Promise<PageResponse<VehicleNode>> => {
    const response = await axiosClient.get<PageResponse<VehicleNode>>(
      API_ENDPOINTS.VEHICLE_NODES,
      { params }
    )
    return response.data
  },

  create: async (payload: CreateVehicleNodeRequest): Promise<VehicleNode> => {
    const response = await axiosClient.post<VehicleNode>(API_ENDPOINTS.VEHICLE_NODES, payload)
    return response.data
  },

  rename: async (id: number, payload: UpdateVehicleNodeRequest): Promise<VehicleNode> => {
    const response = await axiosClient.put<VehicleNode>(
      API_ENDPOINTS.VEHICLE_NODE_DETAIL(id),
      payload
    )
    return response.data
  },

  getImpact: async (id: number): Promise<VehicleNodeImpact> => {
    const response = await axiosClient.get<VehicleNodeImpact>(
      API_ENDPOINTS.VEHICLE_NODE_IMPACT(id)
    )
    return response.data
  },

  remove: async (id: number): Promise<DeleteVehicleNodeResult> => {
    const response = await axiosClient.delete<DeleteVehicleNodeResult>(
      API_ENDPOINTS.VEHICLE_NODE_DETAIL(id)
    )
    return response.data
  },
}
