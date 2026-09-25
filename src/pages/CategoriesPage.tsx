import React from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { CategoryList } from '@/features/categories/CategoryList'

export const CategoriesPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Quản lý Danh mục (Categories)"
        subtitle="Quản lý cấu trúc phân cấp danh mục 6 cấp theo catalog (category, brand, model, variant, year, submodel)"
        breadcrumbs={[
          { title: 'Dashboard', href: '/dashboard' },
          { title: 'Categories' },
        ]}
      />
      <CategoryList />
    </div>
  )
}
