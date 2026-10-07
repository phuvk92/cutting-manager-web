import React, { useEffect, useState } from 'react'
import { Modal, Button, Space, Spin, Alert, Empty, Tooltip } from 'antd'
import {
  DownloadOutlined,
  FileImageOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  RedoOutlined,
} from '@ant-design/icons'
import { userSavedFileService } from '@/services/userSavedFile/userSavedFileService'
import { normalizeSvgFilename } from '@/utils/formatters'

interface UserSavedFilePreviewModalProps {
  fileId: number | null
  title?: string
  open: boolean
  onClose: () => void
}

export const UserSavedFilePreviewModal: React.FC<UserSavedFilePreviewModalProps> = ({
  fileId,
  title,
  open,
  onClose,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    let active = true
    let currentUrl: string | null = null

    if (open && fileId !== null) {
      setLoading(true)
      setError(null)
      setScale(1)
      userSavedFileService
        .getPreviewBlobUrl(fileId)
        .then(url => {
          if (active) {
            currentUrl = url
            setBlobUrl(url)
            setLoading(false)
          } else {
            URL.revokeObjectURL(url)
          }
        })
        .catch(err => {
          if (active) {
            setError(err?.message || 'Không thể hiển thị xem trước SVG')
            setLoading(false)
          }
        })
    } else {
      setBlobUrl(null)
      setError(null)
      setLoading(false)
      setScale(1)
    }

    return () => {
      active = false
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }
    }
  }, [open, fileId])

  if (fileId === null) return null

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 3))
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.5))
  const handleResetZoom = () => setScale(1)

  return (
    <Modal
      title={
        <div className="saved-files-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: '1 1 auto' }}>
            <FileImageOutlined style={{ color: '#7C3AED', fontSize: 16, flexShrink: 0 }} />
            <span
              style={{
                fontWeight: 600,
                fontSize: 14,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 420,
              }}
              title={title || `Bản vẽ #${fileId}`}
            >
              {title || `Bản vẽ #${fileId}`}
            </span>
          </div>
          <Space size={6} style={{ flexShrink: 0 }}>
            <Tooltip title="Thu nhỏ">
              <Button size="small" icon={<ZoomOutOutlined />} onClick={handleZoomOut} disabled={scale <= 0.5} />
            </Tooltip>
            <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", minWidth: 42, textAlign: 'center' }}>
              {Math.round(scale * 100)}%
            </span>
            <Tooltip title="Phóng to">
              <Button size="small" icon={<ZoomInOutlined />} onClick={handleZoomIn} disabled={scale >= 3} />
            </Tooltip>
            <Tooltip title="Đặt lại kích thước">
              <Button size="small" icon={<RedoOutlined />} onClick={handleResetZoom} />
            </Tooltip>
          </Space>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={typeof window !== 'undefined' && window.innerWidth < 880 ? '96vw' : 840}
      style={{ top: 20 }}
      footer={
        <Space wrap style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            style={{ background: '#7C3AED', borderColor: '#7C3AED' }}
            onClick={() =>
              userSavedFileService.download(fileId, normalizeSvgFilename(title, fileId))
            }
          >
            Tải xuống file SVG
          </Button>
          <Button onClick={onClose}>Đóng</Button>
        </Space>
      }
      destroyOnHidden
    >
      <div
        style={{
          padding: '8px 0',
          minHeight: 320,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {loading && <Spin tip="Đang dựng bản vẽ SVG..." />}
        {error && (
          <Alert
            type="warning"
            showIcon
            message="Không thể xem trước"
            description={error}
            style={{ width: '100%' }}
          />
        )}
        {!loading && !error && blobUrl && (
          <div className="saved-files-preview-box">
            <object
              data={blobUrl}
              type="image/svg+xml"
              style={{
                maxWidth: `${scale * 100}%`,
                maxHeight: `${scale * 100}%`,
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease',
                objectFit: 'contain',
              }}
              aria-label="SVG Preview"
            >
              <Empty description="Trình duyệt không hỗ trợ hiển thị file SVG này" />
            </object>
          </div>
        )}
      </div>
    </Modal>
  )
}
