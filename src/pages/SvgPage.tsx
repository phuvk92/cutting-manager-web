import React from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { SvgList } from '@/features/svg/SvgList'

export const SvgPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100%' }}>
      <PageHeader
        title="Kho mẫu & part file"
        subtitle="Danh mục dùng chung và mẫu do đại lý nạp — một file gắn được nhiều mẫu xe"
      />
      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <SvgList />
      </div>
    </div>
  )
}
