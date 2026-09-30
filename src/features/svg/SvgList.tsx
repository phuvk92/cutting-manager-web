import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Popconfirm, Spin, message, Tooltip } from 'antd'
import { AdminFile, AdminFileStats, VehicleNode } from '@/types/adminFile'
import { CatalogOption } from '@/types/category'
import { adminFileService } from '@/services/admin/adminFileService'
import { vehicleNodeService } from '@/services/admin/vehicleNodeService'
import { svgService } from '@/services/svg/svgService'
import { PartFileFormModal } from './PartFileFormModal'
import { SvgPreviewModal } from './SvgPreviewModal'
import { extractErrorMessage } from '@/utils/error'

const FONT = "'IBM Plex Sans', sans-serif"
const MONO = "'IBM Plex Mono', monospace"

const PAGE_SIZES = [20, 50, 100]
const YEAR_OPTIONS: number[] = (() => {
  const now = new Date().getFullYear()
  const list: number[] = []
  for (let y = now + 1; y >= 2018; y--) list.push(y)
  return list
})()

const fmtDate = (s?: string | null) => {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

const SOURCE_LABEL: Record<string, string> = { SYSTEM: 'Hệ thống', DEALER: 'Đại lý' }

/** Ảnh xem trước của file — thumbnailUrl từ API, tải bằng axios blob vì có JWT. */
const FileThumb: React.FC<{ url: string | null; onClick?: () => void }> = ({ url, onClick }) => {
  const [blob, setBlob] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    setBlob(null)
    setFailed(false)
    if (url) {
      svgService
        .getThumbnailBlobUrl(url)
        .then(u => active && setBlob(u))
        .catch(() => active && setFailed(true))
    }
    return () => {
      active = false
    }
  }, [url])

  return (
    <span
      onClick={onClick}
      style={{
        width: 48,
        height: 34,
        border: '1px solid #E4E3DE',
        borderRadius: 4,
        background: '#FFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {blob && !failed ? (
        <img src={blob} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9C8C3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="4" width="17" height="16" rx="2" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="M20 15.5 15.5 11 6.5 20" />
        </svg>
      )}
    </span>
  )
}

interface FilterDef {
  label: string
  value: string
  options: { value: string; label: string }[]
  allLabel: string
  disabled?: boolean
  onChange: (v: string) => void
}

export const SvgList: React.FC = () => {
  const [stats, setStats] = useState<AdminFileStats | null>(null)
  const [files, setFiles] = useState<AdminFile[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)

  const [tree, setTree] = useState<VehicleNode[]>([])

  const [categories, setCategories] = useState<CatalogOption[]>([])

  // bộ lọc — nối tầng Hãng → Dòng xe → Model (SA §5)
  const [fCategory, setFCategory] = useState('')
  const [fYear, setFYear] = useState('')
  const [fBrand, setFBrand] = useState('')
  const [fSeries, setFSeries] = useState('')
  const [fModel, setFModel] = useState('')
  const [query, setQuery] = useState('')
  const [keyword, setKeyword] = useState('')

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminFile | null>(null)
  const [previewId, setPreviewId] = useState<number | null>(null)
  const [previewName, setPreviewName] = useState('')

  useEffect(() => {
    vehicleNodeService.getBrandTrees().then(setTree).catch(() => {})
    vehicleNodeService.getFileCategories().then(setCategories).catch(() => {})
  }, [])

  const seriesOptions = useMemo(
    () => (fBrand ? tree.find(b => String(b.id) === fBrand)?.children || [] : []),
    [tree, fBrand]
  )
  const modelOptions = useMemo(
    () => (fSeries ? seriesOptions.find(s => String(s.id) === fSeries)?.children || [] : []),
    [seriesOptions, fSeries]
  )

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminFileService.getFiles({
        q: keyword || undefined,
        categoryId: fCategory ? Number(fCategory) : undefined,
        year: fYear ? Number(fYear) : undefined,
        brandId: fBrand ? Number(fBrand) : undefined,
        seriesId: fSeries ? Number(fSeries) : undefined,
        modelId: fModel ? Number(fModel) : undefined,
        page,
        size: pageSize,
      })
      setFiles(res.content || [])
      setTotalElements(res.totalElements || 0)
      setTotalPages(res.totalPages || 0)
    } catch (err) {
      message.error(extractErrorMessage(err, 'Lỗi khi tải kho part file'))
    } finally {
      setLoading(false)
    }
  }, [keyword, fCategory, fYear, fBrand, fSeries, fModel, page, pageSize])

  const fetchStats = useCallback(() => {
    adminFileService.getStats().then(setStats).catch(() => {})
  }, [])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const hasFilter = !!(fCategory || fYear || fBrand || fSeries || fModel || keyword || query)
  const clearFilters = () => {
    setFCategory('')
    setFYear('')
    setFBrand('')
    setFSeries('')
    setFModel('')
    setQuery('')
    setKeyword('')
    setPage(0)
  }

  const handleDelete = async (f: AdminFile) => {
    try {
      await adminFileService.deleteFile(f.id)
      message.success(`Đã xoá "${f.name || f.originalFilename}"`)
      fetchFiles()
      fetchStats()
    } catch (err) {
      message.error(extractErrorMessage(err, 'Xoá file thất bại'))
    }
  }

  const filters: FilterDef[] = [
    {
      label: 'Danh mục',
      value: fCategory,
      options: categories.map(c => ({ value: c.value, label: c.label })),
      allLabel: 'Tất cả',
      onChange: v => {
        setFCategory(v)
        setPage(0)
      },
    },
    {
      label: 'Năm',
      value: fYear,
      options: YEAR_OPTIONS.map(y => ({ value: String(y), label: String(y) })),
      allLabel: 'Tất cả',
      onChange: v => {
        setFYear(v)
        setPage(0)
      },
    },
    {
      label: 'Hãng',
      value: fBrand,
      options: tree.map(b => ({ value: String(b.id), label: b.name })),
      allLabel: 'Tất cả',
      onChange: v => {
        setFBrand(v)
        setFSeries('')
        setFModel('')
        setPage(0)
      },
    },
    {
      label: 'Dòng xe',
      value: fSeries,
      options: seriesOptions.map(s => ({ value: String(s.id), label: s.name })),
      allLabel: fBrand ? 'Tất cả' : 'Chọn hãng trước',
      disabled: !fBrand,
      onChange: v => {
        setFSeries(v)
        setFModel('')
        setPage(0)
      },
    },
    {
      label: 'Model',
      value: fModel,
      options: modelOptions.map(m => ({ value: String(m.id), label: m.name })),
      allLabel: fSeries ? 'Tất cả' : 'Chọn dòng trước',
      disabled: !fSeries,
      onChange: v => {
        setFModel(v)
        setPage(0)
      },
    },
  ]

  const statCards = [
    { label: 'Part file trong kho', value: stats?.total, color: '#1B1B19' },
    { label: 'Model đã có file', value: stats?.modelsWithFiles, color: '#1B1B19' },
    { label: 'Do đại lý nạp', value: stats?.fromDealers, color: '#1B1B19' },
    { label: 'Chưa gắn mẫu xe', value: stats?.unlinked, color: '#B4741E' },
  ]

  const gridCols = '44px 56px minmax(0, 1.2fr) 100px minmax(0, 1.6fr) 56px 92px 88px 64px'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 4 thẻ thống kê */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
        {statCards.map(k => (
          <div key={k.label} style={{ padding: '13px 16px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
            <div style={{ font: `400 11.5px ${FONT}`, color: '#6E6D68' }}>{k.label}</div>
            <div style={{ marginTop: 6, font: `500 22px ${MONO}`, color: k.color }}>
              {k.value === undefined ? '—' : k.value.toLocaleString('vi-VN')}
            </div>
          </div>
        ))}
      </div>

      {/* bộ lọc */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
        {filters.map(f => (
          <label
            key={f.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 4px 0 9px',
              height: 32,
              background: f.value ? '#F1EDFC' : '#FFF',
              border: `1px solid ${f.value ? '#C9B6F5' : '#D8D7D2'}`,
              borderRadius: 5,
            }}
          >
            <span style={{ font: `400 11px ${FONT}`, color: '#8A8983', whiteSpace: 'nowrap' }}>{f.label}</span>
            <select
              value={f.value}
              disabled={f.disabled}
              onChange={e => f.onChange(e.target.value)}
              style={{ maxWidth: 150, border: 0, outline: 'none', background: 'transparent', cursor: 'pointer', font: `500 11.5px ${FONT}`, color: f.disabled ? '#A5A49E' : '#1B1B19' }}
            >
              <option value="">{f.allLabel}</option>
              {f.options.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ))}
        {hasFilter && (
          <button
            onClick={clearFilters}
            style={{ padding: '6px 9px', border: 0, background: 'transparent', cursor: 'pointer', font: `500 11px ${FONT}`, color: '#6C3BD6' }}
          >
            Xoá lọc
          </button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px', height: 32, width: 220, border: '1px solid #D8D7D2', borderRadius: 5, background: '#FFF' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A8983" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4 4" />
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setPage(0)
                setKeyword(query.trim())
              }
            }}
            placeholder="Tìm theo tên file…"
            style={{ flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent', font: `400 12px ${FONT}`, color: '#1B1B19' }}
          />
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 13px', border: 0, borderRadius: 5, background: '#7C3AED', cursor: 'pointer', font: `500 11.5px ${FONT}`, color: '#FFF' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V5" />
            <path d="M7.5 9.5 12 5l4.5 4.5" />
            <path d="M5 19h14" />
          </svg>
          Upload part file
        </button>
      </div>

      {/* bảng file */}
      <div style={{ background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 10, padding: '9px 16px', background: '#F1F0EC', borderBottom: '1px solid #E4E3DE', font: `600 10.5px ${FONT}`, letterSpacing: '0.04em', color: '#6E6D68' }}>
          <span>STT</span>
          <span>Ảnh</span>
          <span>Tên file</span>
          <span>Danh mục</span>
          <span>Mẫu xe</span>
          <span>Năm</span>
          <span>Nguồn</span>
          <span>Cập nhật</span>
          <span />
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Spin />
          </div>
        ) : files.length === 0 ? (
          <div style={{ padding: '30px 16px', textAlign: 'center', font: `400 12px ${FONT}`, color: '#8A8983' }}>
            Không có file nào khớp bộ lọc.
          </div>
        ) : (
          files.map((f, i) => {
            const isDealer = f.source === 'DEALER'
            const vehicles = f.vehicles || []
            return (
              <div
                key={f.id}
                style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 10, alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid #EFEEEA', font: `400 12px ${FONT}` }}
              >
                <span style={{ font: `400 11.5px ${MONO}`, color: '#8A8983' }}>{page * pageSize + i + 1}</span>
                <FileThumb
                  url={f.thumbnailUrl}
                  onClick={() => {
                    setPreviewId(f.id)
                    setPreviewName(f.name || f.originalFilename)
                  }}
                />
                <span style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 500, color: '#1B1B19', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.name || f.originalFilename}
                  </div>
                  <div style={{ marginTop: 2, font: `400 10.5px ${MONO}`, color: '#A3A29C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.originalFilename}
                  </div>
                </span>
                <span style={{ color: '#4A4945' }}>{f.category || '—'}</span>
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#35342F' }}>
                  {vehicles.length === 0 ? (
                    <span style={{ color: '#A5A49E' }}>Chưa gắn mẫu xe</span>
                  ) : (
                    <Tooltip title={vehicles.map(v => v.path).join('\n')}>
                      {vehicles[0].path}
                    </Tooltip>
                  )}
                </span>
                <span style={{ fontFamily: MONO, color: '#35342F' }}>{f.year ?? '—'}</span>
                <span>
                  <span style={{ padding: '3px 8px', borderRadius: 4, background: isDealer ? '#F1EDFC' : '#EDEBE6', font: `500 10.5px ${FONT}`, color: isDealer ? '#5B2BB0' : '#4A4945' }}>
                    {SOURCE_LABEL[f.source] || f.source || 'Hệ thống'}
                  </span>
                </span>
                <span style={{ font: `400 11.5px ${MONO}`, color: '#6E6D68' }}>{fmtDate(f.updatedAt)}</span>
                <span style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                  <button
                    onClick={() => {
                      setEditing(f)
                      setFormOpen(true)
                    }}
                    title="Sửa"
                    style={{ width: 26, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', cursor: 'pointer' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4A4945" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 20h4L19 9l-4-4L4 16z" />
                      <path d="M13.5 6.5l4 4" />
                    </svg>
                  </button>
                  <Popconfirm
                    title="Xoá part file"
                    description={`Xoá "${f.name || f.originalFilename}"? File chuyển sang trạng thái DELETED.`}
                    onConfirm={() => handleDelete(f)}
                    okText="Xoá"
                    cancelText="Huỷ"
                    okButtonProps={{ danger: true }}
                  >
                    <button
                      title="Xoá"
                      style={{ width: 26, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E9C9C9', borderRadius: 4, background: '#FFF', cursor: 'pointer' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A93823" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 7h14" />
                        <path d="M9 7V4.5h6V7" />
                        <path d="M7 7l1 13h8l1-13" />
                      </svg>
                    </button>
                  </Popconfirm>
                </span>
              </div>
            )
          })
        )}

        {/* phân trang */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', font: `400 11.5px ${FONT}`, color: '#6E6D68' }}>
          <button
            onClick={() => setPage(0)}
            disabled={page === 0}
            style={{ padding: '4px 9px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', color: page === 0 ? '#A5A49E' : '#35342F', cursor: page === 0 ? 'default' : 'pointer' }}
          >
            «
          </button>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{ padding: '4px 9px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', color: page === 0 ? '#A5A49E' : '#35342F', cursor: page === 0 ? 'default' : 'pointer' }}
          >
            ‹
          </button>
          <input
            value={page + 1}
            readOnly
            style={{ width: 38, padding: '4px 6px', textAlign: 'center', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', font: `400 11.5px ${MONO}`, color: '#1B1B19' }}
          />
          <span style={{ fontFamily: MONO }}>/ {Math.max(totalPages, 1)}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{ padding: '4px 9px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', color: page >= totalPages - 1 ? '#A5A49E' : '#35342F', cursor: page >= totalPages - 1 ? 'default' : 'pointer' }}
          >
            ›
          </button>
          <button
            onClick={() => setPage(totalPages - 1)}
            disabled={page >= totalPages - 1}
            style={{ padding: '4px 9px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', color: page >= totalPages - 1 ? '#A5A49E' : '#35342F', cursor: page >= totalPages - 1 ? 'default' : 'pointer' }}
          >
            »
          </button>
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value))
              setPage(0)
            }}
            style={{ marginLeft: 10, padding: '4px 6px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', font: `400 11.5px ${MONO}`, color: '#1B1B19' }}
          >
            {PAGE_SIZES.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span>file / trang</span>
          <span style={{ marginLeft: 'auto' }}>
            {hasFilter ? `Khớp ${totalElements} file` : `Tổng ${totalElements.toLocaleString('vi-VN')} file`}
          </span>
        </div>
      </div>

      <PartFileFormModal
        open={formOpen}
        editing={editing}
        tree={tree}
        categories={categories}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          fetchFiles()
          fetchStats()
        }}
      />

      <SvgPreviewModal
        fileId={previewId}
        title={previewName}
        open={previewId !== null}
        onClose={() => setPreviewId(null)}
      />
    </div>
  )
}
