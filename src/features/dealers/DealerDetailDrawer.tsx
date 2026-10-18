import React, { useEffect, useState } from 'react'
import {
  Drawer,
  Card,
  Row,
  Col,
  Tag,
  Table,
  Alert,
  Progress,
  Descriptions,
  Badge,
} from 'antd'
import {
  UserOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ShopOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { Dealer } from '@/types/dealer'
import { User } from '@/types/user'
import { dealerService } from '@/services/dealers/dealerService'
import { extractErrorMessage } from '@/utils/error'

interface DealerDetailDrawerProps {
  open: boolean
  dealer: Dealer | null
  onClose: () => void
}

export const DealerDetailDrawer: React.FC<DealerDetailDrawerProps> = ({
  open,
  dealer,
  onClose,
}) => {
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && dealer) {
      setLoadingUsers(true)
      setError(null)
      dealerService
        .getDealerUsers(dealer.id)
        .then(data => {
          setUsers(data)
        })
        .catch(err => {
          setError(extractErrorMessage(err))
        })
        .finally(() => {
          setLoadingUsers(false)
        })
    } else {
      setUsers([])
      setError(null)
    }
  }, [open, dealer])

  if (!dealer) return null

  // Filter only USER role for cutters list (or display all with role tag)
  const cutterUsers = users.filter(u => u.role === 'USER')
  const agentUsers = users.filter(u => u.role === 'AGENT')

  const maxAcc = dealer.maxAccounts ?? 10
  const usedAcc = dealer.createdAccounts ?? cutterUsers.length
  const remainingAcc = dealer.remainingAccounts ?? Math.max(0, maxAcc - usedAcc)

  const totalDays = dealer.totalAllocatedDays ?? 3600
  const usedDays = dealer.usedAllocatedDays ?? 0
  const remainingDays = dealer.remainingAllocatedDays ?? Math.max(0, totalDays - usedDays)

  const accPercent = maxAcc > 0 ? Math.min(100, Math.round((usedAcc / maxAcc) * 100)) : 0
  const daysPercent = totalDays > 0 ? Math.min(100, Math.round((usedDays / totalDays) * 100)) : 0

  const userColumns = [
    {
      title: 'Tài khoản',
      key: 'user',
      render: (_: unknown, record: User) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1B1B19' }}>{record.username}</div>
          <div style={{ fontSize: 11, color: '#8A8983' }}>{record.fullName || '—'}</div>
        </div>
      ),
    },
    {
      title: 'Liên hệ',
      key: 'contact',
      render: (_: unknown, record: User) => (
        <div style={{ fontSize: 12, color: '#555' }}>
          <div>{record.email}</div>
          {record.phone && <div style={{ fontSize: 11, color: '#8A8983' }}>{record.phone}</div>}
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 90,
      render: (role: string) => (
        <Tag color={role === 'AGENT' ? 'purple' : 'blue'}>
          {role === 'AGENT' ? 'AGENT (Đại lý)' : 'USER (Thợ cắt)'}
        </Tag>
      ),
    },
    {
      title: 'Quỹ ngày phân bổ',
      key: 'allocatedDays',
      width: 140,
      align: 'right' as const,
      render: (_: unknown, record: User) => {
        if (record.role === 'AGENT') {
          return <span style={{ color: '#8A8983', fontSize: 11 }}>Không tính quỹ</span>
        }
        return (
          <span style={{ fontWeight: 600, color: '#6C3BD6', fontFamily: 'monospace' }}>
            {(record.allocatedDays ?? 0).toLocaleString()} ngày
          </span>
        )
      },
    },
    {
      title: 'Hạn dùng',
      dataIndex: 'expirationDate',
      key: 'expirationDate',
      width: 110,
      render: (exp: string | null) => (
        <span style={{ fontSize: 11.5, fontFamily: 'monospace' }}>
          {exp ? dayjs(exp).format('DD/MM/YYYY') : 'Vô thời hạn'}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 100,
      align: 'center' as const,
      render: (_: unknown, record: User) => {
        if (!record.enabled) {
          return <Badge status="error" text="Đã khóa" />
        }
        if (record.expired) {
          return <Badge status="warning" text="Hết hạn" />
        }
        return <Badge status="success" text="Hoạt động" />
      },
    },
  ]

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShopOutlined style={{ color: '#7C3AED', fontSize: 18 }} />
          <span>Chi tiết đại lý: <strong>{dealer.name}</strong></span>
          <Tag color="purple" style={{ marginLeft: 6 }}>{dealer.code}</Tag>
        </div>
      }
      placement="right"
      width={780}
      onClose={onClose}
      open={open}
      destroyOnClose
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Section 1: Thông tin đại lý & Tài khoản AGENT */}
        <Card
          size="small"
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4A3A6B' }}>
              <ShopOutlined /> <span>1. Thông tin chung đại lý</span>
            </div>
          }
          style={{ borderRadius: 8, borderColor: '#E4E3DE' }}
        >
          <Descriptions size="small" column={2} bordered>
            <Descriptions.Item label="Tên đại lý"><strong>{dealer.name}</strong></Descriptions.Item>
            <Descriptions.Item label="Mã đại lý">
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{dealer.code}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Khu vực">{dealer.region || '—'}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={dealer.status === 'ACTIVE' ? 'success' : dealer.status === 'EXPIRING' ? 'warning' : 'error'}>
                {dealer.status === 'ACTIVE' ? 'Đang hoạt động' : dealer.status === 'EXPIRING' ? 'Sắp hết hạn' : 'Tạm khóa'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Người liên hệ">{dealer.contactPerson || '—'}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">{dealer.phone || '—'}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ" span={2}>{dealer.address || '—'}</Descriptions.Item>
          </Descriptions>

          {/* Linked AGENT Login Account Info */}
          <div
            style={{
              marginTop: 12,
              padding: '12px 14px',
              borderRadius: 6,
              background: '#F9F7FE',
              border: '1px solid #E9D5FF',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <SafetyCertificateOutlined style={{ color: '#7C3AED', fontSize: 15 }} />
                <span style={{ fontWeight: 600, color: '#5B21B6', fontSize: 13 }}>
                  Tài khoản đăng nhập đại lý (Role AGENT duy nhất)
                </span>
              </div>
              <Tag color="purple" style={{ fontWeight: 600 }}>1 ĐẠI LÝ : 1 TÀI KHOẢN AGENT</Tag>
            </div>

            <Row gutter={[12, 6]} style={{ fontSize: 12 }}>
              <Col span={12}>
                <span style={{ color: '#6B7280' }}>Username: </span>
                <strong style={{ color: '#1B1B19', fontFamily: 'monospace' }}>
                  {dealer.agentUsername || 'Chưa khởi tạo'}
                </strong>
              </Col>
              <Col span={12}>
                <span style={{ color: '#6B7280' }}>Email: </span>
                <span style={{ color: '#1B1B19' }}>{dealer.agentEmail || '—'}</span>
              </Col>
              <Col span={12}>
                <span style={{ color: '#6B7280' }}>Họ tên: </span>
                <span style={{ color: '#1B1B19' }}>{dealer.agentFullName || '—'}</span>
              </Col>
              <Col span={12}>
                <span style={{ color: '#6B7280' }}>SĐT: </span>
                <span style={{ color: '#1B1B19' }}>{dealer.agentPhone || '—'}</span>
              </Col>
              <Col span={12}>
                <span style={{ color: '#6B7280' }}>Trạng thái tài khoản: </span>
                <Badge
                  status={dealer.agentEnabled !== false ? 'success' : 'error'}
                  text={dealer.agentEnabled !== false ? 'Hoạt động' : 'Tạm khóa'}
                />
              </Col>
            </Row>

            <div style={{ marginTop: 8, fontSize: 11, color: '#7C3AED', fontStyle: 'italic' }}>
              * Tài khoản AGENT chỉ dùng để đăng nhập và quản lý phạm vi đại lý, không tiêu thụ quota account và không trừ ngày trong Quỹ ngày phân bổ.
            </div>
          </div>
        </Card>

        {/* Section 2: Gói account & Quỹ ngày phân bổ */}
        <Card
          size="small"
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4A3A6B' }}>
              <CalendarOutlined /> <span>2. Cấu hình gói account & Quỹ ngày phân bổ</span>
            </div>
          }
          style={{ borderRadius: 8, borderColor: '#E4E3DE' }}
        >
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 12, color: '#6E6D68' }}>Gói hiện tại: </span>
              <strong style={{ fontSize: 14, color: '#1B1B19' }}>
                {`Gói ${maxAcc} account Thợ cắt - ${totalDays.toLocaleString()} ngày`}
              </strong>
            </div>
            <div style={{ fontSize: 12, color: '#6E6D68' }}>
              Thời hạn gói:{' '}
              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1B1B19' }}>
                {dealer.packageStartDate ? dayjs(dealer.packageStartDate).format('DD/MM/YYYY') : '—'}
                {' → '}
                {dealer.packageExpiryDate ? dayjs(dealer.packageExpiryDate).format('DD/MM/YYYY') : (dealer.dueDate || '—')}
              </span>
            </div>
          </div>

          <Row gutter={16}>
            {/* Accounts Quota */}
            <Col span={12}>
              <div
                style={{
                  padding: 12,
                  background: '#FBFBFA',
                  border: '1px solid #E4E3DE',
                  borderRadius: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 12, color: '#333' }}>
                    <UserOutlined style={{ marginRight: 4, color: '#2563EB' }} />
                    Hạn mức tài khoản Thợ cắt (USER)
                  </span>
                  <span style={{ fontSize: 11, color: '#666' }}>
                    Tối đa <strong>{maxAcc}</strong>
                  </span>
                </div>
                <Progress percent={accPercent} strokeColor="#2563EB" size="small" />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11 }}>
                  <span>Đã tạo: <strong style={{ color: '#2563EB' }}>{usedAcc}</strong> account</span>
                  <span>Còn lại: <strong style={{ color: remainingAcc > 0 ? '#16A34A' : '#DC2626' }}>{remainingAcc}</strong> account</span>
                </div>
              </div>
            </Col>

            {/* Days Quota */}
            <Col span={12}>
              <div
                style={{
                  padding: 12,
                  background: '#FBFBFA',
                  border: '1px solid #E4E3DE',
                  borderRadius: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 12, color: '#333' }}>
                    <CalendarOutlined style={{ marginRight: 4, color: '#7C3AED' }} />
                    Tổng Quỹ ngày phân bổ (USER)
                  </span>
                  <span style={{ fontSize: 11, color: '#666' }}>
                    Tổng <strong>{totalDays.toLocaleString()}d</strong>
                  </span>
                </div>
                <Progress percent={daysPercent} strokeColor="#7C3AED" size="small" />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11 }}>
                  <span>Đã cấp: <strong style={{ color: '#7C3AED' }}>{usedDays.toLocaleString()}</strong> ngày</span>
                  <span>Còn lại: <strong style={{ color: remainingDays > 0 ? '#16A34A' : '#DC2626' }}>{remainingDays.toLocaleString()}</strong> ngày</span>
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Section 3: Danh sách tài khoản Thợ cắt thuộc đại lý */}
        <Card
          size="small"
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4A3A6B' }}>
                <TeamOutlined /> <span>3. Danh sách tài khoản thuộc đại lý ({users.length})</span>
              </div>
              <span style={{ fontSize: 11, color: '#6E6D68', fontWeight: 'normal' }}>
                Thợ cắt: <strong>{cutterUsers.length}</strong> | AGENT: <strong>{agentUsers.length}</strong>
              </span>
            </div>
          }
          style={{ borderRadius: 8, borderColor: '#E4E3DE' }}
        >
          {error && (
            <Alert message={error} type="error" showIcon style={{ marginBottom: 12 }} />
          )}

          <Table
            dataSource={users}
            columns={userColumns}
            rowKey="id"
            size="small"
            loading={loadingUsers}
            pagination={false}
            locale={{ emptyText: 'Chưa có tài khoản Thợ cắt nào thuộc đại lý này.' }}
          />
        </Card>
      </div>
    </Drawer>
  )
}
