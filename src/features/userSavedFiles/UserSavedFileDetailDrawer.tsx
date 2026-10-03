import React, { useEffect, useState } from 'react'
import {
  Drawer,
  Descriptions,
  Button,
  Space,
  Typography,
  Divider,
  Spin,
  Alert,
  Empty,
} from 'antd'
import {
  DownloadOutlined,
  FileTextOutlined,
  ShopOutlined,
  CarOutlined,
  FileImageOutlined,
} from '@ant-design/icons'
import { UserSavedFile } from '@/types/userSavedFile'
import { userSavedFileService } from '@/services/userSavedFile/userSavedFileService'
import { formatBytes, normalizeSvgFilename } from '@/utils/formatters'

const { Text } = Typography

const FONT = "'IBM Plex Sans', sans-serif"
const MONO = "'IBM Plex Mono', monospace"

interface UserSavedFileDetailDrawerProps {
  file: UserSavedFile | null
  open: boolean
  onClose: () => void
}

export const UserSavedFileDetailDrawer: React.FC<UserSavedFileDetailDrawerProps> = ({
  file,
  open,
  onClose,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let currentUrl: string | null = null

    if (open && file?.id) {
      setPreviewLoading(true)
      setPreviewError(null)
      userSavedFileService
        .getPreviewBlobUrl(file.id)
        .then(url => {
          if (active) {
            currentUrl = url
            setBlobUrl(url)
            setPreviewLoading(false)
          } else {
            URL.revokeObjectURL(url)
          }
        })
        .catch(err => {
          if (active) {
            setPreviewError(err?.message || 'Không thể tải bản vẽ SVG xem trước')
            setPreviewLoading(false)
          }
        })
    } else {
      setBlobUrl(null)
      setPreviewError(null)
      setPreviewLoading(false)
    }

    return () => {
      active = false
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }
    }
  }, [open, file?.id])

  if (!file) return null

  const filmWidth = file.cutSize?.filmWidth ?? file.cutSize?.axisY
  const rollLength = file.cutSize?.rollLength ?? file.cutSize?.axisX
  const widthUnit = file.cutSize?.filmWidthUnit || 'mm'
  const lengthUnit = file.cutSize?.rollLengthUnit || 'mm'

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: `600 14px ${FONT}` }}>
          <FileTextOutlined style={{ color: '#7C3AED' }} />
          <span>Chi tiết bản đã lưu #{file.id}</span>
        </div>
      }
      open={open}
      onClose={onClose}
      width={660}
      extra={
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          style={{ background: '#7C3AED', borderColor: '#7C3AED' }}
          onClick={() =>
            userSavedFileService.download(file.id, normalizeSvgFilename(file.fileName, file.id))
          }
        >
          Tải xuống SVG
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Khung xem trước SVG */}
        <div
          style={{
            border: '1px solid #E4E3DE',
            borderRadius: 6,
            overflow: 'hidden',
            background: '#FBFBFA',
          }}
        >
          <div
            style={{
              padding: '8px 14px',
              borderBottom: '1px solid #E4E3DE',
              fontWeight: 600,
              fontSize: 11.5,
              color: '#65645F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileImageOutlined style={{ color: '#7C3AED' }} />
              XEM TRƯỚC HÌNH HỌC (SVG)
            </span>
            {file.fileSize && (
              <span style={{ fontFamily: MONO, fontSize: 11, color: '#8A8983' }}>
                {formatBytes(file.fileSize)}
              </span>
            )}
          </div>
          <div
            style={{
              height: 250,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 16,
              background: '#FFFFFF',
            }}
          >
            {previewLoading && <Spin tip="Đang tải bản vẽ SVG..." />}
            {previewError && (
              <Alert
                type="warning"
                showIcon
                message="Xem trước không khả dụng"
                description={previewError}
                style={{ width: '100%' }}
              />
            )}
            {!previewLoading && !previewError && blobUrl && (
              <object
                data={blobUrl}
                type="image/svg+xml"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
                aria-label="SVG Safe Preview"
              >
                <Empty description="Không thể hiển thị bản vẽ" />
              </object>
            )}
          </div>
        </div>

        {/* Thông tin tập tin */}
        <div style={{ background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6, padding: 12 }}>
          <div style={{ font: `600 12px ${FONT}`, color: '#1B1B19', marginBottom: 10 }}>
            Thông tin tập tin
          </div>
          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label="Tên hiển thị">
              <Text strong style={{ color: '#1B1B19', font: `600 13px ${FONT}` }}>
                {file.fileName}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Tên file gốc">
              <Text type="secondary" style={{ font: `400 12px ${FONT}` }}>
                {file.originalFileName || file.fileName}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Danh mục">
              {file.category?.name ? (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    background: '#F1EDFC',
                    border: '1px solid #C9B6F5',
                    borderRadius: 4,
                    font: `500 11px ${FONT}`,
                    color: '#5B2BB0',
                  }}
                >
                  {file.category.name}
                </span>
              ) : (
                <Text type="secondary">—</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả">
              {file.description || <Text type="secondary">Chưa có mô tả</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 4,
                  font: `500 11px ${FONT}`,
                  background: file.status === 'ACTIVE' ? '#EBF8F0' : '#F1F0EC',
                  border: `1px solid ${file.status === 'ACTIVE' ? '#B3E7C3' : '#D8D7D2'}`,
                  color: file.status === 'ACTIVE' ? '#1E7E34' : '#6E6D68',
                }}
              >
                {file.status === 'ACTIVE' ? 'Hoạt động' : 'Đã xoá'}
              </span>
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* Thông tin mẫu xe */}
        <div style={{ background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6, padding: 12 }}>
          <div style={{ font: `600 12px ${FONT}`, color: '#1B1B19', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CarOutlined style={{ color: '#7C3AED' }} />
            <span>Mẫu xe & Cấu hình</span>
          </div>
          <Descriptions size="small" column={2} bordered>
            <Descriptions.Item label="Hãng xe">
              {file.vehicleConfiguration?.brandName ? (
                <span style={{ fontWeight: 500 }}>{file.vehicleConfiguration.brandName}</span>
              ) : (
                <Text type="secondary">—</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Dòng xe">
              {file.vehicleConfiguration?.modelName ? (
                <span style={{ fontWeight: 500 }}>{file.vehicleConfiguration.modelName}</span>
              ) : (
                <Text type="secondary">—</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Năm áp dụng">
              {file.vehicleConfiguration?.yearFrom ? (
                <span style={{ fontFamily: MONO, fontSize: 12 }}>
                  {file.vehicleConfiguration.yearFrom}
                  {file.vehicleConfiguration.yearTo
                    ? ` – ${file.vehicleConfiguration.yearTo}`
                    : ''}
                </span>
              ) : (
                <Text type="secondary">Mọi năm</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Mã khung / Đời">
              {file.vehicleConfiguration?.generationCode ? (
                <span style={{ fontFamily: MONO, fontSize: 12 }}>
                  {file.vehicleConfiguration.generationCode}
                </span>
              ) : (
                <Text type="secondary">—</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Nhóm sản phẩm" span={2}>
              {file.vehicleConfiguration?.productGroupName ||
                file.vehicleConfiguration?.productGroup || <Text type="secondary">—</Text>}
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* Khổ cắt */}
        <div style={{ background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6, padding: 12 }}>
          <div style={{ font: `600 12px ${FONT}`, color: '#1B1B19', marginBottom: 10 }}>
            Khổ cắt đã thiết lập
          </div>
          <Descriptions size="small" column={2} bordered>
            <Descriptions.Item label="Khổ phim (Y)">
              {filmWidth !== null && filmWidth !== undefined ? (
                <span style={{ fontFamily: MONO, fontWeight: 600, color: '#1B1B19' }}>
                  {filmWidth.toLocaleString('vi-VN')} {widthUnit}
                </span>
              ) : (
                <Text type="secondary">—</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Dài dọc cuộn (X)">
              {rollLength !== null && rollLength !== undefined ? (
                <span style={{ fontFamily: MONO, fontWeight: 600, color: '#1B1B19' }}>
                  {rollLength.toLocaleString('vi-VN')} {lengthUnit}
                </span>
              ) : (
                <Text type="secondary">—</Text>
              )}
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* Người tạo & Đại lý */}
        <div style={{ background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6, padding: 12 }}>
          <div style={{ font: `600 12px ${FONT}`, color: '#1B1B19', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShopOutlined style={{ color: '#7C3AED' }} />
            <span>Nguồn gốc & Quản trị</span>
          </div>
          <Descriptions size="small" column={2} bordered>
            <Descriptions.Item label="Người tạo">
              <span style={{ fontWeight: 500 }}>
                {file.createdBy?.displayName || file.createdBy?.username || '—'}
              </span>{' '}
              {file.createdBy?.username && (
                <span style={{ fontSize: 11, color: '#8A8983', fontFamily: MONO }}>
                  (@{file.createdBy.username})
                </span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Đại lý">
              {file.dealer?.name ? (
                <span style={{ fontWeight: 500, color: '#6C3BD6' }}>{file.dealer.name}</span>
              ) : (
                <Text type="secondary">—</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian tạo">
              <span style={{ fontFamily: MONO, fontSize: 11.5, color: '#4A4945' }}>
                {file.createdAt ? new Date(file.createdAt).toLocaleString('vi-VN') : '—'}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Dung lượng">
              <span style={{ fontFamily: MONO, fontSize: 12 }}>
                {file.fileSize ? formatBytes(file.fileSize) : '—'}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="MIME Type">
              <span style={{ fontFamily: MONO, fontSize: 11.5 }}>{file.mimeType}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Mã băm (SHA-256)" span={2}>
              <Text
                copyable
                style={{
                  fontFamily: MONO,
                  fontSize: 10.5,
                  wordBreak: 'break-all',
                  color: '#4A4945',
                }}
              >
                {file.checksum}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </div>

        <Divider style={{ margin: '4px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Space>
            <Button onClick={onClose}>Đóng</Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              style={{ background: '#7C3AED', borderColor: '#7C3AED' }}
              onClick={() =>
                userSavedFileService.download(file.id, normalizeSvgFilename(file.fileName, file.id))
              }
            >
              Tải xuống file
            </Button>
          </Space>
        </div>
      </div>
    </Drawer>
  )
}
