import React, { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, App as AntApp } from 'antd'
import { useAuthStore } from '@/stores/authStore'
import { AppRoutes } from '@/routes/AppRoutes'

export const App: React.FC = () => {
  const { initAuth } = useAuthStore()

  useEffect(() => {
    initAuth()
  }, [initAuth])

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#7C3AED',
          borderRadius: 5,
          fontFamily: "'IBM Plex Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          colorBgBase: '#FFFFFF',
          colorTextBase: '#1B1B19',
          colorBorder: '#D8D7D2',
          colorLink: '#6C3BD6',
          colorLinkHover: '#55299F',
        },
        components: {
          Button: {
            colorPrimary: '#7C3AED',
            colorPrimaryHover: '#6A2FD1',
          },
          Menu: {
            itemBg: '#FBFBFA',
            itemColor: '#1B1B19',
            itemSelectedColor: '#5B2BB0',
            itemSelectedBg: '#F1EDFC',
            itemBorderRadius: 0,
            activeBarBorderWidth: 0,
          },
          Table: {
            headerBg: '#F1F0EC',
            headerColor: '#6E6D68',
            rowHoverBg: '#F6F4FD',
            borderColor: '#EFEEEA',
          },
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  )
}

export default App
