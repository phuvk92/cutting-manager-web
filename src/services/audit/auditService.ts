import { axiosClient } from '@/services/api/axiosClient'
import { API_ENDPOINTS } from '@/constants/api'

export interface ActuatorHealth {
  status: string
  components?: Record<string, { status: string; details?: Record<string, unknown> }>
}

export const auditService = {
  getHealth: async (): Promise<ActuatorHealth> => {
    const response = await axiosClient.get<ActuatorHealth>(API_ENDPOINTS.HEALTH)
    return response.data
  },
}
