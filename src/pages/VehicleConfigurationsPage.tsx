import React, { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ClearOutlined,
} from '@ant-design/icons'
import {
  Table,
  Button,
  Input,
  Select,
  InputNumber,
  Space,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  VehicleConfiguration,
  ProductGroup,
  CarBrand,
  CarModel,
} from '@/types/vehicleConfiguration'
import { vehicleConfigurationService } from '@/services/vehicle/vehicleConfigurationService'
import { VehicleConfigurationModal } from '@/features/vehicle-configurations/VehicleConfigurationModal'
import { PRODUCT_GROUPS, PRODUCT_GROUP_MAP } from '@/constants/vehicle'
import { extractErrorMessage } from '@/utils/error'

export const VehicleConfigurationsPage: React.FC = () => {
  const [configurations, setConfigurations] = useState<VehicleConfiguration[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(15)
  const [totalElements, setTotalElements] = useState(0)

  // Filters
  const [selectedGroup, setSelectedGroup] = useState<ProductGroup | 'ALL'>('ALL')
  const [selectedBrandId, setSelectedBrandId] = useState<number | undefined>(undefined)
  const [selectedModelId, setSelectedModelId] = useState<number | undefined>(undefined)
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined)
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined)
  const [searchKeyword, setSearchKeyword] = useState('')

  // Reference data for filters
  const [brands, setBrands] = useState<CarBrand[]>([])
  const [filterModels, setFilterModels] = useState<CarModel[]>([])

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState<VehicleConfiguration | null>(null)

  // Load brands on mount
  useEffect(() => {
    vehicleConfigurationService
      .getBrands()
      .then(setBrands)
      .catch(err => console.error('Failed to load brands for filter:', err))
  }, [])

  // Load models when filter brand changes
  useEffect(() => {
    if (selectedBrandId) {
      vehicleConfigurationService
        .getModels(selectedBrandId)
        .then(setFilterModels)
        .catch(err => console.error('Failed to load models for filter:', err))
    } else {
      setFilterModels([])
      setSelectedModelId(undefined)
    }
  }, [selectedBrandId])

  // Fetch configurations
  const fetchConfigurations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await vehicleConfigurationService.getConfigurations({
        productGroup: selectedGroup === 'ALL' ? undefined : selectedGroup,
        brandId: selectedBrandId,
        modelId: selectedModelId,
        year: selectedYear,
        status: selectedStatus,
        search: searchKeyword.trim() || undefined,
        page,
        size: pageSize,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      })
      setConfigurations(res.content)
      setTotalElements(res.totalElements)
    } catch (err: unknown) {
      message.error(`Không thể tải dữ liệu: ${extractErrorMessage(err)}`)
    } finally {
      setLoading(false)
    }
  }, [
    selectedGroup,
    selectedBrandId,
    selectedModelId,
    selectedYear,
    selectedStatus,
    searchKeyword,
    page,
    pageSize,
  ])

  useEffect(() => {
    fetchConfigurations()
  }, [fetchConfigurations])

  const handleResetFilters = () => {
    setSelectedGroup('ALL')
    setSelectedBrandId(undefined)
    setSelectedModelId(undefined)
    setSelectedYear(undefined)
    setSelectedStatus(undefined)
    setSearchKeyword('')
    setPage(0)
  }

  const handleDelete = async (id: number) => {
    try {
      await vehicleConfigurationService.deleteConfiguration(id)
      message.success('Đã xóa cấu hình xe')
      fetchConfigurations()
    } catch (err: unknown) {
      message.error(extractErrorMessage(err))
    }
  }

  const columns: ColumnsType<VehicleConfiguration> = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => (
        <span style={{ color: '#8A8983', fontSize: 12 }}>
          {page * pageSize + index + 1}
        </span>
      ),
    },
    {
      title: 'Nhóm sản phẩm',
      dataIndex: 'productGroup',
      key: 'productGroup',
      width: 150,
      render: (group: ProductGroup) => {
        const info = PRODUCT_GROUP_MAP[group] || {
          label: group,
          color: '#4B5563',
          bg: '#F3F4F6',
          border: '#E5E7EB',
        }
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '3px 10px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              color: info.color,
              backgroundColor: info.bg,
              border: `1px solid ${info.border}`,
            }}
          >
            {info.label}
          </span>
        )
      },
    },
    {
      title: 'Hãng xe',
      dataIndex: 'brand',
      key: 'brand',
      width: 140,
      render: brand => (
        <div>
          <div style={{ fontWeight: 600, color: '#1B1B19' }}>{brand?.name}</div>
          <div style={{ fontSize: 11, color: '#8A8983', fontFamily: 'monospace' }}>
            {brand?.code}
          </div>
        </div>
      ),
    },
    {
      title: 'Dòng xe',
      dataIndex: 'model',
      key: 'model',
      width: 140,
      render: model => (
        <div>
          <div style={{ fontWeight: 600, color: '#1B1B19' }}>{model?.name}</div>
          <div style={{ fontSize: 11, color: '#8A8983', fontFamily: 'monospace' }}>
            {model?.code}
          </div>
        </div>
      ),
    },
    {
      title: 'Năm sản xuất',
      key: 'years',
      width: 130,
      render: (_, record) => (
        <span
          style={{
            fontWeight: 500,
            fontSize: 13,
            color: '#262624',
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          {record.yearFrom} – {record.yearTo}
        </span>
      ),
    },
    {
      title: 'Mã khung / Mã đời',
      dataIndex: 'generationCode',
      key: 'generationCode',
      width: 170,
      render: code => (
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 600,
            fontSize: 12.5,
            padding: '2px 8px',
            background: '#F1F0EC',
            borderRadius: 4,
            color: '#1B1B19',
            border: '1px solid #E4E3DE',
          }}
        >
          {code}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const isActive = status === 'ACTIVE'
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 500,
              color: isActive ? '#2E7D5B' : '#73726C',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: isActive ? '#2E7D5B' : '#A3A29C',
              }}
            />
            {isActive ? 'Hoạt động' : 'Tạm ngưng'}
          </span>
        )
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 110,
      align: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined style={{ color: '#7C3AED' }} />}
            onClick={() => {
              setSelectedConfig(record)
              setModalOpen(true)
            }}
            title="Chỉnh sửa"
          />
          <Popconfirm
            title="Xóa cấu hình xe?"
            description="Bạn có chắc chắn muốn xóa cấu hình xe này không?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              title="Xóa"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      {/* Header */}
      <PageHeader
        title="Quản lý Cấu hình Xe"
        subtitle="Quản lý và thiết lập cấu hình xe cho 3 nhóm sản phẩm: Ngoại thất (PPF Exterior), Nội thất (PPF Interior) và Window Film"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => {
              setSelectedConfig(null)
              setModalOpen(true)
            }}
            style={{
              background: '#7C3AED',
              borderColor: '#7C3AED',
              fontWeight: 500,
              boxShadow: '0 2px 4px rgba(124, 58, 237, 0.2)',
            }}
          >
            Thêm cấu hình xe
          </Button>
        }
      />

      <div style={{ padding: '24px 32px' }}>
        {/* Tabs Nhóm sản phẩm */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 16,
            background: '#ECEAE4',
            padding: 4,
            borderRadius: 8,
            width: 'fit-content',
          }}
        >
          <button
            onClick={() => {
              setSelectedGroup('ALL')
              setPage(0)
            }}
            style={{
              border: 0,
              padding: '6px 16px',
              borderRadius: 6,
              background: selectedGroup === 'ALL' ? '#FFFFFF' : 'transparent',
              color: selectedGroup === 'ALL' ? '#1B1B19' : '#5E5D57',
              fontWeight: selectedGroup === 'ALL' ? 600 : 500,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: selectedGroup === 'ALL' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Tất cả nhóm
          </button>

          {PRODUCT_GROUPS.map(g => {
            const isSelected = selectedGroup === g.value
            return (
              <button
                key={g.value}
                onClick={() => {
                  setSelectedGroup(g.value)
                  setPage(0)
                }}
                style={{
                  border: 0,
                  padding: '6px 16px',
                  borderRadius: 6,
                  background: isSelected ? '#FFFFFF' : 'transparent',
                  color: isSelected ? g.color : '#5E5D57',
                  fontWeight: isSelected ? 600 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: g.color,
                  }}
                />
                {g.label}
              </button>
            )
          })}
        </div>

        {/* Filter Card */}
        <Card
          style={{
            marginBottom: 16,
            background: '#FFFFFF',
            borderRadius: 8,
            border: '1px solid #E4E3DE',
          }}
          bodyStyle={{ padding: '14px 18px' }}
        >
          <Row gutter={[12, 12]} align="middle">
            {/* Hãng xe */}
            <Col xs={24} sm={12} md={5}>
              <Select
                allowClear
                placeholder="Chọn hãng xe"
                style={{ width: '100%' }}
                value={selectedBrandId}
                onChange={val => {
                  setSelectedBrandId(val)
                  setSelectedModelId(undefined)
                  setPage(0)
                }}
                showSearch
                optionFilterProp="label"
                options={brands.map(b => ({
                  value: b.id,
                  label: b.name,
                }))}
              />
            </Col>

            {/* Dòng xe */}
            <Col xs={24} sm={12} md={5}>
              <Select
                allowClear
                placeholder={selectedBrandId ? 'Chọn dòng xe' : 'Chọn hãng xe trước'}
                disabled={!selectedBrandId}
                style={{ width: '100%' }}
                value={selectedModelId}
                onChange={val => {
                  setSelectedModelId(val)
                  setPage(0)
                }}
                showSearch
                optionFilterProp="label"
                options={filterModels.map(m => ({
                  value: m.id,
                  label: m.name,
                }))}
              />
            </Col>

            {/* Năm */}
            <Col xs={12} sm={6} md={3}>
              <InputNumber
                placeholder="Năm SX"
                style={{ width: '100%' }}
                value={selectedYear}
                onChange={val => {
                  setSelectedYear(val ?? undefined)
                  setPage(0)
                }}
                min={1980}
                max={2040}
              />
            </Col>

            {/* Trạng thái */}
            <Col xs={12} sm={6} md={3}>
              <Select
                allowClear
                placeholder="Trạng thái"
                style={{ width: '100%' }}
                value={selectedStatus}
                onChange={val => {
                  setSelectedStatus(val)
                  setPage(0)
                }}
                options={[
                  { value: 'ACTIVE', label: 'Hoạt động' },
                  { value: 'INACTIVE', label: 'Tạm ngưng' },
                ]}
              />
            </Col>

            {/* Tìm kiếm từ khóa */}
            <Col xs={24} sm={12} md={5}>
              <Input
                placeholder="Tìm theo mã đời, hãng, dòng..."
                prefix={<SearchOutlined style={{ color: '#8A8983' }} />}
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                onPressEnter={() => {
                  setPage(0)
                  fetchConfigurations()
                }}
                allowClear
              />
            </Col>

            {/* Nút lọc & Làm mới */}
            <Col xs={24} sm={12} md={3} style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <Button
                icon={<SearchOutlined />}
                onClick={() => {
                  setPage(0)
                  fetchConfigurations()
                }}
              >
                Lọc
              </Button>
              <Button
                icon={<ClearOutlined />}
                onClick={handleResetFilters}
                title="Đặt lại bộ lọc"
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchConfigurations}
                title="Tải lại"
              />
            </Col>
          </Row>
        </Card>

        {/* Table */}
        <Card
          style={{
            background: '#FFFFFF',
            borderRadius: 8,
            border: '1px solid #E4E3DE',
          }}
          bodyStyle={{ padding: 0 }}
        >
          <Table
            rowKey="id"
            columns={columns}
            dataSource={configurations}
            loading={loading}
            pagination={{
              current: page + 1,
              pageSize,
              total: totalElements,
              showSizeChanger: true,
              pageSizeOptions: ['10', '15', '20', '50'],
              showTotal: (total, range) => (
                <span style={{ fontSize: 13, color: '#5E5D57' }}>
                  Hiển thị {range[0]} - {range[1]} trong tổng số <strong>{total}</strong> cấu hình
                </span>
              ),
              onChange: (p, size) => {
                setPage(p - 1)
                setPageSize(size)
              },
            }}
          />
        </Card>

        {/* Modal Thêm / Sửa */}
        <VehicleConfigurationModal
          open={modalOpen}
          configuration={selectedConfig}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false)
            fetchConfigurations()
          }}
        />
      </div>
    </div>
  )
}
