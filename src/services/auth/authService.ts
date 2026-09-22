import { axiosClient } from '@/services/api/axiosClient'
import { API_ENDPOINTS } from '@/constants/api'
import {
  AuthResponse,
  LoginRequest,
  ChangePasswordRequest,
  MessageResponse,
} from '@/types/auth'
import { User } from '@/types/user'

export const authService = {
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>(API_ENDPOINTS.LOGIN, payload)
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

  changePassword: async (payload: ChangePasswordRequest): Promise<MessageResponse> => {
    const response = await axiosClient.post<MessageResponse>(API_ENDPOINTS.CHANGE_PASSWORD, payload)
    return response.data
  },
}
