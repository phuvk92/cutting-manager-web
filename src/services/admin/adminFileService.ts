import { axiosClient } from '@/services/api/axiosClient'
import { API_ENDPOINTS } from '@/constants/api'
import {
  AdminFile,
  AdminFileFilterParams,
  AdminFileStats,
} from '@/types/adminFile'
import { PageResponse } from '@/types/common'
import type { AxiosProgressEvent } from 'axios'

export interface AdminFilePayload {
  file?: File | null
  name?: string
  categoryId?: number
  /** undefined = không gửi (giữ nguyên khi sửa); null = gửi rỗng (xoá năm → mọi năm) */
  year?: number | null
  vehicleNodeIds?: number[]
  thumbnail?: File | null
  /** Khổ cắt mm — luôn gửi cả cặp (NGO-401); server từ chối khi thiếu một (CUT_AREA_INCOMPLETE) */
  cutAreaLengthMm?: number
  cutAreaWidthMm?: number
}

const appendPayload = (formData: FormData, payload: AdminFilePayload, forEdit: boolean) => {
  if (payload.file) formData.append('file', payload.file)
  if (payload.name !== undefined) formData.append('name', payload.name)
  if (payload.categoryId !== undefined) formData.append('categoryId', String(payload.categoryId))
  // Khi sửa: gửi year kể cả rỗng để server phân biệt "không đổi" với "xoá năm" (SA §3.2)
  if (payload.year !== undefined) formData.append('year', payload.year === null ? '' : String(payload.year))
  if (payload.vehicleNodeIds) {
    payload.vehicleNodeIds.forEach(id => formData.append('vehicleNodeIds', String(id)))
  }
  if (payload.thumbnail) formData.append('thumbnail', payload.thumbnail)
  if (payload.cutAreaLengthMm !== undefined) {
    formData.append('cutAreaLengthMm', String(payload.cutAreaLengthMm))
  }
  if (payload.cutAreaWidthMm !== undefined) {
    formData.append('cutAreaWidthMm', String(payload.cutAreaWidthMm))
  }
  void forEdit
}

const multipartConfig = (onProgress?: (percent: number) => void) => ({
  headers: { 'Content-Type': 'multipart/form-data' },
  onUploadProgress: (e: AxiosProgressEvent) => {
    if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total))
  },
})

export const adminFileService = {
  getFiles: async (params?: AdminFileFilterParams): Promise<PageResponse<AdminFile>> => {
    const response = await axiosClient.get<PageResponse<AdminFile>>(API_ENDPOINTS.ADMIN_FILES, {
      params,
    })
    return response.data
  },

  getStats: async (): Promise<AdminFileStats> => {
    const response = await axiosClient.get<AdminFileStats>(API_ENDPOINTS.ADMIN_FILE_STATS)
    return response.data
  },

  createFile: async (
    payload: AdminFilePayload,
    onProgress?: (percent: number) => void
  ): Promise<AdminFile> => {
    const formData = new FormData()
    appendPayload(formData, payload, false)
    const response = await axiosClient.post<AdminFile>(
      API_ENDPOINTS.ADMIN_FILES,
      formData,
      multipartConfig(onProgress)
    )
    return response.data
  },

  updateFile: async (
    id: number,
    payload: AdminFilePayload,
    onProgress?: (percent: number) => void
  ): Promise<AdminFile> => {
    const formData = new FormData()
    appendPayload(formData, payload, true)
    const response = await axiosClient.put<AdminFile>(
      API_ENDPOINTS.ADMIN_FILE_DETAIL(id),
      formData,
      multipartConfig(onProgress)
    )
    return response.data
  },

  deleteFile: async (id: number): Promise<void> => {
    await axiosClient.delete(API_ENDPOINTS.ADMIN_FILE_DETAIL(id))
  },
}
