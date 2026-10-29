import React, { ReactNode } from 'react'
import { Empty, Typography } from 'antd'
import { useTranslation } from 'react-i18next'

const { Paragraph } = Typography

interface EmptyStateProps {
  description?: string
  children?: ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  description,
  children,
}) => {
  const { t } = useTranslation(['common'])
  const desc = description || t('labels.noData')

  return (
    <div style={{ padding: '32px 0' }}>
      <Empty description={<Paragraph type="secondary">{desc}</Paragraph>}>
        {children}
      </Empty>
    </div>
  )
}
