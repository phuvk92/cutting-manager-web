import { axiosClient } from '@/services/api/axiosClient'
import { API_ENDPOINTS } from '@/constants/api'
import { AuthResponse, LoginRequest, RegisterRequest } from '@/types/auth'
import { User } from '@/types/user'

export const authService = {
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>(API_ENDPOINTS.LOGIN, payload)
    return response.data
  },

  register: async (payload: RegisterRequest): Promise<User> => {
    const response = await axiosClient.post<User>(API_ENDPOINTS.REGISTER, payload)
    return response.data
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>(API_ENDPOINTS.REFRESH, { refreshToken })
    return response.data
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await axiosClient.get<User>(API_ENDPOINTS.ME)
    return response.data
  },
}
