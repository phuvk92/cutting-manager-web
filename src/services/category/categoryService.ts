import { axiosClient } from '@/services/api/axiosClient'
import { API_ENDPOINTS } from '@/constants/api'
import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CatalogOption,
} from '@/types/category'

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    const response = await axiosClient.get<Category[]>(API_ENDPOINTS.CATEGORIES)
    return response.data
  },

  getCategoryById: async (id: number): Promise<Category> => {
    const response = await axiosClient.get<Category>(API_ENDPOINTS.CATEGORY_DETAIL(id))
    return response.data
  },

  createCategory: async (payload: CreateCategoryRequest): Promise<Category> => {
    const response = await axiosClient.post<Category>(API_ENDPOINTS.CATEGORY_CREATE, payload)
    return response.data
  },

  updateCategory: async (id: number, payload: UpdateCategoryRequest): Promise<Category> => {
    const response = await axiosClient.put<Category>(API_ENDPOINTS.CATEGORY_UPDATE(id), payload)
    return response.data
  },

  deleteCategory: async (id: number): Promise<void> => {
    await axiosClient.delete(API_ENDPOINTS.CATEGORY_DELETE(id))
  },

  getCatalogByLevel: async (
    level: string,
    params?: Record<string, string>
  ): Promise<CatalogOption[]> => {
    const response = await axiosClient.get<CatalogOption[]>(API_ENDPOINTS.CATALOG_LEVEL(level), {
      params,
    })
    return response.data
  },
}
