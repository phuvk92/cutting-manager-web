import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Input, Modal, Table, Tooltip, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation(['vehicles', 'common'])
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0)
      setAppliedQuery(query.trim())
    }, 300)
    return () => clearTimeout(timer)
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
      parentPath: path.slice(0, -1).map(n => n.name).join(' › '),
    })
  }

  const handleDelete = async (node: VehicleNode) => {
    const meta = LEVEL_META[node.level]
    const levelLabel = t(`levels.${node.level}`, { defaultValue: meta.vi })
    try {
      const impact = await vehicleNodeService.getImpact(node.id)
      const nodesPart = impact.nodes > 0 ? t('table.impactNodes', { count: impact.nodes }) : ''
      const parts = [
        t('table.deleteImpactDesc', { name: node.name, nodes: nodesPart }),
        impact.files > 0
          ? t('table.impactFiles', { count: impact.files })
          : t('table.impactNoFiles'),
      ]
      const ok = await modal.confirm({
        title: t('table.deleteTitle', { level: levelLabel.toLowerCase() }),
        content: parts.join(' '),
        okText: t('actions.delete', { ns: 'common' }),
        okButtonProps: { danger: true },
        cancelText: t('actions.cancel', { ns: 'common' }),
      })
      if (!ok) return
      const res = await vehicleNodeService.remove(node.id)
      const unlinkedPart = res.unlinkedFiles > 0 ? t('table.unlinkedMsg', { count: res.unlinkedFiles }) : ''
      message.success(t('table.deleteSuccessMsg', { deleted: res.deletedNodes, unlinked: unlinkedPart }))
      fetchTree()
    } catch (err) {
      message.error(extractErrorMessage(err))
    }
  }

  const columns: ColumnsType<VehicleNode> = [
    {
      title: t('columns.stt'),
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
      title: t('columns.name'),
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
      title: t('columns.children'),
      key: 'children',
      width: 160,
      render: (_: unknown, record: VehicleNode) => {
        const next = nextLevel(record.level)
        const nextLabel = next ? t(`levels.${next.code}`, { defaultValue: next.vi }).toLowerCase() : ''
        return (
          <span style={{ font: "400 11px 'IBM Plex Mono', monospace", color: '#8A8983' }}>
            {record.childCount > 0 && next
              ? `${record.childCount} ${nextLabel}`
              : next
                ? '—'
                : ''}
          </span>
        )
      },
    },
    {
      title: t('columns.actions'),
      key: 'actions',
      width: 220,
      align: 'right',
      render: (_: unknown, record: VehicleNode) => {
        const next = nextLevel(record.level)
        const nextLabel = next ? t(`levels.${next.code}`, { defaultValue: next.vi }).toLowerCase() : ''
        return (
          <span style={{ display: 'inline-flex', justifyContent: 'flex-end', gap: 4 }}>
            {next && (
              <Tooltip title={t('table.addSubLevel', { level: nextLabel, name: record.name })}>
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
            <Tooltip title={t('table.editTooltip')}>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={e => {
                  e.stopPropagation()
                  openEdit(record)
                }}
              />
            </Tooltip>
            <Tooltip title={t('table.deleteTooltip')}>
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
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openAdd(null)}
            style={{ background: '#7C3AED' }}
          >
            {t('addBrand')}
          </Button>
          <span style={{ font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#8A8983' }}>
            {t('hint')}
          </span>
          <Input
            prefix={<SearchOutlined style={{ color: '#8A8983' }} />}
            placeholder={t('searchPlaceholder')}
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
            showTotal: totalCount => t('table.totalBrands', { total: totalCount }),
            onChange: (p, s) => {
              setPage(p - 1)
              setSize(s)
            },
          }}
          locale={{ emptyText: appliedQuery ? t('table.noMatch', { query: appliedQuery }) : t('table.noBrands') }}
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
