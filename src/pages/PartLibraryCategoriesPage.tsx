import React from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { PartLibraryCategoryList } from '@/features/partLibraryCategories/PartLibraryCategoryList'

export const PartLibraryCategoriesPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100%' }}>
      <PageHeader
        title="Danh mục kho mẫu & part"
        subtitle="Quản lý danh mục phân loại kho mẫu và part file (Nội thất, Ngoại thất, Phim cách nhiệt...) — Tách biệt hoàn toàn với Danh mục xe"
      />
      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <PartLibraryCategoryList />
      </div>
    </div>
  )
}
