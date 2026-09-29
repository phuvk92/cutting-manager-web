import { axiosClient } from '@/services/api/axiosClient'
import { API_ENDPOINTS } from '@/constants/api'
import { VehicleNode } from '@/types/adminFile'
import { PageResponse } from '@/types/common'
import { CatalogOption } from '@/types/category'

export const vehicleNodeService = {
  /**
   * Cả cây xe 4 cấp: lặp qua mọi trang (phân trang theo hãng) rồi trả mảng hãng
   * kèm children lồng nhau.
   */
  getBrandTrees: async (): Promise<VehicleNode[]> => {
    const brands: VehicleNode[] = []
    let page = 0
    for (;;) {
      const response = await axiosClient.get<PageResponse<VehicleNode>>(
        API_ENDPOINTS.VEHICLE_NODES,
        { params: { page, size: 200 } }
      )
      const data = response.data
      brands.push(...(data.content || []))
      if (data.last || page + 1 >= data.totalPages) break
      page += 1
    }
    return brands
  },

  getFileCategories: async (): Promise<CatalogOption[]> => {
    const response = await axiosClient.get<CatalogOption[]>(API_ENDPOINTS.FILE_CATEGORIES)
    return response.data
  },
}
