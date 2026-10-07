import React from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { UserSavedFileList } from '@/features/userSavedFiles/UserSavedFileList'

export const UserSavedFilesPage: React.FC = () => {
  return (
    <div className="saved-files-page-container">
      <PageHeader
        title="Bản đã lưu"
        subtitle="Quản lý toàn bộ file SVG do người dùng máy cắt lưu thông qua hệ thống"
      />
      <div className="saved-files-page-content">
        <UserSavedFileList />
      </div>
    </div>
  )
}
