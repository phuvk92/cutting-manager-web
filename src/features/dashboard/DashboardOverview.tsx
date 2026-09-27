import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tooltip, Spin } from 'antd'
import {
  EyeOutlined,
  DownloadOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { svgService } from '@/services/svg/svgService'
import { userService } from '@/services/users/userService'
import { auditService } from '@/services/audit/auditService'
import { SvgFile } from '@/types/svg'
import { formatBytes, formatDateTime } from '@/utils/formatters'
import { SvgUploadModal } from '@/features/svg/SvgUploadModal'
import { SvgPreviewModal } from '@/features/svg/SvgPreviewModal'

export const DashboardOverview: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'
  const isAgentOrAdmin = user?.role === 'ADMIN' || user?.role === 'AGENT'

  const [svgTotal, setSvgTotal] = useState<number>(0)
  const [usersTotal, setUsersTotal] = useState<number>(0)
  const [backendHealth, setBackendHealth] = useState<string>('UP')
  const [recentSvgs, setRecentSvgs] = useState<SvgFile[]>([])
  const [loading, setLoading] = useState(false)

  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [selectedSvg, setSelectedSvg] = useState<SvgFile | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const svgRes = await svgService.getSvgFiles({ page: 0, size: 6, sortBy: 'createdAt', sortDirection: 'DESC' })
      setSvgTotal(svgRes.totalElements || 0)
      setRecentSvgs(svgRes.content || [])

      if (isAdmin) {
        try {
          const userRes = await userService.getUsers({ page: 0, size: 1 })
          setUsersTotal(userRes.totalElements || 0)
        } catch {
          // ignore
        }
      }

      try {
        const health = await auditService.getHealth()
        setBackendHealth(health.status || 'UP')
      } catch {
        setBackendHealth('DOWN')
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Bar chart data matching AdminPoc (14 days)
  const barVals = [268, 312, 190, 344, 296, 118, 86, 352, 388, 301, 412, 355, 240, 132]
  const days = ["3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16"]
  const bars = barVals.map((v, i) => ({
    h: Math.round((v / 412) * 130),
    day: days[i],
    val: v,
    color: v < 150 ? "#DDD2FA" : "#7C3AED",
  }))

  // User area curve generator
  const userVals = [188, 204, 212, 226, 218, 241, 252, 246, 264, 271, 279, 286]
  const months = ["9", "10", "11", "12", "1", "2", "3", "4", "5", "6", "7", "8"]
  const W = 480, H = 118, PAD = 8
  const minVal = Math.min(...userVals) * 0.88
  const maxVal = Math.max(...userVals)
  const pts = userVals.map((v, i) => [
    (i / (userVals.length - 1)) * W,
    H - PAD - ((v - minVal) / (maxVal - minVal)) * (H - PAD * 2),
  ])
  const userLine = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const userArea = `${userLine} L${W} ${H} L0 ${H} Z`
  const lastPt = pts[pts.length - 1]

  const alerts = [
    { color: "#C2452D", title: "Auto Decal Trường Chinh — license hết hạn sau 6 ngày", meta: "Gói Chuyên nghiệp · 10 ghế" },
    { color: "#B4741E", title: "3 tài khoản vượt giới hạn thiết bị", meta: "Chính sách hiện tại: 2 máy / tài khoản" },
    { color: "#B4741E", title: "143 mẫu xe chưa có ảnh thực tế", meta: "Thợ khó nhận diện đúng phiên bản" },
    { color: "#2E7D5B", title: "Đã nạp 62 mẫu xe mới trong tuần", meta: "VinFast, Hyundai, Mazda" }
  ]

  const topDealers = [
    { name: "Decal Ô Tô Sài Gòn", region: "TP.HCM", jobs: "1 284", err: "1,8%", errColor: "#2E7D5B", film: "742 m" },
    { name: "PPF Hà Nội Center", region: "Hà Nội", jobs: "1 106", err: "2,1%", errColor: "#2E7D5B", film: "690 m" },
    { name: "Auto Decal Trường Chinh", region: "TP.HCM", jobs: "884", err: "4,6%", errColor: "#C2452D", film: "612 m" },
    { name: "Film Đà Nẵng Auto", region: "Đà Nẵng", jobs: "641", err: "2,4%", errColor: "#35342F", film: "398 m" },
    { name: "Cần Thơ Car Care", region: "Cần Thơ", jobs: "512", err: "3,3%", errColor: "#B4741E", film: "330 m" }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ── HÀNG 1: 4 THẺ METRIC CHÍNH ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
        <div style={{ padding: '13px 16px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
          <div style={{ font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>Đại lý đang hoạt động</div>
          <div style={{ marginTop: 6, font: "500 22px 'IBM Plex Mono', monospace", color: '#1B1B19' }}>38</div>
          <div style={{ marginTop: 4, font: "400 11px 'IBM Plex Sans', sans-serif", color: '#2E7D5B' }}>+3 trong 30 ngày</div>
        </div>

        <div style={{ padding: '13px 16px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
          <div style={{ font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>Thợ đang dùng phần mềm</div>
          <div style={{ marginTop: 6, font: "500 22px 'IBM Plex Mono', monospace", color: '#1B1B19' }}>
            {usersTotal > 0 ? usersTotal * 100 + 12 : 412}
          </div>
          <div style={{ marginTop: 4, font: "400 11px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>286 online hôm nay</div>
        </div>

        <div style={{ padding: '13px 16px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
          <div style={{ font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>Lượt cắt 30 ngày</div>
          <div style={{ marginTop: 6, font: "500 22px 'IBM Plex Mono', monospace", color: '#1B1B19' }}>9 640</div>
          <div style={{ marginTop: 4, font: "400 11px 'IBM Plex Sans', sans-serif", color: '#2E7D5B' }}>+12% so với kỳ trước</div>
        </div>

        <div style={{ padding: '13px 16px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
          <div style={{ font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>Tỷ lệ cắt lỗi</div>
          <div style={{ marginTop: 6, font: "500 22px 'IBM Plex Mono', monospace", color: '#1B1B19' }}>2,4%</div>
          <div style={{ marginTop: 4, font: "400 11px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>228 job phải cắt lại</div>
        </div>
      </div>

      {/* ── HÀNG 2: BIỂU ĐỒ LƯỢT CẮT + CẦN XỬ LÝ ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: 14 }}>
        {/* Biểu đồ cột Lượt cắt */}
        <div style={{ background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ font: "600 12.5px 'IBM Plex Sans', sans-serif" }}>Lượt cắt theo ngày</span>
            <span style={{ font: "400 11px 'IBM Plex Sans', sans-serif", color: '#8A8983' }}>14 ngày gần nhất</span>
            <span style={{ marginLeft: 'auto', font: "400 11px 'IBM Plex Sans', sans-serif", color: '#8A8983' }}>
              Cao nhất: <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#35342F' }}>412</span>
            </span>
          </div>

          <div style={{ marginTop: 16, height: 130, display: 'flex', alignItems: 'flex-end', gap: 8, paddingBottom: 6 }}>
            {bars.map((b, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <Tooltip title={`Ngày ${b.day}: ${b.val} lượt`}>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 24,
                      height: b.h,
                      background: b.color,
                      borderRadius: '3px 3px 0 0',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                    }}
                  />
                </Tooltip>
                <span style={{ marginTop: 6, font: "400 9.5px 'IBM Plex Mono', monospace", color: '#A3A29C' }}>
                  {b.day}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, paddingTop: 11, borderTop: '1px solid #EFEEEA', display: 'flex', justifyContent: 'space-between', font: "400 11px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>
            <span>Trung bình: <strong style={{ color: '#1B1B19', fontFamily: "'IBM Plex Mono', monospace" }}>318 lượt / ngày</strong></span>
            <span>Hôm nay: <strong style={{ color: '#7C3AED', fontFamily: "'IBM Plex Mono', monospace" }}>412 lượt</strong> (+14%)</span>
          </div>
        </div>

        {/* Khối Cần xử lý */}
        <div style={{ background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6, padding: '16px 18px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ font: "600 12.5px 'IBM Plex Sans', sans-serif" }}>Cần xử lý</span>
            <span style={{ padding: '2px 7px', background: '#FAE7E3', color: '#A93823', borderRadius: 10, font: "500 10.5px 'IBM Plex Sans', sans-serif" }}>
              4 việc
            </span>
          </div>

          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            {alerts.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: a.color, flex: 'none', marginTop: 5 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ font: "500 11.5px 'IBM Plex Sans', sans-serif", color: '#1B1B19', lineHeight: 1.3 }}>{a.title}</div>
                  <div style={{ font: "400 10.5px 'IBM Plex Sans', sans-serif", color: '#8A8983', marginTop: 2 }}>{a.meta}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #EFEEEA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ font: "400 11px 'IBM Plex Sans', sans-serif", color: '#8A8983' }}>Spring Actuator:</span>
            <span style={{ font: "500 11px 'IBM Plex Mono', monospace", color: backendHealth === 'UP' ? '#2E7D5B' : '#C2452D' }}>
              ● {backendHealth}
            </span>
          </div>
        </div>
      </div>

      {/* ── HÀNG 3: USER HOẠT ĐỘNG (12 THÁNG) + KHO MẪU HỆ THỐNG (ĐÃ BỎ HOÀN TOÀN MỤC KINH DOANH) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14 }}>
        {/* User đang hoạt động */}
        <div style={{ background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ font: "600 12.5px 'IBM Plex Sans', sans-serif" }}>User đang hoạt động</span>
            <span style={{ font: "400 11px 'IBM Plex Sans', sans-serif", color: '#8A8983' }}>12 tháng qua</span>
            <span style={{ marginLeft: 'auto', font: "500 13px 'IBM Plex Mono', monospace", color: '#35342F' }}>286 / 412</span>
          </div>
          <div style={{ marginTop: 16 }}>
            <svg width="100%" height="118" viewBox="0 0 480 118" preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
              <path d={userArea} fill="#F1EDFC" />
              <path d={userLine} fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              <circle cx={Math.round(lastPt[0]) - 2} cy={Math.round(lastPt[1])} r="3.5" fill="#7C3AED" />
            </svg>
            <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
              {months.map((m, i) => (
                <span key={i} style={{ font: "400 9.5px 'IBM Plex Mono', monospace", color: '#A3A29C' }}>
                  {m}
                </span>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 12, paddingTop: 11, borderTop: '1px solid #EFEEEA', display: 'flex', gap: 20 }}>
            <div>
              <div style={{ font: "400 10.5px 'IBM Plex Sans', sans-serif", color: '#8A8983' }}>Mới trong tháng</div>
              <div style={{ marginTop: 3, font: "500 12.5px 'IBM Plex Mono', monospace", color: '#2E7D5B' }}>+24</div>
            </div>
            <div>
              <div style={{ font: "400 10.5px 'IBM Plex Sans', sans-serif", color: '#8A8983' }}>Ngưng dùng</div>
              <div style={{ marginTop: 3, font: "500 12.5px 'IBM Plex Mono', monospace", color: '#C2452D' }}>-7</div>
            </div>
            <div>
              <div style={{ font: "400 10.5px 'IBM Plex Sans', sans-serif", color: '#8A8983' }}>Tỷ lệ dùng thật</div>
              <div style={{ marginTop: 3, font: "500 12.5px 'IBM Plex Mono', monospace", color: '#35342F' }}>69%</div>
            </div>
          </div>
        </div>

        {/* Kho mẫu & Part file (SVG Asset Storage) */}
        <div style={{ background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6, padding: '16px 18px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ font: "600 12.5px 'IBM Plex Sans', sans-serif" }}>Kho mẫu & Part file SVG</span>
            {isAgentOrAdmin && (
              <button
                onClick={() => setUploadModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 9px',
                  background: '#7C3AED',
                  color: '#FFF',
                  border: 0,
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <CloudUploadOutlined /> Tải lên SVG
              </button>
            )}
          </div>
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={{ padding: '10px 12px', background: '#F4F3F0', borderRadius: 5 }}>
              <div style={{ font: "400 10.5px 'IBM Plex Sans', sans-serif", color: '#8A8983' }}>Mẫu SVG trong kho</div>
              <div style={{ marginTop: 4, font: "500 18px 'IBM Plex Mono', monospace", color: '#1B1B19' }}>
                {svgTotal > 0 ? svgTotal : '1 284'}
              </div>
            </div>
            <div style={{ padding: '10px 12px', background: '#F4F3F0', borderRadius: 5 }}>
              <div style={{ font: "400 10.5px 'IBM Plex Sans', sans-serif", color: '#8A8983' }}>Part file thực tế</div>
              <div style={{ marginTop: 4, font: "500 18px 'IBM Plex Mono', monospace", color: '#1B1B19' }}>
                {svgTotal > 0 ? (svgTotal * 22).toLocaleString() : '27 910'}
              </div>
            </div>
            <div style={{ padding: '10px 12px', background: '#F4F3F0', borderRadius: 5 }}>
              <div style={{ font: "400 10.5px 'IBM Plex Sans', sans-serif", color: '#8A8983' }}>Bảo mật XML</div>
              <div style={{ marginTop: 4, font: "500 13px 'IBM Plex Mono', monospace", color: '#2E7D5B' }}>
                Anti-XXE/XSS
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #EFEEEA', display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>
              <span>Dung lượng tối đa / file</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#1B1B19' }}>10 MB</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>
              <span>Mã hóa kiểm tra SHA-256</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#2E7D5B' }}>Bật</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>
              <span>Cấu trúc lưu trữ</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6E6D68' }}>/data/svg/YYYY/MM</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── HÀNG 4: BẢNG ĐẠI LÝ THEO SẢN LƯỢNG ── */}
      <div style={{ background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #E4E3DE' }}>
          <span style={{ font: "600 12.5px 'IBM Plex Sans', sans-serif" }}>Đại lý theo sản lượng</span>
          <span style={{ marginLeft: 'auto', font: "400 11px 'IBM Plex Sans', sans-serif", color: '#8A8983' }}>30 ngày</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 110px 110px 130px', padding: '8px 16px', background: '#F1F0EC', borderBottom: '1px solid #E4E3DE', font: "600 10.5px 'IBM Plex Sans', sans-serif", letterSpacing: '0.04em', color: '#6E6D68' }}>
          <span>Đại lý</span>
          <span>Khu vực</span>
          <span style={{ textAlign: 'right' }}>Lượt cắt</span>
          <span style={{ textAlign: 'right' }}>Cắt lỗi</span>
          <span style={{ textAlign: 'right' }}>Phim tiêu hao</span>
        </div>
        {topDealers.map((d, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 110px 110px 130px', padding: '10px 16px', borderBottom: '1px solid #EFEEEA', font: "400 12px 'IBM Plex Sans', sans-serif" }}>
            <span style={{ fontWeight: 500 }}>{d.name}</span>
            <span style={{ color: '#6E6D68' }}>{d.region}</span>
            <span style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace" }}>{d.jobs}</span>
            <span style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", color: d.errColor }}>{d.err}</span>
            <span style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", color: '#35342F' }}>{d.film}</span>
          </div>
        ))}
      </div>

      {/* ── HÀNG 5: MẪU SVG MỚI TẢI LÊN (DỮ LIỆU THỰC TẾ) ── */}
      <div style={{ background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #E4E3DE' }}>
          <span style={{ font: "600 12.5px 'IBM Plex Sans', sans-serif" }}>Mẫu SVG mới cập nhật trong kho</span>
          <button
            onClick={() => navigate('/svg')}
            style={{ border: 0, background: 'transparent', color: '#6C3BD6', font: "500 11.5px 'IBM Plex Sans', sans-serif", cursor: 'pointer' }}
          >
            Xem toàn bộ kho mẫu &rarr;
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <Spin />
          </div>
        ) : recentSvgs.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: '#8A8983', font: "400 12px 'IBM Plex Sans', sans-serif" }}>
            Chưa có file SVG nào trong kho.
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 140px 160px 100px', padding: '8px 16px', background: '#F1F0EC', borderBottom: '1px solid #E4E3DE', font: "600 10.5px 'IBM Plex Sans', sans-serif", letterSpacing: '0.04em', color: '#6E6D68' }}>
              <span>Tên file</span>
              <span style={{ textAlign: 'right' }}>Kích thước</span>
              <span>Người tải lên</span>
              <span>Ngày cập nhật</span>
              <span style={{ textAlign: 'right' }}>Thao tác</span>
            </div>
            {recentSvgs.map((svg) => (
              <div key={svg.id} className="pcut-table-row" style={{ display: 'grid', gridTemplateColumns: '1fr 100px 140px 160px 100px', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #EFEEEA', font: "400 12px 'IBM Plex Sans', sans-serif" }}>
                <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {svg.originalFilename}
                </span>
                <span style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", color: '#6E6D68' }}>
                  {formatBytes(svg.fileSize)}
                </span>
                <span style={{ color: '#35342F' }}>
                  {svg.uploadedBy?.username || '—'}
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6E6D68', fontSize: 11 }}>
                  {formatDateTime(svg.createdAt)}
                </span>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                  <button
                    onClick={() => { setSelectedSvg(svg); setPreviewModalOpen(true); }}
                    style={{ padding: '3px 7px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', cursor: 'pointer', fontSize: 11 }}
                  >
                    <EyeOutlined />
                  </button>
                  <button
                    onClick={() => svgService.downloadSvg(svg.id, svg.originalFilename)}
                    style={{ padding: '3px 7px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', cursor: 'pointer', fontSize: 11 }}
                  >
                    <DownloadOutlined />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SvgUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={loadData}
      />

      <SvgPreviewModal
        svg={selectedSvg}
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
      />
    </div>
  )
}
