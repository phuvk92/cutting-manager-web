import React from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { DashboardOverview } from '@/features/dashboard/DashboardOverview'

export const DashboardPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <PageHeader
        title="Bảng tổng quan"
        subtitle="Toàn hệ thống · cập nhật trực tiếp theo thời gian thực"
      />
      <div style={{ padding: '16px 24px', flex: 1 }}>
        <DashboardOverview />
      </div>
    </div>
  )
}
