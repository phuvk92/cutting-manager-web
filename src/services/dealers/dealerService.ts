import { axiosClient } from '@/services/api/axiosClient'
import { API_ENDPOINTS } from '@/constants/api'
import {
  Dealer,
  CreateDealerRequest,
  UpdateDealerRequest,
  DealerStats,
} from '@/types/dealer'
import { PageResponse } from '@/types/common'

export interface GetDealersParams {
  search?: string
  status?: string
  region?: string
  page?: number
  size?: number
  sortBy?: string
  sortDir?: string
}

export const generateDealerCodeLocal = (): string => {
  const now = new Date()
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yyyy = now.getFullYear()
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let rand = ''
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${dd}${mm}${yyyy}${rand}`
}

export const dealerService = {
  getDealers: async (params?: GetDealersParams): Promise<PageResponse<Dealer>> => {
    const response = await axiosClient.get<PageResponse<Dealer>>(API_ENDPOINTS.DEALERS_LIST, {
      params,
    })
    return response.data
  },

  getAllDealers: async (): Promise<Dealer[]> => {
    const response = await axiosClient.get<Dealer[]>(API_ENDPOINTS.DEALERS_ALL)
    return response.data
  },

  getDealerStats: async (): Promise<DealerStats> => {
    const response = await axiosClient.get<DealerStats>(API_ENDPOINTS.DEALER_STATS)
    return response.data
  },

  generateCode: async (): Promise<string> => {
    try {
      const response = await axiosClient.get<{ code: string }>(API_ENDPOINTS.DEALER_GENERATE_CODE)
      return response.data.code
    } catch {
      return generateDealerCodeLocal()
    }
  },

  getDealerById: async (id: number): Promise<Dealer> => {
    const response = await axiosClient.get<Dealer>(API_ENDPOINTS.DEALER_DETAIL(id))
    return response.data
  },

  createDealer: async (payload: CreateDealerRequest): Promise<Dealer> => {
    const response = await axiosClient.post<Dealer>(API_ENDPOINTS.DEALER_CREATE, payload)
    return response.data
  },

  updateDealer: async (id: number, payload: UpdateDealerRequest): Promise<Dealer> => {
    const response = await axiosClient.put<Dealer>(API_ENDPOINTS.DEALER_UPDATE(id), payload)
    return response.data
  },

  updateStatus: async (id: number, status: string): Promise<Dealer> => {
    const response = await axiosClient.patch<Dealer>(API_ENDPOINTS.DEALER_STATUS(id), { status })
    return response.data
  },

  deleteDealer: async (id: number): Promise<void> => {
    await axiosClient.delete(API_ENDPOINTS.DEALER_DELETE(id))
  },
}
