import { Role } from './auth'

export interface User {
  id: number
  username: string
  email: string
  role: Role
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  role: Role
  enabled?: boolean
}

export interface UpdateUserRequest {
  email: string
  role: Role
  enabled: boolean
  password?: string
}

export interface UpdateUserStatusRequest {
  enabled: boolean
}

export interface UpdateUserRoleRequest {
  role: Role
}

export interface UserFilterParams {
  username?: string
  email?: string
  role?: Role
  enabled?: boolean
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
}
