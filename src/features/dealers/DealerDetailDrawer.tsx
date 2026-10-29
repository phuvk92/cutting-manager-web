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
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('dealers')
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
      title: t('detail.colAccount'),
      key: 'user',
      render: (_: unknown, record: User) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1B1B19' }}>{record.username}</div>
          <div style={{ fontSize: 11, color: '#8A8983' }}>{record.fullName || '—'}</div>
        </div>
      ),
    },
    {
      title: t('detail.colContact'),
      key: 'contact',
      render: (_: unknown, record: User) => (
        <div style={{ fontSize: 12, color: '#555' }}>
          <div>{record.email}</div>
          {record.phone && <div style={{ fontSize: 11, color: '#8A8983' }}>{record.phone}</div>}
        </div>
      ),
    },
    {
      title: t('detail.colRole'),
      dataIndex: 'role',
      key: 'role',
      width: 90,
      render: (role: string) => (
        <Tag color={role === 'AGENT' ? 'purple' : 'blue'} style={{ fontSize: 11 }}>
          {role}
        </Tag>
      ),
    },
    {
      title: t('detail.colAllocatedDays'),
      key: 'allocatedDays',
      width: 120,
      render: (_: unknown, record: User) => (
        <span style={{ fontSize: 12 }}>
          {record.role === 'AGENT' ? (
            <span style={{ color: '#8A8983', fontStyle: 'italic' }}>—</span>
          ) : record.allocatedDays && record.allocatedDays > 0 ? (
            <span style={{ fontWeight: 600, color: '#7C3AED' }}>
              {t('detail.daysUnit', { days: record.allocatedDays.toLocaleString() })}
            </span>
          ) : (
            <span style={{ color: '#8A8983' }}>0d</span>
          )}
        </span>
      ),
    },
    {
      title: t('detail.colExpiry'),
      key: 'expirationDate',
      width: 110,
      render: (_: unknown, record: User) => {
        if (!record.expirationDate) {
          return <span style={{ fontSize: 11, color: '#8A8983' }}>{t('detail.noExpiry')}</span>
        }
        const isExp = dayjs(record.expirationDate).isBefore(dayjs(), 'day')
        return (
          <span
            style={{
              fontSize: 12,
              fontFamily: 'monospace',
              color: isExp ? '#DC2626' : '#1B1B19',
              fontWeight: isExp ? 600 : 'normal',
            }}
          >
            {dayjs(record.expirationDate).format('DD/MM/YYYY')}
          </span>
        )
      },
    },
    {
      title: t('detail.colStatus'),
      key: 'enabled',
      width: 90,
      render: (_: unknown, record: User) => (
        <Badge
          status={record.enabled ? 'success' : 'error'}
          text={record.enabled ? t('detail.agentActive') : t('detail.agentLocked')}
        />
      ),
    },
  ]

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShopOutlined style={{ color: '#6C3BD6', fontSize: 18 }} />
          <span>{t('detail.title', { name: dealer.name })}</span>
          <Tag color="purple" style={{ fontFamily: 'monospace' }}>{dealer.code}</Tag>
        </div>
      }
      width={760}
      styles={{ body: { padding: '16px 20px', background: '#FAF9F6' } }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Section 1: Thông tin cơ bản & AGENT */}
        <Card
          size="small"
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4A3A6B' }}>
              <ShopOutlined /> <span>{t('detail.sectionBasic')}</span>
            </div>
          }
          style={{ borderRadius: 8, borderColor: '#E4E3DE' }}
        >
          <Descriptions size="small" column={2} bordered>
            <Descriptions.Item label={t('columns.code')}>
              <strong style={{ fontFamily: 'monospace', color: '#6C3BD6' }}>{dealer.code}</strong>
            </Descriptions.Item>
            <Descriptions.Item label={t('columns.name')}>
              <strong>{dealer.name}</strong>
            </Descriptions.Item>
            <Descriptions.Item label={t('columns.province')}>{dealer.region || '—'}</Descriptions.Item>
            <Descriptions.Item label={t('columns.contact')}>{dealer.contactPerson || '—'}</Descriptions.Item>
            <Descriptions.Item label={t('columns.phone')}>{dealer.phone || '—'}</Descriptions.Item>
            <Descriptions.Item label={t('modal.email')}>{dealer.email || '—'}</Descriptions.Item>
            <Descriptions.Item label={t('modal.address')} span={2}>{dealer.address || '—'}</Descriptions.Item>
            <Descriptions.Item label={t('columns.status')}>
              <Badge
                status={dealer.status === 'ACTIVE' ? 'success' : dealer.status === 'EXPIRING' ? 'warning' : 'error'}
                text={dealer.status === 'ACTIVE' ? t('detail.agentActive') : dealer.status === 'EXPIRING' ? t('filters.expiring', { count: '' }).trim() : t('detail.agentLocked')}
              />
            </Descriptions.Item>
            <Descriptions.Item label={t('modal.notes')}>
              {dealer.notes || <span style={{ color: '#8A8983' }}>—</span>}
            </Descriptions.Item>
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
                  {t('detail.agentAccountBox')}
                </span>
              </div>
              <Tag color="purple" style={{ fontWeight: 600 }}>{t('detail.agentTag')}</Tag>
            </div>

            <Row gutter={[12, 6]} style={{ fontSize: 12 }}>
              <Col span={12}>
                <span style={{ color: '#6B7280' }}>Username: </span>
                <strong style={{ color: '#1B1B19', fontFamily: 'monospace' }}>
                  {dealer.agentUsername || t('detail.notInitialized')}
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
                <span style={{ color: '#6B7280' }}>{t('detail.agentStatus')} </span>
                <Badge
                  status={dealer.agentEnabled !== false ? 'success' : 'error'}
                  text={dealer.agentEnabled !== false ? t('detail.agentActive') : t('detail.agentLocked')}
                />
              </Col>
            </Row>

            <div style={{ marginTop: 8, fontSize: 11, color: '#7C3AED', fontStyle: 'italic' }}>
              {t('detail.agentNote')}
            </div>
          </div>
        </Card>

        {/* Section 2: Gói account & Quỹ ngày phân bổ */}
        <Card
          size="small"
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4A3A6B' }}>
              <CalendarOutlined /> <span>{t('detail.sectionPackage')}</span>
            </div>
          }
          style={{ borderRadius: 8, borderColor: '#E4E3DE' }}
        >
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 12, color: '#6E6D68' }}>{t('detail.currentPackage')} </span>
              <strong style={{ fontSize: 14, color: '#1B1B19' }}>
                {t('detail.packageSummary', { accounts: maxAcc, days: totalDays.toLocaleString() })}
              </strong>
            </div>
            <div style={{ fontSize: 12, color: '#6E6D68' }}>
              {t('detail.packageTerm')}{' '}
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
                    {t('detail.cutterQuota')}
                  </span>
                  <span style={{ fontSize: 11, color: '#666' }}>
                    {t('detail.max', { max: maxAcc })}
                  </span>
                </div>
                <Progress percent={accPercent} strokeColor="#2563EB" size="small" />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11 }}>
                  <span>{t('detail.accountsCreated', { count: usedAcc })}</span>
                  <span style={{ color: remainingAcc > 0 ? '#16A34A' : '#DC2626' }}>
                    {t('detail.accountsRemaining', { count: remainingAcc })}
                  </span>
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
                    {t('detail.totalDaysPool')}
                  </span>
                  <span style={{ fontSize: 11, color: '#666' }}>
                    {t('detail.totalDays', { days: totalDays.toLocaleString() })}
                  </span>
                </div>
                <Progress percent={daysPercent} strokeColor="#7C3AED" size="small" />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11 }}>
                  <span>{t('detail.daysGranted', { days: usedDays.toLocaleString() })}</span>
                  <span style={{ color: remainingDays > 0 ? '#16A34A' : '#DC2626' }}>
                    {t('detail.daysRemaining', { days: remainingDays.toLocaleString() })}
                  </span>
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
                <TeamOutlined /> <span>{t('detail.sectionUsers', { count: users.length })}</span>
              </div>
              <span style={{ fontSize: 11, color: '#6E6D68', fontWeight: 'normal' }}>
                {t('detail.cuttersCount', { cutters: cutterUsers.length, agents: agentUsers.length })}
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
            locale={{ emptyText: t('detail.emptyCutters') }}
          />
        </Card>
      </div>
    </Drawer>
  )
}
