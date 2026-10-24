export interface AuditLogV2Record {
  id: number
  requestId: string
  traceId: string | null
  clientId: string | null
  clientName: string | null
  principalType: 'USER' | 'CLIENT_ONLY' | 'ANONYMOUS'
  userId: number | null
  keycloakUserId: string | null
  username: string | null
  role: string | null
  dealerId: number | null
  dealerName: string | null
  httpMethod: string
  endpoint: string
  apiVersion: string
  httpStatus: number
  result: 'SUCCESS' | 'FAIL'
  errorCode: string | null
  executionTimeMs: number
  clientIp: string | null
  userAgent: string | null
  requestSizeBytes: number | null
  responseSizeBytes: number | null
  createdAt: string
}

export interface AuditLogV2Filter {
  keyword?: string
  clientId?: string
  clientName?: string
  username?: string
  userId?: number
  role?: string
  dealerId?: number
  endpoint?: string
  httpMethod?: string
  httpStatus?: number
  result?: string
  requestId?: string
  from?: string
  to?: string
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
}

export interface EndpointStat {
  endpoint: string
  httpMethod: string
  count: number
  avgLatencyMs: number
}

export interface ClientStat {
  clientId: string
  clientName: string
  count: number
}

export interface UserStat {
  username: string
  role: string
  count: number
}

export interface AuditLogV2Stats {
  totalRequests: number
  successCount: number
  failCount: number
  successRate: number
  topEndpoints: EndpointStat[]
  topClients: ClientStat[]
  topUsers: UserStat[]
}

export interface AuditLogV2PageResponse {
  content: AuditLogV2Record[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}
