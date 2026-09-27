import React, { useState } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { message } from 'antd'

const batches = [
  { code: "LO-2608-04", label: "VinFast bổ sung năm 2026 — ngoại thất", count: "412", errors: "0", errColor: "#2E7D5B", progress: "100%", status: "Hoàn tất", stBg: "#E6F1EB", stColor: "#2E7D5B" },
  { code: "LO-2608-03", label: "Hyundai Santa Fe / Tucson — nội thất", count: "186", errors: "4", errColor: "#B4741E", progress: "100%", status: "Có cảnh báo", stBg: "#FBF0DF", stColor: "#8A5A12" },
  { code: "LO-2608-02", label: "Mazda 2024 — window film", count: "94", errors: "0", errColor: "#2E7D5B", progress: "100%", status: "Hoàn tất", stBg: "#E6F1EB", stColor: "#2E7D5B" },
  { code: "LO-2608-01", label: "Ford Ranger biến thể độ — ngoại thất", count: "1 240", errors: "0", errColor: "#8A8983", progress: "62%", status: "Đang chạy", stBg: "#F1EDFC", stColor: "#5B2BB0" },
  { code: "LO-2607-11", label: "Kia dòng cũ 2018–2021", count: "608", errors: "37", errColor: "#C2452D", progress: "100%", status: "Cần xem lại", stBg: "#FAE7E3", stColor: "#A93823" }
]

export const BulkUploadPage: React.FC = () => {
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    message.info('Đã nhận diện tệp tải lên. Hệ thống đang xác thực cấu trúc...')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <PageHeader
        title="Nạp mẫu hàng loạt"
        subtitle="Import theo lô và gắn nhãn nhiều mẫu cùng lúc"
      />
      <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 296px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: 18, background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
            <div style={{ font: "600 12.5px 'IBM Plex Sans', sans-serif" }}>Lô nạp mới</div>
            <div style={{ marginTop: 4, font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#8A8983' }}>
              Kéo thư mục SVG kèm file mô tả CSV. Hệ thống khớp theo cột mã mẫu.
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                marginTop: 14,
                height: 128,
                border: dragOver ? '1.5px dashed #7C3AED' : '1.5px dashed #C9BCF0',
                borderRadius: 6,
                background: dragOver ? '#F1EDFC' : '#FBFAFF',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                cursor: 'pointer',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V5" />
                <path d="M7.5 9.5 12 5l4.5 4.5" />
                <path d="M4.5 19.5h15" />
              </svg>
              <span style={{ font: "500 12px 'IBM Plex Sans', sans-serif", color: '#5B2BB0' }}>
                Thả thư mục hoặc file .zip vào đây
              </span>
              <span style={{ font: "400 11px 'IBM Plex Sans', sans-serif", color: '#8A8983' }}>
                Tối đa 5 000 mẫu mỗi lô
              </span>
            </div>
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ font: "500 11px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>Nhóm ứng dụng</span>
                <input defaultValue="Ngoại thất" style={{ padding: '7px 9px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', outline: 'none', font: "400 12px 'IBM Plex Sans', sans-serif", color: '#1B1B19', width: '100%' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ font: "500 11px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>Phạm vi phân phối</span>
                <input defaultValue="Toàn hệ thống" style={{ padding: '7px 9px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', outline: 'none', font: "400 12px 'IBM Plex Sans', sans-serif", color: '#1B1B19', width: '100%' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ font: "500 11px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>Trạng thái sau khi nạp</span>
                <input defaultValue="Chờ duyệt" style={{ padding: '7px 9px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', outline: 'none', font: "400 12px 'IBM Plex Sans', sans-serif", color: '#1B1B19', width: '100%' }} />
              </label>
            </div>
          </div>

          <div style={{ background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E4E3DE', font: "600 12.5px 'IBM Plex Sans', sans-serif" }}>
              Lô đã nạp gần đây
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '104px 1fr 84px 76px 84px 112px', padding: '9px 16px', background: '#F1F0EC', borderBottom: '1px solid #E4E3DE', font: "600 10.5px 'IBM Plex Sans', sans-serif", letterSpacing: '0.04em', color: '#6E6D68' }}>
              <span>Mã lô</span>
              <span>Nội dung</span>
              <span style={{ textAlign: 'right' }}>Mẫu</span>
              <span style={{ textAlign: 'right' }}>Lỗi</span>
              <span style={{ textAlign: 'right' }}>Tiến độ</span>
              <span style={{ textAlign: 'right' }}>Trạng thái</span>
            </div>
            {batches.map((b) => (
              <div key={b.code} className="pcut-table-row" style={{ display: 'grid', gridTemplateColumns: '104px 1fr 84px 76px 84px 112px', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #EFEEEA', font: "400 12px 'IBM Plex Sans', sans-serif" }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6E6D68' }}>{b.code}</span>
                <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.label}</span>
                <span style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace" }}>{b.count}</span>
                <span style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", color: b.errColor }}>{b.errors}</span>
                <span style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", color: '#6E6D68' }}>{b.progress}</span>
                <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ padding: '3px 9px', borderRadius: 11, background: b.stBg, font: "500 10.5px 'IBM Plex Sans', sans-serif", color: b.stColor }}>
                    {b.status}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '16px 18px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
          <div style={{ font: "600 12.5px 'IBM Plex Sans', sans-serif" }}>Gắn nhãn hàng loạt</div>
          <div style={{ marginTop: 4, font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#8A8983' }}>
            Sửa dữ liệu mô tả cho nhiều mẫu cùng lúc.
          </div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ font: "500 11px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>Chọn mẫu theo bộ lọc</span>
              <input defaultValue="Hãng = Ford · Năm ≥ 2022" style={{ padding: '7px 9px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', outline: 'none', font: "400 12px 'IBM Plex Sans', sans-serif", color: '#1B1B19', width: '100%' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ font: "500 11px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>Trường cần sửa</span>
              <input defaultValue="Nhóm chi tiết → Thân xe" style={{ padding: '7px 9px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', outline: 'none', font: "400 12px 'IBM Plex Sans', sans-serif", color: '#1B1B19', width: '100%' }} />
            </label>
          </div>
          <div style={{ marginTop: 14, padding: '10px 12px', background: '#F1F0EC', borderRadius: 5, font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#35342F' }}>
            Sẽ áp dụng cho <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>218</span> mẫu
          </div>
          <button style={{ marginTop: 12, width: '100%', padding: 8, border: 0, borderRadius: 5, background: '#7C3AED', cursor: 'pointer', font: "500 12px 'IBM Plex Sans', sans-serif", color: '#FFF' }}>
            Gắn nhãn
          </button>
        </div>
      </div>
    </div>
  )
}
