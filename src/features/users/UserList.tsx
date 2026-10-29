import React, { useState, useEffect, useCallback } from 'react'
import {
  Table,
  Input,
  Select,
  Button,
  Space,
  Popconfirm,
  message,
  Tooltip,
  Card,
  Row,
  Col,
  Tag,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  ShopOutlined,
  StopOutlined,
  KeyOutlined,
} from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { useTranslation } from 'react-i18next'
import { User, UserFilterParams } from '@/types/user'
import { Dealer } from '@/types/dealer'
import { dealerService } from '@/services/dealers/dealerService'
import { Role } from '@/types/auth'
import { userService } from '@/services/users/userService'
import { formatDateTime } from '@/utils/formatters'
import { RoleTag } from '@/components/common/RoleTag'
import { StatusTag } from '@/components/common/StatusTag'
import { UserModal } from './UserModal'
import { ResetPasswordModal } from './ResetPasswordModal'
import { DealerPackageBanner } from '@/features/dealers/DealerPackageBanner'
import { useAuthStore } from '@/stores/authStore'
import { extractErrorMessage } from '@/utils/error'
import dayjs from 'dayjs'

export const UserList: React.FC = () => {
  const { t } = useTranslation(['users', 'common'])
  const { user: currentUser } = useAuthStore()
  const isAdmin = currentUser?.role === 'ADMIN'

  // Data state
  const [data, setData] = useState<User[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)

  // Filters & Pagination state
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [usernameInput, setUsernameInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined)
  const [selectedEnabled, setSelectedEnabled] = useState<boolean | undefined>(undefined)
  const [selectedExpiration, setSelectedExpiration] = useState<string | undefined>(undefined)
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [selectedDealerId, setSelectedDealerId] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (isAdmin) {
      dealerService
        .getDealers({ status: 'ACTIVE', size: 200 })
        .then(res => setDealers(res.content || []))
        .catch(() => {})
    }
  }, [isAdmin])
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC')

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [resetUser, setResetUser] = useState<User | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params: UserFilterParams = {
        page,
        size: pageSize,
        sortBy,
        sortDirection,
      }
      if (usernameInput.trim()) params.username = usernameInput.trim()
      if (emailInput.trim()) params.email = emailInput.trim()
      if (selectedRole) params.role = selectedRole
      if (selectedEnabled !== undefined) params.enabled = selectedEnabled
      if (selectedExpiration) params.expirationStatus = selectedExpiration
      if (selectedDealerId !== undefined) params.dealerId = selectedDealerId

      const res = await userService.getUsers(params)
      setData(res.content || [])
      setTotalElements(res.totalElements || 0)
    } catch (err) {
      message.error(extractErrorMessage(err, t('common.messages.error', { ns: 'common' })))
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, usernameInput, emailInput, selectedRole, selectedEnabled, selectedExpiration, selectedDealerId, sortBy, sortDirection, t])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearch = () => {
    if (loading) return
    setPage(0)
    fetchUsers()
  }

  const handleResetFilters = () => {
    if (loading) return
    const hasActiveFilters =
      usernameInput !== '' ||
      emailInput !== '' ||
      selectedRole !== undefined ||
      selectedEnabled !== undefined ||
      selectedExpiration !== undefined ||
      page !== 0

    setUsernameInput('')
    setEmailInput('')
    setSelectedRole(undefined)
    setSelectedEnabled(undefined)
    setSelectedExpiration(undefined)
    setPage(0)

    if (!hasActiveFilters) {
      fetchUsers()
    }
  }

  const handleTableChange = (pagination: TablePaginationConfig, _filters: unknown, sorter: unknown) => {
    if (pagination.current !== undefined) {
      setPage(pagination.current - 1)
    }
    if (pagination.pageSize !== undefined) {
      setPageSize(pagination.pageSize)
    }

    if (sorter && typeof sorter === 'object' && 'field' in sorter && 'order' in sorter) {
      const s = sorter as { field?: string; order?: 'ascend' | 'descend' }
      if (s.field && s.order) {
        setSortBy(String(s.field))
        setSortDirection(s.order === 'ascend' ? 'ASC' : 'DESC')
      } else {
        setSortBy('createdAt')
        setSortDirection('DESC')
      }
    }
  }

  const handleCreate = () => {
    setSelectedUser(null)
    setModalOpen(true)
  }

  const handleEdit = (record: User) => {
    setSelectedUser(record)
    setModalOpen(true)
  }

  const handleOpenResetPassword = (record: User) => {
    setResetUser(record)
    setResetModalOpen(true)
  }

  const handleToggleStatus = async (record: User) => {
    try {
      await userService.updateUserStatus(record.id, { enabled: !record.enabled })
      message.success(t('userList.statusUpdateSuccess', { username: record.username }))
      fetchUsers()
    } catch (err) {
      message.error(extractErrorMessage(err))
    }
  }

  const handleDelete = async (record: User) => {
    if (record.id === currentUser?.id) {
      message.error(t('userList.selfDeleteError'))
      return
    }

    try {
      await userService.deleteUser(record.id)
      message.success(t('userList.deleteSuccess', { username: record.username }))
      fetchUsers()
    } catch (err) {
      message.error(extractErrorMessage(err))
    }
  }

  const getInitials = (name?: string, username?: string) => {
    const target = name || username || 'U'
    const parts = target.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return target.slice(0, 2).toUpperCase()
  }

  const columns: ColumnsType<User> = [
    {
      title: t('columns.nameAccount'),
      key: 'userInfo',
      sorter: true,
      render: (_: unknown, record: User) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              flex: 'none',
              borderRadius: '50%',
              background: '#EDEBE6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              font: "500 11px 'IBM Plex Sans', sans-serif",
              color: '#6E6D68',
            }}
          >
            {getInitials(record.fullName, record.username)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 600, color: '#1B1B19' }}>
                {record.fullName || record.username}
              </span>
              {record.id === currentUser?.id && <Tag color="gold">{t('userList.you')}</Tag>}
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: '#6E6D68' }}>
              @{record.username}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: t('columns.dealerBranch'),
      key: 'dealer',
      width: 220,
      render: (_: unknown, record: User) => {
        if (record.dealerName) {
          return (
            <div>
              <div style={{ fontWeight: 500, color: '#35342F', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ShopOutlined style={{ color: '#6C3BD6' }} />
                <span>{record.dealerName}</span>
              </div>
              {record.dealerCode && (
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#6E6D68' }}>
                  {record.dealerCode}
                </div>
              )}
            </div>
          )
        }
        if (record.agentUsername) {
          return <Tag color="cyan">Agent: {record.agentUsername}</Tag>
        }
        return <span style={{ color: '#8A8983', fontSize: 12 }}>{t('userList.independent')}</span>
      },
    },
    {
      title: t('columns.contact'),
      key: 'contact',
      width: 210,
      render: (_: unknown, record: User) => (
        <div>
          <div style={{ color: '#35342F', fontSize: 12 }}>{record.email}</div>
          {record.phone && (
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: '#6E6D68' }}>
              {record.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      title: t('columns.role'),
      dataIndex: 'role',
      key: 'role',
      width: 130,
      render: (role: Role) => <RoleTag role={role} />,
    },
    {
      title: t('columns.expiration'),
      key: 'expirationDate',
      width: 165,
      render: (_: unknown, record: User) => {
        if (record.role === 'ADMIN') {
          return <span style={{ color: '#8A8983', fontSize: 12 }}>{t('userList.notApplicable')}</span>
        }
        const hasDays = record.allocatedDays && record.allocatedDays > 0
        const months = record.allocatedDays ? Math.round(record.allocatedDays / 30) : 0
        if (!record.expirationDate) {
          return (
            <div>
              {hasDays && (
                <div style={{ fontSize: 11, color: '#6C3BD6', fontWeight: 500 }}>
                  {t('userList.daysUnit', { days: record.allocatedDays, months })}
                </div>
              )}
              <span style={{ color: '#8A8983', fontSize: 12 }}>{t('noExpiration')}</span>
            </div>
          )
        }
        const isExpired = record.expired ?? dayjs().isAfter(dayjs(record.expirationDate), 'day')
        return (
          <div>
            {hasDays && (
              <div style={{ fontSize: 11, color: '#6C3BD6', fontWeight: 500 }}>
                {t('userList.daysUnit', { days: record.allocatedDays, months })}
              </div>
            )}
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                color: isExpired ? '#DC2626' : '#35342F',
                fontWeight: isExpired ? 600 : 400,
              }}
            >
              {dayjs(record.expirationDate).format('DD/MM/YYYY')}
            </span>
          </div>
        )
      },
    },
    {
      title: t('columns.status'),
      key: 'status',
      width: 120,
      render: (_: unknown, record: User) => {
        if (!record.enabled) {
          return <StatusTag enabled={false} />
        }
        const isExpired = record.role !== 'ADMIN' && (record.expired ?? (record.expirationDate ? dayjs().isAfter(dayjs(record.expirationDate), 'day') : false))
        if (isExpired) {
          return (
            <Tag icon={<StopOutlined />} color="warning">
              {t('expired')}
            </Tag>
          )
        }
        return <StatusTag enabled={true} />
      },
    },
    {
      title: t('columns.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      sorter: true,
      render: (dateStr: string) => (
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#6E6D68' }}>
          {formatDateTime(dateStr)}
        </span>
      ),
    },
    {
      title: t('columns.actions'),
      key: 'actions',
      width: 140,
      align: 'center',
      render: (_: unknown, record: User) => {
        const isSelf = record.id === currentUser?.id

        return (
          <Space size="small">
            <Tooltip title={t('userList.editTooltip')}>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined style={{ color: '#6C3BD6' }} />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
            {isAdmin && (
              <Tooltip title={t('userList.resetPasswordTooltip')}>
                <Button
                  type="text"
                  size="small"
                  icon={<KeyOutlined style={{ color: '#D97706' }} />}
                  onClick={() => handleOpenResetPassword(record)}
                />
              </Tooltip>
            )}
            {!isSelf && (
              <Tooltip title={record.enabled ? t('userList.lockTooltip') : t('userList.unlockTooltip')}>
                <Popconfirm
                  title={record.enabled ? t('userList.lockConfirmTitle') : t('userList.unlockConfirmTitle')}
                  description={t('userList.toggleConfirmDesc', {
                    action: record.enabled ? t('userList.lockAction') : t('userList.unlockAction'),
                    username: record.username,
                  })}
                  onConfirm={() => handleToggleStatus(record)}
                  okText={t('actions.confirm', { ns: 'common' })}
                  cancelText={t('actions.cancel', { ns: 'common' })}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={record.enabled ? <LockOutlined style={{ color: '#D97706' }} /> : <UnlockOutlined style={{ color: '#16A34A' }} />}
                  />
                </Popconfirm>
              </Tooltip>
            )}
            {!isSelf && (
              <Tooltip title={t('userList.deleteTooltip')}>
                <Popconfirm
                  title={t('userList.deleteConfirmTitle')}
                  description={t('userList.deleteConfirmDesc', { username: record.username })}
                  onConfirm={() => handleDelete(record)}
                  okText={t('actions.delete', { ns: 'common' })}
                  cancelText={t('actions.cancel', { ns: 'common' })}
                  okButtonProps={{ danger: true }}
                >
                  <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                </Popconfirm>
              </Tooltip>
            )}
          </Space>
        )
      },
    },
  ]

  return (
    <div>
      <DealerPackageBanner />
      <Card style={{ marginBottom: 14, borderRadius: 6, borderColor: '#E4E3DE' }} bodyStyle={{ padding: 14 }}>
        <Row gutter={[10, 10]} align="middle">
          <Col xs={24} sm={12} md={isAdmin ? 4 : 6} lg={isAdmin ? 4 : 6}>
            <Input
              placeholder={t('userList.searchName')}
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined style={{ color: '#8A8983' }} />}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={isAdmin ? 4 : 6} lg={isAdmin ? 4 : 6}>
            <Input
              placeholder={t('userList.searchEmail')}
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined style={{ color: '#8A8983' }} />}
              allowClear
            />
          </Col>
          {isAdmin && (
            <Col xs={12} sm={6} md={4} lg={4}>
              <Select
                placeholder={t('userList.allDealers')}
                value={selectedDealerId}
                onChange={val => setSelectedDealerId(val)}
                allowClear
                showSearch
                optionFilterProp="children"
                style={{ width: '100%' }}
              >
                {dealers.map(d => (
                  <Select.Option key={d.id} value={d.id}>
                    {d.name} {d.agentUsername ? '(@' + d.agentUsername + ')' : ''}
                  </Select.Option>
                ))}
              </Select>
            </Col>
          )}
          {isAdmin && (
            <Col xs={12} sm={6} md={3} lg={3}>
              <Select
                placeholder={t('userList.allRoles')}
                value={selectedRole}
                onChange={val => setSelectedRole(val)}
                allowClear
                style={{ width: '100%' }}
              >
                <Select.Option value="ADMIN">{t('roles.ADMIN', { ns: 'common' })} (ADMIN)</Select.Option>
                <Select.Option value="AGENT">{t('roles.AGENT', { ns: 'common' })} (AGENT)</Select.Option>
                <Select.Option value="USER">{t('roles.USER', { ns: 'common' })} (USER)</Select.Option>
              </Select>
            </Col>
          )}
          <Col xs={12} sm={6} md={isAdmin ? 3 : 4} lg={isAdmin ? 3 : 4}>
            <Select
              placeholder={t('userList.allStatuses')}
              value={selectedEnabled}
              onChange={val => setSelectedEnabled(val)}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value={true}>{t('userList.active')}</Select.Option>
              <Select.Option value={false}>{t('userList.locked')}</Select.Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={isAdmin ? 3 : 5} lg={isAdmin ? 3 : 5}>
            <Select
              placeholder={t('userList.expiration')}
              value={selectedExpiration}
              onChange={val => setSelectedExpiration(val)}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value="ALL">{t('userList.allExpiration')}</Select.Option>
              <Select.Option value="VALID">{t('userList.valid')}</Select.Option>
              <Select.Option value="EXPIRED">{t('userList.expired')}</Select.Option>
              <Select.Option value="NO_EXPIRATION">{t('userList.noExpiration')}</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={6} md={isAdmin ? 3 : 3} lg={isAdmin ? 3 : 3} style={{ display: 'flex', justifyContent: 'flex-end', marginLeft: 'auto' }}>
            <Space size={8}>
              <Tooltip title={t('userList.search')}>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                  loading={loading}
                  aria-label={t('userList.search')}
                  style={{ background: '#6C3BD6', borderColor: '#6C3BD6' }}
                />
              </Tooltip>
              <Tooltip title={t('userList.reset')}>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleResetFilters}
                  disabled={loading}
                  aria-label={t('userList.reset')}
                />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchUsers} loading={loading}>
            {t('userList.refresh')}
          </Button>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={handleCreate}
            style={{ background: '#6C3BD6', borderColor: '#6C3BD6' }}
          >
            {t('userList.addUser')}
          </Button>
        </Space>
      </div>

      <Table<User>
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page + 1,
          pageSize,
          total: totalElements,
          showSizeChanger: true,
          showTotal: total => t('userList.totalUsers', { total }),
        }}
        onChange={handleTableChange}
        bordered
        size="middle"
      />

      <UserModal
        open={modalOpen}
        user={selectedUser}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchUsers}
        onResetPassword={handleOpenResetPassword}
      />

      <ResetPasswordModal
        open={resetModalOpen}
        user={resetUser}
        onClose={() => setResetModalOpen(false)}
      />
    </div>
  )
}
