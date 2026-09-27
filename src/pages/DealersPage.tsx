import React, { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import {
  PlusOutlined,
  InfoCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { Popconfirm, message, Tooltip, Input, Spin, Empty } from 'antd'
import { Dealer, DealerStats } from '@/types/dealer'
import { dealerService } from '@/services/dealers/dealerService'
import { DealerModal } from '@/features/dealers/DealerModal'
import { extractErrorMessage } from '@/utils/error'

const OK = { stBg: '#E6F1EB', stColor: '#2E7D5B', label: 'Hoạt động' }
const WARN = { stBg: '#FBF0DF', stColor: '#8A5A12', label: 'Sắp hết hạn' }
const BAD = { stBg: '#FAE7E3', stColor: '#A93823', label: 'Tạm khoá' }

export const DealersPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'ACTIVE' | 'EXPIRING' | 'LOCKED'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [stats, setStats] = useState<DealerStats>({ total: 0, active: 0, expiring: 0, locked: 0 })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const data = await dealerService.getDealerStats()
      setStats(data)
    } catch {
      // ignore
    }
  }, [])

  const fetchDealers = useCallback(async () => {
    setLoading(true)
    try {
      const statusParam = filter === 'all' ? undefined : filter
      const res = await dealerService.getDealers({
        search: searchTerm.trim() || undefined,
        status: statusParam,
        page,
        size: 15,
        sortBy: 'createdAt',
        sortDir: 'desc',
      })
      setDealers(res.content)
      setTotalPages(res.totalPages)
      setTotalElements(res.totalElements)
    } catch (err: unknown) {
      message.error(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [filter, searchTerm, page])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchDealers()
  }, [fetchDealers])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    fetchDealers()
  }

  const handleOpenCreate = () => {
    setSelectedDealer(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (dealer: Dealer) => {
    setSelectedDealer(dealer)
    setModalOpen(true)
  }

  const handleToggleStatus = async (dealer: Dealer) => {
    try {
      const nextStatus = dealer.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED'
      await dealerService.updateStatus(dealer.id, nextStatus)
      message.success(
        nextStatus === 'LOCKED'
          ? `Đã tạm khoá đại lý ${dealer.name}`
          : `Đã kích hoạt lại đại lý ${dealer.name}`
      )
      fetchDealers()
      fetchStats()
    } catch (err: unknown) {
      message.error(extractErrorMessage(err))
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await dealerService.deleteDealer(id)
      message.success('Đã xóa đại lý thành công!')
      fetchDealers()
      fetchStats()
    } catch (err: unknown) {
      message.error(extractErrorMessage(err))
    }
  }

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase()
    if (s === 'EXPIRING') return WARN
    if (s === 'LOCKED') return BAD
    return OK
  }

  const getDueColor = (dealer: Dealer) => {
    if (dealer.status === 'LOCKED') return '#8A8983'
    if (dealer.status === 'EXPIRING') return '#C2452D'
    return '#35342F'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <PageHeader
        title="Đại lý & chi nhánh"
        subtitle={`Hồ sơ, khu vực và trạng thái hoạt động của ${stats.total || dealers.length} đại lý`}
      />

      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Top Control Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span
              onClick={() => {
                setFilter('all')
                setPage(0)
              }}
              style={{
                padding: '6px 11px',
                background: filter === 'all' ? '#F1EDFC' : '#FFF',
                border: filter === 'all' ? '1px solid #D6C7F7' : '1px solid #D8D7D2',
                borderRadius: 5,
                font: "500 11.5px 'IBM Plex Sans', sans-serif",
                color: filter === 'all' ? '#5B2BB0' : '#6E6D68',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Tất cả {stats.total}
            </span>
            <span
              onClick={() => {
                setFilter('ACTIVE')
                setPage(0)
              }}
              style={{
                padding: '6px 11px',
                background: filter === 'ACTIVE' ? '#F1EDFC' : '#FFF',
                border: filter === 'ACTIVE' ? '1px solid #D6C7F7' : '1px solid #D8D7D2',
                borderRadius: 5,
                font: "400 11.5px 'IBM Plex Sans', sans-serif",
                color: filter === 'ACTIVE' ? '#5B2BB0' : '#6E6D68',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Đang hoạt động {stats.active}
            </span>
            <span
              onClick={() => {
                setFilter('EXPIRING')
                setPage(0)
              }}
              style={{
                padding: '6px 11px',
                background: filter === 'EXPIRING' ? '#F1EDFC' : '#FFF',
                border: filter === 'EXPIRING' ? '1px solid #D6C7F7' : '1px solid #D8D7D2',
                borderRadius: 5,
                font: "400 11.5px 'IBM Plex Sans', sans-serif",
                color: filter === 'EXPIRING' ? '#5B2BB0' : '#6E6D68',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Sắp hết hạn {stats.expiring}
            </span>
            <span
              onClick={() => {
                setFilter('LOCKED')
                setPage(0)
              }}
              style={{
                padding: '6px 11px',
                background: filter === 'LOCKED' ? '#F1EDFC' : '#FFF',
                border: filter === 'LOCKED' ? '1px solid #D6C7F7' : '1px solid #D8D7D2',
                borderRadius: 5,
                font: "400 11.5px 'IBM Plex Sans', sans-serif",
                color: filter === 'LOCKED' ? '#5B2BB0' : '#6E6D68',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Tạm khoá {stats.locked}
            </span>
          </div>

          {/* Search Box */}
          <div style={{ minWidth: 220, marginLeft: 6 }}>
            <Input
              placeholder="Tìm kiếm mã, tên, SĐT..."
              prefix={<SearchOutlined style={{ color: '#8A8983' }} />}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
              size="middle"
              style={{ borderRadius: 5, fontSize: 12 }}
            />
          </div>

          <button
            onClick={() => {
              fetchDealers()
              fetchStats()
            }}
            title="Làm mới"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px 10px',
              background: '#FFF',
              border: '1px solid #D8D7D2',
              borderRadius: 5,
              cursor: 'pointer',
              color: '#6E6D68',
            }}
          >
            <ReloadOutlined spin={loading} />
          </button>

          {/* Add Dealer Button */}
          <button
            onClick={handleOpenCreate}
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 13px',
              border: 0,
              borderRadius: 5,
              background: '#7C3AED',
              cursor: 'pointer',
              font: "500 11.5px 'IBM Plex Sans', sans-serif",
              color: '#FFF',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#6A2FD1')}
            onMouseLeave={e => (e.currentTarget.style.background = '#7C3AED')}
          >
            <PlusOutlined /> Thêm đại lý
          </button>
        </div>

        {/* Table Container */}
        <div
          style={{
            background: '#FBFBFA',
            border: '1px solid #E4E3DE',
            borderRadius: 6,
            overflow: 'hidden',
          }}
        >
          {/* Table Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '92px 1fr 110px 60px 105px 95px 105px 90px',
              padding: '9px 16px',
              background: '#F1F0EC',
              borderBottom: '1px solid #E4E3DE',
              font: "600 10.5px 'IBM Plex Sans', sans-serif",
              letterSpacing: '0.04em',
              color: '#6E6D68',
            }}
          >
            <span>Mã</span>
            <span>Tên đại lý</span>
            <span>Khu vực</span>
            <span style={{ textAlign: 'right' }}>User</span>
            <span>Gói cước</span>
            <span>Hạn dùng</span>
            <span style={{ textAlign: 'center' }}>Trạng thái</span>
            <span style={{ textAlign: 'right' }}>Thao tác</span>
          </div>

          {/* Table Body */}
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <Spin />
            </div>
          ) : dealers.length === 0 ? (
            <div style={{ padding: '32px 0' }}>
              <Empty description="Không tìm thấy đại lý nào" />
            </div>
          ) : (
            dealers.map(d => {
              const badge = getStatusBadge(d.status)
              const dueColor = getDueColor(d)
              const isLocked = d.status === 'LOCKED'

              return (
                <div
                  key={d.id}
                  className="pcut-table-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '92px 1fr 110px 60px 105px 95px 105px 90px',
                    alignItems: 'center',
                    padding: '11px 16px',
                    borderBottom: '1px solid #EFEEEA',
                    font: "400 12px 'IBM Plex Sans', sans-serif",
                    transition: 'background 0.15s ease',
                  }}
                >
                  {/* Mã */}
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6E6D68' }}>
                    {d.code}
                  </span>

                  {/* Tên & liên hệ */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 500, color: isLocked ? '#8A8983' : '#1B1B19' }}>
                      {d.name}
                    </span>
                    {(d.contactPerson || d.phone) && (
                      <span style={{ fontSize: 11, color: '#8A8983', marginTop: 1 }}>
                        {d.contactPerson ? `${d.contactPerson}` : ''}
                        {d.contactPerson && d.phone ? ' · ' : ''}
                        {d.phone || ''}
                      </span>
                    )}
                  </div>

                  {/* Khu vực */}
                  <span style={{ color: '#6E6D68' }}>{d.region || '—'}</span>

                  {/* User count */}
                  <span style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {d.usersCount ?? 0}
                  </span>

                  {/* Gói cước */}
                  <span style={{ color: '#35342F' }}>{d.plan || 'Cơ bản'}</span>

                  {/* Hạn dùng */}
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: dueColor }}>
                    {d.dueDate || '—'}
                  </span>

                  {/* Trạng thái */}
                  <span style={{ display: 'flex', justifyContent: 'center' }}>
                    <span
                      style={{
                        padding: '3px 9px',
                        borderRadius: 11,
                        background: badge.stBg,
                        font: "500 10.5px 'IBM Plex Sans', sans-serif",
                        color: badge.stColor,
                      }}
                    >
                      {badge.label}
                    </span>
                  </span>

                  {/* Thao tác */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                    <Tooltip title="Chỉnh sửa thông tin">
                      <button
                        onClick={() => handleOpenEdit(d)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#6C3BD6',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <EditOutlined style={{ fontSize: 13 }} />
                      </button>
                    </Tooltip>

                    <Tooltip title={isLocked ? 'Kích hoạt lại' : 'Tạm khóa đại lý'}>
                      <button
                        onClick={() => handleToggleStatus(d)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: isLocked ? '#2E7D5B' : '#B4741E',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {isLocked ? (
                          <UnlockOutlined style={{ fontSize: 13 }} />
                        ) : (
                          <LockOutlined style={{ fontSize: 13 }} />
                        )}
                      </button>
                    </Tooltip>

                    <Popconfirm
                      title="Xóa đại lý"
                      description={`Bạn có chắc muốn xóa đại lý "${d.name}"?`}
                      onConfirm={() => handleDelete(d.id)}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                    >
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#A93823',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <DeleteOutlined style={{ fontSize: 13 }} />
                      </button>
                    </Popconfirm>
                  </div>
                </div>
              )
            })
          )}

          {/* Table Footer / Pagination */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 16px',
              font: "400 11.5px 'IBM Plex Sans', sans-serif",
              color: '#6E6D68',
            }}
          >
            Hiển thị {dealers.length} / {totalElements} đại lý
            {totalPages > 1 && (
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <span
                    key={idx}
                    onClick={() => setPage(idx)}
                    style={{
                      padding: '4px 9px',
                      border: idx === page ? '1px solid #D8D7D2' : '1px solid #E4E3DE',
                      borderRadius: 4,
                      background: idx === page ? '#FFF' : 'transparent',
                      color: idx === page ? '#1B1B19' : '#8A8983',
                      fontFamily: "'IBM Plex Mono', monospace",
                      cursor: 'pointer',
                    }}
                  >
                    {idx + 1}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>

        {/* Informational Callout */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            padding: '12px 16px',
            background: '#F6F4FD',
            border: '1px solid #DDD2FA',
            borderRadius: 6,
          }}
        >
          <InfoCircleOutlined style={{ color: '#6C3BD6', marginTop: 2 }} />
          <div style={{ font: "400 11.5px/1.6 'IBM Plex Sans', sans-serif", color: '#4A3A6B' }}>
            Đại lý tự quản lý user và kho mẫu trong phạm vi của mình. Admin không cần duyệt từng
            thao tác, nhưng thấy toàn bộ dữ liệu tại đây.
          </div>
        </div>
      </div>

      {/* Create / Edit Dealer Modal */}
      <DealerModal
        open={modalOpen}
        dealer={selectedDealer}
        onClose={() => {
          setModalOpen(false)
          setSelectedDealer(null)
        }}
        onSuccess={() => {
          fetchDealers()
          fetchStats()
        }}
      />
    </div>
  )
}
