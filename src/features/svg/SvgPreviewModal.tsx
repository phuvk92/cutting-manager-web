import React from 'react'
import { Modal, Button, Space, Typography } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { SvgFile } from '@/types/svg'
import { SafeSvgViewer } from '@/components/svg/SafeSvgViewer'
import { formatBytes } from '@/utils/formatters'
import { svgService } from '@/services/svg/svgService'

const { Text } = Typography

interface SvgPreviewModalProps {
  svg: SvgFile | null
  open: boolean
  onClose: () => void
}

export const SvgPreviewModal: React.FC<SvgPreviewModalProps> = ({
  svg,
  open,
  onClose,
}) => {
  if (!svg) return null

  const handleDownload = () => {
    svgService.downloadSvg(svg.id, svg.originalFilename)
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{svg.originalFilename}</span>
          <Text type="secondary" style={{ fontSize: 12 }}>
            ({formatBytes(svg.fileSize)})
          </Text>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={720}
      footer={[
        <Space key="actions">
          <Button icon={<DownloadOutlined />} onClick={handleDownload}>
            Download
          </Button>
          <Button type="primary" onClick={onClose}>
            Close
          </Button>
        </Space>,
      ]}
      destroyOnClose
    >
      <div style={{ padding: '16px 0' }}>
        <SafeSvgViewer svgId={svg.id} height={400} />
      </div>
    </Modal>
  )
}
