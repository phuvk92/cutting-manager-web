import { Role } from './auth'

export interface User {
  id: number
  keycloakUserId?: string
  username: string
  email: string
  fullName?: string
  phone?: string
  role: Role
  agentId?: number
  agentUsername?: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateUserRequest {
  username: string
  email: string
  fullName?: string
  phone?: string
  password: string
  role: Role
  agentId?: number
  enabled?: boolean
}

export interface UpdateUserRequest {
  email: string
  fullName?: string
  phone?: string
  role: Role
  agentId?: number
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
