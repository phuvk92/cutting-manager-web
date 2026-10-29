import React from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/common/PageHeader'
import { UserSavedFileList } from '@/features/userSavedFiles/UserSavedFileList'

export const UserSavedFilesPage: React.FC = () => {
  const { t } = useTranslation(['savedFiles'])

  return (
    <div className="saved-files-page-container">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <div className="saved-files-page-content">
        <UserSavedFileList />
      </div>
    </div>
  )
}
