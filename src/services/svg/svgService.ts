import { axiosClient } from '@/services/api/axiosClient'
import { API_ENDPOINTS } from '@/constants/api'
import { SvgFile, SvgFilterParams } from '@/types/svg'
import { PageResponse } from '@/types/common'

export const svgService = {
  getSvgFiles: async (params?: SvgFilterParams): Promise<PageResponse<SvgFile>> => {
    const response = await axiosClient.get<PageResponse<SvgFile>>(API_ENDPOINTS.SVG_LIST, {
      params,
    })
    return response.data
  },

  getPreviewBlobUrl: async (id: number): Promise<string> => {
    const response = await axiosClient.get<Blob>(API_ENDPOINTS.SVG_PREVIEW(id), {
      responseType: 'blob',
    })
    return URL.createObjectURL(response.data)
  },

  getThumbnailBlobUrl: async (url: string): Promise<string> => {
    // thumbnailUrl từ backend đã có sẵn tiền tố /api — gỡ đi để không bị baseURL nối lần nữa
    const path = url.startsWith('/api/') ? url.slice(4) : url
    const response = await axiosClient.get<Blob>(path, { responseType: 'blob' })
    return URL.createObjectURL(response.data)
  },

  downloadSvg: async (id: number, filename = 'download.svg'): Promise<void> => {
    const response = await axiosClient.get<Blob>(API_ENDPOINTS.SVG_DOWNLOAD(id), {
      responseType: 'blob',
    })

    const blob = new Blob([response.data], { type: 'image/svg+xml' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },
}
