export type DeviceStatusFilter = 'ACTIVE' | 'REVOKED' | 'ALL'

export interface DeviceStats {
  activeNow: number
  registered: number
  usersAtLimit: number
  staleDevices: number
}

export interface SystemDevice {
  deviceRegId: number
  userId: number
  username?: string | null
  fullName?: string | null
  dealerId?: number | null
  dealerName?: string | null
  deviceName?: string | null
  platform?: string | null
  lastIp?: string | null
  firstSeenAt?: string | null
  lastSeenAt?: string | null
  status?: 'ACTIVE' | 'REVOKED' | null
  revokedAt?: string | null
  revokedBy?: string | null
}

export interface DeviceFilterParams {
  q?: string
  dealerId?: number
  status?: DeviceStatusFilter
  page?: number
  size?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}
