import React from 'react'
import { Drawer, Descriptions, Button, Space, Typography, Popconfirm, Tag } from 'antd'
import { DownloadOutlined, DeleteOutlined, FolderOutlined } from '@ant-design/icons'
import { SvgFile } from '@/types/svg'
import { SafeSvgViewer } from '@/components/svg/SafeSvgViewer'
import { RoleTag } from '@/components/common/RoleTag'
import { formatBytes, formatDateTime } from '@/utils/formatters'
import { svgService } from '@/services/svg/svgService'
import { useAuthStore } from '@/stores/authStore'

const { Text, Paragraph } = Typography

interface SvgDetailDrawerProps {
  svg: SvgFile | null
  open: boolean
  onClose: () => void
  onDeleteSuccess?: () => void
}

export const SvgDetailDrawer: React.FC<SvgDetailDrawerProps> = ({
  svg,
  open,
  onClose,
  onDeleteSuccess,
}) => {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'

  if (!svg) return null

  const handleDownload = () => {
    svgService.downloadSvg(svg.id, svg.originalFilename)
  }

  const handleDelete = async () => {
    await svgService.deleteSvg(svg.id)
    onClose()
    if (onDeleteSuccess) {
      onDeleteSuccess()
    }
  }

  return (
    <Drawer
      title="SVG File Details"
      placement="right"
      width={520}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleDownload}>
            Download
          </Button>
          {isAdmin && (
            <Popconfirm
              title="Delete SVG File"
              description="Are you sure you want to permanently delete this SVG file?"
              onConfirm={handleDelete}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      }
    >
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={5} style={{ marginBottom: 12 }}>
          Preview
        </Typography.Title>
        <SafeSvgViewer svgId={svg.id} height={260} />
      </div>

      <Descriptions title="Metadata" column={1} bordered size="small">
        <Descriptions.Item label="File ID">{svg.id}</Descriptions.Item>
        <Descriptions.Item label="Original Filename">
          <Text strong>{svg.originalFilename}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Category">
          {svg.category ? (
            <div>
              <Space>
                <FolderOutlined style={{ color: '#1890ff' }} />
                <Text strong>{svg.category.name}</Text>
                <Tag color="blue">{svg.category.level}</Tag>
              </Space>
              <div style={{ marginTop: 4, color: '#8c8c8c', fontSize: 12 }}>
                Full Path: {svg.category.fullPath}
              </div>
            </div>
          ) : (
            '-'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="File Size">
          {formatBytes(svg.fileSize)} ({svg.fileSize.toLocaleString()} bytes)
        </Descriptions.Item>
        <Descriptions.Item label="Content Type">
          <code>{svg.contentType}</code>
        </Descriptions.Item>
        <Descriptions.Item label="SHA-256 Checksum">
          <Paragraph copyable={{ text: svg.checksum }} style={{ margin: 0, fontSize: 12, wordBreak: 'break-all' }}>
            {svg.checksum || '-'}
          </Paragraph>
        </Descriptions.Item>
        <Descriptions.Item label="Uploaded By">
          <Space>
            <Text strong>{svg.uploadedBy?.username || 'Unknown'}</Text>
            {svg.uploadedBy?.role && <RoleTag role={svg.uploadedBy.role} />}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Uploader Email">
          {svg.uploadedBy?.email || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          {formatDateTime(svg.createdAt)}
        </Descriptions.Item>
        <Descriptions.Item label="Last Modified">
          {formatDateTime(svg.updatedAt)}
        </Descriptions.Item>
      </Descriptions>
    </Drawer>
  )
}
