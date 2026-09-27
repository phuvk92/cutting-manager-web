import React from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { AuditLogView } from '@/features/audit/AuditLogView'

export const AuditPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <PageHeader
        title="Nhật ký quản trị"
        subtitle="Ai đã làm gì trên cổng quản trị · truy vết bảo mật hệ thống"
      />
      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AuditLogView />
      </div>
    </div>
  )
}
