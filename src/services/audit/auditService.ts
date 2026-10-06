import { axiosClient } from '@/services/api/axiosClient'
import { API_ENDPOINTS } from '@/constants/api'

export interface ActuatorHealth {
  status: string
  components?: Record<string, { status: string; details?: Record<string, unknown> }>
}

export interface AuditLogItem {
  id: number | string
  timestamp: string
  actor: string
  actorRole: string
  action: string
  entity: string
  resource?: string
  entityId?: number
  details: string
}

export interface AuditLogsResponse {
  content: AuditLogItem[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export interface AuditLogQueryParams {
  keyword?: string
  entity?: string
  actor?: string
  actorRole?: string
  action?: string
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: string
}

export const auditService = {
  getHealth: async (): Promise<ActuatorHealth> => {
    const response = await axiosClient.get<ActuatorHealth>(API_ENDPOINTS.HEALTH)
    return response.data
  },
  getAuditLogs: async (params?: AuditLogQueryParams): Promise<AuditLogsResponse> => {
    const response = await axiosClient.get<AuditLogsResponse>(API_ENDPOINTS.AUDIT_LOGS_LIST, { params })
    return response.data
  },
  getAuditLogById: async (id: number | string): Promise<AuditLogItem> => {
    const response = await axiosClient.get<AuditLogItem>(API_ENDPOINTS.AUDIT_LOG_DETAIL(id))
    return response.data
  },
}
