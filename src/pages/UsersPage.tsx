import React from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { UserList } from '@/features/users/UserList'
import { useNavigate } from 'react-router-dom'

export const UsersPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <PageHeader
        title="Người dùng"
        subtitle="Tài khoản đại lý, user độc lập và vai trò"
      />
      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <UserList />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
          <div style={{ padding: '14px 16px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
            <div style={{ font: "600 12px 'IBM Plex Sans', sans-serif" }}>Vai trò trong hệ thống</div>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>
                <span>Quản trị viên</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#1B1B19' }}>4</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>
                <span>Quản lý đại lý</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#1B1B19' }}>38</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>
                <span>Thợ cắt</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#1B1B19' }}>370</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '14px 16px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
            <div style={{ font: "600 12px 'IBM Plex Sans', sans-serif" }}>Chính sách phiên đăng nhập</div>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>
                <span>Thiết bị tối đa / tài khoản</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#1B1B19' }}>2</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>
                <span>Hết hạn phiên</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#1B1B19' }}>8 giờ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>
                <span>Đăng nhập song song</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#C2452D' }}>Chặn</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '14px 16px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
            <div style={{ font: "600 12px 'IBM Plex Sans', sans-serif" }}>Vượt giới hạn thiết bị</div>
            <div style={{ marginTop: 10, font: "400 11.5px/1.6 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>
              3 tài khoản đang đăng nhập trên nhiều hơn 2 máy. Xem danh sách để thu hồi phiên.
            </div>
            <button
              onClick={() => navigate('/sessions')}
              style={{
                marginTop: 12,
                padding: '6px 11px',
                border: '1px solid #D8D7D2',
                borderRadius: 5,
                background: '#FFF',
                cursor: 'pointer',
                font: "500 11.5px 'IBM Plex Sans', sans-serif",
                color: '#35342F',
              }}
            >
              Xem phiên đang mở
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
