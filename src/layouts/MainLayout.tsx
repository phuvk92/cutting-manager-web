import React, { useState } from 'react'
import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { AppFooter } from '@/components/layout/AppFooter'

const { Content } = Layout

export const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <AppSidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <Layout>
        <AppHeader
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(prev => !prev)}
        />
        <Content
          style={{
            margin: '24px 24px 0',
            padding: 24,
            background: '#ffffff',
            borderRadius: 8,
            minHeight: 380,
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <Outlet />
        </Content>
        <AppFooter />
      </Layout>
    </Layout>
  )
}
