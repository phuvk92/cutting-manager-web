import React from 'react'
import { Alert, Button, Space } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

interface ErrorStateProps {
  message?: string
  description?: string
  onRetry?: () => void
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Error Occurred',
  description = 'Failed to load data from server. Please try again.',
  onRetry,
}) => {
  return (
    <Alert
      type="error"
      showIcon
      message={message}
      description={
        <Space orientation="vertical" size="small" style={{ width: '100%', marginTop: 8 }}>
          <span>{description}</span>
          {onRetry && (
            <Button size="small" danger icon={<ReloadOutlined />} onClick={onRetry}>
              Retry
            </Button>
          )}
        </Space>
      }
      style={{ marginBottom: 16 }}
    />
  )
}
