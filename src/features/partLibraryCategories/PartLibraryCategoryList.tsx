import React, { useCallback, useEffect, useState } from 'react'
import { Table, Button, Input, Select, Tag, Popconfirm, message, Space, Tooltip, Typography } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { PartLibraryCategory, PartLibraryCategoryFilterParams } from '@/types/partLibraryCategory'
import { partLibraryCategoryService } from '@/services/admin/partLibraryCategoryService'
import { PartLibraryCategoryModal } from './PartLibraryCategoryModal'
import { extractErrorMessage } from '@/utils/error'
import { formatDateTime } from '@/utils/formatters'

const { Text } = Typography

export const PartLibraryCategoryList: React.FC = () => {
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
      message.error(extractErrorMessage(err, 'Không thể tải danh sách danh mục kho mẫu & part'))
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, status])

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
      message.success('Đã cập nhật trạng thái danh mục')
      fetchCategories()
    } catch (err) {
      message.error(extractErrorMessage(err, 'Không thể thay đổi trạng thái danh mục'))
    }
  }

  const handleDelete = async (record: PartLibraryCategory) => {
    try {
      await partLibraryCategoryService.deleteCategory(record.id)
      message.success('Đã xóa danh mục thành công')
      fetchCategories()
    } catch (err) {
      message.error(extractErrorMessage(err, 'Không thể xóa danh mục'))
    }
  }

  const columns: ColumnsType<PartLibraryCategory> = [
    {
      title: 'Mã danh mục',
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
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Text strong style={{ color: '#1B1B19' }}>
          {name}
        </Text>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (st: string) => (
        st === 'ACTIVE' ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>Hoạt động</Tag>
        ) : (
          <Tag color="default" icon={<StopOutlined />}>Tạm dừng</Tag>
        )
      ),
    },
    {
      title: 'Số file sử dụng',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 140,
      align: 'center',
      render: (count: number) => (
        <Tag color={count > 0 ? 'processing' : 'default'}>
          {count ?? 0} file
        </Tag>
      ),
    },
    {
      title: 'Người tạo',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 130,
      render: (user: string | null) => user || '—',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (dateStr: string) => (dateStr ? formatDateTime(dateStr) : '—'),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 180,
      align: 'right',
      render: (_, record) => {
        const inUse = (record.usageCount ?? 0) > 0
        return (
          <Space size="middle">
            <Tooltip title="Chỉnh sửa">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined style={{ color: '#2F5BA8' }} />}
                onClick={() => handleOpenEdit(record)}
              />
            </Tooltip>

            <Tooltip title={record.status === 'ACTIVE' ? 'Tạm dừng danh mục' : 'Kích hoạt danh mục'}>
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
              <Tooltip title="Không thể xóa vì đang có part file sử dụng. Vui lòng chuyển trạng thái sang Tạm dừng (INACTIVE).">
                <Button
                  type="text"
                  size="small"
                  disabled
                  icon={<DeleteOutlined style={{ color: '#BFBFBF' }} />}
                />
              </Tooltip>
            ) : (
              <Popconfirm
                title="Xóa danh mục"
                description={'Bạn có chắc chắn muốn xóa danh mục "' + record.name + '"?'}
                onConfirm={() => handleDelete(record)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Xóa danh mục">
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
            placeholder="Tìm theo mã hoặc tên..."
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
            <Select.Option value="ALL">Tất cả trạng thái</Select.Option>
            <Select.Option value="ACTIVE">Hoạt động</Select.Option>
            <Select.Option value="INACTIVE">Tạm dừng</Select.Option>
          </Select>

          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            Làm mới
          </Button>
        </Space>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenCreate}
          style={{ background: '#2E7D5B', borderColor: '#2E7D5B' }}
        >
          Thêm danh mục
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
            showTotal: total => 'Tổng cộng ' + total + ' danh mục',
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
