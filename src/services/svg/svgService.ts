import { axiosClient } from '@/services/api/axiosClient'
import { API_ENDPOINTS } from '@/constants/api'
import {
  SvgFile,
  SvgFilterParams,
  BatchSvgUploadResponse,
  SvgFileDealerPermission,
  SvgVehicleConfigurationSummary,
} from '@/types/svg'
import { PageResponse } from '@/types/common'
import type { AxiosProgressEvent } from 'axios'

export const svgService = {
  getSvgFiles: async (params?: SvgFilterParams): Promise<PageResponse<SvgFile>> => {
    const response = await axiosClient.get<PageResponse<SvgFile>>(API_ENDPOINTS.SVG_LIST, {
      params,
    })
    return response.data
  },

  getSvgById: async (id: number): Promise<SvgFile> => {
    const response = await axiosClient.get<SvgFile>(API_ENDPOINTS.SVG_DETAIL(id))
    return response.data
  },

  uploadSvg: async (
    file: File,
    categoryId: number,
    onProgress?: (percent: number) => void
  ): Promise<SvgFile> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('categoryId', categoryId.toString())

    const response = await axiosClient.post<SvgFile>(API_ENDPOINTS.SVG_UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      },
    })
    return response.data
  },

  batchUploadSvg: async (
    files: File[],
    vehicleConfigurationIds: number[],
    dealerPermissions: { dealerId: number; canView: boolean; canDownload: boolean }[],
    onProgress?: (percent: number) => void
  ): Promise<BatchSvgUploadResponse> => {
    const formData = new FormData()
    files.forEach(f => {
      formData.append('files', f)
    })
    vehicleConfigurationIds.forEach(id => {
      formData.append('vehicleConfigurationIds', id.toString())
    })
    if (dealerPermissions.length > 0) {
      formData.append('dealerPermissions', JSON.stringify(dealerPermissions))
    }

    const response = await axiosClient.post<BatchSvgUploadResponse>(
      API_ENDPOINTS.SVG_BATCH_UPLOAD,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(percent)
          }
        },
      }
    )
    return response.data
  },

  getSvgDealers: async (id: number): Promise<SvgFileDealerPermission[]> => {
    const response = await axiosClient.get<SvgFileDealerPermission[]>(API_ENDPOINTS.SVG_DEALERS(id))
    return response.data
  },

  updateSvgDealers: async (
    id: number,
    dealers: { dealerId: number; canView: boolean; canDownload: boolean }[]
  ): Promise<SvgFileDealerPermission[]> => {
    const response = await axiosClient.put<SvgFileDealerPermission[]>(API_ENDPOINTS.SVG_DEALERS(id), {
      dealers,
    })
    return response.data
  },

  getSvgConfigurations: async (id: number): Promise<SvgVehicleConfigurationSummary[]> => {
    const response = await axiosClient.get<SvgVehicleConfigurationSummary[]>(
      API_ENDPOINTS.SVG_CONFIGURATIONS(id)
    )
    return response.data
  },

  updateSvgConfigurations: async (
    id: number,
    vehicleConfigurationIds: number[]
  ): Promise<SvgVehicleConfigurationSummary[]> => {
    const response = await axiosClient.put<SvgVehicleConfigurationSummary[]>(
      API_ENDPOINTS.SVG_CONFIGURATIONS(id),
      {
        vehicleConfigurationIds,
      }
    )
    return response.data
  },

  getPreviewContent: async (id: number): Promise<string> => {
    const response = await axiosClient.get<string>(API_ENDPOINTS.SVG_PREVIEW(id), {
      responseType: 'text',
      headers: {
        Accept: 'image/svg+xml, text/plain, */*',
      },
    })
    return response.data
  },

  getPreviewBlobUrl: async (id: number): Promise<string> => {
    const response = await axiosClient.get<Blob>(API_ENDPOINTS.SVG_PREVIEW(id), {
      responseType: 'blob',
    })
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

  deleteSvg: async (id: number): Promise<void> => {
    await axiosClient.delete(API_ENDPOINTS.SVG_DELETE(id))
  },
}
