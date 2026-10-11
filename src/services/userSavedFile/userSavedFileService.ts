import { axiosClient } from '@/services/api/axiosClient'
import { API_ENDPOINTS } from '@/constants/api'
import { useAuthStore } from '@/stores/authStore'
import {
  UserSavedFile,
  UserSavedFileFilterParams,
  UserSavedFileListResponse,
  FileSharesResponse,
  UserSvgFileShareItem,
} from '@/types/userSavedFile'
import { normalizeSvgFilename } from '@/utils/formatters'

export const userSavedFileService = {
  list: async (params?: UserSavedFileFilterParams): Promise<UserSavedFileListResponse> => {
    const role = useAuthStore.getState().user?.role
    let endpoint: string = API_ENDPOINTS.ADMIN_USER_FILES
    if (role === 'AGENT') {
      endpoint = API_ENDPOINTS.AGENT_USER_FILES
    } else if (role === 'USER') {
      endpoint = API_ENDPOINTS.INTERNAL_USER_FILES
    }
    const response = await axiosClient.get<UserSavedFileListResponse>(
      endpoint,
      { params }
    )
    return response.data
  },

  getDetail: async (id: number): Promise<UserSavedFile> => {
    const role = useAuthStore.getState().user?.role
    const endpoint = role === 'USER' ? API_ENDPOINTS.INTERNAL_USER_FILE_DETAIL(id) : API_ENDPOINTS.ADMIN_USER_FILE_DETAIL(id)
    const response = await axiosClient.get<UserSavedFile>(endpoint)
    return response.data
  },

  getPreviewBlobUrl: async (id: number): Promise<string> => {
    const role = useAuthStore.getState().user?.role
    const endpoint = role === 'USER' ? API_ENDPOINTS.INTERNAL_USER_FILE_PREVIEW(id) : API_ENDPOINTS.ADMIN_USER_FILE_PREVIEW(id)
    const response = await axiosClient.get<Blob>(
      endpoint,
      { responseType: 'blob' }
    )
    return URL.createObjectURL(response.data)
  },

  download: async (id: number, filename?: string): Promise<void> => {
    const safeFilename = normalizeSvgFilename(filename, id)
    const role = useAuthStore.getState().user?.role
    const endpoint = role === 'USER' ? API_ENDPOINTS.INTERNAL_USER_FILE_DOWNLOAD(id) : API_ENDPOINTS.ADMIN_USER_FILE_DOWNLOAD(id)
    const response = await axiosClient.get<Blob>(
      endpoint,
      { responseType: 'blob' }
    )

    const blob = new Blob([response.data], { type: 'image/svg+xml' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', safeFilename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },

  getShares: async (fileId: number): Promise<FileSharesResponse> => {
    const role = useAuthStore.getState().user?.role
    const endpoint = role === 'USER' ? API_ENDPOINTS.INTERNAL_USER_FILE_SHARES(fileId) : API_ENDPOINTS.ADMIN_USER_FILE_SHARES(fileId)
    const response = await axiosClient.get<FileSharesResponse>(endpoint)
    return response.data
  },

  share: async (fileId: number, userId: number): Promise<UserSvgFileShareItem> => {
    const role = useAuthStore.getState().user?.role
    const endpoint = role === 'USER' ? API_ENDPOINTS.INTERNAL_USER_FILE_SHARES(fileId) : API_ENDPOINTS.ADMIN_USER_FILE_SHARES(fileId)
    const response = await axiosClient.post<UserSvgFileShareItem>(
      endpoint,
      { userId }
    )
    return response.data
  },

  revokeShare: async (fileId: number, targetUserId: number): Promise<void> => {
    const role = useAuthStore.getState().user?.role
    const endpoint = role === 'USER' ? `/internal/user-files/${fileId}/shares/${targetUserId}` : API_ENDPOINTS.ADMIN_USER_FILE_REVOKE_SHARE(fileId, targetUserId)
    await axiosClient.delete(endpoint)
  },
}
