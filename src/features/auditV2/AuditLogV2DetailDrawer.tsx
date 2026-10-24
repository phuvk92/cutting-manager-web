import React from 'react'
import { Drawer, Descriptions, Tag, Typography, Space, Divider, Alert } from 'antd'
import dayjs from 'dayjs'
import { AuditLogV2Record } from '@/types/auditV2'

const { Text, Paragraph } = Typography

interface AuditLogV2DetailDrawerProps {
  record: AuditLogV2Record | null
  visible: boolean
  onClose: () => void
}

export const AuditLogV2DetailDrawer: React.FC<AuditLogV2DetailDrawerProps> = ({
  record,
  visible,
  onClose,
}) => {
  if (!record) return null

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return '#2563EB'
      case 'POST':
        return '#059669'
      case 'PUT':
        return '#D97706'
      case 'DELETE':
        return '#DC2626'
      case 'PATCH':
        return '#7C3AED'
      default:
        return '#4B5563'
    }
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'success'
    if (status >= 300 && status < 400) return 'blue'
    if (status >= 400 && status < 500) return 'warning'
    return 'error'
  }

  const formatBytes = (bytes: number | null) => {
    if (bytes === null || bytes === undefined) return '—'
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 24 }}>
          <Space size={8}>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 4,
                background: '#F1F5F9',
                color: getMethodColor(record.httpMethod),
                font: "700 12px 'IBM Plex Mono', monospace",
                border: `1px solid ${getMethodColor(record.httpMethod)}33`,
              }}
            >
              {record.httpMethod}
            </span>
            <span style={{ font: "600 14px 'IBM Plex Sans', sans-serif", color: '#0F172A' }}>
              Chi tiết Audit Record #{record.id}
            </span>
          </Space>
          <Tag color={getStatusColor(record.httpStatus)} style={{ font: "700 12px 'IBM Plex Mono', monospace" }}>
            HTTP {record.httpStatus}
          </Tag>
        </div>
      }
      placement="right"
      width={680}
      open={visible}
      onClose={onClose}
      destroyOnClose
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Kết quả request */}
        {record.result === 'SUCCESS' ? (
          <Alert
            type="success"
            showIcon
            message="Yêu cầu xử lý thành công"
            description={`Phản hồi mã trạng thái HTTP ${record.httpStatus} trong thời gian ${record.executionTimeMs} ms.`}
          />
        ) : (
          <Alert
            type="error"
            showIcon
            message="Yêu cầu gặp sự cố hoặc bị từ chối"
            description={
              <div>
                <div>Mã trạng thái HTTP: <strong>{record.httpStatus}</strong></div>
                {record.errorCode && (
                  <div style={{ marginTop: 4 }}>
                    Mã lỗi phân loại: <Tag color="error">{record.errorCode}</Tag>
                  </div>
                )}
                <div style={{ marginTop: 4, color: '#64748B', fontSize: 12 }}>
                  Thời gian phản hồi: {record.executionTimeMs} ms
                </div>
              </div>
            }
          />
        )}

        {/* Thông tin định danh 3 lớp: Client, User, Dealer */}
        <div>
          <h4 style={{ margin: '0 0 10px', font: "600 13px 'IBM Plex Sans', sans-serif", color: '#475569' }}>
            1. ĐỊNH DANH 3 LỚP (CLIENT · USER · DEALER)
          </h4>
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Ứng dụng / Client">
              <Space direction="vertical" size={2}>
                <span style={{ fontWeight: 600, color: '#1E293B' }}>
                  {record.clientName || record.clientId || 'Chưa định danh'}
                </span>
                {record.clientId && (
                  <Text type="secondary" copyable={{ text: record.clientId }} style={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }}>
                    ID: {record.clientId}
                  </Text>
                )}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Loại Principal">
              {record.principalType === 'USER' && <Tag color="green">USER (Đã xác thực)</Tag>}
              {record.principalType === 'CLIENT_ONLY' && <Tag color="blue">CLIENT_ONLY</Tag>}
              {record.principalType === 'ANONYMOUS' && <Tag color="red">ANONYMOUS (Ẩn danh)</Tag>}
            </Descriptions.Item>

            <Descriptions.Item label="Tài khoản (Username)">
              {record.username ? (
                <Text strong copyable={{ text: record.username }}>
                  {record.username}
                </Text>
              ) : (
                <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Không có user xác thực</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Vai trò (Role)">
              {record.role ? (
                <Tag color="purple">{record.role}</Tag>
              ) : (
                <span style={{ color: '#94A3B8' }}>—</span>
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Mã User (DB ID)">
              {record.userId ? (
                <span style={{ fontFamily: 'IBM Plex Mono' }}>#{record.userId}</span>
              ) : (
                <span style={{ color: '#94A3B8' }}>—</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Keycloak User ID">
              {record.keycloakUserId ? (
                <Text copyable={{ text: record.keycloakUserId }} style={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }}>
                  {record.keycloakUserId}
                </Text>
              ) : (
                <span style={{ color: '#94A3B8' }}>—</span>
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Đại lý (Dealer)" span={2}>
              {record.dealerName || record.dealerId ? (
                <Space>
                  <span style={{ fontWeight: 600, color: '#334155' }}>
                    {record.dealerName || `Đại lý #${record.dealerId}`}
                  </span>
                  {record.dealerId && <Tag color="cyan">ID: {record.dealerId}</Tag>}
                </Space>
              ) : (
                <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Không gắn với đại lý</span>
              )}
            </Descriptions.Item>
          </Descriptions>
        </div>

        <Divider style={{ margin: '8px 0' }} />

        {/* Thông tin API Endpoint & HTTP */}
        <div>
          <h4 style={{ margin: '0 0 10px', font: "600 13px 'IBM Plex Sans', sans-serif", color: '#475569' }}>
            2. THÔNG TIN API & THỜI ĐIỂM
          </h4>
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Phiên bản API">
              <Tag color="geekblue">{record.apiVersion}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian nhận">
              <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 500 }}>
                {dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss.SSS')}
              </span>
            </Descriptions.Item>

            <Descriptions.Item label="Đường dẫn (Endpoint)" span={2}>
              <Text copyable={{ text: record.endpoint }} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
                {record.endpoint}
              </Text>
            </Descriptions.Item>

            <Descriptions.Item label="Thời gian xử lý">
              <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700, color: record.executionTimeMs > 1000 ? '#DC2626' : '#059669' }}>
                {record.executionTimeMs} ms
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="HTTP Status">
              <Tag color={getStatusColor(record.httpStatus)}>
                {record.httpStatus} ({record.result})
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Dung lượng Request">
              <span style={{ fontFamily: 'IBM Plex Mono' }}>{formatBytes(record.requestSizeBytes)}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Dung lượng Response">
              <span style={{ fontFamily: 'IBM Plex Mono' }}>{formatBytes(record.responseSizeBytes)}</span>
            </Descriptions.Item>
          </Descriptions>
        </div>

        <Divider style={{ margin: '8px 0' }} />

        {/* Truy vết mạng & Headers */}
        <div>
          <h4 style={{ margin: '0 0 10px', font: "600 13px 'IBM Plex Sans', sans-serif", color: '#475569' }}>
            3. TRUY VẾT & MÔI TRƯỜNG MẠNG
          </h4>
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Request ID">
              <Text copyable={{ text: record.requestId }} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, fontWeight: 600 }}>
                {record.requestId}
              </Text>
            </Descriptions.Item>

            {record.traceId && (
              <Descriptions.Item label="Trace ID">
                <Text copyable={{ text: record.traceId }} style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>
                  {record.traceId}
                </Text>
              </Descriptions.Item>
            )}

            <Descriptions.Item label="Địa chỉ IP Client">
              <span style={{ fontFamily: 'IBM Plex Mono' }}>{record.clientIp || '—'}</span>
            </Descriptions.Item>

            <Descriptions.Item label="User-Agent">
              <Paragraph
                ellipsis={{ rows: 2, expandable: true, symbol: 'Xem thêm' }}
                style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, margin: 0, color: '#475569' }}
              >
                {record.userAgent || '—'}
              </Paragraph>
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* Ghi chú bảo mật */}
        <div
          style={{
            marginTop: 8,
            padding: '10px 14px',
            background: '#F8FAFC',
            borderRadius: 6,
            border: '1px solid #E2E8F0',
            fontSize: 11.5,
            color: '#64748B',
            lineHeight: 1.5,
          }}
        >
          🔒 <strong>Chính sách bảo mật:</strong> Hệ thống không lưu trữ JWT token, mật khẩu xác thực,
          nội dung file SVG hay payload nhạy cảm. Toàn bộ định danh Client và User được xác minh bằng
          chữ ký số từ Security Context.
        </div>
      </div>
    </Drawer>
  )
}
