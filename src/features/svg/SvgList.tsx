import React, { useState, useEffect, useCallback } from 'react'
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
  Cascader,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  UploadOutlined,
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  FileImageOutlined,
  FolderOutlined,
} from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { SvgFile, SvgFilterParams } from '@/types/svg'
import { Category } from '@/types/category'
import { svgService } from '@/services/svg/svgService'
import { categoryService } from '@/services/category/categoryService'
import { formatBytes, formatDateTime, truncateString } from '@/utils/formatters'
import { RoleTag } from '@/components/common/RoleTag'
import { SvgUploadModal } from './SvgUploadModal'
import { SvgPreviewModal } from './SvgPreviewModal'
import { SvgDetailDrawer } from './SvgDetailDrawer'
import { useAuthStore } from '@/stores/authStore'
import { extractErrorMessage } from '@/utils/error'

interface CascaderOption {
  value: number
  label: string
  children?: CascaderOption[]
}

const mapCategoryToCascader = (cat: Category): CascaderOption => ({
  value: cat.id,
  label: `${cat.label} (${cat.level})`,
  children: cat.children && cat.children.length > 0 ? cat.children.map(mapCategoryToCascader) : undefined,
})

export const SvgList: React.FC = () => {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'

  // Data state
  const [data, setData] = useState<SvgFile[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)

  // Categories for filter
  const [categoryOptions, setCategoryOptions] = useState<CascaderOption[]>([])
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<number | undefined>(undefined)

  // Filter & Pagination state
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC')

  // Modals / Drawer state
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [selectedSvg, setSelectedSvg] = useState<SvgFile | null>(null)

  useEffect(() => {
    categoryService.getCategories().then(cats => {
      setCategoryOptions(cats.map(mapCategoryToCascader))
    }).catch(() => {
      // Ignore category load error on list filter
    })
  }, [])

  const fetchSvgFiles = useCallback(async () => {
    setLoading(true)
    try {
      const params: SvgFilterParams = {
        page,
        size: pageSize,
        sortBy,
        sortDirection,
      }
      if (keyword.trim()) {
        params.keyword = keyword.trim()
      }
      if (selectedFilterCategory) {
        params.categoryId = selectedFilterCategory
      }

      const res = await svgService.getSvgFiles(params)
      setData(res.content || [])
      setTotalElements(res.totalElements || 0)
    } catch (err) {
      message.error(extractErrorMessage(err, 'Failed to fetch SVG files'))
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, keyword, selectedFilterCategory, sortBy, sortDirection])

  useEffect(() => {
    fetchSvgFiles()
  }, [fetchSvgFiles])

  const handleSearch = () => {
    setPage(0)
    setKeyword(searchInput)
  }

  const handleResetSearch = () => {
    setSearchInput('')
    setKeyword('')
    setSelectedFilterCategory(undefined)
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

  const handlePreview = (record: SvgFile) => {
    setSelectedSvg(record)
    setPreviewModalOpen(true)
  }

  const handleDetail = (record: SvgFile) => {
    setSelectedSvg(record)
    setDetailDrawerOpen(true)
  }

  const handleDownload = (record: SvgFile) => {
    svgService.downloadSvg(record.id, record.originalFilename)
  }

  const handleDelete = async (record: SvgFile) => {
    try {
      await svgService.deleteSvg(record.id)
      message.success(`SVG "${record.originalFilename}" deleted successfully`)
      fetchSvgFiles()
    } catch (err) {
      message.error(extractErrorMessage(err, 'Failed to delete SVG file'))
    }
  }

  const columns: ColumnsType<SvgFile> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      sorter: true,
    },
    {
      title: 'Filename',
      dataIndex: 'originalFilename',
      key: 'originalFilename',
      sorter: true,
      render: (text: string, record: SvgFile) => (
        <Space size="small">
          <FileImageOutlined style={{ color: '#1890ff', fontSize: 16 }} />
          <Button
            type="link"
            style={{ padding: 0, fontWeight: 500 }}
            onClick={() => handleDetail(record)}
          >
            {truncateString(text, 36)}
          </Button>
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 200,
      render: (cat: SvgFile['category']) =>
        cat ? (
          <Tooltip title={cat.fullPath}>
            <Space size="small">
              <FolderOutlined style={{ color: '#1890ff' }} />
              <span>{cat.name}</span>
              <Tag color="geekblue">{cat.level}</Tag>
            </Space>
          </Tooltip>
        ) : (
          '-'
        ),
    },
    {
      title: 'Size',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 100,
      sorter: true,
      render: (bytes: number) => formatBytes(bytes),
    },
    {
      title: 'Uploaded By',
      dataIndex: 'uploadedBy',
      key: 'uploadedBy',
      width: 170,
      render: (uploader: SvgFile['uploadedBy']) =>
        uploader ? (
          <Space size="small">
            <span>{uploader.username}</span>
            <RoleTag role={uploader.role} />
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: 'Uploaded At',
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
      render: (_: unknown, record: SvgFile) => (
        <Space size="small">
          <Tooltip title="Preview SVG">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          <Tooltip title="Download SVG">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
            />
          </Tooltip>
          <Tooltip title="Details">
            <Button
              type="text"
              icon={<InfoCircleOutlined />}
              onClick={() => handleDetail(record)}
            />
          </Tooltip>
          {isAdmin && (
            <Tooltip title="Delete">
              <Popconfirm
                title="Delete SVG File"
                description={`Are you sure you want to delete "${record.originalFilename}"?`}
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
      ),
    },
  ]

  return (
    <div>
      <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: 16 }}>
        <Row gutter={[16, 16]} justify="space-between" align="middle">
          <Col xs={24} md={16}>
            <Space wrap>
              <Input
                placeholder="Search by filename..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                allowClear
                style={{ width: 220 }}
              />
              <Cascader
                options={categoryOptions}
                placeholder="Filter by Category"
                changeOnSelect
                allowClear
                onChange={value => {
                  if (value && value.length > 0) {
                    setSelectedFilterCategory(value[value.length - 1] as number)
                  } else {
                    setSelectedFilterCategory(undefined)
                  }
                  setPage(0)
                }}
                style={{ width: 240 }}
              />
              <Button type="primary" onClick={handleSearch}>
                Search
              </Button>
              {(keyword || selectedFilterCategory) && (
                <Button onClick={handleResetSearch}>Reset</Button>
              )}
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchSvgFiles} loading={loading}>
                Refresh
              </Button>
              {isAdmin && (
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={() => setUploadModalOpen(true)}
                >
                  Upload SVG
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      <Table<SvgFile>
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page + 1,
          pageSize,
          total: totalElements,
          showSizeChanger: true,
          showTotal: total => `Total ${total} SVG files`,
        }}
        onChange={handleTableChange}
        bordered
        size="middle"
      />

      <SvgUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={fetchSvgFiles}
      />

      <SvgPreviewModal
        svg={selectedSvg}
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
      />

      <SvgDetailDrawer
        svg={selectedSvg}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        onDeleteSuccess={fetchSvgFiles}
      />
    </div>
  )
}
