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
  /** Số ngày đã phân bổ từ quỹ đại lý (quy ước 30 ngày/tháng, 360 ngày/năm) */
  allocatedDays?: number
  /** Ngày hết hạn tài khoản (yyyy-MM-dd) — null = không hết hạn */
  expirationDate?: string | null
  /** Tài khoản đã hết hạn hay chưa */
  expired?: boolean
  createdAt: string
  partCategoryIds?: number[]
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
  /** Số ngày phân bổ từ quỹ đại lý */
  allocatedDays?: number
  /** Ngày hết hạn tài khoản (yyyy-MM-dd) — không bắt buộc */
  expirationDate?: string | null
  partCategoryIds?: number[]
}

export interface UpdateUserRequest {
  email: string
  fullName?: string
  phone?: string
  role?: Role
  agentId?: number | null
  dealerId?: number | null
  enabled?: boolean
  password?: string
  /** Số ngày phân bổ từ quỹ đại lý */
  allocatedDays?: number
  /** Chỉ ADMIN. 0 = về mặc định hệ thống, bỏ trống = giữ nguyên */
  maxDevices?: number | null
  /** Ngày hết hạn tài khoản (yyyy-MM-dd) — null để bỏ hết hạn */
  expirationDate?: string | null
  partCategoryIds?: number[]
}

export interface ResetPasswordRequest {
  newPassword: string
}

export interface UpdateUserStatusRequest {
  enabled: boolean
}

export interface UpdateUserRoleRequest {
  role: Role
}

export interface UserFilterParams {
  search?: string
  username?: string
  email?: string
  role?: Role
  enabled?: boolean
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
  expirationStatus?: 'ALL' | 'VALID' | 'EXPIRED' | 'NO_EXPIRATION' | string
}

/** Máy đã đăng ký của một tài khoản (F-57 — 1 tài khoản 1 thiết bị) */
export interface UserDevice {
  id: number
  /** Định danh máy đầy đủ (mã băm) — giao diện chỉ hiện 12 ký tự đầu */
  deviceId: string
  /** Tên máy app gửi lên */
  name?: string | null
  platform?: string | null
  status: 'ACTIVE' | 'REVOKED'
  firstSeenAt: string
  lastSeenAt: string
  lastIp?: string | null
  revokedAt?: string | null
  revokedBy?: string | null
  isCurrent: boolean
}
