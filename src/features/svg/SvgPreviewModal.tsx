import React from 'react'
import { Modal, Button, Space, Typography, Tooltip, Tag } from 'antd'
import { DownloadOutlined, LockOutlined } from '@ant-design/icons'
import { SvgFile } from '@/types/svg'
import { SafeSvgViewer } from '@/components/svg/SafeSvgViewer'
import { formatBytes } from '@/utils/formatters'
import { svgService } from '@/services/svg/svgService'
import { useAuthStore } from '@/stores/authStore'

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
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'

  if (!svg) return null

  const canDownload = isAdmin || svg.canDownload

  const handleDownload = () => {
    if (!canDownload) return
    svgService.downloadSvg(svg.id, svg.originalFilename)
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 24 }}>
          <Space>
            <span style={{ fontWeight: 600 }}>{svg.originalFilename}</span>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ({formatBytes(svg.fileSize)})
            </Text>
          </Space>
          {svg.vehicleConfigurations && svg.vehicleConfigurations.length > 0 ? (
            <Tag color="blue">{svg.vehicleConfigurations[0].brandName} {svg.vehicleConfigurations[0].modelName}</Tag>
          ) : (
            <Tag color="default">Dùng chung</Tag>
          )}
        </div>
      }
      open={open}
      onCancel={onClose}
      width={780}
      footer={[
        <Space key="actions">
          {canDownload ? (
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
              Tải xuống file
            </Button>
          ) : (
            <Tooltip title="Đại lý của bạn không có quyền tải file này">
              <Button disabled icon={<LockOutlined />}>
                Chỉ xem (Không được tải)
              </Button>
            </Tooltip>
          )}
          <Button onClick={onClose}>Đóng</Button>
        </Space>,
      ]}
      destroyOnClose
    >
      <div style={{ padding: '12px 0' }}>
        <SafeSvgViewer svgId={svg.id} height={420} />
      </div>
    </Modal>
  )
}
