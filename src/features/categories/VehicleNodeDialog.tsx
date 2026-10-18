import React, { useEffect, useState } from 'react'
import { Modal, Input, Alert } from 'antd'
import axios, { AxiosError } from 'axios'
import { ErrorResponse } from '@/types/common'
import { VehicleNode } from '@/types/vehicleNode'
import { vehicleNodeService } from '@/services/vehicle/vehicleNodeService'
import { LEVEL_META } from './vehicleLevels'
import { extractErrorMessage } from '@/utils/error'

export interface VehicleNodeDialogProps {
  open: boolean
  /** null = thêm hãng mới; có node = thêm con (add) hoặc đổi tên (edit) */
  mode: 'add' | 'edit'
  /** node đang sửa (mode=edit) — level/parent lấy từ node này */
  node?: VehicleNode | null
  /** node cha khi thêm con; null khi thêm hãng */
  parent?: VehicleNode | null
  /** level của node mới khi mode=add (suy từ cha hoặc BRAND) */
  level: keyof typeof LEVEL_META
  parentPath: string
  zIndex?: number
  onClose: () => void
  onSaved: (createdNode?: VehicleNode) => void
}

export const VehicleNodeDialog: React.FC<VehicleNodeDialogProps> = ({
  open,
  mode,
  node,
  parent,
  level,
  parentPath,
  zIndex,
  onClose,
  onSaved,
}) => {
  const meta = LEVEL_META[level]
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(mode === 'edit' && node ? node.name : '')
      setError(null)
    }
  }, [open, mode, node])

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed || saving) return
    setSaving(true)
    setError(null)
    try {
      let created: VehicleNode | undefined
      if (mode === 'edit' && node) {
        await vehicleNodeService.rename(node.id, { name: trimmed })
      } else {
        const parentId = (parent?.id ?? node?.id) ?? null
        created = await vehicleNodeService.create({ parentId, name: trimmed })
      }
      onSaved(created)
      onClose()
    } catch (err) {
      // 409 NODE_NAME_TAKEN — trùng tên trong cùng cha
      const code = axios.isAxiosError(err)
        ? (err as AxiosError<ErrorResponse>).response?.data?.code
        : undefined
      setError(
        code === 'NODE_NAME_TAKEN'
          ? `Đã có ${meta.vi.toLowerCase()} tên "${trimmed}" trong cùng mục cha.`
          : extractErrorMessage(err)
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      zIndex={zIndex}
      title={`${mode === 'add' ? 'Thêm' : 'Sửa'} ${meta.vi.toLowerCase()}`}
      okText="Lưu"
      cancelText="Huỷ"
      onCancel={onClose}
      onOk={save}
      confirmLoading={saving}
      okButtonProps={{ disabled: name.trim() === '', style: { background: '#7C3AED' } }}
      width={420}
      destroyOnHidden
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '70px 1fr',
          gap: '8px 10px',
          alignItems: 'center',
          padding: '10px 12px',
          margin: '12px 0',
          background: '#FBFBFA',
          border: '1px solid #E4E3DE',
          borderRadius: 5,
        }}
      >
        <span style={{ font: "500 11px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>Cấp</span>
        <span>
          <span
            style={{
              padding: '2px 7px',
              borderRadius: 3,
              background: meta.bg,
              font: "500 10.5px 'IBM Plex Mono', monospace",
              color: meta.color,
            }}
          >
            {meta.code} · {meta.vi}
          </span>
        </span>
        <span style={{ font: "500 11px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>Thuộc</span>
        <span style={{ font: "400 12px 'IBM Plex Sans', sans-serif", color: '#35342F' }}>
          {parentPath || '— (gốc)'}
        </span>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ font: "500 11px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>Tên</span>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          onPressEnter={save}
          placeholder={meta.ph}
          autoFocus
        />
      </label>

      {error && <Alert type="error" showIcon message={error} style={{ marginTop: 10 }} />}
    </Modal>
  )
}
