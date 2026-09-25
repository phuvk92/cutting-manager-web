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

      const res = await userService.getUsers(params)
      setData(res.content || [])
      setTotalElements(res.totalElements || 0)
    } catch (err) {
      message.error(extractErrorMessage(err, 'Failed to fetch users'))
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, usernameInput, emailInput, selectedRole, selectedEnabled, sortBy, sortDirection])

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
      message.success(`User "${record.username}" status updated`)
      fetchUsers()
    } catch (err) {
      message.error(extractErrorMessage(err, 'Failed to update user status'))
    }
  }

  const handleDelete = async (record: User) => {
    if (record.id === currentUser?.id) {
      message.error('You cannot delete your own account.')
      return
    }

    try {
      await userService.deleteUser(record.id)
      message.success(`User "${record.username}" deleted successfully`)
      fetchUsers()
    } catch (err) {
      message.error(extractErrorMessage(err, 'Failed to delete user'))
    }
  }

  const columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 65,
      sorter: true,
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      sorter: true,
      render: (text: string, record: User) => (
        <Space direction="vertical" size={0}>
          <Space>
            <span style={{ fontWeight: 600 }}>{text}</span>
            {record.id === currentUser?.id && <Tag color="gold">You</Tag>}
          </Space>
          {record.fullName && <span style={{ fontSize: 12, color: '#8c8c8c' }}>{record.fullName}</span>}
        </Space>
      ),
    },
    {
      title: 'Email / Phone',
      key: 'contact',
      render: (_: unknown, record: User) => (
        <Space direction="vertical" size={0}>
          <span>{record.email}</span>
          {record.phone && <span style={{ fontSize: 12, color: '#8c8c8c' }}>{record.phone}</span>}
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 110,
      render: (role: Role) => <RoleTag role={role} />,
    },
    ...(isAdmin
      ? [
          {
            title: 'Agent',
            key: 'agent',
            width: 140,
            render: (_: unknown, record: User) => {
              if (record.role === 'ADMIN') return <Tag color="purple">System</Tag>
              if (record.role === 'AGENT') return <Tag color="blue">Agent Self</Tag>
              return record.agentUsername ? (
                <Tag color="cyan">Agent: {record.agentUsername}</Tag>
              ) : (
                <Tag>Direct</Tag>
              )
            },
          },
        ]
      : []),
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 110,
      render: (enabled: boolean) => <StatusTag enabled={enabled} />,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      sorter: true,
      render: (dateStr: string) => formatDateTime(dateStr),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      align: 'center',
      render: (_: unknown, record: User) => {
        const isSelf = record.id === currentUser?.id

        return (
          <Space size="small">
            <Tooltip title="Edit User">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
            {!isSelf && (
              <Tooltip title={record.enabled ? 'Disable Account' : 'Enable Account'}>
                <Popconfirm
                  title={record.enabled ? 'Disable User' : 'Enable User'}
                  description={`Are you sure you want to ${record.enabled ? 'disable' : 'enable'} "${record.username}"?`}
                  onConfirm={() => handleToggleStatus(record)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="text"
                    icon={record.enabled ? <LockOutlined /> : <UnlockOutlined />}
                  />
                </Popconfirm>
              </Tooltip>
            )}
            {!isSelf && (
              <Tooltip title="Delete User">
                <Popconfirm
                  title="Delete User"
                  description={`Are you sure you want to delete "${record.username}"?`}
                  onConfirm={() => handleDelete(record)}
                  okText="Delete"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <Button type="text" danger icon={<DeleteOutlined />} />
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
      <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Filter by username..."
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Filter by email..."
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              allowClear
            />
          </Col>
          {isAdmin && (
            <Col xs={12} sm={6} md={4}>
              <Select
                placeholder="Role"
                value={selectedRole}
                onChange={val => setSelectedRole(val)}
                allowClear
                style={{ width: '100%' }}
              >
                <Select.Option value="ADMIN">ADMIN</Select.Option>
                <Select.Option value="AGENT">AGENT</Select.Option>
                <Select.Option value="USER">USER</Select.Option>
              </Select>
            </Col>
          )}
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Status"
              value={selectedEnabled}
              onChange={val => setSelectedEnabled(val)}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value={true}>Active</Select.Option>
              <Select.Option value={false}>Disabled</Select.Option>
            </Select>
          </Col>
          <Col xs={24} md={isAdmin ? 4 : 8} style={{ textAlign: 'right' }}>
            <Space>
              <Button type="primary" onClick={handleSearch}>
                Filter
              </Button>
              <Button onClick={handleResetFilters}>Reset</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchUsers} loading={loading}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={handleCreate}
          >
            Create User
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
          showTotal: total => `Total ${total} users`,
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
