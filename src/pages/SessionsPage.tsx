import React, { useCallback, useEffect, useState } from 'react'
import { Button, Card, Col, Input, Row, Select, Space, Table, Tag, Tooltip, message } from 'antd'
import { ReloadOutlined, SearchOutlined, ShopOutlined, UserOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { DeviceRevokeButton } from '@/features/devices/DeviceRevokeButton'
import { UserModal } from '@/features/users/UserModal'
import { deviceService } from '@/services/devices/deviceService'
import { dealerService } from '@/services/dealers/dealerService'
import { userService } from '@/services/users/userService'
import { useAuthStore } from '@/stores/authStore'
import { DeviceStats, DeviceStatusFilter, SystemDevice } from '@/types/device'
import { Dealer } from '@/types/dealer'
import { User } from '@/types/user'
import { extractErrorMessage } from '@/utils/error'
import { formatDateTime, formatRelativeTime } from '@/utils/formatters'

const PAGE_SIZE_OPTIONS = [10, 20, 50]
const SEARCH_DEBOUNCE_MS = 300
const ACTIVE_RECENT_MINUTES = 15

const emptyStats: DeviceStats = { activeNow: 0, registered: 0, usersAtLimit: 0, staleDevices: 0 }

const statCardStyle: React.CSSProperties = {
  padding: '13px 16px',
  background: '#FBFBFA',
  border: '1px solid #E4E3DE',
  borderRadius: 6,
}

const statLabelStyle: React.CSSProperties = {
  font: "400 11.5px 'IBM Plex Sans', sans-serif",
  color: '#6E6D68',
}

const statValueStyle: React.CSSProperties = {
  marginTop: 6,
  font: "500 22px 'IBM Plex Mono', monospace",
}

const deviceDot = (device: SystemDevice): { color: string; title: string } => {
  if (device.status === 'REVOKED') {
    return { color: '#C2452D', title: 'Đã gỡ' }
  }
  const lastSeen = device.lastSeenAt ? Date.parse(device.lastSeenAt) : NaN
  if (!Number.isNaN(lastSeen) && Date.now() - lastSeen <= ACTIVE_RECENT_MINUTES * 60 * 1000) {
    return { color: '#2E7D5B', title: `Đang dùng — thấy trong ${ACTIVE_RECENT_MINUTES} phút gần nhất` }
  }
  return { color: '#8A8983', title: 'Đang đăng ký nhưng đã lâu không thấy' }
}

export const SessionsPage: React.FC = () => {
  const { user: currentUser } = useAuthStore()
  const isAdmin = currentUser?.role === 'ADMIN'

  const [stats, setStats] = useState<DeviceStats>(emptyStats)
  const [devices, setDevices] = useState<SystemDevice[]>([])
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingUser, setLoadingUser] = useState(false)
  const [revokingId, setRevokingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [dealerId, setDealerId] = useState<number | undefined>(undefined)
  const [status, setStatus] = useState<DeviceStatusFilter>('ACTIVE')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [totalElements, setTotalElements] = useState(0)

  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userModalOpen, setUserModalOpen] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(0)
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    if (!isAdmin) return
    dealerService
      .getAllDealers()
      .then(list => setDealers(list || []))
      .catch(err => message.error(extractErrorMessage(err, 'Không tải được danh sách đại lý')))
  }, [isAdmin])

  const loadDevices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await deviceService.getDevices({
        q: search || undefined,
        dealerId: isAdmin ? dealerId : undefined,
        status,
        page,
        size: pageSize,
        sortBy: 'lastSeenAt',
        sortDir: 'desc',
      })
      setDevices(res.content || [])
      setTotalElements(res.totalElements || 0)
    } catch (err) {
      setError(extractErrorMessage(err, 'Không tải được danh sách thiết bị'))
      setDevices([])
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }, [search, dealerId, status, page, pageSize, isAdmin])

  const loadStats = useCallback(async () => {
    try {
      setStats(await deviceService.getStats())
    } catch (err) {
      message.error(extractErrorMessage(err, 'Không tải được thống kê thiết bị'))
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadDevices)
  }, [loadDevices])

  useEffect(() => {
    void Promise.resolve().then(loadStats)
  }, [loadStats])

  const reloadAll = async () => {
    await Promise.all([loadDevices(), loadStats()])
  }

  const openUserModal = async (device: SystemDevice) => {
    if (!device.userId) return
    setLoadingUser(true)
    try {
      setEditingUser(await userService.getUserById(device.userId))
      setUserModalOpen(true)
    } catch (err) {
      message.error(extractErrorMessage(err, 'Không mở được thông tin người dùng'))
    } finally {
      setLoadingUser(false)
    }
  }

  const revokeDevice = async (device: SystemDevice) => {
    if (!device.userId || !device.deviceRegId) return
    setRevokingId(device.deviceRegId)
    try {
      await userService.revokeUserDevice(device.userId, device.deviceRegId)
      message.success(`Đã gỡ máy "${device.deviceName || 'Máy không tên'}" khỏi tài khoản ${device.username || ''}`.trim())
      setDevices(current =>
        current.map(d =>
          d.deviceRegId === device.deviceRegId
            ? { ...d, status: 'REVOKED', revokedAt: new Date().toISOString(), revokedBy: currentUser?.username || null }
            : d
        )
      )
      if (status !== 'ACTIVE') {
        await loadDevices()
      }
      await loadStats()
    } catch (err) {
      message.error(extractErrorMessage(err, 'Không gỡ được máy'))
    } finally {
      setRevokingId(null)
    }
  }

  const resetFilters = () => {
    setSearchInput('')
    setSearch('')
    setDealerId(undefined)
    setStatus('ACTIVE')
    setPage(0)
  }

  const columns: ColumnsType<SystemDevice> = [
    {
      title: 'Người dùng',
      key: 'user',
      render: (_: unknown, record: SystemDevice) => {
        const dot = deviceDot(record)
        return (
          <Button
            type="link"
            onClick={() => openUserModal(record)}
            loading={loadingUser}
            style={{ padding: 0, height: 'auto', textAlign: 'left' }}
          >
            <Space size={8}>
              <Tooltip title={dot.title}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot.color, display: 'inline-block' }} />
              </Tooltip>
              <span>
                <span style={{ display: 'block', fontWeight: 600, color: '#1B1B19' }}>
                  {record.fullName || record.username || 'Người dùng không tên'}
                </span>
                <span style={{ display: 'block', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: '#6E6D68' }}>
                  @{record.username || '-'}
                </span>
              </span>
            </Space>
          </Button>
        )
      },
    },
    {
      title: 'Đại lý',
      key: 'dealer',
      width: 210,
      render: (_: unknown, record: SystemDevice) =>
        record.dealerName ? (
          <Space size={6}>
            <ShopOutlined style={{ color: '#6C3BD6' }} />
            <span>{record.dealerName}</span>
          </Space>
        ) : (
          <span style={{ color: '#8A8983' }}>—</span>
        ),
    },
    {
      title: 'Thiết bị',
      key: 'device',
      width: 190,
      render: (_: unknown, record: SystemDevice) => (
        <div>
          <div style={{ fontWeight: 500, color: '#35342F' }}>{record.deviceName || 'Máy không tên'}</div>
          <div style={{ fontSize: 11.5, color: '#6E6D68' }}>{record.platform || 'Nền tảng chưa rõ'}</div>
        </div>
      ),
    },
    {
      title: 'IP cuối',
      dataIndex: 'lastIp',
      key: 'lastIp',
      width: 135,
      render: (ip?: string | null) => (
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6E6D68' }}>{ip || '—'}</span>
      ),
    },
    {
      title: 'Lần đầu',
      dataIndex: 'firstSeenAt',
      key: 'firstSeenAt',
      width: 150,
      render: (value?: string | null) => (
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#6E6D68' }}>
          {formatDateTime(value)}
        </span>
      ),
    },
    {
      title: 'Lần cuối thấy',
      dataIndex: 'lastSeenAt',
      key: 'lastSeenAt',
      width: 160,
      render: (value: string | null | undefined, record: SystemDevice) => (
        <div>
          <div style={{ fontSize: 12, color: '#35342F' }}>{formatRelativeTime(value)}</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#8A8983' }}>
            {formatDateTime(value)}
          </div>
          {record.status === 'REVOKED' && (
            <div style={{ fontSize: 11, color: '#C2452D' }}>
              Đã gỡ{record.revokedBy ? ` bởi ${record.revokedBy}` : ''}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'state',
      width: 120,
      render: (_: unknown, record: SystemDevice) =>
        record.status === 'REVOKED' ? <Tag>Đã gỡ</Tag> : <Tag color="green">Đang dùng được</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 110,
      align: 'center',
      render: (_: unknown, record: SystemDevice) =>
        record.status === 'ACTIVE' ? (
          <DeviceRevokeButton loading={revokingId === record.deviceRegId} onConfirm={() => revokeDevice(record)} />
        ) : (
          <span style={{ color: '#8A8983' }}>—</span>
        ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <PageHeader
        title="Phiên & thiết bị"
        subtitle="Thiết bị đã đăng ký phần mềm cắt và mức độ hoạt động"
        extra={
          <Button icon={<ReloadOutlined />} onClick={reloadAll} loading={loading}>
            Làm mới
          </Button>
        }
      />
      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>Đang dùng (15 phút)</div>
            <div style={statValueStyle}>{stats.activeNow}</div>
          </div>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>Máy đã đăng ký</div>
            <div style={statValueStyle}>{stats.registered}</div>
          </div>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>Tài khoản đã đủ máy</div>
            <div style={{ ...statValueStyle, color: stats.usersAtLimit > 0 ? '#C2452D' : '#1B1B19' }}>
              {stats.usersAtLimit}
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>Máy lâu không dùng &gt; 30 ngày</div>
            <div style={{ ...statValueStyle, color: stats.staleDevices > 0 ? '#B4741E' : '#1B1B19' }}>
              {stats.staleDevices}
            </div>
          </div>
        </div>

        <Card style={{ borderRadius: 6, borderColor: '#E4E3DE' }} bodyStyle={{ padding: 14 }}>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} md={isAdmin ? 8 : 10}>
              <Input
                placeholder="Tìm người dùng, máy hoặc IP..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                prefix={<SearchOutlined style={{ color: '#8A8983' }} />}
                allowClear
              />
            </Col>
            {isAdmin && (
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="Tất cả đại lý"
                  value={dealerId}
                  onChange={value => {
                    setDealerId(value)
                    setPage(0)
                  }}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  style={{ width: '100%' }}
                  options={dealers.map(d => ({ value: d.id, label: `${d.name} (${d.code})` }))}
                />
              </Col>
            )}
            <Col xs={24} sm={12} md={5}>
              <Select
                value={status}
                onChange={value => {
                  setStatus(value)
                  setPage(0)
                }}
                style={{ width: '100%' }}
                options={[
                  { value: 'ACTIVE', label: 'Đang dùng được' },
                  { value: 'REVOKED', label: 'Đã gỡ' },
                  { value: 'ALL', label: 'Tất cả' },
                ]}
              />
            </Col>
            <Col flex="auto" style={{ textAlign: 'right' }}>
              <Button icon={<UserOutlined />} onClick={resetFilters}>
                Đặt lại
              </Button>
            </Col>
          </Row>
        </Card>

        {error && (
          <ErrorState
            message="Không tải được dữ liệu thiết bị"
            description={error}
            onRetry={reloadAll}
          />
        )}

        <Table<SystemDevice>
          columns={columns}
          dataSource={devices}
          rowKey="deviceRegId"
          loading={loading}
          pagination={{
            current: page + 1,
            pageSize,
            total: totalElements,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showTotal: total => `Tổng số: ${total} thiết bị`,
          }}
          onChange={pagination => {
            setPage((pagination.current || 1) - 1)
            setPageSize(pagination.pageSize || pageSize)
          }}
          locale={{
            emptyText: (
              <EmptyState
                description={
                  search || dealerId || status !== 'ACTIVE'
                    ? 'Không có thiết bị nào khớp bộ lọc hiện tại.'
                    : 'Chưa có máy nào đăng ký. Máy sẽ xuất hiện khi thợ đăng nhập phần mềm cắt.'
                }
              />
            ),
          }}
          bordered
          size="middle"
        />
      </div>

      <UserModal
        open={userModalOpen}
        user={editingUser}
        onClose={() => setUserModalOpen(false)}
        onSuccess={reloadAll}
      />
    </div>
  )
}
