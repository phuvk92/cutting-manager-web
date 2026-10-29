import React from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/common/PageHeader'
import { SvgList } from '@/features/svg/SvgList'

export const SvgPage: React.FC = () => {
  const { t } = useTranslation(['parts'])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100%' }}>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <SvgList />
      </div>
    </div>
  )
}
