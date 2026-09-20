import React from 'react'
import { Layout, Typography } from 'antd'

const { Footer } = Layout
const { Text } = Typography

export const AppFooter: React.FC = () => {
  return (
    <Footer style={{ textAlign: 'center', background: 'transparent', padding: '16px 24px' }}>
      <Text type="secondary" style={{ fontSize: 13 }}>
        Cutting Manager Web &copy; {new Date().getFullYear()} — Enterprise SVG Management System
      </Text>
    </Footer>
  )
}
