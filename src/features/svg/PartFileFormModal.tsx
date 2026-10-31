import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, Select, Button, Tooltip, message, Spin } from 'antd'
import { svgService } from '@/services/svg/svgService'
import { PlusOutlined } from '@ant-design/icons'
import { AdminFile } from '@/types/adminFile'
import { VehicleNode, VehicleLevel } from '@/types/vehicleNode'
import { CatalogOption } from '@/types/category'
import { adminFileService } from '@/services/admin/adminFileService'
import { vehicleNodeService } from '@/services/admin/vehicleNodeService'
import { partLibraryCategoryService } from '@/services/admin/partLibraryCategoryService'
import { extractErrorMessage } from '@/utils/error'
import { validateCutArea } from './cutAreaSchema'
import { useAuthStore } from '@/stores/authStore'
import { VehicleNodeDialog } from '@/features/categories/VehicleNodeDialog'
import {
  FILM_WIDTH_PRESETS_MM,
  FORM_DEFAULT_FILM_WIDTH_MM,
  DEFAULT_CUT_AREA_LENGTH_MM,
} from '@/constants/cutArea'

const FONT = "'IBM Plex Sans', sans-serif"
const MONO = "'IBM Plex Mono', monospace"

const LEVEL_META = [
  { code: 'BRAND', vi: 'hãng', en: 'brand', label: 'Hãng', bg: '#EEF3FC', color: '#2F5BA8', required: true },
  { code: 'SERIES', vi: 'dòng xe', en: 'series', label: 'Dòng xe', bg: '#E9F5EE', color: '#2E7D5B', required: true },
  { code: 'MODEL', vi: 'model', en: 'model', label: 'Model', bg: '#FBF0DF', color: '#8A5A12', required: false },
  { code: 'SUBTYPE', vi: 'phiên bản', en: 'version', label: 'Phiên bản', bg: '#FAE7E3', color: '#A93823', required: false },
]

const ADD_TOOLTIPS: Record<string, string> = {
  BRAND: 'Thêm hãng xe',
  SERIES: 'Thêm dòng xe',
  MODEL: 'Thêm model xe',
  SUBTYPE: 'Thêm phiên bản xe',
}

/** Bỏ dấu + chữ thường để tìm tiếng Việt không cần gõ dấu (đ → d). */
const foldVi = (text: string): string =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase()

/** Đảm bảo file SVG luôn có MIME type image/svg+xml khi tạo object URL */
const createSvgBlobUrl = (file: File | Blob): string => {
  if (file.type === 'image/svg+xml') {
    return URL.createObjectURL(file)
  }
  const typedBlob = new Blob([file], { type: 'image/svg+xml' })
  return URL.createObjectURL(typedBlob)
}

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
  onTreeReload?: () => void
}

interface NodeDialogState {
  mode: 'add'
  level: VehicleLevel
  node: VehicleNode | null
  parent: VehicleNode | null
  parentPath: string
  targetLevel: VehicleLevel
  targetRowKey: number
}

let rowSeq = 1
const emptyRow = (): VehicleRow => ({ key: rowSeq++ })

/** Giá trị combobox khổ phim: một khổ chuẩn, hoặc 'custom' mở ô gõ số. */
const CUSTOM_WIDTH = 'custom' as const
type WidthChoice = number | typeof CUSTOM_WIDTH

/** Ô số nhập tay — chuỗi rỗng là "thiếu", không phải 0. */
const parseMm = (s: string): number => (s.trim() === '' ? NaN : Number(s))

interface SvgDropZoneProps {
  title: string
  hint: string
  /** File .svg mới chọn (chưa lưu) */
  file: File | null
  /** Tên bản đang có trên server (chế độ sửa); null = chưa có */
  existingName: string | null
  /** Đã đánh dấu bỏ bản đang có */
  removed: boolean
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
                style={smallBtn}
                title="Bỏ bản đang có"
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
  onTreeReload,
}) => {
  const { t, i18n } = useTranslation(["parts", "common"])
  const isEn = i18n.language === "en" 
  const isEdit = !!editing
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'

  const [treeSelf, setTreeSelf] = useState<VehicleNode[]>([])
  const [categoriesSelf, setCategoriesSelf] = useState<CatalogOption[]>([])
  const [nodeDialog, setNodeDialog] = useState<NodeDialogState | null>(null)

  useEffect(() => {
    if (!open) return
    if (!treeProp?.length) {
      vehicleNodeService.getBrandTrees().then(setTreeSelf).catch(() => {})
    } else {
      setTreeSelf(treeProp)
    }
    if (!categoriesProp?.length) {
      partLibraryCategoryService.getActiveCategories().then(cats => {
        setCategoriesSelf(cats.map(c => ({ value: String(c.id), label: c.name })))
      }).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, treeProp])

  const tree = treeSelf.length ? treeSelf : (treeProp || [])
  const categories = categoriesProp && categoriesProp.length ? categoriesProp : categoriesSelf

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
  const [previewLoading, setPreviewLoading] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  const [widthChoice, setWidthChoice] = useState<WidthChoice>(FORM_DEFAULT_FILM_WIDTH_MM)
  const [widthCustom, setWidthCustom] = useState('')
  const [cutLength, setCutLength] = useState(String(DEFAULT_CUT_AREA_LENGTH_MM))
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
    setNodeDialog(null)
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
      // Khổ đang lưu: trùng khổ chuẩn → chọn sẵn; lạ → "Khổ khác…"; chưa khai → chọn sẵn 1520/15000
      const w = editing.cutAreaWidthMm
      if (w == null) {
        setWidthChoice(FORM_DEFAULT_FILM_WIDTH_MM)
        setWidthCustom('')
      } else if (FILM_WIDTH_PRESETS_MM.includes(w)) {
        setWidthChoice(w)
        setWidthCustom('')
      } else {
        setWidthChoice(CUSTOM_WIDTH)
        setWidthCustom(String(w))
      }
      setCutLength(String(editing.cutAreaLengthMm ?? DEFAULT_CUT_AREA_LENGTH_MM))
    } else {
      setName('')
      setCategoryId(undefined)
      setYear(undefined)
      setRows([emptyRow()])
      setWidthChoice(FORM_DEFAULT_FILM_WIDTH_MM)
      setWidthCustom('')
      setCutLength(String(DEFAULT_CUT_AREA_LENGTH_MM))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing])

  // Quản lý xem trước SVG / Thumbnail phản ứng nhanh với mọi thay đổi nguồn
  useEffect(() => {
    let active = true
    let currentBlobUrl: string | null = null

    setImgFailed(false)

    // 1. Người dùng chọn ảnh thumbnail mới
    if (thumbnail) {
      const url = URL.createObjectURL(thumbnail)
      currentBlobUrl = url
      setThumbPreview(url)
      setPreviewLoading(false)
      return () => {
        URL.revokeObjectURL(url)
      }
    }

    // 2. Người dùng chọn file SVG mới (nestedFile hoặc rawFile)
    const newSvg = (!removeNested && nestedFile) || (!removeRaw && rawFile)
    if (newSvg) {
      const url = createSvgBlobUrl(newSvg)
      currentBlobUrl = url
      setThumbPreview(url)
      setPreviewLoading(false)
      return () => {
        URL.revokeObjectURL(url)
      }
    }

    // 3. Chế độ sửa: tải file SVG hiện có từ server (hoặc thumbnailUrl nếu có)
    if (open && isEdit && editing?.id) {
      const fileId = editing.id
      const thumbUrl = editing.thumbnailUrl

      setPreviewLoading(true)
      setThumbPreview(null)

      const loadExisting = async () => {
        try {
          let url: string
          if (thumbUrl) {
            try {
              url = await svgService.getThumbnailBlobUrl(thumbUrl)
            } catch {
              url = await svgService.getPreviewBlobUrl(fileId)
            }
          } else {
            url = await svgService.getPreviewBlobUrl(fileId)
          }

          if (active) {
            currentBlobUrl = url
            setThumbPreview(url)
            setPreviewLoading(false)
          } else {
            URL.revokeObjectURL(url)
          }
        } catch {
          if (active) {
            setThumbPreview(null)
            setPreviewLoading(false)
          }
        }
      }

      loadExisting()

      return () => {
        active = false
        if (currentBlobUrl) {
          URL.revokeObjectURL(currentBlobUrl)
        }
      }
    }

    // 4. Mặc định chưa có file nào
    setThumbPreview(null)
    setPreviewLoading(false)

    return () => {
      active = false
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl)
      }
    }
  }, [open, isEdit, editing?.id, editing?.thumbnailUrl, thumbnail, nestedFile, rawFile, removeNested, removeRaw])

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

  const handleOpenAddNode = (level: number, row: VehicleRow) => {
    if (!isAdmin) return

    if (level === 0) {
      // BRAND: Thêm hãng xe
      setNodeDialog({
        mode: 'add',
        level: 'BRAND',
        node: null,
        parent: null,
        parentPath: '',
        targetLevel: 'BRAND',
        targetRowKey: row.key,
      })
      return
    }

    if (level === 1) {
      // SERIES: Thêm dòng xe
      if (!row.brandId) {
        message.warning(t('modal.warnings.selectBrandFirstForSeries'))
        return
      }
      const brandNode = nodeMap.get(row.brandId)?.node
      if (!brandNode) {
        message.warning(t('modal.warnings.brandNotFound'))
        return
      }
      setNodeDialog({
        mode: 'add',
        level: 'SERIES',
        node: brandNode,
        parent: brandNode,
        parentPath: brandNode.name,
        targetLevel: 'SERIES',
        targetRowKey: row.key,
      })
      return
    }

    if (level === 2) {
      // MODEL: Thêm model xe
      if (!row.brandId) {
        message.warning(t('modal.warnings.selectBrandFirstForModel'))
        return
      }
      if (!row.seriesId) {
        message.warning(t('modal.warnings.selectSeriesFirstForModel'))
        return
      }
      const brandNode = nodeMap.get(row.brandId)?.node
      const seriesNode = nodeMap.get(row.seriesId)?.node
      if (!seriesNode) {
        message.warning(t('modal.warnings.seriesNotFound'))
        return
      }
      const path = [brandNode?.name, seriesNode.name].filter(Boolean).join(' › ')
      setNodeDialog({
        mode: 'add',
        level: 'MODEL',
        node: seriesNode,
        parent: seriesNode,
        parentPath: path,
        targetLevel: 'MODEL',
        targetRowKey: row.key,
      })
      return
    }

    if (level === 3) {
      // SUBTYPE: Thêm phiên bản xe
      if (!row.brandId) {
        message.warning(t('modal.warnings.selectBrandFirstForYear'))
        return
      }
      if (!row.seriesId) {
        message.warning(t('modal.warnings.selectSeriesFirstForYear'))
        return
      }
      if (!row.modelId) {
        message.warning(t('modal.warnings.selectModelFirstForYear'))
        return
      }
      const brandNode = nodeMap.get(row.brandId)?.node
      const seriesNode = nodeMap.get(row.seriesId)?.node
      const modelNode = nodeMap.get(row.modelId)?.node
      if (!modelNode) {
        message.warning(t('modal.warnings.modelNotFound'))
        return
      }
      const path = [brandNode?.name, seriesNode?.name, modelNode.name].filter(Boolean).join(' › ')
      setNodeDialog({
        mode: 'add',
        level: 'SUBTYPE',
        node: modelNode,
        parent: modelNode,
        parentPath: path,
        targetLevel: 'SUBTYPE',
        targetRowKey: row.key,
      })
      return
    }
  }

  const handleNodeSaved = async (created?: VehicleNode) => {
    if (!created || !nodeDialog) return
    const { targetLevel, targetRowKey } = nodeDialog

    try {
      // 1. Tải lại cây xe từ backend API thật
      const freshTree = await vehicleNodeService.getBrandTrees()
      setTreeSelf(freshTree)
      onTreeReload?.()

      // 2. Tự động chọn bản ghi vừa tạo theo ID trả về
      const levelIdx = LEVEL_META.findIndex(l => l.code === targetLevel)
      if (levelIdx >= 0) {
        setRow(targetRowKey, levelIdx, created.id)
      }

      // 3. Thông báo thành công
      const levelMeta = LEVEL_META.find(l => l.code === targetLevel)
      message.success(t('modal.nodeAddedSuccess', { level: isEn ? (levelMeta?.en || '') : (levelMeta?.vi.toLowerCase() || ''), name: created.name }))
    } catch (err) {
      message.error(extractErrorMessage(err, t('modal.nodeUpdateError')))
    } finally {
      setNodeDialog(null)
    }
  }

  const acceptFile = (kind: 'nested' | 'raw', f: File | undefined | null) => {
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.svg')) {
      setFileError(t('modal.warnings.svgOnlyRejected', { name: f.name }))
      message.warning(t('modal.warnings.svgOnlyRejected', { name: f.name }))
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

  const cutLengthMm = parseMm(cutLength)
  const widthMm = widthChoice === CUSTOM_WIDTH ? parseMm(widthCustom) : widthChoice
  // Lỗi zod tính mỗi render — hai ô luôn có mặc định nên chỉ báo khi admin sửa sai
  const cutErrors = validateCutArea(cutLengthMm, widthMm)

  const missing: string[] = []
  if (!name.trim()) missing.push(t('modal.missingFileName'))
  if (categoryId === undefined) missing.push(t('modal.missingCategory'))
  const ready = missing.length === 0 && !cutErrors.length && !cutErrors.width

  const pathLabel = (r: VehicleRow): string => {
    const ids = [r.brandId, r.seriesId, r.modelId, r.subtypeId].filter(
      (x): x is number => x !== undefined
    )
    const names = ids
      .map(id => nodeMap.get(id)?.node.name)
      .filter((n): n is string => !!n)
    return names.length ? names.join(' › ') : t('modal.notSelected')
  }

  const handleSave = async () => {
    if (!ready || saving) return
    const vehicleNodeIds = rows
      .map(r => r.subtypeId ?? r.modelId ?? r.seriesId ?? r.brandId)
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
          cutAreaLengthMm: cutLengthMm,
          cutAreaWidthMm: widthMm,
        })
        message.success(t('modal.updateSuccess', { name: name.trim() }))
      } else {
        await adminFileService.createFile({
          nestedFile,
          rawFile,
          name: name.trim(),
          categoryId,
          year,
          vehicleNodeIds,
          thumbnail,
          cutAreaLengthMm: cutLengthMm,
          cutAreaWidthMm: widthMm,
        })
        message.success(t('modal.uploadSuccess', { name: name.trim() }))
      }
      onSaved()
      onClose()
    } catch (err) {
      message.error(extractErrorMessage(err, t('modal.saveFailed')))
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
        allowClear={true}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 24 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, font: `600 12.5px ${FONT}` }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V5" />
              <path d="M7.5 9.5 12 5l4.5 4.5" />
              <path d="M5 19h14" />
            </svg>
            {isEdit ? 'Sửa part file' : 'Upload part file'}
          </span>
          <span style={{ fontSize: 11, color: '#8A8983', fontWeight: 400 }}>
            {t('labels.requiredLegend', { ns: 'common', defaultValue: '* Trường bắt buộc' })}
          </span>
        </div>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {levelSelect(row, level, values[level], parents[level])}
                          </div>
                          {isAdmin && (
                            <Tooltip title={ADD_TOOLTIPS[meta.code]}>
                              <Button
                                danger
                                type="default"
                                size="middle"
                                onClick={() => handleOpenAddNode(level, row)}
                                icon={<PlusOutlined style={{ color: '#DC2626', fontSize: 13, fontWeight: 'bold' }} />}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 32,
                                  height: 32,
                                  flexShrink: 0,
                                  borderColor: '#FCA5A5',
                                  background: '#FEF2F2',
                                  borderRadius: 4,
                                }}
                              />
                            </Tooltip>
                          )}
                        </div>
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
                    <span style={{ fontWeight: 500, color: (row.subtypeId || row.modelId || row.seriesId || row.brandId) ? '#1B1B19' : '#A5A49E' }}>
                      {pathLabel(row)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── khổ cắt: khổ phim chọn từ khổ chuẩn cuộn PPF, dài cuộn admin quyết (board 02/10) ── */}
          <div style={{ padding: '12px 14px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ font: `600 11.5px ${FONT}`, color: '#1B1B19' }}>Khổ cắt (vùng cắt)</span>
              <span style={{ font: `400 11px ${FONT}`, color: '#8A8983' }}>
                bản cắt xếp trong khung này, đơn vị mm
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '96px minmax(0, 1fr)', gap: '9px 12px', alignItems: 'start' }}>
              <span style={{ ...labelStyle, paddingTop: 6 }}>
                Khổ phim <span style={{ fontWeight: 400, color: '#8A8983' }}>(trục Y)</span>
              </span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Select
                    value={widthChoice}
                    onChange={(v: WidthChoice) => setWidthChoice(v)}
                    options={[
                      ...FILM_WIDTH_PRESETS_MM.map(w => ({ value: w as WidthChoice, label: `${w} mm` })),
                      { value: CUSTOM_WIDTH as WidthChoice, label: 'Khổ khác…' },
                    ]}
                    style={{ width: 140 }}
                  />
                  {widthChoice === CUSTOM_WIDTH && (
                    <>
                      <input
                        type="number"
                        value={widthCustom}
                        onChange={e => setWidthCustom(e.target.value)}
                        placeholder="VD: 900"
                        style={{ width: 110, padding: '5px 9px', border: `1px solid ${cutErrors.width ? '#C2452D' : '#D8D7D2'}`, borderRadius: 4, background: '#FFF', outline: 'none', font: `400 12.5px ${MONO}`, color: '#1B1B19' }}
                      />
                      <span style={{ font: `400 11px ${FONT}`, color: '#8A8983' }}>mm</span>
                    </>
                  )}
                </div>
                {cutErrors.width && (
                  <div style={{ marginTop: 4, font: `400 11px ${FONT}`, color: '#A93823' }}>{cutErrors.width}</div>
                )}
              </div>

              <span style={{ ...labelStyle, paddingTop: 6 }}>
                Dài dọc cuộn <span style={{ fontWeight: 400, color: '#8A8983' }}>(trục X)</span>
              </span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    value={cutLength}
                    onChange={e => setCutLength(e.target.value)}
                    style={{ width: 140, padding: '5px 9px', border: `1px solid ${cutErrors.length ? '#C2452D' : '#D8D7D2'}`, borderRadius: 4, background: '#FFF', outline: 'none', font: `400 12.5px ${MONO}`, color: '#1B1B19' }}
                  />
                  <span style={{ font: `400 11px ${FONT}`, color: '#8A8983' }}>mm</span>
                </div>
                {cutErrors.length && (
                  <div style={{ marginTop: 4, font: `400 11px ${FONT}`, color: '#A93823' }}>{cutErrors.length}</div>
                )}
              </div>
            </div>
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
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ font: `500 11px ${FONT}`, color: '#6E6D68' }}>Ảnh xem trước (SVG / Thumbnail)</span>
              {thumbPreview && (
                <span style={{ font: `400 10.5px ${FONT}`, color: '#8A8983' }}>
                  {thumbnail
                    ? 'Ảnh thumbnail mới'
                    : nestedFile || rawFile
                    ? 'Từ SVG mới chọn'
                    : 'Từ SVG hiện có'}
                </span>
              )}
            </div>
            <div
              onClick={() => thumbInputRef.current?.click()}
              title="Nhấn để tải lên ảnh thumbnail riêng (tuỳ chọn)"
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
                padding: 8,
                position: 'relative',
              }}
            >
              {previewLoading ? (
                <Spin tip="Đang tải preview..." />
              ) : thumbPreview ? (
                !imgFailed ? (
                  <img
                    src={thumbPreview}
                    alt="preview"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                    onError={() => setImgFailed(true)}
                  />
                ) : (
                  <object
                    data={thumbPreview}
                    type="image/svg+xml"
                    style={{ maxWidth: '100%', maxHeight: '100%', pointerEvents: 'none' }}
                    aria-label="SVG Preview"
                  >
                    <span style={{ font: `400 11px ${FONT}`, color: '#A5A49E' }}>Không thể hiển thị SVG</span>
                  </object>
                )
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C9C8C3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3.5" y="4" width="17" height="16" rx="2" />
                    <circle cx="9" cy="10" r="1.6" />
                    <path d="M20 15.5 15.5 11 6.5 20" />
                  </svg>
                  <span style={{ font: `400 11px ${FONT}`, color: '#A5A49E' }}>Chưa có preview</span>
                  <span style={{ font: `400 10px ${FONT}`, color: '#C6C5BF' }}>Chọn file SVG hoặc nhấn để chọn ảnh</span>
                </div>
              )}
            </div>
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
            {thumbnail && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setThumbnail(null)
                  }}
                  style={{
                    padding: '2px 8px',
                    border: '1px solid #D8D7D2',
                    borderRadius: 4,
                    background: '#FFF',
                    cursor: 'pointer',
                    font: `400 10.5px ${FONT}`,
                    color: '#A93823',
                  }}
                >
                  Xoá ảnh thumbnail đã chọn
                </button>
              </div>
            )}
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

      {nodeDialog && (
        <VehicleNodeDialog
          open
          mode="add"
          node={nodeDialog.node}
          parent={nodeDialog.parent}
          level={nodeDialog.level}
          parentPath={nodeDialog.parentPath}
          zIndex={1100}
          onClose={() => setNodeDialog(null)}
          onSaved={handleNodeSaved}
        />
      )}
    </Modal>
  )
}
