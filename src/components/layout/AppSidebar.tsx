import React from 'react'
import { Layout, Menu } from 'antd'
import {
  DashboardOutlined,
  FileImageOutlined,
  TeamOutlined,
  AuditOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

const { Sider } = Layout

interface AppSidebarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()

  const isAdmin = user?.role === 'ADMIN'

  // Build menu items based on actual backend roles
  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/svg',
      icon: <FileImageOutlined />,
      label: 'SVG Files',
    },
    ...(isAdmin
      ? [
          {
            key: '/users',
            icon: <TeamOutlined />,
            label: 'User Management',
          },
          {
            key: '/audit',
            icon: <AuditOutlined />,
            label: 'Audit & Health',
          },
        ]
      : []),
  ]

  // Determine active key
  const selectedKey = location.pathname.startsWith('/svg')
    ? '/svg'
    : location.pathname.startsWith('/users')
    ? '/users'
    : location.pathname.startsWith('/audit')
    ? '/audit'
    : '/dashboard'

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      breakpoint="lg"
      theme="light"
      width={240}
      style={{
        boxShadow: '1px 0 4px rgba(0,21,41,.05)',
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 16px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #1890ff, #722ed1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            C
          </div>
          {!collapsed && (
            <span style={{ fontWeight: 700, fontSize: 15, color: '#1f1f1f' }}>
              Cutting Admin
            </span>
          )}
        </div>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ borderRight: 0, marginTop: 12 }}
      />
    </Sider>
  )
}
