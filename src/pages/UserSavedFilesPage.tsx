import React from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { UserSavedFileList } from '@/features/userSavedFiles/UserSavedFileList'

export const UserSavedFilesPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100%' }}>
      <PageHeader
        title="Bản đã lưu"
        subtitle="Quản lý toàn bộ file SVG do người dùng máy cắt lưu thông qua hệ thống"
      />
      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <UserSavedFileList />
      </div>
    </div>
  )
}
