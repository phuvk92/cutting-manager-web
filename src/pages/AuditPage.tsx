import React from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { AuditLogView } from '@/features/audit/AuditLogView'

export const AuditPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Audit Logs & System Health"
        subtitle="Review security events, user activity trails, and backend actuator health status"
        breadcrumbs={[
          { title: 'Dashboard', href: '/dashboard' },
          { title: 'Audit Logs & Health' },
        ]}
      />
      <AuditLogView />
    </div>
  )
}
