import dayjs from 'dayjs'
import React, { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { Popconfirm, message, Tooltip, Input, Spin, Empty } from 'antd'
import { useTranslation } from 'react-i18next'
import { Dealer, DealerStats } from '@/types/dealer'
import { dealerService } from '@/services/dealers/dealerService'
import { DealerModal } from '@/features/dealers/DealerModal'
import { DealerDetailDrawer } from '@/features/dealers/DealerDetailDrawer'
import { extractErrorMessage } from '@/utils/error'

export const DealersPage: React.FC = () => {
  const { t } = useTranslation(['dealers', 'common'])
  const [filter, setFilter] = useState<'all' | 'ACTIVE' | 'EXPIRING' | 'LOCKED'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [stats, setStats] = useState<DealerStats>({ total: 0, active: 0, expiring: 0, locked: 0 })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  // Modal & Drawer state
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [detailDealer, setDetailDealer] = useState<Dealer | null>(null)

  const OK = { stBg: '#E6F1EB', stColor: '#2E7D5B', label: t('status.active', { ns: 'common' }) }
  const WARN = { stBg: '#FBF0DF', stColor: '#8A5A12', label: t('status.expiringSoon', { ns: 'common' }) }
  const BAD = { stBg: '#FAE7E3', stColor: '#A93823', label: t('status.disabled', { ns: 'common' }) }

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

  const handleOpenDetail = (dealer: Dealer) => {
    setDetailDealer(dealer)
    setDetailDrawerOpen(true)
  }

  const handleToggleStatus = async (dealer: Dealer) => {
    try {
      const nextStatus = dealer.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED'
      await dealerService.updateStatus(dealer.id, nextStatus)
      message.success(
        nextStatus === 'LOCKED'
          ? t('messages.lockedSuccess', { name: dealer.name })
          : t('messages.unlockedSuccess', { name: dealer.name })
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
      message.success(t('messages.deleteSuccess'))
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
        title={t('title')}
        subtitle={t('pageSubtitle', { total: stats.total || dealers.length })}
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
              {t('filters.all', { count: stats.total })}
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
              {t('filters.active', { count: stats.active })}
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
              {t('filters.expiring', { count: stats.expiring })}
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
              {t('filters.locked', { count: stats.locked })}
            </span>
          </div>

          {/* Search Box */}
          <div style={{ minWidth: 220, marginLeft: 6 }}>
            <Input
              placeholder={t('filters.searchPlaceholder')}
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
            title={t('filters.refresh')}
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
            <PlusOutlined /> {t('addDealer')}
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
              gridTemplateColumns: '80px 1.1fr 1fr 85px 95px 145px 90px 90px 110px',
              padding: '9px 16px',
              background: '#F1F0EC',
              borderBottom: '1px solid #E4E3DE',
              font: "600 10.5px 'IBM Plex Sans', sans-serif",
              letterSpacing: '0.04em',
              color: '#6E6D68',
            }}
          >
            <span>{t('table.code')}</span>
            <span>{t('table.name')}</span>
            <span>{t('table.agentAccount')}</span>
            <span>{t('table.region')}</span>
            <span style={{ textAlign: 'center' }}>{t('table.cutters')}</span>
            <span style={{ textAlign: 'center' }}>{t('table.daysPool')}</span>
            <span>{t('table.expiry')}</span>
            <span style={{ textAlign: 'center' }}>{t('table.status')}</span>
            <span style={{ textAlign: 'right' }}>{t('table.actions')}</span>
          </div>

          {/* Table Body */}
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <Spin />
            </div>
          ) : dealers.length === 0 ? (
            <div style={{ padding: '32px 0' }}>
              <Empty description={t('filters.empty')} />
            </div>
          ) : (
            dealers.map(d => {
              const badge = getStatusBadge(d.status)
              const dueColor = getDueColor(d)
              const isLocked = d.status === 'LOCKED'

              const maxAcc = d.maxAccounts ?? 10
              const createdAcc = d.createdAccounts ?? d.usersCount ?? 0
              const totalDays = d.totalAllocatedDays ?? 3600
              const usedDays = d.usedAllocatedDays ?? 0
              const remainingDays = d.remainingAllocatedDays ?? Math.max(0, totalDays - usedDays)

              return (
                <div
                  key={d.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1.1fr 1fr 85px 95px 145px 90px 90px 110px',
                    padding: '11px 16px',
                    alignItems: 'center',
                    background: '#FFF',
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

                  {/* Tài khoản AGENT duy nhất */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {d.agentUsername ? (
                      <>
                        <span style={{ fontWeight: 600, color: '#5B21B6', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5 }}>
                          {d.agentUsername}
                        </span>
                        {d.agentEmail && (
                          <span style={{ fontSize: 10.5, color: '#8A8983' }}>
                            {d.agentEmail}
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{ color: '#B4741E', fontStyle: 'italic', fontSize: 11 }}>
                        Chưa cấp
                      </span>
                    )}
                  </div>

                  {/* Khu vực */}
                  <span style={{ color: '#6E6D68' }}>{d.region || '—'}</span>

                  {/* Cutter Accounts Quota */}
                  <div style={{ textAlign: 'center', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
                    <span style={{ color: createdAcc >= maxAcc ? '#DC2626' : '#2E7D5B', fontWeight: 600 }}>
                      {createdAcc}
                    </span>
                    <span style={{ color: '#8A8983' }}>/{maxAcc}</span>
                  </div>

                  {/* Days Quota (chỉ tính USER) */}
                  <div style={{ textAlign: 'center', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
                    <div>
                      <span style={{ color: '#6C3BD6', fontWeight: 600 }}>
                        {usedDays.toLocaleString()}
                      </span>
                      <span style={{ color: '#8A8983' }}>
                        /{totalDays.toLocaleString()}d
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: remainingDays > 0 ? '#16A34A' : '#DC2626', marginTop: 1 }}>
                      {t('table.daysRemaining', { days: remainingDays.toLocaleString() })}
                    </div>
                  </div>

                  {/* Hạn gói */}
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: dueColor, fontSize: 11.5 }}>
                    {d.packageExpiryDate ? dayjs(d.packageExpiryDate).format('DD/MM/YYYY') : (d.dueDate || '—')}
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
                    <Tooltip title={t('table.tooltipDetail')}>
                      <button
                        onClick={() => handleOpenDetail(d)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#2563EB',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <EyeOutlined style={{ fontSize: 13 }} />
                      </button>
                    </Tooltip>

                    <Tooltip title={t('table.tooltipEdit')}>
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

                    <Tooltip title={isLocked ? t('table.tooltipUnlock') : t('table.tooltipLock')}>
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
                      title={t('table.tooltipDelete')}
                      description={t('deleteConfirmDesc', { name: d.name })}
                      onConfirm={() => handleDelete(d.id)}
                      okText={t('actions.delete', { ns: 'common' })}
                      cancelText={t('actions.cancel', { ns: 'common' })}
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
            {t('showingDealers', { count: dealers.length, total: totalElements })}
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
            {t('infoCallout')}
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

      {/* Dealer Detail Drawer */}
      <DealerDetailDrawer
        open={detailDrawerOpen}
        dealer={detailDealer}
        onClose={() => {
          setDetailDrawerOpen(false)
          setDetailDealer(null)
        }}
      />
    </div>
  )
}
