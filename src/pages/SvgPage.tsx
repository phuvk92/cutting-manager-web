import React from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { SvgList } from '@/features/svg/SvgList'

export const SvgPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100%' }}>
      <PageHeader
        title="Kho mẫu & part file"
        subtitle="Quản lý file mẫu cắt SVG, gán cấu hình xe và phân quyền đại lý"
      />
      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <SvgList />
      </div>
    </div>
  )
}
