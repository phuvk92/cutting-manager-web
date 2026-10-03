import { axiosClient } from '@/services/api/axiosClient'
import { API_ENDPOINTS } from '@/constants/api'
import {
  UserSavedFile,
  UserSavedFileFilterParams,
  UserSavedFileListResponse,
} from '@/types/userSavedFile'
import { normalizeSvgFilename } from '@/utils/formatters'

export const userSavedFileService = {
  list: async (params?: UserSavedFileFilterParams): Promise<UserSavedFileListResponse> => {
    const response = await axiosClient.get<UserSavedFileListResponse>(
      API_ENDPOINTS.ADMIN_USER_FILES,
      { params }
    )
    return response.data
  },

  getDetail: async (id: number): Promise<UserSavedFile> => {
    const response = await axiosClient.get<UserSavedFile>(
      API_ENDPOINTS.ADMIN_USER_FILE_DETAIL(id)
    )
    return response.data
  },

  getPreviewBlobUrl: async (id: number): Promise<string> => {
    const response = await axiosClient.get<Blob>(
      API_ENDPOINTS.ADMIN_USER_FILE_PREVIEW(id),
      { responseType: 'blob' }
    )
    return URL.createObjectURL(response.data)
  },

  download: async (id: number, filename?: string): Promise<void> => {
    const safeFilename = normalizeSvgFilename(filename, id)
    const response = await axiosClient.get<Blob>(
      API_ENDPOINTS.ADMIN_USER_FILE_DOWNLOAD(id),
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
}
