import { useTranslation } from 'react-i18next'
import React, { useEffect, useState } from 'react'
import {
  Drawer,
  Descriptions,
  Button,
  Typography,
  Divider,
  Spin,
  Alert,
  Empty,
  Tag,
} from 'antd'
import {
  DownloadOutlined,
  FileTextOutlined,
  ShopOutlined,
  CarOutlined,
  FileImageOutlined,
  ShareAltOutlined,
  AppstoreOutlined,
  UserOutlined,
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
  onShare?: (file: UserSavedFile) => void
  canDownload?: boolean
}

export const UserSavedFileDetailDrawer: React.FC<UserSavedFileDetailDrawerProps> = ({
  file,
  open,
  onClose,
  onShare,
  canDownload = true,
}) => {
  const { t } = useTranslation('savedFiles')
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let currentUrl: string | null = null

    if (open && file?.id && canDownload) {
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
      width={typeof window !== 'undefined' && window.innerWidth < 680 ? '100%' : 660}
      extra={
        canDownload ? (
          <Button
            type="primary"
            size="small"
            icon={<DownloadOutlined />}
            style={{ background: '#7C3AED', borderColor: '#7C3AED' }}
            onClick={() =>
              userSavedFileService.download(file.id, normalizeSvgFilename(file.fileName, file.id))
            }
          >
            Tải SVG
          </Button>
        ) : null
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {(file.fileSource === 'ADMIN_LIBRARY' || file.id >= 1000000000) ? (
          <Alert
            type="info"
            showIcon
            icon={<AppstoreOutlined style={{ color: '#6D28D9' }} />}
            message="Thư viện kho mẫu & part (Admin quản lý)"
            description="Tệp SVG này thuộc thư viện hệ thống do Admin quản lý và được tự động phân phối theo quyền danh mục kho mẫu & part của bạn."
            style={{ borderRadius: 6, border: '1px solid #DDD6FE', background: '#F5F3FF' }}
          />
        ) : (
          <Alert
            type="success"
            showIcon
            icon={<UserOutlined style={{ color: '#0D9488' }} />}
            message={file.accessType === 'SHARED' ? 'File được chia sẻ' : 'File cá nhân của người dùng'}
            description={file.accessType === 'SHARED' ? 'Tệp này được chia sẻ từ người dùng khác trên hệ thống.' : 'Tệp SVG do người dùng lưu từ máy cắt qua API internal.'}
            style={{ borderRadius: 6, border: '1px solid #CCFBF1', background: '#F0FDFA' }}
          />
        )}

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
              flexWrap: 'wrap',
              gap: 4,
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
              maxHeight: '35vh',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 16,
              background: '#FFFFFF',
            }}
          >
            {!canDownload && (
              <Alert
                type="info"
                showIcon
                message="Chế độ giám sát đại lý (Chỉ đọc)"
                description="Đại lý chỉ xem danh sách và thông tin tệp (metadata); không có quyền tải xuống hay xem trước nội dung."
                style={{ width: '100%' }}
              />
            )}
            {canDownload && previewLoading && <Spin tip="Đang tải bản vẽ SVG..." />}
            {canDownload && previewError && (
              <Alert
                type="warning"
                showIcon
                message="Không thể xem trước"
                description={previewError}
                style={{ width: '100%' }}
              />
            )}
            {canDownload && !previewLoading && !previewError && blobUrl && (
              <object
                data={blobUrl}
                type="image/svg+xml"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                }}
                aria-label="SVG Preview"
              >
                <Empty description="Trình duyệt không hỗ trợ hiển thị SVG này" />
              </object>
            )}
            {!previewLoading && !previewError && !blobUrl && (
              <Empty description="Không có hình học xem trước" />
            )}
          </div>
        </div>

        {/* Thông tin cơ bản */}
        <div style={{ background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6, padding: 12 }}>
          <div style={{ font: `600 12px ${FONT}`, color: '#1B1B19', marginBottom: 10 }}>
            Thông tin tệp tin
          </div>
          <Descriptions size="small" column={{ xs: 1, sm: 2 }} bordered>
            <Descriptions.Item label="ID">{file.id}</Descriptions.Item>
            <Descriptions.Item label="Nguồn gốc file">
              {(file.fileSource === 'ADMIN_LIBRARY' || file.id >= 1000000000) ? (
                <Tag color="purple" icon={<AppstoreOutlined />}>Thư viện kho mẫu & part</Tag>
              ) : file.accessType === 'SHARED' ? (
                <Tag color="cyan" icon={<ShareAltOutlined />}>Được chia sẻ</Tag>
              ) : (
                <Tag color="blue" icon={<UserOutlined />}>File cá nhân</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Tên file">
              <span style={{ fontWeight: 600, color: '#6C3BD6' }}>{file.fileName}</span>
            </Descriptions.Item>
            <Descriptions.Item label={t("drawer.category")}>
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
            <Descriptions.Item label={t("drawer.description")}>
              {file.description || <Text type="secondary">{t("drawer.noDescription")}</Text>}
            </Descriptions.Item>
            <Descriptions.Item label={t("drawer.status")}>
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
                {file.status === 'ACTIVE' ? t('drawer.statusActive') : t('drawer.statusDeleted')}
              </span>
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* Thông tin mẫu xe */}
        <div style={{ background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6, padding: 12 }}>
          <div style={{ font: `600 12px ${FONT}`, color: '#1B1B19', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CarOutlined style={{ color: '#7C3AED' }} />
            <span>{t("drawer.vehicleConfig")}</span>
          </div>
          <Descriptions size="small" column={{ xs: 1, sm: 2 }} bordered>
            <Descriptions.Item label={t("drawer.brand")}>
              {file.vehicleConfiguration?.brandName ? (
                <span style={{ fontWeight: 500 }}>{file.vehicleConfiguration.brandName}</span>
              ) : (
                <Text type="secondary">—</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t("drawer.model")}>
              {file.vehicleConfiguration?.modelName ? (
                <span style={{ fontWeight: 500 }}>{file.vehicleConfiguration.modelName}</span>
              ) : (
                <Text type="secondary">—</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t("drawer.appliedYears")}>
              {file.vehicleConfiguration?.yearFrom ? (
                <span style={{ fontFamily: MONO, fontSize: 12 }}>
                  {file.vehicleConfiguration.yearFrom}
                  {file.vehicleConfiguration.yearTo
                    ? ` – ${file.vehicleConfiguration.yearTo}`
                    : ''}
                </span>
              ) : (
                <Text type="secondary">{t("drawer.allYears")}</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t("drawer.generationCode")}>
              {file.vehicleConfiguration?.generationCode ? (
                <span style={{ fontFamily: MONO, fontSize: 12 }}>
                  {file.vehicleConfiguration.generationCode}
                </span>
              ) : (
                <Text type="secondary">—</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t("drawer.productGroup")} span={2}>
              {file.vehicleConfiguration?.productGroupName ||
                file.vehicleConfiguration?.productGroup || <Text type="secondary">—</Text>}
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* Khổ cắt */}
        <div style={{ background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6, padding: 12 }}>
          <div style={{ font: `600 12px ${FONT}`, color: '#1B1B19', marginBottom: 10 }}>
            {t("drawer.cutDimensions")}
          </div>
          <Descriptions size="small" column={{ xs: 1, sm: 2 }} bordered>
            <Descriptions.Item label={t("drawer.filmWidth")}>
              {filmWidth !== null && filmWidth !== undefined ? (
                <span style={{ fontFamily: MONO, fontWeight: 600, color: '#1B1B19' }}>
                  {filmWidth.toLocaleString('vi-VN')} {widthUnit}
                </span>
              ) : (
                <Text type="secondary">—</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t("drawer.rollLength")}>
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
            <span>{t("drawer.originAdmin")}</span>
          </div>
          <Descriptions size="small" column={{ xs: 1, sm: 2 }} bordered>
            <Descriptions.Item label={t("drawer.createdBy")}>
              <span style={{ fontWeight: 500 }}>
                {file.createdBy?.displayName || file.createdBy?.username || '—'}
              </span>{' '}
              {file.createdBy?.username && (
                <span style={{ fontSize: 11, color: '#8A8983', fontFamily: MONO }}>
                  (@{file.createdBy.username})
                </span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t("drawer.dealer")}>
              {file.dealer?.name ? (
                <span style={{ fontWeight: 500, color: '#6C3BD6' }}>{file.dealer.name}</span>
              ) : (
                <Text type="secondary">—</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t("drawer.createdAt")}>
              <span style={{ fontFamily: MONO, fontSize: 11.5, color: '#4A4945' }}>
                {file.createdAt ? new Date(file.createdAt).toLocaleString('vi-VN') : '—'}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label={t("drawer.fileSize")}>
              <span style={{ fontFamily: MONO, fontSize: 12 }}>
                {file.fileSize ? formatBytes(file.fileSize) : '—'}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label={t("drawer.mimeType")}>
              <span style={{ fontFamily: MONO, fontSize: 11.5 }}>{file.mimeType}</span>
            </Descriptions.Item>
            <Descriptions.Item label={t("drawer.checksum")} span={2}>
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
          <Button onClick={onClose}>{t("drawer.closeBtn")}</Button>
          {onShare && (
            <Button
              icon={<ShareAltOutlined />}
              onClick={() => onShare(file)}
            >
              {t("drawer.shareBtn")}
            </Button>
          )}
          {canDownload && (
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              style={{ background: '#7C3AED', borderColor: '#7C3AED' }}
              onClick={() =>
                userSavedFileService.download(file.id, normalizeSvgFilename(file.fileName, file.id))
              }
            >
              {t("drawer.downloadBtn")}
            </Button>
          )}
        </div>
      </div>
    </Drawer>
  )
}
