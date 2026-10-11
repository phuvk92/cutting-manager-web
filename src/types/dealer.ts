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
  // Thông tin gói account của đại lý
  maxAccounts?: number
  totalAllocatedDays?: number
  usedAllocatedDays?: number
  remainingAllocatedDays?: number
  packageStartDate?: string | null
  packageExpiryDate?: string | null
  packageStatus?: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | string
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
