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
} from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { User, UserFilterParams } from '@/types/user'
import { Role } from '@/types/auth'
import { userService } from '@/services/users/userService'
import { formatDateTime } from '@/utils/formatters'
import { RoleTag } from '@/components/common/RoleTag'
import { StatusTag } from '@/components/common/StatusTag'
import { UserModal } from './UserModal'
import { useAuthStore } from '@/stores/authStore'
import { extractErrorMessage } from '@/utils/error'
import dayjs from 'dayjs'

export const UserList: React.FC = () => {
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
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC')

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

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

      const res = await userService.getUsers(params)
      setData(res.content || [])
      setTotalElements(res.totalElements || 0)
    } catch (err) {
      message.error(extractErrorMessage(err, 'Không thể tải danh sách người dùng'))
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, usernameInput, emailInput, selectedRole, selectedEnabled, selectedExpiration, sortBy, sortDirection])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearch = () => {
    setPage(0)
    fetchUsers()
  }

  const handleResetFilters = () => {
    setUsernameInput('')
    setEmailInput('')
    setSelectedRole(undefined)
    setSelectedEnabled(undefined)
    setSelectedExpiration(undefined)
    setPage(0)
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

  const handleToggleStatus = async (record: User) => {
    try {
      await userService.updateUserStatus(record.id, { enabled: !record.enabled })
      message.success(`Đã cập nhật trạng thái người dùng "${record.username}"`)
      fetchUsers()
    } catch (err) {
      message.error(extractErrorMessage(err, 'Không thể cập nhật trạng thái người dùng'))
    }
  }

  const handleDelete = async (record: User) => {
    if (record.id === currentUser?.id) {
      message.error('Bạn không thể tự xóa tài khoản của chính mình.')
      return
    }

    try {
      await userService.deleteUser(record.id)
      message.success(`Đã xóa người dùng "${record.username}" thành công`)
      fetchUsers()
    } catch (err) {
      message.error(extractErrorMessage(err, 'Không thể xóa người dùng'))
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
      title: 'Họ tên & Tài khoản',
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
              {record.id === currentUser?.id && <Tag color="gold">Bạn</Tag>}
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: '#6E6D68' }}>
              @{record.username}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Đại lý & Chi nhánh',
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
        return <span style={{ color: '#8A8983', fontSize: 12 }}>Độc lập / Trực tiếp</span>
      },
    },
    {
      title: 'Liên hệ',
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
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 130,
      render: (role: Role) => <RoleTag role={role} />,
    },
    {
      title: 'Ngày hết hạn',
      key: 'expirationDate',
      width: 140,
      render: (_: unknown, record: User) => {
        if (record.role === 'ADMIN') {
          return <span style={{ color: '#8A8983', fontSize: 12 }}>Không áp dụng</span>
        }
        if (!record.expirationDate) {
          return <span style={{ color: '#8A8983', fontSize: 12 }}>Không hết hạn</span>
        }
        const isExpired = record.expired ?? dayjs().isAfter(dayjs(record.expirationDate), 'day')
        return (
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
        )
      },
    },
    {
      title: 'Trạng thái',
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
              Hết hạn
            </Tag>
          )
        }
        return <StatusTag enabled={true} />
      },
    },
    {
      title: 'Ngày tạo',
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
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_: unknown, record: User) => {
        const isSelf = record.id === currentUser?.id

        return (
          <Space size="small">
            <Tooltip title="Chỉnh sửa thông tin">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined style={{ color: '#6C3BD6' }} />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
            {!isSelf && (
              <Tooltip title={record.enabled ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}>
                <Popconfirm
                  title={record.enabled ? 'Khóa người dùng' : 'Mở khóa người dùng'}
                  description={`Bạn có chắc muốn ${record.enabled ? 'khóa' : 'mở khóa'} tài khoản "${record.username}"?`}
                  onConfirm={() => handleToggleStatus(record)}
                  okText="Đồng ý"
                  cancelText="Hủy"
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
              <Tooltip title="Xóa tài khoản">
                <Popconfirm
                  title="Xóa người dùng"
                  description={`Bạn có chắc muốn xóa vĩnh viễn người dùng "${record.username}"?`}
                  onConfirm={() => handleDelete(record)}
                  okText="Xóa"
                  cancelText="Hủy"
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
      <Card style={{ marginBottom: 14, borderRadius: 6, borderColor: '#E4E3DE' }} bodyStyle={{ padding: 14 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Tìm theo tên đăng nhập..."
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined style={{ color: '#8A8983' }} />}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Tìm theo email..."
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined style={{ color: '#8A8983' }} />}
              allowClear
            />
          </Col>
          {isAdmin && (
            <Col xs={12} sm={6} md={4}>
              <Select
                placeholder="Tất cả vai trò"
                value={selectedRole}
                onChange={val => setSelectedRole(val)}
                allowClear
                style={{ width: '100%' }}
              >
                <Select.Option value="ADMIN">Quản trị viên (ADMIN)</Select.Option>
                <Select.Option value="AGENT">Quản lý đại lý (AGENT)</Select.Option>
                <Select.Option value="USER">Thợ cắt (USER)</Select.Option>
              </Select>
            </Col>
          )}
          <Col xs={12} sm={6} md={isAdmin ? 3 : 4}>
            <Select
              placeholder="Tất cả trạng thái"
              value={selectedEnabled}
              onChange={val => setSelectedEnabled(val)}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value={true}>Hoạt động</Select.Option>
              <Select.Option value={false}>Đang khóa</Select.Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={isAdmin ? 3 : 4}>
            <Select
              placeholder="Hạn tài khoản"
              value={selectedExpiration}
              onChange={val => setSelectedExpiration(val)}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value="ALL">Tất cả hạn</Select.Option>
              <Select.Option value="VALID">Còn hạn</Select.Option>
              <Select.Option value="EXPIRED">Hết hạn</Select.Option>
              <Select.Option value="NO_EXPIRATION">Không có ngày hết hạn</Select.Option>
            </Select>
          </Col>
          <Col xs={24} md={isAdmin ? 4 : 8} style={{ textAlign: 'right' }}>
            <Space>
              <Button type="primary" onClick={handleSearch} style={{ background: '#6C3BD6', borderColor: '#6C3BD6' }}>
                Lọc
              </Button>
              <Button onClick={handleResetFilters}>Đặt lại</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchUsers} loading={loading}>
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={handleCreate}
            style={{ background: '#6C3BD6', borderColor: '#6C3BD6' }}
          >
            Thêm người dùng
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
          showTotal: total => `Tổng số: ${total} người dùng`,
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
      />
    </div>
  )
}
