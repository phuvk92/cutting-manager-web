import React from 'react'
import { Alert, Button, Space } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

interface ErrorStateProps {
  message?: string
  description?: string
  onRetry?: () => void
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  description,
  onRetry,
}) => {
  const { t } = useTranslation(['errors', 'common'])
  const msg = message || t('generic.title', { ns: 'errors' })
  const desc = description || t('generic.description', { ns: 'errors' })

  return (
    <Alert
      type="error"
      showIcon
      message={msg}
      description={
        <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 8 }}>
          <span>{desc}</span>
          {onRetry && (
            <Button size="small" danger icon={<ReloadOutlined />} onClick={onRetry}>
              {t('actions.retry', { ns: 'common' })}
            </Button>
          )}
        </Space>
      }
      style={{ marginBottom: 16 }}
    />
  )
}
