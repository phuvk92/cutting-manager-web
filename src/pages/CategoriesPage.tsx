import React, { useState, useEffect } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { CategoryList } from '@/features/categories/CategoryList'
import { InfoCircleOutlined } from '@ant-design/icons'
import { categoryService } from '@/services/category/categoryService'
import { Category } from '@/types/category'

const initialLevels = [
  { n: "1", name: "Nhóm ứng dụng", count: "3" },
  { n: "2", name: "Hãng", count: "42" },
  { n: "3", name: "Dòng xe", count: "386" },
  { n: "4", name: "Phiên bản", count: "1 284" },
  { n: "5", name: "Năm", count: "2 940" },
  { n: "6", name: "Biến thể", count: "4 118" }
]

export const CategoriesPage: React.FC = () => {
  const [levels, setLevels] = useState(initialLevels)

  useEffect(() => {
    categoryService.getCategories().then((categories: Category[]) => {
      if (categories && categories.length > 0) {
        let l1 = 0, l2 = 0, l3 = 0, l4 = 0, l5 = 0, l6 = 0
        categories.forEach(c => {
          if (c.level === 'category') l1++
          else if (c.level === 'brand') l2++
          else if (c.level === 'model') l3++
          else if (c.level === 'variant') l4++
          else if (c.level === 'year') l5++
          else if (c.level === 'submodel') l6++
        })
        setLevels([
          { n: "1", name: "Nhóm ứng dụng", count: String(l1 || 3) },
          { n: "2", name: "Hãng", count: String(l2 || 42) },
          { n: "3", name: "Dòng xe", count: String(l3 || 386) },
          { n: "4", name: "Phiên bản", count: String(l4 || 1284) },
          { n: "5", name: "Năm", count: String(l5 || 2940) },
          { n: "6", name: "Biến thể", count: String(l6 || 4118) },
        ])
      }
    }).catch(() => {})
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <PageHeader
        title="Danh mục xe"
        subtitle="Sáu cấp phân loại và Model Album"
      />
      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Banner hướng dẫn chuẩn AdminPoc */}
        <div style={{ display: 'flex', gap: 10, padding: '11px 14px', background: '#F6F4FD', border: '1px solid #DDD2FA', borderRadius: 6 }}>
          <InfoCircleOutlined style={{ color: '#6C3BD6', marginTop: 2 }} />
          <div style={{ font: "400 11.5px/1.6 'IBM Plex Sans', sans-serif", color: '#4A3A6B' }}>
            Sáu cấp phân loại: Nhóm ứng dụng → Hãng → Dòng xe → Phiên bản → Năm → Biến thể. Đây là dữ liệu nền cho bộ lọc mẫu trong app thợ.
          </div>
        </div>

        {/* 6 Khối cấp danh mục */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 10 }}>
          {levels.map((l) => (
            <div key={l.n} style={{ padding: '12px 13px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
              <div style={{ font: "400 10px 'IBM Plex Sans', sans-serif", letterSpacing: '0.06em', color: '#A3A29C' }}>
                CẤP {l.n}
              </div>
              <div style={{ marginTop: 5, font: "500 12px 'IBM Plex Sans', sans-serif", color: '#1B1B19' }}>
                {l.name}
              </div>
              <div style={{ marginTop: 7, font: "500 19px 'IBM Plex Mono', monospace", color: '#35342F' }}>
                {l.count}
              </div>
            </div>
          ))}
        </div>

        {/* Cây danh mục thực tế */}
        <CategoryList />
      </div>
    </div>
  )
}
