import React from 'react'
import { Modal, Button, Space } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { SafeSvgViewer } from '@/components/svg/SafeSvgViewer'
import { svgService } from '@/services/svg/svgService'

interface SvgPreviewModalProps {
  fileId: number | null
  title?: string
  open: boolean
  onClose: () => void
}

export const SvgPreviewModal: React.FC<SvgPreviewModalProps> = ({
  fileId,
  title,
  open,
  onClose,
}) => {
  if (fileId === null) return null

  return (
    <Modal
      title={<span style={{ fontWeight: 600 }}>{title || `File #${fileId}`}</span>}
      open={open}
      onCancel={onClose}
      width={780}
      footer={
        <Space>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => svgService.downloadSvg(fileId, title || `file-${fileId}.svg`)}
          >
            Tải xuống file
          </Button>
          <Button onClick={onClose}>Đóng</Button>
        </Space>
      }
      destroyOnHidden
    >
      <div style={{ padding: '12px 0' }}>
        <SafeSvgViewer svgId={fileId} height={420} />
      </div>
    </Modal>
  )
}
