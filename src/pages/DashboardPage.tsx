import React from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { DashboardOverview } from '@/features/dashboard/DashboardOverview'

export const DashboardPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of system metrics, file assets, and recent activities"
      />
      <DashboardOverview />
    </div>
  )
}
