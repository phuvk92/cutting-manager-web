import React from 'react'
import { Spin, Typography } from 'antd'

const { Text } = Typography

interface LoadingStateProps {
  tip?: string
  minHeight?: number | string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  tip = 'Loading data...',
  minHeight = 250,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight,
        gap: 16,
      }}
    >
      <Spin size="large" />
      <Text type="secondary">{tip}</Text>
    </div>
  )
}
