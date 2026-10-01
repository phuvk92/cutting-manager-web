import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Modal, Select, message } from 'antd'
import { AdminFile, VehicleNode } from '@/types/adminFile'
import { CatalogOption } from '@/types/category'
import { adminFileService } from '@/services/admin/adminFileService'
import { vehicleNodeService } from '@/services/admin/vehicleNodeService'
import { axiosClient } from '@/services/api/axiosClient'
import { extractErrorMessage } from '@/utils/error'

const FONT = "'IBM Plex Sans', sans-serif"
const MONO = "'IBM Plex Mono', monospace"

const LEVEL_META = [
  { code: 'BRAND', vi: 'hãng', label: 'Hãng', bg: '#EEF3FC', color: '#2F5BA8', required: true },
  { code: 'SERIES', vi: 'dòng xe', label: 'Dòng xe', bg: '#E9F5EE', color: '#2E7D5B', required: true },
  { code: 'MODEL', vi: 'model', label: 'Model', bg: '#FBF0DF', color: '#8A5A12', required: true },
  { code: 'SUBTYPE', vi: 'phiên bản', label: 'Phiên bản', bg: '#FAE7E3', color: '#A93823', required: false },
]

/** Bỏ dấu + chữ thường để tìm tiếng Việt không cần gõ dấu (đ → d). */
const foldVi = (text: string): string =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase()

interface VehicleRow {
  key: number
  brandId?: number
  seriesId?: number
  modelId?: number
  subtypeId?: number
}

interface NodeInfo {
  node: VehicleNode
  parent?: VehicleNode
}

interface PartFileFormModalProps {
  open: boolean
  editing: AdminFile | null
  /** Truyền sẵn khi màn danh sách đã tải; để trống thì modal tự tải khi mở. */
  tree?: VehicleNode[]
  categories?: CatalogOption[]
  onClose: () => void
  onSaved: () => void
}

let rowSeq = 1
const emptyRow = (): VehicleRow => ({ key: rowSeq++ })

interface SvgDropZoneProps {
  title: string
  hint: string
  /** File .svg mới chọn (chưa lưu) */
  file: File | null
  /** Tên bản đang có trên server (chế độ sửa); null = chưa có */
  existingName: string | null
  /** Đã đánh dấu bỏ bản đang có */
  removed: boolean
  /** Cho phép bỏ bản đang có — tắt khi đó là bản cuối cùng */
  canRemove: boolean
  dragActive: boolean
  onBrowse: () => void
  onDropFile: (f: File | undefined | null) => void
  onDragActive: (v: boolean) => void
  onClearNew: () => void
  onMarkRemove: () => void
  onUndoRemove: () => void
}

/** Một vùng thả file .svg — SA-DanhMucXe-v2 §8.2: hai vùng riêng cho bản đã xếp / chưa xếp. */
const SvgDropZone: React.FC<SvgDropZoneProps> = ({
  title,
  hint,
  file,
  existingName,
  removed,
  canRemove,
  dragActive,
  onBrowse,
  onDropFile,
  onDragActive,
  onClearNew,
  onMarkRemove,
  onUndoRemove,
}) => {
  const filled = !!file || (!!existingName && !removed)
  const stop = (e: React.MouseEvent) => e.stopPropagation()
  const smallBtn: React.CSSProperties = {
    padding: '2px 8px',
    border: '1px solid #D8D7D2',
    borderRadius: 4,
    background: '#FFF',
    cursor: 'pointer',
    font: `500 10.5px ${FONT}`,
    color: '#4A4945',
  }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
        <span style={{ font: `600 11px ${FONT}`, color: '#35342F' }}>{title}</span>
        <span style={{ font: `400 10.5px ${FONT}`, color: '#8A8983' }}>{hint}</span>
      </div>
      <button
        onClick={onBrowse}
        onDragOver={e => {
          e.preventDefault()
          onDragActive(true)
        }}
        onDragLeave={() => onDragActive(false)}
        onDrop={e => {
          e.preventDefault()
          onDragActive(false)
          onDropFile(e.dataTransfer.files?.[0])
        }}
        style={{
          width: '100%',
          minHeight: 76,
          border: `1.5px dashed ${filled || dragActive ? '#7C3AED' : '#C9BCF0'}`,
          borderRadius: 6,
          background: filled || dragActive ? '#F1EDFC' : '#FBFAFF',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          padding: '8px 10px',
        }}
      >
        {file ? (
          <>
            <span style={{ font: `500 11.5px ${MONO}`, color: '#5B2BB0', wordBreak: 'break-all' }}>
              {file.name}
            </span>
            <span style={{ display: 'flex', gap: 6 }} onClick={stop}>
              <span style={{ font: `400 10.5px ${FONT}`, color: '#8A8983' }}>Bấm vùng này để đổi file</span>
              <button style={smallBtn} onClick={onClearNew}>
                Bỏ file
              </button>
            </span>
          </>
        ) : existingName && !removed ? (
          <>
            <span style={{ font: `400 11px ${FONT}`, color: '#6E6D68' }}>Đang có:</span>
            <span style={{ font: `500 11.5px ${MONO}`, color: '#35342F', wordBreak: 'break-all' }}>
              {existingName}
            </span>
            <span style={{ display: 'flex', gap: 6 }} onClick={stop}>
              <button
                style={{ ...smallBtn, ...(canRemove ? {} : { opacity: 0.45, cursor: 'not-allowed' }) }}
                disabled={!canRemove}
                title={canRemove ? 'Bỏ bản đang có' : 'Không bỏ được — file phải còn ít nhất một bản'}
                onClick={onMarkRemove}
              >
                Bỏ bản này
              </button>
            </span>
            <span style={{ font: `400 10.5px ${FONT}`, color: '#8A8983' }}>Bấm vùng này để thay file</span>
          </>
        ) : existingName && removed ? (
          <>
            <span style={{ font: `400 11px ${FONT}`, color: '#A93823' }}>
              Sẽ bỏ: {existingName}
            </span>
            <span style={{ display: 'flex', gap: 6 }} onClick={stop}>
              <button style={smallBtn} onClick={onUndoRemove}>
                Giữ lại
              </button>
            </span>
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V5" />
              <path d="M7.5 9.5 12 5l4.5 4.5" />
              <path d="M4.5 19.5h15" />
            </svg>
            <span style={{ font: `500 11.5px ${FONT}`, color: '#5B2BB0' }}>
              Chọn file hoặc thả vào đây
            </span>
            <span style={{ font: `400 10.5px ${FONT}`, color: '#8A8983' }}>SVG</span>
          </>
        )}
      </button>
    </div>
  )
}

const YEARS: number[] = (() => {
  const now = new Date().getFullYear()
  const list: number[] = []
  for (let y = now + 1; y >= 2018; y--) list.push(y)
  return list
})()

/** Tìm chuỗi tổ tiên [brand, series, model, subtype] của một node id trong cây. */
const findChain = (map: Map<number, NodeInfo>, nodeId: number): VehicleNode[] => {
  const chain: VehicleNode[] = []
  let cur = map.get(nodeId)
  while (cur) {
    chain.unshift(cur.node)
    cur = cur.parent ? map.get(cur.parent.id) : undefined
  }
  return chain
}

export const PartFileFormModal: React.FC<PartFileFormModalProps> = ({
  open,
  editing,
  tree: treeProp,
  categories: categoriesProp,
  onClose,
  onSaved,
}) => {
  const isEdit = !!editing

  const [treeSelf, setTreeSelf] = useState<VehicleNode[]>([])
  const [categoriesSelf, setCategoriesSelf] = useState<CatalogOption[]>([])
  const tree = treeProp && treeProp.length ? treeProp : treeSelf
  const categories = categoriesProp && categoriesProp.length ? categoriesProp : categoriesSelf

  useEffect(() => {
    if (!open) return
    if (!treeProp?.length) {
      vehicleNodeService.getBrandTrees().then(setTreeSelf).catch(() => {})
    }
    if (!categoriesProp?.length) {
      vehicleNodeService.getFileCategories().then(setCategoriesSelf).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)
  const [year, setYear] = useState<number | undefined>(undefined)
  const [rows, setRows] = useState<VehicleRow[]>([emptyRow()])
  // Hai bản file (SA-DanhMucXe-v2 §8.2): nested = đã xếp → vùng cắt, raw = chưa xếp → khu chưa cắt
  const [nestedFile, setNestedFile] = useState<File | null>(null)
  const [rawFile, setRawFile] = useState<File | null>(null)
  const [removeNested, setRemoveNested] = useState(false)
  const [removeRaw, setRemoveRaw] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [thumbPreview, setThumbPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [dragOver, setDragOver] = useState<'nested' | 'raw' | null>(null)
  const nestedInputRef = useRef<HTMLInputElement>(null)
  const rawInputRef = useRef<HTMLInputElement>(null)
  const thumbInputRef = useRef<HTMLInputElement>(null)

  const nodeMap = useMemo(() => {
    const map = new Map<number, NodeInfo>()
    const walk = (nodes: VehicleNode[], parent?: VehicleNode) => {
      nodes.forEach(n => {
        map.set(n.id, { node: n, parent })
        walk(n.children || [], n)
      })
    }
    walk(tree)
    return map
  }, [tree])

  const childrenOf = (parentId?: number): VehicleNode[] => {
    if (parentId === undefined) return tree
    return nodeMap.get(parentId)?.node.children || []
  }

  // Nạp thumbnail đang có khi mở sửa (ảnh qua API nên phải tải bằng axios blob)
  const loadExistingThumb = (url: string) => {
    axiosClient
      .get<Blob>(url, { responseType: 'blob' })
      .then(res => setThumbPreview(URL.createObjectURL(res.data)))
      .catch(() => setThumbPreview(null))
  }

  useEffect(() => {
    if (!open) return
    setNestedFile(null)
    setRawFile(null)
    setRemoveNested(false)
    setRemoveRaw(false)
    setFileError(null)
    setThumbnail(null)
    setThumbPreview(null)
    setSaving(false)
    if (editing) {
      setName(editing.name || '')
      const cat = categories.find(c => c.label === editing.category)
      setCategoryId(cat ? Number(cat.value) : undefined)
      setYear(editing.year ?? undefined)
      const prefill: VehicleRow[] = (editing.vehicles || []).slice(0, 1)
        .map(v => {
          const chain = findChain(nodeMap, v.nodeId)
          if (!chain.length) return null
          const row = emptyRow()
          chain.forEach(n => {
            if (n.level === 'BRAND') row.brandId = n.id
            if (n.level === 'SERIES') row.seriesId = n.id
            if (n.level === 'MODEL') row.modelId = n.id
            if (n.level === 'SUBTYPE') row.subtypeId = n.id
          })
          return row
        })
        .filter((r): r is VehicleRow => r !== null)
      setRows(prefill.length ? prefill : [emptyRow()])
      if (editing.thumbnailUrl) loadExistingThumb(editing.thumbnailUrl)
    } else {
      setName('')
      setCategoryId(undefined)
      setYear(undefined)
      setRows([emptyRow()])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing])

  useEffect(() => {
    if (!thumbnail) return
    const url = URL.createObjectURL(thumbnail)
    setThumbPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [thumbnail])

  const setRow = (key: number, level: number, value?: number) => {
    setRows(prev =>
      prev.map(r => {
        if (r.key !== key) return r
        const next = { ...r }
        if (level === 0) {
          next.brandId = value
          next.seriesId = next.modelId = next.subtypeId = undefined
        } else if (level === 1) {
          next.seriesId = value
          next.modelId = next.subtypeId = undefined
        } else if (level === 2) {
          next.modelId = value
          next.subtypeId = undefined
        } else {
          next.subtypeId = value
        }
        return next
      })
    )
  }

  const acceptFile = (kind: 'nested' | 'raw', f: File | undefined | null) => {
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.svg')) {
      setFileError(`Không nhận "${f.name}" — chỉ hỗ trợ file .svg`)
      message.warning(`Chỉ nhận file .svg — "${f.name}" bị từ chối`)
      return
    }
    setFileError(null)
    if (kind === 'nested') {
      setNestedFile(f)
      setRemoveNested(false)
    } else {
      setRawFile(f)
      setRemoveRaw(false)
    }
    if (!name.trim()) setName(f.name.replace(/\.svg$/i, ''))
  }

  // Bản đang có hiệu lực: file mới chọn, hoặc bản cũ chưa bị đánh dấu bỏ (SA §8.2 — ít nhất một)
  const nestedPresent = !!nestedFile || (isEdit && !!editing?.hasNested && !removeNested)
  const rawPresent = !!rawFile || (isEdit && !!editing?.hasRaw && !removeRaw)

  const missing: string[] = []
  if (!name.trim()) missing.push('tên file')
  if (categoryId === undefined) missing.push('danh mục')
  if (!rows.some(r => r.modelId !== undefined)) missing.push('mẫu xe (chọn tới Model)')
  if (!nestedPresent && !rawPresent) missing.push('ít nhất một file .svg')
  const ready = missing.length === 0

  const pathLabel = (r: VehicleRow): string => {
    const ids = [r.brandId, r.seriesId, r.modelId, r.subtypeId].filter(
      (x): x is number => x !== undefined
    )
    const names = ids
      .map(id => nodeMap.get(id)?.node.name)
      .filter((n): n is string => !!n)
    return names.length ? names.join(' › ') : 'Chưa chọn'
  }

  const handleSave = async () => {
    if (!ready || saving) return
    const vehicleNodeIds = rows
      .map(r => r.subtypeId ?? r.modelId)
      .filter((x): x is number => x !== undefined)
    setSaving(true)
    try {
      if (isEdit && editing) {
        await adminFileService.updateFile(editing.id, {
          nestedFile,
          rawFile,
          removeNested: removeNested && !nestedFile,
          removeRaw: removeRaw && !rawFile,
          name: name.trim(),
          categoryId,
          year: year ?? null,
          vehicleNodeIds,
          thumbnail,
        })
        message.success(`Đã cập nhật "${name.trim()}"`)
      } else {
        await adminFileService.createFile({
          nestedFile,
          rawFile,
          name: name.trim(),
          categoryId,
          year,
          vehicleNodeIds,
          thumbnail,
        })
        message.success(`Đã tải lên "${name.trim()}"`)
      }
      onSaved()
      onClose()
    } catch (err) {
      message.error(extractErrorMessage(err, 'Lưu part file thất bại'))
    } finally {
      setSaving(false)
    }
  }

  const levelSelect = (
    row: VehicleRow,
    level: number,
    value: number | undefined,
    parentId?: number
  ) => {
    const meta = LEVEL_META[level]
    const parentMissing = level > 0 && parentId === undefined
    const options = parentMissing ? [] : childrenOf(parentId)
    const disabled = parentMissing || options.length === 0
    const placeholder = parentMissing
      ? `Chọn ${LEVEL_META[level - 1].vi} trước`
      : options.length
        ? `— Chọn ${meta.vi} —`
        : 'Không có'
    return (
      <Select
        key={`${row.key}-${level}`}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        allowClear={!meta.required}
        showSearch
        // Gõ không dấu vẫn khớp: "vinfast", "dong" ra "VinFast", "Dòng…"
        filterOption={(input, option) => foldVi(String(option?.label ?? '')).includes(foldVi(input))}
        notFoundContent="Không có mục khớp"
        onChange={(v?: number) => setRow(row.key, level, v)}
        options={options.map(o => ({ value: o.id, label: o.name }))}
        style={{ width: '100%', minWidth: 0 }}
      />
    )
  }

  const labelStyle: React.CSSProperties = {
    font: `500 11.5px ${FONT}`,
    color: '#35342F',
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={780}
      destroyOnHidden
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, font: `600 12.5px ${FONT}` }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V5" />
            <path d="M7.5 9.5 12 5l4.5 4.5" />
            <path d="M5 19h14" />
          </svg>
          {isEdit ? 'Sửa part file' : 'Upload part file'}
        </span>
      }
      styles={{ body: { background: '#F4F3F0', padding: 16 } }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 260px', gap: 18 }}>
        {/* ── cột trái ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '96px minmax(0, 1fr)', gap: '9px 12px', alignItems: 'center' }}>
            <span style={labelStyle}>
              Tên file <span style={{ color: '#C2452D' }}>*</span>
            </span>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="VD: Camry 2.5Q — Capo"
              style={{ padding: '7px 9px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', outline: 'none', font: `400 12.5px ${FONT}`, color: '#1B1B19' }}
            />
            <span style={labelStyle}>
              Danh mục <span style={{ color: '#C2452D' }}>*</span>
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto 100px', gap: 10, alignItems: 'center' }}>
              <select
                value={categoryId ?? ''}
                onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                style={{ width: '100%', minWidth: 0, padding: '7px 9px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', font: `400 12.5px ${FONT}`, color: '#1B1B19' }}
              >
                <option value="">— Chọn danh mục —</option>
                {categories.map(c => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <span style={labelStyle}>
                Năm <span style={{ fontWeight: 400, color: '#8A8983' }}>(nếu có)</span>
              </span>
              <select
                value={year ?? ''}
                onChange={e => setYear(e.target.value ? Number(e.target.value) : undefined)}
                style={{ width: '100%', minWidth: 0, padding: '7px 9px', border: '1px solid #D8D7D2', borderRadius: 4, background: '#FFF', font: `400 12.5px ${MONO}`, color: '#1B1B19' }}
              >
                <option value="">Không</option>
                {YEARS.map(y => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── mẫu xe: một dòng nối tầng — board 30/09 bỏ Q5, mỗi file một mẫu xe ── */}
          <div style={{ padding: '12px 14px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ font: `600 11.5px ${FONT}`, color: '#1B1B19' }}>Mẫu xe</span>
              <span style={{ font: `400 11px ${FONT}`, color: '#8A8983' }}>
                lấy từ Danh mục xe, chọn lần lượt từ trên xuống
              </span>
            </div>

            {rows.slice(0, 1).map(row => {
              // Đúng design Admin Portal (AP:524–539): lưới 96px | ô chọn, mỗi cấp một hàng —
              // nhãn = badge mã cấp + "bắt buộc"/"nếu có"; đường dẫn ở dưới, có kẻ ngăn.
              const values = [row.brandId, row.seriesId, row.modelId, row.subtypeId]
              const parents = [undefined, row.brandId, row.seriesId, row.modelId]
              return (
                <div key={row.key}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '96px minmax(0, 1fr)',
                      gap: '9px 12px',
                      alignItems: 'center',
                    }}
                  >
                    {LEVEL_META.map((meta, level) => (
                      <Fragment key={meta.code}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              padding: '1px 5px',
                              borderRadius: 3,
                              background: meta.bg,
                              font: "500 9.5px 'IBM Plex Mono', monospace",
                              color: meta.color,
                            }}
                          >
                            {meta.code}
                          </span>
                          <span style={{ font: `400 11px ${FONT}`, color: '#6E6D68' }}>
                            {meta.required ? 'bắt buộc' : 'nếu có'}
                          </span>
                        </span>
                        {levelSelect(row, level, values[level], parents[level])}
                      </Fragment>
                    ))}
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      paddingTop: 9,
                      borderTop: '1px solid #EFEEEA',
                      font: `400 11.5px ${FONT}`,
                      color: '#6E6D68',
                    }}
                  >
                    Đường dẫn:{' '}
                    <span style={{ fontWeight: 500, color: row.modelId ? '#1B1B19' : '#A5A49E' }}>
                      {pathLabel(row)}
                    </span>
                  </div>
                </div>
              )
            })}

          </div>
        </div>

        {/* ── cột phải: file + ảnh ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SvgDropZone
            title="File đã xếp"
            hint="→ vào vùng cắt"
            file={nestedFile}
            existingName={isEdit && editing?.hasNested ? editing.originalFilename || 'bản đã xếp' : null}
            removed={removeNested}
            canRemove={rawPresent}
            dragActive={dragOver === 'nested'}
            onBrowse={() => nestedInputRef.current?.click()}
            onDropFile={f => acceptFile('nested', f)}
            onDragActive={v => setDragOver(v ? 'nested' : null)}
            onClearNew={() => setNestedFile(null)}
            onMarkRemove={() => setRemoveNested(true)}
            onUndoRemove={() => setRemoveNested(false)}
          />
          <SvgDropZone
            title="File chưa xếp"
            hint="→ vào khu chưa cắt"
            file={rawFile}
            existingName={isEdit && editing?.hasRaw ? 'bản chưa xếp' : null}
            removed={removeRaw}
            canRemove={nestedPresent}
            dragActive={dragOver === 'raw'}
            onBrowse={() => rawInputRef.current?.click()}
            onDropFile={f => acceptFile('raw', f)}
            onDragActive={v => setDragOver(v ? 'raw' : null)}
            onClearNew={() => setRawFile(null)}
            onMarkRemove={() => setRemoveRaw(true)}
            onUndoRemove={() => setRemoveRaw(false)}
          />
          <input
            ref={nestedInputRef}
            type="file"
            accept=".svg"
            style={{ display: 'none' }}
            onChange={e => {
              acceptFile('nested', e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <input
            ref={rawInputRef}
            type="file"
            accept=".svg"
            style={{ display: 'none' }}
            onChange={e => {
              acceptFile('raw', e.target.files?.[0])
              e.target.value = ''
            }}
          />
          {fileError && (
            <div style={{ font: `400 11px ${FONT}`, color: '#A93823' }}>{fileError}</div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ font: `500 11px ${FONT}`, color: '#6E6D68' }}>Ảnh xem trước</span>
            <button
              onClick={() => thumbInputRef.current?.click()}
              style={{
                height: 170,
                border: '1px solid #D8D7D2',
                borderRadius: 6,
                background: '#FFF',
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 6,
              }}
            >
              {thumbPreview ? (
                <img src={thumbPreview} alt="thumbnail" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ font: `400 11px ${FONT}`, color: '#A5A49E' }}>Ảnh thumbnail</span>
              )}
            </button>
            <input
              ref={thumbInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                setThumbnail(e.target.files?.[0] || null)
                e.target.value = ''
              }}
            />
          </div>
        </div>
      </div>

      {/* footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          margin: '16px -16px -16px',
          padding: '11px 16px',
          background: '#FBFBFA',
          borderTop: '1px solid #D8D7D2',
          borderRadius: '0 0 8px 8px',
        }}
      >
        <span style={{ font: `400 11px ${FONT}`, color: ready ? '#2E7D5B' : '#8A5A12' }}>
          {ready ? 'Đủ thông tin, bấm Lưu để tải lên.' : `Còn thiếu: ${missing.join(', ')}`}
        </span>
        <button
          onClick={onClose}
          style={{ marginLeft: 'auto', padding: '7px 14px', border: '1px solid #D8D7D2', borderRadius: 5, background: '#FFF', cursor: 'pointer', font: `500 12px ${FONT}`, color: '#35342F' }}
        >
          Huỷ
        </button>
        <button
          onClick={handleSave}
          disabled={!ready || saving}
          style={{
            padding: '7px 16px',
            border: 0,
            borderRadius: 5,
            background: ready && !saving ? '#7C3AED' : '#C9BDEA',
            cursor: ready && !saving ? 'pointer' : 'not-allowed',
            font: `500 12px ${FONT}`,
            color: '#FFF',
          }}
        >
          {saving ? 'Đang lưu…' : 'Lưu'}
        </button>
      </div>
    </Modal>
  )
}
