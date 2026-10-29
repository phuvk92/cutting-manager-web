import React from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/common/PageHeader'
import { DashboardOverview } from '@/features/dashboard/DashboardOverview'

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation(['dashboard'])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <div style={{ padding: '16px 24px', flex: 1 }}>
        <DashboardOverview />
      </div>
    </div>
  )
}
