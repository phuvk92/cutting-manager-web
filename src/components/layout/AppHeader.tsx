import React, { useState } from 'react'
import { Dropdown, Typography } from 'antd'
import {
  LogoutOutlined,
  KeyOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { ChangePasswordModal } from '@/features/auth/ChangePasswordModal'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'

const { Text } = Typography

export const AppHeader: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation(['nav', 'common'])
  const { user, logout } = useAuthStore()
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleNameMap: Record<string, string> = {
    ADMIN: t('roles.ADMIN', { ns: 'common' }),
    AGENT: t('roles.AGENT', { ns: 'common' }),
    USER: t('roles.USER', { ns: 'common' }),
  }

  const userRoleDisplay = user?.role ? roleNameMap[user.role] || user.role : t('roles.ADMIN', { ns: 'common' })
  const userInitials = (user?.username?.substring(0, 2) || 'QT').toUpperCase()

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      label: (
        <div style={{ padding: '4px 0' }}>
          <Text strong style={{ display: 'block', fontSize: 13 }}>
            {user?.username}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {user?.email || t('userMenu.internal', { ns: 'nav' })} · {userRoleDisplay}
          </Text>
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
      label: t('userMenu.changePassword', { ns: 'nav' }),
      onClick: () => setChangePasswordOpen(true),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: t('userMenu.logout', { ns: 'nav' }),
      onClick: handleLogout,
    },
  ]

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/svg?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <>
      <header
        style={{
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          height: 54,
          padding: '0 20px',
          background: '#FBFBFA',
          borderBottom: '1px solid #D8D7D2',
          zIndex: 10,
        }}
      >
        {/* Brand Logo & Title */}
        <div
          onClick={() => navigate('/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}
        >
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <rect x="1.2" y="1.2" width="29.6" height="29.6" rx="7" stroke="#7C3AED" strokeWidth="2.4" />
            <path d="M9 21.5 16 9l7 12.5" stroke="#7C3AED" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12.2 17h7.6" stroke="#7C3AED" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="2.4 3" />
          </svg>
          <span style={{ font: "600 15px 'IBM Plex Sans', sans-serif", letterSpacing: '-0.01em', color: '#1B1B19' }}>
            {t('brand', { ns: 'nav' })}
          </span>
        </div>

        <span
          style={{
            padding: '3px 8px',
            border: '1px solid #D8D7D2',
            borderRadius: 4,
            font: "500 10.5px 'IBM Plex Sans', sans-serif",
            letterSpacing: '0.06em',
            color: '#6E6D68',
          }}
        >
          {t('systemAdmin', { ns: 'nav' })}
        </span>

        {/* Search, Language Switcher & User Profile */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '6px 10px',
              background: '#FFF',
              border: '1px solid #D8D7D2',
              borderRadius: 5,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A8983" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="M15.5 15.5 21 21" />
            </svg>
            <input
              placeholder={t('searchPlaceholder', { ns: 'nav' })}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              style={{
                width: 220,
                border: 0,
                outline: 'none',
                background: 'transparent',
                font: "400 11.5px 'IBM Plex Sans', sans-serif",
                color: '#1B1B19',
              }}
            />
          </div>

          <LanguageSwitcher theme="light" />

          <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '5px 10px 5px 5px',
                background: '#FFF',
                border: '1px solid #D8D7D2',
                borderRadius: 20,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#7C3AED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  font: "500 10.5px 'IBM Plex Sans', sans-serif",
                  color: '#FFF',
                }}
              >
                {userInitials}
              </span>
              <span style={{ font: "500 11.5px 'IBM Plex Sans', sans-serif", color: '#1B1B19' }}>
                {user?.username || userRoleDisplay}
              </span>
            </div>
          </Dropdown>
        </div>
      </header>

      <ChangePasswordModal
        open={changePasswordOpen}
        onCancel={() => setChangePasswordOpen(false)}
      />
    </>
  )
}
