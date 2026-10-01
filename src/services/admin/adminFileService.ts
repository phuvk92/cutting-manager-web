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
  /** Bản đã xếp — vào vùng cắt (SA-DanhMucXe-v2 §8.2) */
  nestedFile?: File | null
  /** Bản chưa xếp — vào khu chưa cắt */
  rawFile?: File | null
  /** Chỉ khi sửa: bỏ bản đã xếp / chưa xếp đang có (không được bỏ cả hai) */
  removeNested?: boolean
  removeRaw?: boolean
  name?: string
  categoryId?: number
  /** undefined = không gửi (giữ nguyên khi sửa); null = gửi rỗng (xoá năm → mọi năm) */
  year?: number | null
  vehicleNodeIds?: number[]
  thumbnail?: File | null
}

const appendPayload = (formData: FormData, payload: AdminFilePayload, forEdit: boolean) => {
  if (payload.nestedFile) formData.append('nestedFile', payload.nestedFile)
  if (payload.rawFile) formData.append('rawFile', payload.rawFile)
  if (forEdit && payload.removeNested) formData.append('removeNested', 'true')
  if (forEdit && payload.removeRaw) formData.append('removeRaw', 'true')
  if (payload.name !== undefined) formData.append('name', payload.name)
  if (payload.categoryId !== undefined) formData.append('categoryId', String(payload.categoryId))
  // Khi sửa: gửi year kể cả rỗng để server phân biệt "không đổi" với "xoá năm" (SA §3.2)
  if (payload.year !== undefined) formData.append('year', payload.year === null ? '' : String(payload.year))
  if (payload.vehicleNodeIds) {
    payload.vehicleNodeIds.forEach(id => formData.append('vehicleNodeIds', String(id)))
  }
  if (payload.thumbnail) formData.append('thumbnail', payload.thumbnail)
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
