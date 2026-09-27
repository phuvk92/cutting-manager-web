export interface Dealer {
  id: number
  code: string
  name: string
  region?: string
  address?: string
  phone?: string
  email?: string
  contactPerson?: string
  plan: string
  dueDate?: string
  status: 'ACTIVE' | 'EXPIRING' | 'LOCKED' | string
  usersCount: number
  notes?: string
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
  plan?: string
  dueDate?: string
  status?: string
  notes?: string
}

export interface UpdateDealerRequest {
  code: string
  name: string
  region?: string
  address?: string
  phone?: string
  email?: string
  contactPerson?: string
  plan?: string
  dueDate?: string
  status?: string
  notes?: string
}

export interface DealerStats {
  total: number
  active: number
  expiring: number
  locked: number
}
