import React, { useState } from 'react'
import { Layout, Dropdown, Avatar, Space, Typography, Button } from 'antd'
import {
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { RoleTag } from '@/components/common/RoleTag'
import { ChangePasswordModal } from '@/features/auth/ChangePasswordModal'

const { Header } = Layout
const { Text } = Typography

interface AppHeaderProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

export const AppHeader: React.FC<AppHeaderProps> = ({ collapsed, onToggleCollapse }) => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      label: (
        <div style={{ padding: '4px 0' }}>
          <Text strong style={{ display: 'block' }}>
            {user?.username}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {user?.email}
          </Text>
          <div style={{ marginTop: 6 }}>
            {user?.role && <RoleTag role={user.role} />}
          </div>
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'change-password',
      icon: <KeyOutlined />,
      label: 'Change Password',
      onClick: () => setChangePasswordOpen(true),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: 'Sign Out',
      onClick: handleLogout,
    },
  ]

  return (
    <>
      <Header
        style={{
          padding: '0 24px',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          zIndex: 10,
          position: 'sticky',
          top: 0,
        }}
      >
        <Space size="middle">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onToggleCollapse}
            style={{ fontSize: 16, width: 40, height: 40 }}
            aria-label="Toggle Navigation Sidebar"
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px',
              }}
            >
              CUTTING MANAGER
            </span>
            <span
              style={{
                background: '#f0f5ff',
                color: '#1d39c4',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              WEB
            </span>
          </div>
        </Space>

        <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
          <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }} className="user-dropdown-btn">
            <Avatar
              style={{ backgroundColor: '#1890ff', verticalAlign: 'middle' }}
              icon={<UserOutlined />}
            >
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <Text strong style={{ fontSize: 13 }}>
                {user?.username || 'User'}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {user?.role || 'Role'}
              </Text>
            </div>
          </Space>
        </Dropdown>
      </Header>

      <ChangePasswordModal
        open={changePasswordOpen}
        onCancel={() => setChangePasswordOpen(false)}
      />
    </>
  )
}
