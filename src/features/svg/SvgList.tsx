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
  Tag,
  Select,
  Segmented,
  Empty,
  Pagination,
  Spin,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  UploadOutlined,
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  SettingOutlined,
  TeamOutlined,
  LockOutlined,
  AppstoreOutlined,
  BarsOutlined,
  ClearOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { SvgFile, SvgFilterParams } from '@/types/svg'
import { svgService } from '@/services/svg/svgService'
import { vehicleConfigurationService } from '@/services/vehicle/vehicleConfigurationService'
import { dealerService } from '@/services/dealers/dealerService'
import { CarBrand, CarModel } from '@/types/vehicleConfiguration'
import { Dealer } from '@/types/dealer'
import { formatBytes, formatDateTime, truncateString } from '@/utils/formatters'
import { SvgThumbnail } from '@/components/svg/SvgThumbnail'
import { SvgUploadModal } from './SvgUploadModal'
import { SvgPreviewModal } from './SvgPreviewModal'
import { SvgDetailDrawer } from './SvgDetailDrawer'
import { useAuthStore } from '@/stores/authStore'
import { extractErrorMessage } from '@/utils/error'

export const PRODUCT_GROUPS = [
  { value: 'ALL', label: 'Tất cả nhóm' },
  { value: 'PPF_EXTERIOR', label: 'Ngoại thất (PPF Exterior)' },
  { value: 'PPF_INTERIOR', label: 'Nội thất (PPF Interior)' },
  { value: 'WINDOW_FILM', label: 'Phim cách nhiệt (Window Film)' },
]

export const SvgList: React.FC = () => {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'

  // View Mode: Table vs Grid
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // Data state
  const [data, setData] = useState<SvgFile[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)

  // Filters state
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedProductGroup, setSelectedProductGroup] = useState<string>('ALL')
  const [selectedBrandId, setSelectedBrandId] = useState<number | undefined>(undefined)
  const [selectedModelId, setSelectedModelId] = useState<number | undefined>(undefined)
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined)
  const [selectedDealerId, setSelectedDealerId] = useState<number | undefined>(undefined)

  // Filter options data
  const [brands, setBrands] = useState<CarBrand[]>([])
  const [models, setModels] = useState<CarModel[]>([])
  const [dealers, setDealers] = useState<Dealer[]>([])

  // Pagination state
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(12)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC')

  // Modals / Drawer state
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [selectedSvg, setSelectedSvg] = useState<SvgFile | null>(null)

  // Initial load of filter dictionaries
  useEffect(() => {
    vehicleConfigurationService.getBrands('ACTIVE').then(setBrands).catch(() => {})
    if (isAdmin) {
      dealerService.getAllDealers().then(setDealers).catch(() => {})
    }
  }, [isAdmin])

  // Load models when brand changes
  useEffect(() => {
    if (selectedBrandId) {
      vehicleConfigurationService.getModels(selectedBrandId, 'ACTIVE').then(setModels).catch(() => {})
    } else {
      setModels([])
      setSelectedModelId(undefined)
    }
  }, [selectedBrandId])

  const fetchSvgFiles = useCallback(async () => {
    setLoading(true)
    try {
      const params: SvgFilterParams = {
        page,
        size: pageSize,
        sortBy,
        sortDirection,
      }
      if (keyword.trim()) params.keyword = keyword.trim()
      if (selectedProductGroup && selectedProductGroup !== 'ALL') {
        params.productGroup = selectedProductGroup
      }
      if (selectedBrandId) params.brandId = selectedBrandId
      if (selectedModelId) params.modelId = selectedModelId
      if (selectedYear) params.year = selectedYear
      if (isAdmin && selectedDealerId) params.dealerId = selectedDealerId

      const res = await svgService.getSvgFiles(params)
      setData(res.content || [])
      setTotalElements(res.totalElements || 0)
    } catch (err) {
      message.error(extractErrorMessage(err, 'Lỗi khi tải danh sách file SVG'))
    } finally {
      setLoading(false)
    }
  }, [
    page,
    pageSize,
    keyword,
    selectedProductGroup,
    selectedBrandId,
    selectedModelId,
    selectedYear,
    selectedDealerId,
    isAdmin,
    sortBy,
    sortDirection,
  ])

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
    setSelectedProductGroup('ALL')
    setSelectedBrandId(undefined)
    setSelectedModelId(undefined)
    setSelectedYear(undefined)
    setSelectedDealerId(undefined)
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
    if (!isAdmin && !record.canDownload) {
      message.warning('Đại lý của bạn không có quyền tải file này')
      return
    }
    svgService.downloadSvg(record.id, record.originalFilename)
  }

  const handleDelete = async (record: SvgFile) => {
    try {
      await svgService.deleteSvg(record.id)
      message.success(`Đã xóa file "${record.originalFilename}"`)
      fetchSvgFiles()
    } catch (err) {
      message.error(extractErrorMessage(err, 'Xóa file SVG thất bại'))
    }
  }

  // Active filter badge count
  const hasActiveFilters = Boolean(
    keyword ||
    selectedProductGroup !== 'ALL' ||
    selectedBrandId ||
    selectedModelId ||
    selectedYear ||
    selectedDealerId
  )

  const renderProductGroupTag = (group?: string) => {
    switch (group) {
      case 'PPF_EXTERIOR':
        return <Tag color="blue" style={{ margin: 0 }}>Ngoại thất</Tag>
      case 'PPF_INTERIOR':
        return <Tag color="purple" style={{ margin: 0 }}>Nội thất</Tag>
      case 'WINDOW_FILM':
        return <Tag color="orange" style={{ margin: 0 }}>Phim cách nhiệt</Tag>
      default:
        return null
    }
  }

  const columns: ColumnsType<SvgFile> = [
    {
      title: 'Mẫu',
      key: 'thumbnail',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <SvgThumbnail
          svgId={record.id}
          size={40}
          onClick={() => handlePreview(record)}
        />
      ),
    },
    {
      title: 'Tên file SVG',
      dataIndex: 'originalFilename',
      key: 'originalFilename',
      sorter: true,
      render: (text: string, record: SvgFile) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Button
            type="link"
            style={{
              padding: 0,
              fontWeight: 600,
              textAlign: 'left',
              height: 'auto',
              color: '#1B1B19',
              fontSize: 13.5,
            }}
            onClick={() => handleDetail(record)}
          >
            {truncateString(text, 36)}
          </Button>
          <span style={{ fontSize: 11, color: '#8A8983', fontFamily: 'monospace' }}>
            ID: #{record.id}
          </span>
        </div>
      ),
    },
    {
      title: 'Cấu hình xe áp dụng',
      dataIndex: 'vehicleConfigurations',
      key: 'vehicleConfigurations',
      render: (configs: SvgFile['vehicleConfigurations']) => {
        if (!configs || configs.length === 0) {
          return (
            <Tag
              style={{
                background: '#F0EFEA',
                borderColor: '#D8D7D2',
                color: '#6E6D68',
                borderRadius: 4,
              }}
            >
              File dùng chung
            </Tag>
          )
        }
        return (
          <Space wrap size={[4, 6]}>
            {configs.slice(0, 2).map(c => (
              <span
                key={c.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: '#F4F3EF',
                  border: '1px solid #E4E3DE',
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontSize: 12,
                }}
              >
                {renderProductGroupTag(c.productGroup)}
                <span style={{ fontWeight: 500 }}>
                  {c.brandName} {c.modelName} ({c.yearFrom}-{c.yearTo})
                </span>
                {c.generationCode && (
                  <span style={{ color: '#8A8983', fontSize: 11 }}>[{c.generationCode}]</span>
                )}
              </span>
            ))}
            {configs.length > 2 && (
              <Tooltip title={configs.map(c => c.fullName).join(', ')}>
                <Tag color="cyan">+{configs.length - 2} xe khác</Tag>
              </Tooltip>
            )}
          </Space>
        )
      },
    },
    {
      title: 'Quyền Đại lý',
      key: 'dealerPermissions',
      width: 170,
      render: (_: unknown, record: SvgFile) => {
        if (isAdmin) {
          return (
            <Button
              type="text"
              size="small"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: record.dealerPermissionCount > 0 ? '#EBF5EE' : '#FAF9F5',
                color: record.dealerPermissionCount > 0 ? '#2E7D5B' : '#8A8983',
                border: '1px solid',
                borderColor: record.dealerPermissionCount > 0 ? '#BCE2C9' : '#E4E3DE',
                borderRadius: 4,
                padding: '2px 8px',
                fontWeight: 500,
                fontSize: 12,
              }}
              onClick={() => handleDetail(record)}
            >
              <TeamOutlined />
              <span>
                {record.dealerPermissionCount > 0
                  ? `${record.dealerPermissionCount} đại lý`
                  : 'Chưa gán (Chỉ Admin)'}
              </span>
            </Button>
          )
        }
        // User View
        return (
          <Space wrap size={[0, 4]}>
            {record.canView && (
              <Tag color="green" icon={<CheckCircleOutlined />}>
                Xem
              </Tag>
            )}
            {record.canDownload ? (
              <Tag color="blue">Tải xuống</Tag>
            ) : (
              <Tag color="orange" icon={<LockOutlined />}>
                Chỉ xem
              </Tag>
            )}
          </Space>
        )
      },
    },
    {
      title: 'Dung lượng',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 90,
      sorter: true,
      render: (bytes: number) => (
        <span style={{ fontSize: 12, color: '#6E6D68' }}>{formatBytes(bytes)}</span>
      ),
    },
    {
      title: 'Ngày nạp',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 135,
      sorter: true,
      render: (dateStr: string) => (
        <span style={{ fontSize: 12, color: '#6E6D68' }}>{formatDateTime(dateStr)}</span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 130,
      align: 'center',
      render: (_: unknown, record: SvgFile) => (
        <Space size={2}>
          <Tooltip title="Xem nhanh SVG">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ fontSize: 15 }} />}
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          {isAdmin || record.canDownload ? (
            <Tooltip title="Tải file về máy">
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined style={{ fontSize: 15, color: '#1677ff' }} />}
                onClick={() => handleDownload(record)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Đại lý không có quyền tải file này">
              <Button type="text" size="small" disabled icon={<LockOutlined />} />
            </Tooltip>
          )}
          <Tooltip title={isAdmin ? 'Chi tiết & Phân quyền' : 'Xem thông tin'}>
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined style={{ fontSize: 15 }} />}
              onClick={() => handleDetail(record)}
            />
          </Tooltip>
          {isAdmin && (
            <Tooltip title="Xóa file">
              <Popconfirm
                title="Xóa File SVG"
                description={`Bạn có chắc muốn xóa file "${record.originalFilename}"?`}
                onConfirm={() => handleDelete(record)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button type="text" size="small" danger icon={<DeleteOutlined style={{ fontSize: 15 }} />} />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* KPI / Quick-Filter Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        <div
          onClick={() => {
            setSelectedProductGroup('ALL')
            setPage(0)
          }}
          style={{
            padding: '12px 16px',
            background: selectedProductGroup === 'ALL' ? '#F5F3FF' : '#FBFBFA',
            border: '1px solid',
            borderColor: selectedProductGroup === 'ALL' ? '#7C3AED' : '#E4E3DE',
            borderRadius: 6,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ font: "500 12px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>
            Tất cả file SVG
          </div>
          <div style={{ marginTop: 4, font: "600 22px 'IBM Plex Mono', monospace", color: '#1B1B19' }}>
            {totalElements}
          </div>
        </div>

        <div
          onClick={() => {
            setSelectedProductGroup('PPF_EXTERIOR')
            setPage(0)
          }}
          style={{
            padding: '12px 16px',
            background: selectedProductGroup === 'PPF_EXTERIOR' ? '#EFF6FF' : '#FBFBFA',
            border: '1px solid',
            borderColor: selectedProductGroup === 'PPF_EXTERIOR' ? '#2563EB' : '#E4E3DE',
            borderRadius: 6,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ font: "500 12px 'IBM Plex Sans', sans-serif", color: '#2563EB' }}>
            Ngoại thất (PPF Exterior)
          </div>
          <div style={{ marginTop: 4, font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>
            Mẫu cắt vỏ xe & chi tiết ngoài
          </div>
        </div>

        <div
          onClick={() => {
            setSelectedProductGroup('PPF_INTERIOR')
            setPage(0)
          }}
          style={{
            padding: '12px 16px',
            background: selectedProductGroup === 'PPF_INTERIOR' ? '#FAF5FF' : '#FBFBFA',
            border: '1px solid',
            borderColor: selectedProductGroup === 'PPF_INTERIOR' ? '#9333EA' : '#E4E3DE',
            borderRadius: 6,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ font: "500 12px 'IBM Plex Sans', sans-serif", color: '#9333EA' }}>
            Nội thất (PPF Interior)
          </div>
          <div style={{ marginTop: 4, font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>
            Mẫu màn hình, tablo, tapi cửa
          </div>
        </div>

        <div
          onClick={() => {
            setSelectedProductGroup('WINDOW_FILM')
            setPage(0)
          }}
          style={{
            padding: '12px 16px',
            background: selectedProductGroup === 'WINDOW_FILM' ? '#FFFBEB' : '#FBFBFA',
            border: '1px solid',
            borderColor: selectedProductGroup === 'WINDOW_FILM' ? '#D97706' : '#E4E3DE',
            borderRadius: 6,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ font: "500 12px 'IBM Plex Sans', sans-serif", color: '#D97706' }}>
            Phim cách nhiệt (Window Film)
          </div>
          <div style={{ marginTop: 4, font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>
            Kính lái, kính sườn, kính hậu
          </div>
        </div>
      </div>

      {/* Filter and Actions Bar */}
      <Card bodyStyle={{ padding: '14px 16px' }} style={{ border: '1px solid #E4E3DE', borderRadius: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Row 1: Primary Search, Filter Selects & View Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, flex: 1 }}>
              <Input
                placeholder="Tìm theo tên file..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined style={{ color: '#8A8983' }} />}
                allowClear
                style={{ width: 220 }}
              />

              <Select
                placeholder="Nhóm sản phẩm"
                value={selectedProductGroup}
                onChange={val => {
                  setSelectedProductGroup(val)
                  setPage(0)
                }}
                options={PRODUCT_GROUPS}
                style={{ width: 200 }}
              />

              <Select
                placeholder="Hãng xe"
                allowClear
                value={selectedBrandId}
                onChange={val => {
                  setSelectedBrandId(val)
                  setSelectedModelId(undefined)
                  setPage(0)
                }}
                options={brands.map(b => ({ value: b.id, label: b.name }))}
                style={{ width: 140 }}
              />

              <Select
                placeholder="Dòng xe"
                allowClear
                disabled={!selectedBrandId}
                value={selectedModelId}
                onChange={val => {
                  setSelectedModelId(val)
                  setPage(0)
                }}
                options={models.map(m => ({ value: m.id, label: m.name }))}
                style={{ width: 140 }}
              />

              <Input
                placeholder="Năm SX"
                type="number"
                value={selectedYear || ''}
                onChange={e => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : undefined
                  setSelectedYear(val)
                  setPage(0)
                }}
                style={{ width: 95 }}
              />

              {isAdmin && (
                <Select
                  placeholder="Lọc theo Đại lý"
                  allowClear
                  value={selectedDealerId}
                  onChange={val => {
                    setSelectedDealerId(val)
                    setPage(0)
                  }}
                  options={dealers.map(d => ({ value: d.id, label: `${d.code} - ${d.name}` }))}
                  style={{ width: 180 }}
                />
              )}

              <Button type="primary" onClick={handleSearch}>
                Tìm kiếm
              </Button>

              {hasActiveFilters && (
                <Button icon={<ClearOutlined />} onClick={handleResetSearch}>
                  Đặt lại
                </Button>
              )}
            </div>

            {/* View Mode & Primary Upload Action */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Segmented
                value={viewMode}
                onChange={val => setViewMode(val as 'table' | 'grid')}
                options={[
                  { value: 'table', icon: <BarsOutlined />, label: 'Bảng' },
                  { value: 'grid', icon: <AppstoreOutlined />, label: 'Lưới mẫu' },
                ]}
              />

              <Button icon={<ReloadOutlined />} onClick={fetchSvgFiles} loading={loading}>
                Tải lại
              </Button>

              {isAdmin && (
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={() => setUploadModalOpen(true)}
                  style={{
                    background: '#1B1B19',
                    borderColor: '#1B1B19',
                    fontWeight: 500,
                  }}
                >
                  Nạp file SVG
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content: Table or Gallery Grid */}
      {viewMode === 'table' ? (
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
            showTotal: total => `Tổng cộng ${total} file SVG`,
          }}
          onChange={handleTableChange}
          bordered
          size="middle"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E4E3DE',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        />
      ) : (
        /* Gallery / Grid View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', background: '#FFFFFF', borderRadius: 8 }}>
              <Spin tip="Đang tải danh sách mẫu SVG..." />
            </div>
          ) : data.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', background: '#FFFFFF', borderRadius: 8 }}>
              <Empty description="Không tìm thấy file SVG nào phù hợp" />
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 14,
              }}
            >
              {data.map(item => {
                const canDownload = isAdmin || item.canDownload
                return (
                  <Card
                    key={item.id}
                    hoverable
                    bodyStyle={{ padding: 12 }}
                    style={{
                      border: '1px solid #E4E3DE',
                      borderRadius: 8,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Thumbnail preview */}
                    <div
                      onClick={() => handlePreview(item)}
                      style={{
                        height: 150,
                        background: '#FAF9F5',
                        borderRadius: 6,
                        border: '1px solid #F0EFEA',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        marginBottom: 10,
                        position: 'relative',
                        padding: 8,
                      }}
                    >
                      <SvgThumbnail svgId={item.id} size={110} />
                      <div
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          background: 'rgba(255,255,255,0.9)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontFamily: 'monospace',
                          color: '#6E6D68',
                        }}
                      >
                        #{item.id}
                      </div>
                    </div>

                    {/* Metadata */}
                    <Tooltip title={item.originalFilename}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: '#1B1B19',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginBottom: 6,
                        }}
                      >
                        {item.originalFilename}
                      </div>
                    </Tooltip>

                    {/* Vehicle configuration tags */}
                    <div style={{ minHeight: 26, marginBottom: 8 }}>
                      {item.vehicleConfigurations && item.vehicleConfigurations.length > 0 ? (
                        <Tag color="blue" style={{ fontSize: 11 }}>
                          {item.vehicleConfigurations[0].brandName} {item.vehicleConfigurations[0].modelName}
                          {item.vehicleConfigurations.length > 1 && ` (+${item.vehicleConfigurations.length - 1})`}
                        </Tag>
                      ) : (
                        <Tag color="default" style={{ fontSize: 11 }}>Dùng chung</Tag>
                      )}
                    </div>

                    {/* Bottom action row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: 8,
                        borderTop: '1px solid #F0EFEA',
                      }}
                    >
                      <span style={{ fontSize: 11, color: '#8A8983' }}>
                        {formatBytes(item.fileSize)}
                      </span>

                      <Space size={4}>
                        <Tooltip title="Xem trước">
                          <Button
                            type="text"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => handlePreview(item)}
                          />
                        </Tooltip>

                        {canDownload ? (
                          <Tooltip title="Tải xuống">
                            <Button
                              type="text"
                              size="small"
                              icon={<DownloadOutlined style={{ color: '#1677ff' }} />}
                              onClick={() => handleDownload(item)}
                            />
                          </Tooltip>
                        ) : (
                          <Tooltip title="Không có quyền tải">
                            <Button type="text" size="small" disabled icon={<LockOutlined />} />
                          </Tooltip>
                        )}

                        <Tooltip title="Chi tiết">
                          <Button
                            type="text"
                            size="small"
                            icon={<SettingOutlined />}
                            onClick={() => handleDetail(item)}
                          />
                        </Tooltip>
                      </Space>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Grid pagination */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 0' }}>
            <Pagination
              current={page + 1}
              pageSize={pageSize}
              total={totalElements}
              showSizeChanger
              pageSizeOptions={['12', '24', '48']}
              onChange={(p, ps) => {
                setPage(p - 1)
                setPageSize(ps)
              }}
              showTotal={total => `Tổng cộng ${total} file SVG`}
            />
          </div>
        </div>
      )}

      {/* Modals & Drawer */}
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
        onUpdateSuccess={fetchSvgFiles}
        onDeleteSuccess={fetchSvgFiles}
      />
    </div>
  )
}
