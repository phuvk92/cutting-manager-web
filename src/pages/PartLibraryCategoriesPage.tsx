import React from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/common/PageHeader'
import { PartLibraryCategoryList } from '@/features/partLibraryCategories/PartLibraryCategoryList'

export const PartLibraryCategoriesPage: React.FC = () => {
  const { t } = useTranslation(['partLibraryCategories'])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100%' }}>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <PartLibraryCategoryList />
      </div>
    </div>
  )
}
