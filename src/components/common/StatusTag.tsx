import React from 'react'
import { Tag } from 'antd'
import { CheckCircleOutlined, StopOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

interface StatusTagProps {
  enabled: boolean
}

export const StatusTag: React.FC<StatusTagProps> = ({ enabled }) => {
  const { t } = useTranslation(['common'])
  return enabled ? (
    <Tag icon={<CheckCircleOutlined />} color="success">
      {t('status.active')}
    </Tag>
  ) : (
    <Tag icon={<StopOutlined />} color="error">
      {t('status.disabled')}
    </Tag>
  )
}
