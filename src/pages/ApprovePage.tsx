import React, { useState } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { message } from 'antd'

const initialPending = [
  { id: 1, model: "Ford Ranger Wildtrak (2023) — thân xe", source: "Decal Ô Tô Sài Gòn", parts: "27", sent: "15/08 14:20", scope: "Riêng đại lý" },
  { id: 2, model: "Kia Sorento Signature — kính & đèn", source: "PPF Hà Nội Center", parts: "16", sent: "15/08 11:05", scope: "Riêng đại lý" },
  { id: 3, model: "VinFast VF 9 (2026) — thân xe", source: "Nạp lô LO-2608-04", parts: "34", sent: "14/08 18:40", scope: "Toàn hệ thống" },
  { id: 4, model: "Toyota Hilux độ — thân xe", source: "Decal Ô Tô Sài Gòn", parts: "22", sent: "14/08 09:12", scope: "Riêng đại lý" },
  { id: 5, model: "Hyundai Tucson (2025) — nội thất", source: "Nạp lô LO-2608-03", parts: "19", sent: "13/08 16:55", scope: "Toàn hệ thống" },
  { id: 6, model: "Mercedes C300 — ốp gương", source: "Auto Decal Trường Chinh", parts: "3", sent: "13/08 10:30", scope: "Riêng đại lý" }
]

const scopes = [
  { label: "Toàn hệ thống", hint: "Mọi đại lý và user độc lập đều thấy", border: "#7C3AED", dot: "#7C3AED" },
  { label: "Theo nhóm đại lý", hint: "Chỉ nhóm được chọn, ví dụ đại lý gói Chuỗi", border: "#B9B8B2", dot: "transparent" },
  { label: "Riêng đại lý nạp", hint: "Chỉ thợ của đại lý đó thấy mẫu", border: "#B9B8B2", dot: "transparent" }
]

const policies = [
  { label: "Thông báo, thợ tự chọn", hint: "App báo có bản mới, thợ quyết định cập nhật", border: "#7C3AED", dot: "#7C3AED" },
  { label: "Tự động cập nhật", hint: "Bản đã tải bị thay ngay khi mẫu gốc đổi", border: "#B9B8B2", dot: "transparent" },
  { label: "Giữ nguyên bản đã tải", hint: "Job đang làm không bị ảnh hưởng", border: "#B9B8B2", dot: "transparent" }
]

export const ApprovePage: React.FC = () => {
  const [pendingList, setPendingList] = useState(initialPending)
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending')

  const handleApprove = (id: number) => {
    setPendingList(prev => prev.filter(p => p.id !== id))
    message.success('Đã duyệt mẫu thành công')
  }

  const handleReject = (id: number) => {
    setPendingList(prev => prev.filter(p => p.id !== id))
    message.info('Đã từ chối mẫu')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <PageHeader
        title="Duyệt mẫu & phân phối"
        subtitle="Hàng chờ duyệt, phạm vi phân phối và chính sách cập nhật"
      />
      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <span
              onClick={() => setTab('pending')}
              style={{
                padding: '6px 11px',
                background: tab === 'pending' ? '#F1EDFC' : '#FFF',
                border: tab === 'pending' ? '1px solid #D6C7F7' : '1px solid #D8D7D2',
                borderRadius: 5,
                font: "500 11.5px 'IBM Plex Sans', sans-serif",
                color: tab === 'pending' ? '#5B2BB0' : '#6E6D68',
                cursor: 'pointer',
              }}
            >
              Chờ duyệt {pendingList.length}
            </span>
            <span
              onClick={() => setTab('approved')}
              style={{
                padding: '6px 11px',
                background: tab === 'approved' ? '#F1EDFC' : '#FFF',
                border: tab === 'approved' ? '1px solid #D6C7F7' : '1px solid #D8D7D2',
                borderRadius: 5,
                font: "400 11.5px 'IBM Plex Sans', sans-serif",
                color: tab === 'approved' ? '#5B2BB0' : '#6E6D68',
                cursor: 'pointer',
              }}
            >
              Đã duyệt 1 208
            </span>
            <span
              onClick={() => setTab('rejected')}
              style={{
                padding: '6px 11px',
                background: tab === 'rejected' ? '#F1EDFC' : '#FFF',
                border: tab === 'rejected' ? '1px solid #D6C7F7' : '1px solid #D8D7D2',
                borderRadius: 5,
                font: "400 11.5px 'IBM Plex Sans', sans-serif",
                color: tab === 'rejected' ? '#5B2BB0' : '#6E6D68',
                cursor: 'pointer',
              }}
            >
              Từ chối 52
            </span>
          </div>
          <button
            onClick={() => { setPendingList([]); message.success('Đã duyệt tất cả mẫu chờ!'); }}
            style={{
              marginLeft: 'auto',
              padding: '7px 13px',
              border: '1px solid #D8D7D2',
              borderRadius: 5,
              background: '#FFF',
              cursor: 'pointer',
              font: "500 11.5px 'IBM Plex Sans', sans-serif",
              color: '#35342F',
            }}
          >
            Duyệt tất cả đã kiểm
          </button>
        </div>

        <div style={{ background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px 130px 116px 168px', padding: '9px 16px', background: '#F1F0EC', borderBottom: '1px solid #E4E3DE', font: "600 10.5px 'IBM Plex Sans', sans-serif", letterSpacing: '0.04em', color: '#6E6D68' }}>
            <span>Mẫu chờ duyệt</span>
            <span>Nguồn</span>
            <span style={{ textAlign: 'right' }}>Part</span>
            <span>Gửi lúc</span>
            <span>Phạm vi</span>
            <span style={{ textAlign: 'right' }}>Thao tác</span>
          </div>
          {pendingList.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#8A8983', font: "400 12px 'IBM Plex Sans', sans-serif" }}>
              Không còn mẫu nào đang chờ duyệt.
            </div>
          ) : (
            pendingList.map((p) => (
              <div key={p.id} className="pcut-table-row" style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px 130px 116px 168px', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #EFEEEA', font: "400 12px 'IBM Plex Sans', sans-serif" }}>
                <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.model}</span>
                <span style={{ color: '#6E6D68', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.source}</span>
                <span style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace" }}>{p.parts}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6E6D68' }}>{p.sent}</span>
                <span style={{ color: '#6E6D68' }}>{p.scope}</span>
                <span style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                  <button onClick={() => handleApprove(p.id)} style={{ padding: '5px 10px', border: 0, borderRadius: 4, background: '#7C3AED', cursor: 'pointer', font: "500 11px 'IBM Plex Sans', sans-serif", color: '#FFF' }}>
                    Duyệt
                  </button>
                  <button onClick={() => handleReject(p.id)} style={{ padding: '5px 10px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', cursor: 'pointer', font: "500 11px 'IBM Plex Sans', sans-serif", color: '#35342F' }}>
                    Từ chối
                  </button>
                </span>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
          <div style={{ padding: '16px 18px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
            <div style={{ font: "600 12.5px 'IBM Plex Sans', sans-serif" }}>Phạm vi phân phối mặc định</div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {scopes.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <span style={{ width: 15, height: 15, flex: 'none', borderRadius: '50%', border: `1.5px solid ${s.border}`, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot }} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ font: "500 12px 'IBM Plex Sans', sans-serif" }}>{s.label}</div>
                    <div style={{ marginTop: 2, font: "400 11px 'IBM Plex Sans', sans-serif", color: '#8A8983' }}>{s.hint}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '16px 18px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
            <div style={{ font: "600 12.5px 'IBM Plex Sans', sans-serif" }}>Chính sách cập nhật mẫu</div>
            <div style={{ marginTop: 4, font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#8A8983' }}>
              Khi mẫu gốc thay đổi, bản đã tải về máy thợ xử lý thế nào.
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {policies.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <span style={{ width: 15, height: 15, flex: 'none', borderRadius: '50%', border: `1.5px solid ${p.border}`, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.dot }} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ font: "500 12px 'IBM Plex Sans', sans-serif" }}>{p.label}</div>
                    <div style={{ marginTop: 2, font: "400 11px 'IBM Plex Sans', sans-serif", color: '#8A8983' }}>{p.hint}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
