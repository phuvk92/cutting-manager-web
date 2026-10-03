import { axiosClient } from '@/services/api/axiosClient'
import { API_ENDPOINTS } from '@/constants/api'
import { DeviceFilterParams, DeviceStats, SystemDevice } from '@/types/device'
import { PageResponse } from '@/types/common'

export const deviceService = {
  getDevices: async (params?: DeviceFilterParams): Promise<PageResponse<SystemDevice>> => {
    const response = await axiosClient.get<PageResponse<SystemDevice>>(API_ENDPOINTS.DEVICES, { params })
    return response.data
  },

  getStats: async (): Promise<DeviceStats> => {
    const response = await axiosClient.get<DeviceStats>(API_ENDPOINTS.DEVICE_STATS)
    return response.data
  },
}
