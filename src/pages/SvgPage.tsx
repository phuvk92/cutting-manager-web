import React from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { SvgList } from '@/features/svg/SvgList'

export const SvgPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="SVG File Management"
        subtitle="Upload, search, preview, download, and manage sanitized SVG assets"
        breadcrumbs={[
          { title: 'Dashboard', href: '/dashboard' },
          { title: 'SVG Files' },
        ]}
      />
      <SvgList />
    </div>
  )
}
