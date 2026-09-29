import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Input, Modal, Table, Tooltip, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { PageHeader } from '@/components/common/PageHeader'
import { VehicleNodeDialog } from '@/features/categories/VehicleNodeDialog'
import { LEVEL_META, nextLevel } from '@/features/categories/vehicleLevels'
import { vehicleNodeService } from '@/services/vehicle/vehicleNodeService'
import { VehicleNode } from '@/types/vehicleNode'
import { extractErrorMessage } from '@/utils/error'

interface DialogState {
  mode: 'add' | 'edit'
  /** edit: node đang sửa · add: node cha (null = thêm hãng) */
  node: VehicleNode | null
  parentPath: string
}

const collectIds = (nodes: VehicleNode[], out: React.Key[] = []): React.Key[] => {
  for (const n of nodes) {
    out.push(n.id)
    if (n.children?.length) collectIds(n.children, out)
  }
  return out
}

const findPath = (nodes: VehicleNode[], id: number, trail: VehicleNode[] = []): VehicleNode[] | null => {
  for (const n of nodes) {
    const t = [...trail, n]
    if (n.id === id) return t
    const r = n.children?.length ? findPath(n.children, id, t) : null
    if (r) return r
  }
  return null
}

export const CategoriesPage: React.FC = () => {
  const [brands, setBrands] = useState<VehicleNode[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([])
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [modal, contextHolder] = Modal.useModal()

  const fetchTree = useCallback(async () => {
    setLoading(true)
    try {
      const res = await vehicleNodeService.getTree({
        q: appliedQuery || undefined,
        page,
        size,
      })
      setBrands(res.content)
      setTotal(res.totalElements)
      // Mở hết nhánh sau mỗi lần tải: khi tìm kiếm server trả node khớp kèm tổ tiên (đúng design),
      // khi vừa thêm/sửa/xoá thì giữ ngữ cảnh đang nhìn
      setExpandedRowKeys(collectIds(res.content))
    } catch (err) {
      message.error(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [appliedQuery, page, size])

  useEffect(() => {
    fetchTree()
  }, [fetchTree])

  // Gõ tìm → debounce rồi lọc server-side
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0)
      setAppliedQuery(query.trim())
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const brandNumbers = useMemo(() => {
    const map = new Map<number, number>()
    brands.forEach((b, i) => map.set(b.id, page * size + i + 1))
    return map
  }, [brands, page, size])

  const openAdd = (parent: VehicleNode | null) => {
    const path = parent
      ? (findPath(brands, parent.id) ?? [parent]).map(n => n.name).join(' › ')
      : ''
    setDialog({ mode: 'add', node: parent, parentPath: path })
  }

  const openEdit = (node: VehicleNode) => {
    const path = findPath(brands, node.id) ?? []
    setDialog({
      mode: 'edit',
      node,
      // "Thuộc" là đường dẫn cha, không gồm chính node
      parentPath: path.slice(0, -1).map(n => n.name).join(' › '),
    })
  }

  const handleDelete = async (node: VehicleNode) => {
    const meta = LEVEL_META[node.level]
    try {
      const impact = await vehicleNodeService.getImpact(node.id)
      const parts = [
        `Xoá «${node.name}»${impact.nodes > 0 ? ` và ${impact.nodes} mục con` : ''}.`,
        impact.files > 0
          ? `${impact.files} file sẽ mất liên kết mẫu xe (file vẫn còn trong kho).`
          : 'Không có file nào gắn nhánh này.',
      ]
      const ok = await modal.confirm({
        title: `Xoá ${meta.vi.toLowerCase()}?`,
        content: parts.join(' '),
        okText: 'Xoá',
        okButtonProps: { danger: true },
        cancelText: 'Huỷ',
      })
      if (!ok) return
      const res = await vehicleNodeService.remove(node.id)
      message.success(
        `Đã xoá ${res.deletedNodes} mục` +
          (res.unlinkedFiles > 0 ? ` · ${res.unlinkedFiles} file mất liên kết` : '')
      )
      fetchTree()
    } catch (err) {
      message.error(extractErrorMessage(err))
    }
  }

  const columns: ColumnsType<VehicleNode> = [
    {
      title: 'STT',
      key: 'stt',
      width: 64,
      render: (_: unknown, record: VehicleNode) =>
        record.level === 'BRAND' ? (
          <span style={{ font: "400 11.5px 'IBM Plex Mono', monospace", color: '#8A8983' }}>
            {brandNumbers.get(record.id)}
          </span>
        ) : null,
    },
    {
      title: 'TÊN',
      key: 'name',
      render: (_: unknown, record: VehicleNode) => {
        const meta = LEVEL_META[record.level]
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
            <span
              style={{
                padding: '1px 6px',
                borderRadius: 3,
                background: meta.bg,
                font: "500 10px 'IBM Plex Mono', monospace",
                color: meta.color,
                flex: 'none',
              }}
            >
              {meta.code}
            </span>
            <span
              style={{
                font:
                  record.level === 'BRAND'
                    ? "600 12.5px 'IBM Plex Sans', sans-serif"
                    : "400 12px 'IBM Plex Sans', sans-serif",
                color: record.level === 'SUBTYPE' || record.level === 'MODEL' ? '#4A4945' : '#1B1B19',
              }}
            >
              {record.name}
            </span>
          </span>
        )
      },
    },
    {
      title: 'MỤC CON',
      key: 'children',
      width: 160,
      render: (_: unknown, record: VehicleNode) => {
        const next = nextLevel(record.level)
        return (
          <span style={{ font: "400 11px 'IBM Plex Mono', monospace", color: '#8A8983' }}>
            {record.childCount > 0 && next
              ? `${record.childCount} ${next.vi.toLowerCase()}`
              : next
                ? '—'
                : ''}
          </span>
        )
      },
    },
    {
      title: 'THAO TÁC',
      key: 'actions',
      width: 220,
      align: 'right',
      render: (_: unknown, record: VehicleNode) => {
        const next = nextLevel(record.level)
        return (
          <span style={{ display: 'inline-flex', justifyContent: 'flex-end', gap: 4 }}>
            {next && (
              <Tooltip title={`Thêm ${next.vi.toLowerCase()} dưới ${record.name}`}>
                <Button
                  size="small"
                  onClick={e => {
                    e.stopPropagation()
                    openAdd(record)
                  }}
                  style={{ font: "500 10.5px 'IBM Plex Sans', sans-serif", color: '#6C3BD6' }}
                >
                  + {next.code}
                </Button>
              </Tooltip>
            )}
            <Tooltip title="Sửa">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={e => {
                  e.stopPropagation()
                  openEdit(record)
                }}
              />
            </Tooltip>
            <Tooltip title="Xoá (xoá luôn mục con)">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={e => {
                  e.stopPropagation()
                  handleDelete(record)
                }}
              />
            </Tooltip>
          </span>
        )
      },
    },
  ]

  const dialogLevel =
    dialog?.mode === 'edit'
      ? dialog.node!.level
      : dialog?.node
        ? nextLevel(dialog.node.level)!.code
        : 'BRAND'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <style>{`.cat-brand-row > td { background: #FBFBFA !important; }`}</style>
      {contextHolder}
      <PageHeader
        title="Danh mục xe"
        subtitle="Cây 4 cấp Brand › Series › Model › SubType — danh mục và năm chọn khi upload file"
      />
      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openAdd(null)}
            style={{ background: '#7C3AED' }}
          >
            Thêm hãng
          </Button>
          <span style={{ font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#8A8983' }}>
            Cây 4 cấp{' '}
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#4A4945' }}>
              Brand › Series › Model › SubType
            </span>
            . Danh mục và Năm chọn khi upload file mẫu.
          </span>
          <Input
            prefix={<SearchOutlined style={{ color: '#8A8983' }} />}
            placeholder="Tìm hãng, dòng, model…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            allowClear
            style={{ marginLeft: 'auto', width: 260 }}
          />
        </div>

        <Table<VehicleNode>
          columns={columns}
          dataSource={brands}
          rowKey="id"
          loading={loading}
          size="middle"
          rowClassName={record => (record.level === 'BRAND' ? 'cat-brand-row' : '')}
          expandable={{
            expandedRowKeys,
            onExpandedRowsChange: keys => setExpandedRowKeys(keys as React.Key[]),
            expandIconColumnIndex: 1,
            childrenColumnName: 'children',
          }}
          pagination={{
            current: page + 1,
            pageSize: size,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: t => `Tổng ${t} hãng`,
            onChange: (p, s) => {
              setPage(p - 1)
              setSize(s)
            },
          }}
          locale={{ emptyText: appliedQuery ? `Không có mục nào khớp "${appliedQuery}".` : 'Chưa có hãng nào.' }}
        />
      </div>

      {dialog && (
        <VehicleNodeDialog
          open
          mode={dialog.mode}
          node={dialog.node}
          level={dialogLevel}
          parentPath={dialog.parentPath}
          onClose={() => setDialog(null)}
          onSaved={fetchTree}
        />
      )}
    </div>
  )
}
