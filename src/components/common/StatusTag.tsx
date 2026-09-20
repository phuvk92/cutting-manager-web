import React from 'react'
import { Tag } from 'antd'
import { CheckCircleOutlined, StopOutlined } from '@ant-design/icons'

interface StatusTagProps {
  enabled: boolean
}

export const StatusTag: React.FC<StatusTagProps> = ({ enabled }) => {
  return enabled ? (
    <Tag icon={<CheckCircleOutlined />} color="success">
      Active
    </Tag>
  ) : (
    <Tag icon={<StopOutlined />} color="error">
      Disabled
    </Tag>
  )
}
