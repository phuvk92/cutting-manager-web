import React from 'react'
import { Outlet } from 'react-router-dom'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppSidebar } from '@/components/layout/AppSidebar'

export const MainLayout: React.FC = () => {
  return (
    <div
      className="pcut-admin-layout"
      style={{
        height: '100vh',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#F4F3F0',
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        color: '#1B1B19',
        overflow: 'hidden',
      }}
    >
      {/* ══ THANH TRÊN (AppHeader) ══ */}
      <AppHeader />

      {/* ══ THÂN GIAO DIỆN (SIDEBAR + MAIN CONTENT) ══ */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <AppSidebar />

        {/* ══ NỘI DUNG CHÍNH (CONTENT) ══ */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            background: '#F4F3F0',
            overflowY: 'auto',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
