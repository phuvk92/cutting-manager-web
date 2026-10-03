import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export const AppSidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()

  const isAdmin = user?.role === 'ADMIN'
  const isAgent = user?.role === 'AGENT'
  const isAgentOrAdmin = isAdmin || isAgent

  const path = location.pathname

  const isCurrent = (route: string) => {
    if (route === '/dashboard') return path === '/dashboard' || path === '/'
    return path.startsWith(route)
  }

  const renderNavBtn = (route: string, label: string, icon: React.ReactNode, visible = true) => {
    if (!visible) return null
    const active = isCurrent(route)

    return (
      <button
        key={route}
        onClick={() => navigate(route)}
        className={active ? 'pcut-menu-item-active' : 'pcut-menu-item'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '8px 16px',
          border: 0,
          borderLeft: active ? '3px solid #7C3AED' : '3px solid transparent',
          background: active ? '#F1EDFC' : 'transparent',
          cursor: 'pointer',
          font: "500 12.5px 'IBM Plex Sans', sans-serif",
          color: active ? '#5B2BB0' : '#1B1B19',
          textAlign: 'left',
          width: '100%',
          transition: 'all 0.15s ease-in-out',
        }}
      >
        <span style={{ color: active ? '#7C3AED' : '#4A4945', display: 'flex', alignItems: 'center' }}>
          {icon}
        </span>
        <span>{label}</span>
      </button>
    )
  }

  return (
    <aside
      style={{
        width: 214,
        flex: 'none',
        display: 'flex',
        flexDirection: 'column',
        background: '#FBFBFA',
        borderRight: '1px solid #D8D7D2',
        overflowY: 'auto',
        minHeight: 'calc(100vh - 54px)',
      }}
    >
      {/* ── TỔNG QUAN ── */}
      <div style={{ padding: '14px 16px 6px', font: "600 10px 'IBM Plex Sans', sans-serif", letterSpacing: '0.1em', color: '#A3A29C' }}>
        TỔNG QUAN
      </div>
      {renderNavBtn(
        '/dashboard',
        'Bảng tổng quan',
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="7" height="7" rx="1.5" />
          <rect x="13" y="4" width="7" height="4.5" rx="1.5" />
          <rect x="13" y="10.5" width="7" height="9.5" rx="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" />
        </svg>
      )}

      {/* ── NỀN TẢNG & TÀI KHOẢN ── */}
      <div style={{ padding: '16px 16px 6px', font: "600 10px 'IBM Plex Sans', sans-serif", letterSpacing: '0.1em', color: '#A3A29C' }}>
        NỀN TẢNG & TÀI KHOẢN
      </div>
      {renderNavBtn(
        '/dealers',
        'Đại lý & chi nhánh',
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20V9l8-5 8 5v11" />
          <path d="M9.5 20v-6h5v6" />
        </svg>,
        isAdmin
      )}
      {renderNavBtn(
        '/users',
        'Người dùng',
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9.5" cy="8.5" r="3.2" />
          <path d="M3.5 19.5c0-3.3 2.7-5 6-5s6 1.7 6 5" />
          <path d="M16 6.2a3 3 0 0 1 0 5.6" />
          <path d="M17.5 15c2 .6 3 2.1 3 4.5" />
        </svg>,
        isAgentOrAdmin
      )}
      {renderNavBtn(
        '/sessions',
        'Phiên & thiết bị',
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="5" width="17" height="11" rx="2" />
          <path d="M8 19.5h8" />
          <path d="M12 16v3.5" />
        </svg>,
        isAdmin
      )}
      {renderNavBtn(
        '/audit',
        'Nhật ký quản trị',
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </svg>,
        isAdmin
      )}

      {/* ── DATA CENTER ── */}
      {isAgentOrAdmin && (
        <>
          <div style={{ padding: '16px 16px 6px', font: "600 10px 'IBM Plex Sans', sans-serif", letterSpacing: '0.1em', color: '#A3A29C' }}>
            DATA CENTER
          </div>
          {isAdmin && renderNavBtn(
            '/categories',
            'Danh mục xe',
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          )}
          {isAdmin && renderNavBtn(
            '/svg',
            'Kho mẫu & part file',
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="6" rx="7.5" ry="3" />
              <path d="M4.5 6v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6" />
              <path d="M4.5 12v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6" />
            </svg>
          )}
          {isAdmin && renderNavBtn(
            '/admin/user-saved-files',
            'Bản đã lưu',
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          )}
          {isAdmin && renderNavBtn(
            '/bulk-upload',
            'Nạp mẫu hàng loạt',
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V5" />
              <path d="M7.5 9.5 12 5l4.5 4.5" />
              <path d="M4.5 19.5h15" />
            </svg>
          )}
        </>
      )}

      {/* ── MÁY CHỦ TRẠNG THÁI (STATUS FOOTER) ── */}
      <div style={{ marginTop: 'auto', padding: '12px 16px', borderTop: '1px solid #E4E3DE' }}>
        <div style={{ font: "400 10.5px 'IBM Plex Sans', sans-serif", color: '#8A8983' }}>Máy chủ</div>
        <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2E7D5B' }} />
          <span style={{ font: "500 11.5px 'IBM Plex Mono', monospace", color: '#35342F' }}>
            Hoạt động · 99,8%
          </span>
        </div>
      </div>
    </aside>
  )
}
