export interface Dealer {
  id: number
  code: string
  name: string
  region?: string
  address?: string
  phone?: string
  email?: string
  contactPerson?: string
  plan?: string
  dueDate?: string
  status: 'ACTIVE' | 'EXPIRING' | 'LOCKED' | string
  usersCount: number
  notes?: string
  // Thông tin tài khoản AGENT duy nhất của đại lý
  agentUserId?: number | null
  agentUsername?: string | null
  agentFullName?: string | null
  agentEmail?: string | null
  agentPhone?: string | null
  agentEnabled?: boolean | null
  // Thông tin gói account của đại lý
  maxAccounts?: number
  createdAccounts?: number
  remainingAccounts?: number
  totalAllocatedDays?: number
  usedAllocatedDays?: number
  remainingAllocatedDays?: number
  packageStartDate?: string | null
  packageExpiryDate?: string | null
  packageStatus?: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | string
  packageExpired?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateDealerRequest {
  code: string
  name: string
  region?: string
  address?: string
  phone?: string
  email?: string
  contactPerson?: string
  status?: string
  notes?: string
  // Thông tin tài khoản AGENT
  agentUsername?: string
  agentEmail?: string
  agentPassword?: string
  agentFullName?: string
  agentPhone?: string
  // Gói account
  maxAccounts?: number
  totalAllocatedDays?: number
  packageStartDate?: string | null
  packageExpiryDate?: string | null
  packageStatus?: string
}

export interface UpdateDealerRequest {
  code: string
  name: string
  region?: string
  address?: string
  phone?: string
  email?: string
  contactPerson?: string
  status?: string
  notes?: string
  // Cập nhật tài khoản AGENT
  agentUsername?: string
  agentEmail?: string
  agentPassword?: string
  agentFullName?: string
  agentPhone?: string
  // Gói account
  maxAccounts?: number
  totalAllocatedDays?: number
  packageStartDate?: string | null
  packageExpiryDate?: string | null
  packageStatus?: string
}

export interface DealerPackageResponse {
  dealerId: number
  dealerCode: string
  dealerName: string
  maxAccounts: number
  createdAccounts: number
  remainingAccounts: number
  totalAllocatedDays: number
  usedAllocatedDays: number
  remainingAllocatedDays: number
  packageStartDate?: string | null
  packageExpiryDate?: string | null
  packageStatus: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | string
  expired: boolean
  active: boolean
}

export interface DealerStats {
  total: number
  active: number
  expiring: number
  locked: number
}
