import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Table,
  Input,
  Button,
  Space,
  Popconfirm,
  message,
  Tooltip,
  Card,
  Row,
  Col,
  Tag,
  Typography,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  NodeIndexOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { Category } from '@/types/category'
import { categoryService } from '@/services/category/categoryService'
import { CategoryModal } from './CategoryModal'
import { extractErrorMessage } from '@/utils/error'

const { Text } = Typography

const LEVEL_COLOR_MAP: Record<string, string> = {
  category: 'blue',
  brand: 'purple',
  model: 'cyan',
  variant: 'green',
  year: 'orange',
  submodel: 'magenta',
}

const LEVEL_VIETNAMESE_MAP: Record<string, string> = {
  category: 'Cấp 1 - Loại sản phẩm',
  brand: 'Cấp 2 - Hãng xe',
  model: 'Cấp 3 - Dòng xe',
  variant: 'Cấp 4 - Phiên bản',
  year: 'Cấp 5 - Năm sản xuất',
  submodel: 'Cấp 6 - Chi tiết / Kiểu dáng',
}

export const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([])

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [defaultParentId, setDefaultParentId] = useState<number | null>(null)

  // Fetch all categories
  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const data = await categoryService.getCategories()
      setCategories(data)
      // Auto-expand root categories by default
      const rootKeys = data.map(c => c.id)
      setExpandedRowKeys(rootKeys)
    } catch (err: unknown) {
      message.error(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Collect all IDs in tree
  const getAllKeys = (nodes: Category[]): React.Key[] => {
    const keys: React.Key[] = []
    const traverse = (list: Category[]) => {
      for (const item of list) {
        keys.push(item.id)
        if (item.children && item.children.length > 0) {
          traverse(item.children)
        }
      }
    }
    traverse(nodes)
    return keys
  }

  const handleExpandAll = () => {
    setExpandedRowKeys(getAllKeys(categories))
  }

  const handleCollapseAll = () => {
    setExpandedRowKeys([])
  }

  // Filter tree recursively by search keyword
  const filterTree = (nodes: Category[], keyword: string): Category[] => {
    const lower = keyword.toLowerCase()
    const result: Category[] = []

    for (const node of nodes) {
      const matchesCurrent =
        node.label.toLowerCase().includes(lower) ||
        node.value.toLowerCase().includes(lower) ||
        node.level.toLowerCase().includes(lower)

      const matchingChildren =
        node.children && node.children.length > 0 ? filterTree(node.children, keyword) : []

      if (matchesCurrent || matchingChildren.length > 0) {
        result.push({
          ...node,
          children: matchingChildren.length > 0 ? matchingChildren : node.children,
        })
      }
    }

    return result
  }

  const filteredData = useMemo(() => {
    if (!searchKeyword.trim()) return categories
    return filterTree(categories, searchKeyword.trim())
  }, [categories, searchKeyword])

  // Handlers for modal
  const handleOpenCreateRoot = () => {
    setSelectedCategory(null)
    setDefaultParentId(null)
    setModalOpen(true)
  }

  const handleOpenAddChild = (parent: Category) => {
    setSelectedCategory(null)
    setDefaultParentId(parent.id)
    setModalOpen(true)
  }

  const handleOpenEdit = (category: Category) => {
    setSelectedCategory(category)
    setDefaultParentId(category.parentId || null)
    setModalOpen(true)
  }

  const handleDelete = async (category: Category) => {
    try {
      await categoryService.deleteCategory(category.id)
      message.success(`Đã xóa danh mục "${category.label}"`)
      fetchCategories()
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err)
      if (errorMsg.includes('CATEGORY_HAS_CHILDREN')) {
        message.error('Không thể xóa Category vì vẫn còn Category con.')
      } else if (errorMsg.includes('CATEGORY_IN_USE')) {
        message.error('Không thể xóa Category vì đang được sử dụng bởi SVG.')
      } else {
        message.error(errorMsg)
      }
    }
  }

  const columns: ColumnsType<Category> = [
    {
      title: 'Tên danh mục (Label)',
      dataIndex: 'label',
      key: 'label',
      width: '35%',
      render: (label: string, record: Category) => (
        <Space>
          <span style={{ fontWeight: 600 }}>{label}</span>
          {record.children && record.children.length > 0 && (
            <Tag style={{ fontSize: 11, borderRadius: 10 }}>
              {record.children.length} cấp con
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Mã / Giá trị (Value)',
      dataIndex: 'value',
      key: 'value',
      width: '20%',
      render: (value: string) => <Text code>{value}</Text>,
    },
    {
      title: 'Cấp bậc (Level)',
      dataIndex: 'level',
      key: 'level',
      width: '20%',
      render: (level: string) => (
        <Tooltip title={LEVEL_VIETNAMESE_MAP[level] || level}>
          <Tag color={LEVEL_COLOR_MAP[level] || 'default'} style={{ fontWeight: 500 }}>
            {level.toUpperCase()}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Thứ tự',
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      width: '10%',
      align: 'center',
      render: (order: number) => order ?? 0,
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: '15%',
      align: 'right',
      render: (_: unknown, record: Category) => {
        const isMaxDepth = record.level === 'submodel'
        return (
          <Space size="small">
            <Tooltip title={isMaxDepth ? 'Đã đạt cấp sâu nhất (submodel)' : 'Thêm danh mục con'}>
              <Button
                type="text"
                size="small"
                icon={<NodeIndexOutlined />}
                disabled={isMaxDepth}
                onClick={() => handleOpenAddChild(record)}
                style={{ color: isMaxDepth ? undefined : '#52c41a' }}
              />
            </Tooltip>

            <Tooltip title="Chỉnh sửa">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleOpenEdit(record)}
              />
            </Tooltip>

            <Tooltip title="Xóa danh mục">
              <Popconfirm
                title="Xóa danh mục"
                description={`Bạn có chắc muốn xóa danh mục "${record.label}"?`}
                onConfirm={() => handleDelete(record)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          </Space>
        )
      },
    },
  ]

  return (
    <Card style={{ marginTop: 16 }}>
      {/* Search and Action Bar */}
      <Row gutter={[16, 16]} justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Tìm theo tên hoặc mã danh mục..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            allowClear
          />
        </Col>

        <Col xs={24} sm={12} md={16} style={{ textAlign: 'right' }}>
          <Space wrap>
            <Button onClick={handleExpandAll}>Mở rộng tất cả</Button>
            <Button onClick={handleCollapseAll}>Thu gọn tất cả</Button>
            <Button icon={<ReloadOutlined />} onClick={fetchCategories} loading={loading}>
              Làm mới
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateRoot}>
              + Tạo danh mục gốc
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Category Tree Table */}
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        loading={loading}
        pagination={false}
        expandable={{
          expandedRowKeys,
          onExpandedRowsChange: keys => setExpandedRowKeys(keys as React.Key[]),
        }}
        bordered
        size="middle"
      />

      {/* Create / Edit Modal */}
      {modalOpen && (
        <CategoryModal
          open={modalOpen}
          category={selectedCategory}
          defaultParentId={defaultParentId}
          categoriesTree={categories}
          onClose={() => setModalOpen(false)}
          onSuccess={fetchCategories}
        />
      )}
    </Card>
  )
}
