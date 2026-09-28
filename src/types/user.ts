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
  dealerId?: number
  dealerName?: string
  dealerCode?: string
  enabled: boolean
  /** Số máy tối đa riêng của tài khoản (F-57) — không có = dùng mặc định hệ thống */
  maxDevices?: number | null
  /** Số máy tối đa đang áp dụng */
  effectiveMaxDevices?: number
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
  dealerId?: number
  enabled?: boolean
}

export interface UpdateUserRequest {
  email: string
  fullName?: string
  phone?: string
  role: Role
  agentId?: number
  dealerId?: number
  enabled: boolean
  password?: string
  /** Chỉ ADMIN. 0 = về mặc định hệ thống, bỏ trống = giữ nguyên */
  maxDevices?: number
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

/** Máy đã đăng ký của một tài khoản (F-57 — 1 tài khoản 1 thiết bị) */
export interface UserDevice {
  id: number
  deviceIdShort: string
  deviceName?: string | null
  platform?: string | null
  status: 'ACTIVE' | 'REVOKED'
  firstSeenAt: string
  lastSeenAt: string
  lastIp?: string | null
  revokedAt?: string | null
  revokedBy?: string | null
  current: boolean
}
