import { axiosClient } from '@/services/api/axiosClient'
import { API_ENDPOINTS } from '@/constants/api'
import {
  AuditLogV2Filter,
  AuditLogV2PageResponse,
  AuditLogV2Record,
  AuditLogV2Stats,
} from '@/types/auditV2'

export const auditV2Service = {
  getLogs: async (params?: AuditLogV2Filter): Promise<AuditLogV2PageResponse> => {
    const cleanParams: Record<string, unknown> = {}
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          cleanParams[key] = val
        }
      })
    }
    const response = await axiosClient.get<AuditLogV2PageResponse>(API_ENDPOINTS.AUDIT_V2_LIST, {
      params: cleanParams,
    })
    return response.data
  },

  getLogById: async (id: number | string): Promise<AuditLogV2Record> => {
    const response = await axiosClient.get<AuditLogV2Record>(API_ENDPOINTS.AUDIT_V2_DETAIL(id))
    return response.data
  },

  getStats: async (params?: {
    from?: string
    to?: string
    clientId?: string
    dealerId?: number
  }): Promise<AuditLogV2Stats> => {
    const cleanParams: Record<string, unknown> = {}
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          cleanParams[key] = val
        }
      })
    }
    const response = await axiosClient.get<AuditLogV2Stats>(API_ENDPOINTS.AUDIT_V2_STATS, {
      params: cleanParams,
    })
    return response.data
  },

  exportCsv: async (params?: AuditLogV2Filter): Promise<void> => {
    const cleanParams: Record<string, unknown> = {}
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          cleanParams[key] = val
        }
      })
    }
    const response = await axiosClient.get(API_ENDPOINTS.AUDIT_V2_EXPORT, {
      params: cleanParams,
      responseType: 'blob',
    })

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `audit-v2-export-${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },
}
