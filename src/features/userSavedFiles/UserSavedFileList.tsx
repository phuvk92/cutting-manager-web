import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Table,
  Select,
  DatePicker,
  Button,
  Space,
  Tooltip,
  Empty,
  message,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  DownloadOutlined,
  FileImageOutlined,
  ShopOutlined,
  ClearOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  UserSavedFile,
  UserSavedFileFilterParams,
  UserSavedFileListResponse,
} from '@/types/userSavedFile'
import { CatalogOption } from '@/types/category'
import { Dealer } from '@/types/dealer'
import { User } from '@/types/user'
import { VehicleNode } from '@/types/adminFile'
import { userSavedFileService } from '@/services/userSavedFile/userSavedFileService'
import { vehicleNodeService } from '@/services/admin/vehicleNodeService'
import { dealerService } from '@/services/dealers/dealerService'
import { userService } from '@/services/users/userService'
import { UserSavedFileDetailDrawer } from './UserSavedFileDetailDrawer'
import { UserSavedFilePreviewModal } from './UserSavedFilePreviewModal'
import { formatBytes, normalizeSvgFilename } from '@/utils/formatters'
import { extractErrorMessage } from '@/utils/error'

const { RangePicker } = DatePicker
const { Text } = Typography

const FONT = "'IBM Plex Sans', sans-serif"
const MONO = "'IBM Plex Mono', monospace"

/** Ảnh xem trước thu nhỏ của file SVG */
const FileThumb: React.FC<{ fileId: number; title: string; onClick?: () => void }> = ({
  fileId,
  title,
  onClick,
}) => {
  const [blob, setBlob] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    setBlob(null)
    setFailed(false)
    userSavedFileService
      .getPreviewBlobUrl(fileId)
      .then(u => {
        if (active) setBlob(u)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
  }, [fileId])

  return (
    <Tooltip title="Nhấn để xem trước bản vẽ">
      <span
        onClick={onClick}
        style={{
          width: 46,
          height: 34,
          border: '1px solid #E4E3DE',
          borderRadius: 4,
          background: '#FFFFFF',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all 0.15s ease',
        }}
      >
        {blob && !failed ? (
          <img
            src={blob}
            alt={title}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        ) : (
          <FileImageOutlined style={{ color: '#C9C8C3', fontSize: 16 }} />
        )}
      </span>
    </Tooltip>
  )
}

const getInitials = (name?: string, username?: string) => {
  const target = name || username || 'U'
  const parts = target.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return target.slice(0, 2).toUpperCase()
}

export const UserSavedFileList: React.FC = () => {
  // Data state
  const [data, setData] = useState<UserSavedFile[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)

  // Filter options
  const [categories, setCategories] = useState<CatalogOption[]>([])
  const [brandTrees, setBrandTrees] = useState<VehicleNode[]>([])
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [users, setUsers] = useState<User[]>([])

  // Filter values
  const [keyword, setKeyword] = useState<string>('')
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined)
  const [selectedBrand, setSelectedBrand] = useState<number | undefined>(undefined)
  const [selectedModel, setSelectedModel] = useState<number | undefined>(undefined)
  const [selectedDealer, setSelectedDealer] = useState<number | undefined>(undefined)
  const [selectedUser, setSelectedUser] = useState<number | undefined>(undefined)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined)

  // Modals / Drawer
  const [selectedFileForDetail, setSelectedFileForDetail] = useState<UserSavedFile | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [previewFileId, setPreviewFileId] = useState<number | null>(null)
  const [previewTitle, setPreviewTitle] = useState<string>('')
  const [previewOpen, setPreviewOpen] = useState(false)

  // Debounce search keyword
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword.trim())
      setPage(0)
    }, 350)
    return () => clearTimeout(timer)
  }, [keyword])

  // Load dropdown options once
  useEffect(() => {
    vehicleNodeService
      .getFileCategories()
      .then(setCategories)
      .catch(() => {})

    vehicleNodeService
      .getBrandTrees()
      .then(setBrandTrees)
      .catch(() => {})

    dealerService
      .getAllDealers()
      .then(setDealers)
      .catch(() => {})

    userService
      .getUsers({ size: 100 })
      .then(res => setUsers(res.content || []))
      .catch(() => {})
  }, [])

  // Model options cascading from selected brand
  const modelOptions = useMemo(() => {
    if (!selectedBrand) return []
    const brand = brandTrees.find(b => b.id === selectedBrand)
    if (!brand || !brand.children) return []

    const list: { id: number; name: string }[] = []
    brand.children.forEach(series => {
      list.push({ id: series.id, name: series.name })
      if (series.children) {
        series.children.forEach(model => {
          list.push({ id: model.id, name: `${series.name} - ${model.name}` })
        })
      }
    })
    return list
  }, [selectedBrand, brandTrees])

  // Fetch list from backend
  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const params: UserSavedFileFilterParams = {
        page,
        size: pageSize,
        keyword: debouncedKeyword || undefined,
        categoryId: selectedCategory,
        brandId: selectedBrand,
        modelId: selectedModel,
        dealerId: selectedDealer,
        userId: selectedUser,
        status: selectedStatus,
        createdFrom: dateRange?.[0] ? dateRange[0].startOf('day').toISOString() : undefined,
        createdTo: dateRange?.[1] ? dateRange[1].endOf('day').toISOString() : undefined,
      }

      const res: UserSavedFileListResponse = await userSavedFileService.list(params)
      setData(res.content || [])
      setTotal(res.totalElements || 0)
    } catch (err) {
      message.error(extractErrorMessage(err, 'Không thể tải danh sách bản lưu'))
      setData([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [
    page,
    pageSize,
    debouncedKeyword,
    selectedCategory,
    selectedBrand,
    selectedModel,
    selectedDealer,
    selectedUser,
    selectedStatus,
    dateRange,
  ])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const hasFilter = useMemo(() => {
    return Boolean(
      keyword ||
        selectedCategory !== undefined ||
        selectedBrand !== undefined ||
        selectedModel !== undefined ||
        selectedDealer !== undefined ||
        selectedUser !== undefined ||
        selectedStatus !== undefined ||
        dateRange !== null
    )
  }, [
    keyword,
    selectedCategory,
    selectedBrand,
    selectedModel,
    selectedDealer,
    selectedUser,
    selectedStatus,
    dateRange,
  ])

  const handleResetFilters = () => {
    setKeyword('')
    setDebouncedKeyword('')
    setSelectedCategory(undefined)
    setSelectedBrand(undefined)
    setSelectedModel(undefined)
    setSelectedDealer(undefined)
    setSelectedUser(undefined)
    setDateRange(null)
    setSelectedStatus(undefined)
    setPage(0)
  }

  const handleDownload = async (file: UserSavedFile) => {
    try {
      message.loading({ content: 'Đang tải file...', key: 'dl' })
      await userSavedFileService.download(file.id, normalizeSvgFilename(file.fileName, file.id))
      message.success({ content: 'Tải file thành công', key: 'dl' })
    } catch (err) {
      message.error({
        content: extractErrorMessage(err, 'Không thể tải file SVG'),
        key: 'dl',
      })
    }
  }

  // Thống kê nhanh
  const stats = useMemo(() => {
    const activeCount = data.filter(d => d.status === 'ACTIVE').length
    const dealerSet = new Set(data.map(d => d.dealer?.name).filter(Boolean))
    const totalBytes = data.reduce((acc, cur) => acc + (cur.fileSize || 0), 0)
    return {
      total,
      activeCount,
      dealerCount: dealerSet.size,
      totalBytes,
    }
  }, [data, total])

  const columns: ColumnsType<UserSavedFile> = [
    {
      title: 'STT',
      width: 52,
      align: 'center',
      render: (_, __, index) => (
        <span style={{ fontFamily: MONO, fontSize: 11.5, color: '#8A8983' }}>
          {page * pageSize + index + 1}
        </span>
      ),
    },
    {
      title: 'Bản vẽ & Tên file',
      dataIndex: 'fileName',
      key: 'fileName',
      width: 250,
      render: (text: string, record: UserSavedFile) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileThumb
            fileId={record.id}
            title={text}
            onClick={() => {
              setPreviewFileId(record.id)
              setPreviewTitle(record.fileName)
              setPreviewOpen(true)
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div
              onClick={() => {
                setSelectedFileForDetail(record)
                setDetailOpen(true)
              }}
              style={{
                fontFamily: FONT,
                fontWeight: 600,
                fontSize: 12.5,
                color: '#6C3BD6',
                cursor: 'pointer',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 180,
              }}
              title={text}
            >
              {text}
            </div>
            <div style={{ fontSize: 11, color: '#8A8983', fontFamily: MONO, marginTop: 2 }}>
              {formatBytes(record.fileSize)} <span style={{ color: '#C9C8C3' }}>·</span> SVG
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Danh mục',
      key: 'category',
      width: 130,
      render: (_, record) =>
        record.category?.name ? (
          <span
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              background: '#F1EDFC',
              border: '1px solid #C9B6F5',
              borderRadius: 4,
              font: `500 11px ${FONT}`,
              color: '#5B2BB0',
            }}
          >
            {record.category.name}
          </span>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Mẫu xe',
      key: 'vehicle',
      width: 180,
      render: (_, record) => {
        const vc = record.vehicleConfiguration
        if (!vc?.brandName && !vc?.modelName) {
          return <Text type="secondary">—</Text>
        }
        return (
          <div>
            <div style={{ fontWeight: 500, fontSize: 12.5, color: '#1B1B19' }}>
              {vc.brandName} {vc.modelName}
            </div>
            {(vc.yearFrom || vc.generationCode) && (
              <div style={{ fontSize: 11, color: '#8A8983', marginTop: 2 }}>
                {vc.yearFrom ? `${vc.yearFrom}${vc.yearTo ? `–${vc.yearTo}` : ''}` : ''}
                {vc.generationCode ? ` · ${vc.generationCode}` : ''}
              </div>
            )}
          </div>
        )
      },
    },
    {
      title: 'Khổ cắt (Y × X)',
      key: 'cutSize',
      width: 140,
      render: (_, record) => {
        const w = record.cutSize?.filmWidth ?? record.cutSize?.axisY
        const l = record.cutSize?.rollLength ?? record.cutSize?.axisX
        if (!w && !l) return <Text type="secondary">—</Text>
        return (
          <span style={{ fontFamily: MONO, fontSize: 11.5, color: '#35342F' }}>
            {w ? w.toLocaleString('vi-VN') : '—'} × {l ? l.toLocaleString('vi-VN') : '—'} mm
          </span>
        )
      },
    },
    {
      title: 'Người tạo',
      key: 'createdBy',
      width: 150,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              flex: 'none',
              borderRadius: '50%',
              background: '#EDEBE6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              font: `500 10.5px ${FONT}`,
              color: '#6E6D68',
            }}
          >
            {getInitials(record.createdBy?.displayName, record.createdBy?.username)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 500,
                fontSize: 12,
                color: '#1B1B19',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {record.createdBy?.displayName || record.createdBy?.username || '—'}
            </div>
            {record.createdBy?.username && (
              <div style={{ fontSize: 10.5, color: '#8A8983', fontFamily: MONO }}>
                @{record.createdBy.username}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Đại lý',
      key: 'dealer',
      width: 140,
      render: (_, record) =>
        record.dealer?.name ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <ShopOutlined style={{ color: '#6C3BD6', fontSize: 13 }} />
            <span style={{ font: `500 11.5px ${FONT}`, color: '#35342F' }}>
              {record.dealer.name}
            </span>
          </div>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Thời gian lưu',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 135,
      render: (dateStr: string) => {
        if (!dateStr) return '—'
        const d = new Date(dateStr)
        if (isNaN(d.getTime())) return '—'
        return (
          <span style={{ fontFamily: MONO, fontSize: 11, color: '#4A4945' }}>
            {d.toLocaleDateString('vi-VN')} {d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status: string) => (
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 4,
            font: `500 11px ${FONT}`,
            background: status === 'ACTIVE' ? '#EBF8F0' : '#F1F0EC',
            border: `1px solid ${status === 'ACTIVE' ? '#B3E7C3' : '#D8D7D2'}`,
            color: status === 'ACTIVE' ? '#1E7E34' : '#6E6D68',
          }}
        >
          {status === 'ACTIVE' ? 'Hoạt động' : 'Đã xoá'}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 110,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ color: '#4A4945' }} />}
              onClick={() => {
                setSelectedFileForDetail(record)
                setDetailOpen(true)
              }}
            />
          </Tooltip>
          <Tooltip title="Xem trước SVG">
            <Button
              type="text"
              size="small"
              icon={<FileImageOutlined style={{ color: '#6C3BD6' }} />}
              onClick={() => {
                setPreviewFileId(record.id)
                setPreviewTitle(record.fileName)
                setPreviewOpen(true)
              }}
            />
          </Tooltip>
          <Tooltip title="Tải xuống file">
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined style={{ color: '#1B1B19' }} />}
              onClick={() => handleDownload(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 4 Thẻ thống kê tổng quan */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
        <div
          style={{
            padding: '13px 16px',
            background: '#FBFBFA',
            border: '1px solid #E4E3DE',
            borderRadius: 6,
          }}
        >
          <div style={{ font: `400 11.5px ${FONT}`, color: '#6E6D68' }}>Tổng số bản đã lưu</div>
          <div style={{ marginTop: 6, font: `500 22px ${MONO}`, color: '#1B1B19' }}>
            {stats.total.toLocaleString('vi-VN')}
          </div>
        </div>

        <div
          style={{
            padding: '13px 16px',
            background: '#FBFBFA',
            border: '1px solid #E4E3DE',
            borderRadius: 6,
          }}
        >
          <div style={{ font: `400 11.5px ${FONT}`, color: '#6E6D68' }}>Bản lưu đang hoạt động</div>
          <div style={{ marginTop: 6, font: `500 22px ${MONO}`, color: '#1E7E34' }}>
            {stats.activeCount.toLocaleString('vi-VN')}
          </div>
        </div>

        <div
          style={{
            padding: '13px 16px',
            background: '#FBFBFA',
            border: '1px solid #E4E3DE',
            borderRadius: 6,
          }}
        >
          <div style={{ font: `400 11.5px ${FONT}`, color: '#6E6D68' }}>Đại lý có bản lưu</div>
          <div style={{ marginTop: 6, font: `500 22px ${MONO}`, color: '#6C3BD6' }}>
            {stats.dealerCount.toLocaleString('vi-VN')}
          </div>
        </div>

        <div
          style={{
            padding: '13px 16px',
            background: '#FBFBFA',
            border: '1px solid #E4E3DE',
            borderRadius: 6,
          }}
        >
          <div style={{ font: `400 11.5px ${FONT}`, color: '#6E6D68' }}>Dung lượng trang này</div>
          <div style={{ marginTop: 6, font: `500 22px ${MONO}`, color: '#1B1B19' }}>
            {formatBytes(stats.totalBytes)}
          </div>
        </div>
      </div>

      {/* Thanh bộ lọc chuẩn thẩm mỹ */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          background: '#FBFBFA',
          border: '1px solid #E4E3DE',
          borderRadius: 6,
        }}
      >
        <Select
          placeholder="Danh mục"
          value={selectedCategory}
          onChange={v => {
            setSelectedCategory(v)
            setPage(0)
          }}
          style={{ width: 140 }}
          allowClear
          options={categories.map(c => ({ value: c.value, label: c.label }))}
        />

        <Select
          placeholder="Hãng xe"
          value={selectedBrand}
          onChange={v => {
            setSelectedBrand(v)
            setSelectedModel(undefined)
            setPage(0)
          }}
          style={{ width: 130 }}
          allowClear
          options={brandTrees.map(b => ({ value: b.id, label: b.name }))}
        />

        <Select
          placeholder="Dòng xe"
          value={selectedModel}
          onChange={v => {
            setSelectedModel(v)
            setPage(0)
          }}
          disabled={!selectedBrand}
          style={{ width: 150 }}
          allowClear
          options={modelOptions.map(m => ({ value: m.id, label: m.name }))}
        />

        <Select
          placeholder="Đại lý"
          value={selectedDealer}
          onChange={v => {
            setSelectedDealer(v)
            setPage(0)
          }}
          style={{ width: 150 }}
          allowClear
          showSearch
          optionFilterProp="label"
          options={dealers.map(d => ({ value: d.id, label: d.name }))}
        />

        <Select
          placeholder="Người tạo"
          value={selectedUser}
          onChange={v => {
            setSelectedUser(v)
            setPage(0)
          }}
          style={{ width: 140 }}
          allowClear
          showSearch
          optionFilterProp="label"
          options={users.map(u => ({ value: u.id, label: u.fullName || u.username }))}
        />

        <RangePicker
          value={dateRange}
          onChange={dates => {
            setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])
            setPage(0)
          }}
          style={{ width: 220 }}
          placeholder={['Từ ngày', 'Đến ngày']}
        />

        <Select
          placeholder="Trạng thái"
          value={selectedStatus}
          onChange={v => {
            setSelectedStatus(v)
            setPage(0)
          }}
          style={{ width: 110 }}
          allowClear
          options={[
            { value: 'ACTIVE', label: 'Hoạt động' },
            { value: 'DELETED', label: 'Đã xoá' },
          ]}
        />

        {hasFilter && (
          <button
            onClick={handleResetFilters}
            style={{
              padding: '6px 10px',
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              font: `500 11.5px ${FONT}`,
              color: '#6C3BD6',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <ClearOutlined /> Xoá lọc
          </button>
        )}

        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '0 10px',
            height: 32,
            width: 240,
            border: '1px solid #D8D7D2',
            borderRadius: 5,
            background: '#FFF',
          }}
        >
          <SearchOutlined style={{ color: '#8A8983', fontSize: 13 }} />
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Tìm theo tên file..."
            style={{
              flex: 1,
              minWidth: 0,
              border: 0,
              outline: 'none',
              background: 'transparent',
              font: `400 12px ${FONT}`,
              color: '#1B1B19',
            }}
          />
          {keyword && (
            <span
              onClick={() => setKeyword('')}
              style={{ cursor: 'pointer', color: '#8A8983', fontSize: 12 }}
            >
              ✕
            </span>
          )}
        </div>

        <Tooltip title="Làm mới danh sách">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchList()}
            style={{
              height: 32,
              borderRadius: 5,
              borderColor: '#D8D7D2',
              color: '#4A4945',
            }}
          />
        </Tooltip>
      </div>

      {/* Bảng dữ liệu viền nét thanh lịch */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E4E3DE',
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        <Table<UserSavedFile>
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 1350 }}
          pagination={{
            current: page + 1,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['20', '50', '100'],
            showTotal: t => `Tổng số ${t} bản lưu`,
            onChange: (p, s) => {
              setPage(p - 1)
              setPageSize(s)
            },
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Chưa có bản lưu nào khớp bộ lọc"
              />
            ),
          }}
        />
      </div>

      {/* Drawer Xem Chi Tiết */}
      <UserSavedFileDetailDrawer
        file={selectedFileForDetail}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false)
          setSelectedFileForDetail(null)
        }}
      />

      {/* Modal Xem Trước SVG */}
      <UserSavedFilePreviewModal
        fileId={previewFileId}
        title={previewTitle}
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false)
          setPreviewFileId(null)
          setPreviewTitle('')
        }}
      />
    </div>
  )
}
