import { axiosClient } from '@/services/api/axiosClient'
import { API_ENDPOINTS } from '@/constants/api'
import {
  VehicleConfiguration,
  VehicleConfigurationFilter,
  CreateVehicleConfigurationPayload,
  UpdateVehicleConfigurationPayload,
  CarBrand,
  CarModel,
} from '@/types/vehicleConfiguration'
import { PageResponse } from '@/types/common'

export const vehicleConfigurationService = {
  getConfigurations: async (
    filter?: VehicleConfigurationFilter
  ): Promise<PageResponse<VehicleConfiguration>> => {
    const response = await axiosClient.get<PageResponse<VehicleConfiguration>>(
      API_ENDPOINTS.VEHICLE_CONFIGURATIONS,
      { params: filter }
    )
    return response.data
  },

  getConfigurationById: async (id: number): Promise<VehicleConfiguration> => {
    const response = await axiosClient.get<VehicleConfiguration>(
      API_ENDPOINTS.VEHICLE_CONFIGURATION_DETAIL(id)
    )
    return response.data
  },

  createConfiguration: async (
    payload: CreateVehicleConfigurationPayload
  ): Promise<VehicleConfiguration> => {
    const response = await axiosClient.post<VehicleConfiguration>(
      API_ENDPOINTS.VEHICLE_CONFIGURATIONS,
      payload
    )
    return response.data
  },

  updateConfiguration: async (
    id: number,
    payload: UpdateVehicleConfigurationPayload
  ): Promise<VehicleConfiguration> => {
    const response = await axiosClient.put<VehicleConfiguration>(
      API_ENDPOINTS.VEHICLE_CONFIGURATION_DETAIL(id),
      payload
    )
    return response.data
  },

  deleteConfiguration: async (id: number): Promise<void> => {
    await axiosClient.delete(API_ENDPOINTS.VEHICLE_CONFIGURATION_DETAIL(id))
  },

  getBrands: async (status?: string): Promise<CarBrand[]> => {
    const response = await axiosClient.get<CarBrand[]>(API_ENDPOINTS.CAR_BRANDS, {
      params: { status },
    })
    return response.data
  },

  getModels: async (brandId: number, status?: string): Promise<CarModel[]> => {
    const response = await axiosClient.get<CarModel[]>(API_ENDPOINTS.CAR_MODELS, {
      params: { brandId, status },
    })
    return response.data
  },
}
