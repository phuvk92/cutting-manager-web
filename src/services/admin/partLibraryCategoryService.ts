import { axiosClient } from '@/services/api/axiosClient'
import { API_ENDPOINTS } from '@/constants/api'
import { PageResponse } from '@/types/common'
import {
  PartLibraryCategory,
  PartLibraryCategoryCreateRequest,
  PartLibraryCategoryUpdateRequest,
  PartLibraryCategoryFilterParams,
} from '@/types/partLibraryCategory'

export const partLibraryCategoryService = {
  getCategories: async (params?: PartLibraryCategoryFilterParams): Promise<PageResponse<PartLibraryCategory>> => {
    const response = await axiosClient.get<PageResponse<PartLibraryCategory>>(
      API_ENDPOINTS.PART_LIBRARY_CATEGORIES,
      { params }
    )
    return response.data
  },

  getActiveCategories: async (): Promise<PartLibraryCategory[]> => {
    const response = await axiosClient.get<PartLibraryCategory[]>(
      API_ENDPOINTS.PART_LIBRARY_CATEGORIES_ACTIVE
    )
    return response.data
  },

  getCategoryById: async (id: number): Promise<PartLibraryCategory> => {
    const response = await axiosClient.get<PartLibraryCategory>(
      API_ENDPOINTS.PART_LIBRARY_CATEGORY_DETAIL(id)
    )
    return response.data
  },

  createCategory: async (data: PartLibraryCategoryCreateRequest): Promise<PartLibraryCategory> => {
    const response = await axiosClient.post<PartLibraryCategory>(
      API_ENDPOINTS.PART_LIBRARY_CATEGORIES,
      data
    )
    return response.data
  },

  updateCategory: async (id: number, data: PartLibraryCategoryUpdateRequest): Promise<PartLibraryCategory> => {
    const response = await axiosClient.put<PartLibraryCategory>(
      API_ENDPOINTS.PART_LIBRARY_CATEGORY_DETAIL(id),
      data
    )
    return response.data
  },

  deleteCategory: async (id: number): Promise<void> => {
    await axiosClient.delete(API_ENDPOINTS.PART_LIBRARY_CATEGORY_DETAIL(id))
  },
}
