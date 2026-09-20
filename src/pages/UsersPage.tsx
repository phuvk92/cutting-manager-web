import React from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { UserList } from '@/features/users/UserList'

export const UsersPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage user accounts, roles, access statuses, and permissions"
        breadcrumbs={[
          { title: 'Dashboard', href: '/dashboard' },
          { title: 'User Management' },
        ]}
      />
      <UserList />
    </div>
  )
}
