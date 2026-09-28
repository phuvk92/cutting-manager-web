import { axiosClient } from '@/services/api/axiosClient'
import { API_ENDPOINTS } from '@/constants/api'
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserStatusRequest,
  UpdateUserRoleRequest,
  UserFilterParams,
  UserDevice,
} from '@/types/user'
import { PageResponse } from '@/types/common'

export const userService = {
  getUsers: async (params?: UserFilterParams): Promise<PageResponse<User>> => {
    const response = await axiosClient.get<PageResponse<User>>(API_ENDPOINTS.USERS_LIST, {
      params,
    })
    return response.data
  },

  getUserById: async (id: number): Promise<User> => {
    const response = await axiosClient.get<User>(API_ENDPOINTS.USER_DETAIL(id))
    return response.data
  },

  createUser: async (payload: CreateUserRequest): Promise<User> => {
    const response = await axiosClient.post<User>(API_ENDPOINTS.USER_CREATE, payload)
    return response.data
  },

  updateUser: async (id: number, payload: UpdateUserRequest): Promise<User> => {
    const response = await axiosClient.put<User>(API_ENDPOINTS.USER_UPDATE(id), payload)
    return response.data
  },

  updateUserStatus: async (id: number, payload: UpdateUserStatusRequest): Promise<User> => {
    const response = await axiosClient.patch<User>(API_ENDPOINTS.USER_STATUS(id), payload)
    return response.data
  },

  updateUserRole: async (id: number, payload: UpdateUserRoleRequest): Promise<User> => {
    const response = await axiosClient.patch<User>(API_ENDPOINTS.USER_ROLE(id), payload)
    return response.data
  },

  deleteUser: async (id: number): Promise<void> => {
    await axiosClient.delete(API_ENDPOINTS.USER_DELETE(id))
  },

  getUserDevices: async (id: number): Promise<UserDevice[]> => {
    const response = await axiosClient.get<UserDevice[]>(API_ENDPOINTS.USER_DEVICES(id))
    return response.data
  },

  revokeUserDevice: async (id: number, deviceId: number): Promise<UserDevice> => {
    const response = await axiosClient.delete<UserDevice>(API_ENDPOINTS.USER_DEVICE_REVOKE(id, deviceId))
    return response.data
  },
}
