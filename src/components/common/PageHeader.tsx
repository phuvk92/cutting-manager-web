import React, { ReactNode } from 'react'
import { Typography, Space, Breadcrumb } from 'antd'
import type { BreadcrumbProps } from 'antd'

const { Title, Paragraph } = Typography

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbProps['items']
  extra?: ReactNode
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  extra,
}) => {
  return (
    <div style={{ marginBottom: 24 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb style={{ marginBottom: 12 }} items={breadcrumbs} />
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>
            {title}
          </Title>
          {subtitle && (
            <Paragraph type="secondary" style={{ margin: '4px 0 0 0' }}>
              {subtitle}
            </Paragraph>
          )}
        </div>
        {extra && <Space size="middle">{extra}</Space>}
      </div>
    </div>
  )
}
