import React from 'react'
import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { GlobalOutlined } from '@ant-design/icons'
import { useLocaleStore } from '@/stores/localeStore'

interface LanguageSwitcherProps {
  theme?: 'light' | 'dark'
  compact?: boolean
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  theme = 'light',
  compact = false,
}) => {
  const { locale, setLocale } = useLocaleStore()

  const items: MenuProps['items'] = [
    {
      key: 'vi',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
          <span style={{ fontSize: 16 }}>🇻🇳</span>
          <span style={{ fontWeight: locale === 'vi' ? 600 : 400 }}>Tiếng Việt</span>
        </div>
      ),
      onClick: () => setLocale('vi'),
    },
    {
      key: 'en',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
          <span style={{ fontSize: 16 }}>🇬🇧</span>
          <span style={{ fontWeight: locale === 'en' ? 600 : 400 }}>English</span>
        </div>
      ),
      onClick: () => setLocale('en'),
    },
  ]

  const isDark = theme === 'dark'

  return (
    <Dropdown menu={{ items, selectedKeys: [locale] }} trigger={['click']} placement="bottomRight">
      <button
        type="button"
        aria-label="Language Switcher"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: compact ? '4px 8px' : '5px 10px',
          background: isDark ? '#232228' : '#FFF',
          border: isDark ? '1px solid #34333B' : '1px solid #D8D7D2',
          borderRadius: 6,
          cursor: 'pointer',
          font: "500 12px 'IBM Plex Sans', sans-serif",
          color: isDark ? '#F4F3F0' : '#1B1B19',
          transition: 'all 0.15s ease',
          outline: 'none',
        }}
      >
        <span style={{ fontSize: 14 }}>{locale === 'vi' ? '🇻🇳' : '🇬🇧'}</span>
        {!compact && (
          <span>{locale === 'vi' ? 'Tiếng Việt' : 'English'}</span>
        )}
        <GlobalOutlined style={{ fontSize: 12, opacity: 0.65, marginLeft: 2 }} />
      </button>
    </Dropdown>
  )
}
