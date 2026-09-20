import React, { ReactNode } from 'react'
import { Empty, Typography } from 'antd'

const { Paragraph } = Typography

interface EmptyStateProps {
  description?: string
  children?: ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  description = 'No data found',
  children,
}) => {
  return (
    <div style={{ padding: '32px 0' }}>
      <Empty description={<Paragraph type="secondary">{description}</Paragraph>}>
        {children}
      </Empty>
    </div>
  )
}
