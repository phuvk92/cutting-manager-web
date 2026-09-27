import React from 'react'
import { PageHeader } from '@/components/common/PageHeader'

const sessions = [
  { name: "Trần Minh Hoàng", dealer: "Decal Ô Tô Sài Gòn", device: "PC xưởng", ip: "113.161.44.2", start: "16/08 08:47", dot: "#2E7D5B" },
  { name: "Phạm Anh Dũng", dealer: "PPF Hà Nội Center", device: "PC xưởng", ip: "14.191.88.7", start: "15/08 22:30", dot: "#C2452D" },
  { name: "Phạm Anh Dũng", dealer: "PPF Hà Nội Center", device: "Laptop cá nhân", ip: "27.72.19.44", start: "16/08 07:10", dot: "#C2452D" },
  { name: "Võ Quốc Khánh", dealer: "Auto Decal Trường Chinh", device: "PC xưởng", ip: "113.190.6.18", start: "16/08 09:20", dot: "#2E7D5B" },
  { name: "Lê Thị Phương", dealer: "PPF Hà Nội Center", device: "PC văn phòng", ip: "14.191.88.9", start: "16/08 07:55", dot: "#2E7D5B" },
  { name: "Đỗ Thanh Tùng", dealer: "Film Đà Nẵng Auto", device: "PC xưởng", ip: "222.255.31.5", start: "15/08 17:04", dot: "#B4741E" },
  { name: "Ngô Đức Quang", dealer: "— (nội bộ)", device: "Trình duyệt", ip: "10.0.4.12", start: "16/08 09:38", dot: "#2E7D5B" }
]

export const SessionsPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <PageHeader
        title="Phiên & thiết bị"
        subtitle="Thiết bị đang đăng nhập và chính sách phiên"
      />
      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
          <div style={{ padding: '13px 16px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
            <div style={{ font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>Phiên đang mở</div>
            <div style={{ marginTop: 6, font: "500 22px 'IBM Plex Mono', monospace" }}>286</div>
          </div>
          <div style={{ padding: '13px 16px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
            <div style={{ font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>Thiết bị đã kích hoạt</div>
            <div style={{ marginTop: 6, font: "500 22px 'IBM Plex Mono', monospace" }}>648</div>
          </div>
          <div style={{ padding: '13px 16px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
            <div style={{ font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>Vượt giới hạn</div>
            <div style={{ marginTop: 6, font: "500 22px 'IBM Plex Mono', monospace", color: '#C2452D' }}>3</div>
          </div>
          <div style={{ padding: '13px 16px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
            <div style={{ font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>Phiên treo quá 8 giờ</div>
            <div style={{ marginTop: 6, font: "500 22px 'IBM Plex Mono', monospace", color: '#B4741E' }}>11</div>
          </div>
        </div>

        <div style={{ background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 150px 130px 130px 130px', padding: '9px 16px', background: '#F1F0EC', borderBottom: '1px solid #E4E3DE', font: "600 10.5px 'IBM Plex Sans', sans-serif", letterSpacing: '0.04em', color: '#6E6D68' }}>
            <span>Người dùng</span>
            <span>Đại lý</span>
            <span>Thiết bị</span>
            <span>Địa chỉ IP</span>
            <span>Bắt đầu</span>
            <span style={{ textAlign: 'right' }}>Thao tác</span>
          </div>
          {sessions.map((s, i) => (
            <div key={i} className="pcut-table-row" style={{ display: 'grid', gridTemplateColumns: '1fr 180px 150px 130px 130px 130px', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #EFEEEA', font: "400 12px 'IBM Plex Sans', sans-serif" }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 7, height: 7, flex: 'none', borderRadius: '50%', background: s.dot }} />
                <span style={{ fontWeight: 500 }}>{s.name}</span>
              </span>
              <span style={{ color: '#6E6D68', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.dealer}</span>
              <span style={{ color: '#6E6D68' }}>{s.device}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6E6D68' }}>{s.ip}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6E6D68' }}>{s.start}</span>
              <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{ padding: '5px 10px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', cursor: 'pointer', font: "500 11px 'IBM Plex Sans', sans-serif", color: '#35342F' }}>
                  Buộc đăng xuất
                </button>
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
          <div style={{ padding: '14px 16px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
            <div style={{ font: "600 12px 'IBM Plex Sans', sans-serif" }}>Số phiên tối đa</div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <input defaultValue="2" style={{ width: 62, padding: '7px 9px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', outline: 'none', font: "400 13px 'IBM Plex Mono', monospace", color: '#1B1B19' }} />
              <span style={{ font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>phiên / tài khoản</span>
            </div>
          </div>
          <div style={{ padding: '14px 16px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
            <div style={{ font: "600 12px 'IBM Plex Sans', sans-serif" }}>Hết hạn phiên</div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <input defaultValue="8" style={{ width: 62, padding: '7px 9px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', outline: 'none', font: "400 13px 'IBM Plex Mono', monospace", color: '#1B1B19' }} />
              <span style={{ font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>giờ không thao tác</span>
            </div>
          </div>
          <div style={{ padding: '14px 16px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
            <div style={{ font: "600 12px 'IBM Plex Sans', sans-serif" }}>Đăng nhập song song</div>
            <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
              <span style={{ flex: 1, padding: '7px 10px', border: '1px solid #D6C7F7', borderRadius: 4, background: '#F1EDFC', textAlign: 'center', font: "500 11.5px 'IBM Plex Sans', sans-serif", color: '#5B2BB0' }}>
                Chặn
              </span>
              <span style={{ flex: 1, padding: '7px 10px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', textAlign: 'center', font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>
                Cho phép
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
