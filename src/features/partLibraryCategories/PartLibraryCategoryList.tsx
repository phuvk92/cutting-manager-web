import React, { useCallback, useEffect, useState } from 'react'
import { Table, Button, Input, Select, Tag, Popconfirm, message, Space, Tooltip, Typography } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useTranslation } from 'react-i18next'
import { PartLibraryCategory, PartLibraryCategoryFilterParams } from '@/types/partLibraryCategory'
import { partLibraryCategoryService } from '@/services/admin/partLibraryCategoryService'
import { PartLibraryCategoryModal } from './PartLibraryCategoryModal'
import { extractErrorMessage } from '@/utils/error'
import { formatDateTime } from '@/utils/formatters'

const { Text } = Typography

export const PartLibraryCategoryList: React.FC = () => {
  const { t } = useTranslation(['partLibraryCategories', 'common'])
  const [data, setData] = useState<PartLibraryCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [totalElements, setTotalElements] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('ALL')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PartLibraryCategory | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      const params: PartLibraryCategoryFilterParams = {
        page,
        size: pageSize,
        sortBy: 'name',
        sortDirection: 'asc',
      }
      if (search.trim()) params.search = search.trim()
      if (status && status !== 'ALL') params.status = status

      const res = await partLibraryCategoryService.getCategories(params)
      setData(res.content || [])
      setTotalElements(res.totalElements || 0)
    } catch (err) {
      message.error(extractErrorMessage(err, t('messages.loadError')))
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, status, t])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleSearch = () => {
    setPage(0)
    fetchCategories()
  }

  const handleReset = () => {
    setSearch('')
    setStatus('ALL')
    setPage(0)
  }

  const handleOpenCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (record: PartLibraryCategory) => {
    setEditing(record)
    setModalOpen(true)
  }

  const handleToggleStatus = async (record: PartLibraryCategory) => {
    const newStatus = record.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await partLibraryCategoryService.updateCategory(record.id, { status: newStatus })
      message.success(t('messages.statusUpdated'))
      fetchCategories()
    } catch (err) {
      message.error(extractErrorMessage(err, t('messages.statusError')))
    }
  }

  const handleDelete = async (record: PartLibraryCategory) => {
    try {
      await partLibraryCategoryService.deleteCategory(record.id)
      message.success(t('messages.deleteSuccess'))
      fetchCategories()
    } catch (err) {
      message.error(extractErrorMessage(err, t('messages.deleteError')))
    }
  }

  const columns: ColumnsType<PartLibraryCategory> = [
    {
      title: t('columns.code'),
      dataIndex: 'code',
      key: 'code',
      width: 160,
      render: (code: string) => (
        <Tag color="blue" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
          {code}
        </Tag>
      ),
    },
    {
      title: t('columns.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Text strong style={{ color: '#1B1B19' }}>
          {name}
        </Text>
      ),
    },
    {
      title: t('columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (st: string) => (
        st === 'ACTIVE' ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>{t('status.active', { ns: 'common' })}</Tag>
        ) : (
          <Tag color="default" icon={<StopOutlined />}>{t('status.inactive', { ns: 'common' })}</Tag>
        )
      ),
    },
    {
      title: t('columns.usageCount'),
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 140,
      align: 'center',
      render: (count: number) => (
        <Tag color={count > 0 ? 'processing' : 'default'}>
          {t('columns.filesUnit', { count: count ?? 0 })}
        </Tag>
      ),
    },
    {
      title: t('columns.createdBy'),
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 130,
      render: (user: string | null) => user || '—',
    },
    {
      title: t('columns.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (dateStr: string) => (dateStr ? formatDateTime(dateStr) : '—'),
    },
    {
      title: t('columns.action'),
      key: 'action',
      width: 180,
      align: 'right',
      render: (_, record) => {
        const inUse = (record.usageCount ?? 0) > 0
        return (
          <Space size="middle">
            <Tooltip title={t('tooltips.edit')}>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined style={{ color: '#2F5BA8' }} />}
                onClick={() => handleOpenEdit(record)}
              />
            </Tooltip>

            <Tooltip title={record.status === 'ACTIVE' ? t('tooltips.pause') : t('tooltips.activate')}>
              <Button
                type="text"
                size="small"
                icon={
                  record.status === 'ACTIVE' ? (
                    <StopOutlined style={{ color: '#C2452D' }} />
                  ) : (
                    <CheckCircleOutlined style={{ color: '#2E7D5B' }} />
                  )
                }
                onClick={() => handleToggleStatus(record)}
              />
            </Tooltip>

            {inUse ? (
              <Tooltip title={t('tooltips.cannotDelete')}>
                <Button
                  type="text"
                  size="small"
                  disabled
                  icon={<DeleteOutlined style={{ color: '#BFBFBF' }} />}
                />
              </Tooltip>
            ) : (
              <Popconfirm
                title={t('messages.deleteConfirmTitle')}
                description={t('messages.deleteConfirmDesc', { name: record.name })}
                onConfirm={() => handleDelete(record)}
                okText={t('actions.delete', { ns: 'common' })}
                cancelText={t('actions.cancel', { ns: 'common' })}
                okButtonProps={{ danger: true }}
              >
                <Tooltip title={t('tooltips.delete')}>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        )
      },
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filter bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          padding: '12px 16px',
          background: '#FFF',
          border: '1px solid #E4E3DE',
          borderRadius: 6,
        }}
      >
        <Space size="middle" wrap>
          <Input.Search
            placeholder={t('filters.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 260 }}
            allowClear
          />

          <Select
            value={status}
            onChange={v => {
              setStatus(v)
              setPage(0)
            }}
            style={{ width: 160 }}
          >
            <Select.Option value="ALL">{t('filters.allStatuses')}</Select.Option>
            <Select.Option value="ACTIVE">{t('status.active', { ns: 'common' })}</Select.Option>
            <Select.Option value="INACTIVE">{t('status.inactive', { ns: 'common' })}</Select.Option>
          </Select>

          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            {t('filters.refresh')}
          </Button>
        </Space>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenCreate}
          style={{ background: '#2E7D5B', borderColor: '#2E7D5B' }}
        >
          {t('addCategory')}
        </Button>
      </div>

      {/* Table */}
      <div style={{ background: '#FFF', border: '1px solid #E4E3DE', borderRadius: 6, overflow: 'hidden' }}>
        <Table<PartLibraryCategory>
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current: page + 1,
            pageSize,
            total: totalElements,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            onChange: (p, s) => {
              setPage(p - 1)
              setPageSize(s)
            },
            showTotal: total => t('filters.totalCategories', { total }),
          }}
        />
      </div>

      {/* Modal create / edit */}
      <PartLibraryCategoryModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchCategories}
      />
    </div>
  )
}
