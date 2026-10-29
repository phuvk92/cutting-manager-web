import React from 'react'
import { useTranslation } from 'react-i18next'
import { Table, Tag, Tooltip, Typography, Button, Badge } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { AuditLogV2Record } from '@/types/auditV2'

const { Text } = Typography

interface AuditLogV2TableProps {
  data: AuditLogV2Record[]
  loading: boolean
  pagination: {
    current: number
    pageSize: number
    total: number
  }
  onChange: (page: number, pageSize: number) => void
  onSelectRecord: (record: AuditLogV2Record) => void
}

export const AuditLogV2Table: React.FC<AuditLogV2TableProps> = ({
  data,
  loading,
  pagination,
  onChange,
  onSelectRecord,
}) => {
  const { t } = useTranslation('audit')
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

  const getStatusTagColor = (status: number) => {
    if (status >= 200 && status < 300) return 'success'
    if (status >= 300 && status < 400) return 'blue'
    if (status >= 400 && status < 500) return 'warning'
    return 'error'
  }

  const getRoleColor = (role?: string | null) => {
    if (!role) return 'default'
    switch (role.toUpperCase()) {
      case 'ADMIN':
      case 'ROLE_ADMIN':
        return 'purple'
      case 'AGENT':
      case 'ROLE_AGENT':
        return 'blue'
      case 'USER':
      case 'ROLE_USER':
        return 'cyan'
      default:
        return 'default'
    }
  }

  const getLatencyColor = (ms: number) => {
    if (ms < 200) return '#059669'
    if (ms < 1000) return '#D97706'
    return '#DC2626'
  }

  const columns: ColumnsType<AuditLogV2Record> = [
    {
      title: t('columns.timestamp'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (val: string) => (
        <Tooltip title={val}>
          <div style={{ font: "500 12px 'IBM Plex Mono', monospace", color: '#1B1B19', lineHeight: 1.3 }}>
            {dayjs(val).format('YYYY-MM-DD')}
            <br />
            <span style={{ color: '#71716B', fontSize: 11 }}>{dayjs(val).format('HH:mm:ss')}</span>
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'Client / App',
      key: 'client',
      width: 160,
      render: (_, record) => {
        const isClientOnly = record.principalType === 'CLIENT_ONLY'
        const isAnon = record.principalType === 'ANONYMOUS'
        const clientLabel = record.clientName || record.clientId || (isAnon ? 'Khách ẩn danh' : 'Chưa định danh')

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Tooltip title={`Client ID: ${record.clientId || 'N/A'}`}>
              <span
                style={{
                  font: "600 12px 'IBM Plex Sans', sans-serif",
                  color: isAnon ? '#DC2626' : '#1E293B',
                  maxWidth: 150,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                }}
              >
                {clientLabel}
              </span>
            </Tooltip>
            <div>
              {isClientOnly && <Tag color="geekblue" style={{ fontSize: 10, margin: 0, padding: '0 4px', lineHeight: '16px' }}>Client App</Tag>}
              {isAnon && <Tag color="red" style={{ fontSize: 10, margin: 0, padding: '0 4px', lineHeight: '16px' }}>Anonymous</Tag>}
              {record.principalType === 'USER' && (
                <Tag color="green" style={{ fontSize: 10, margin: 0, padding: '0 4px', lineHeight: '16px' }}>User Verified</Tag>
              )}
            </div>
          </div>
        )
      },
    },
    {
      title: 'Người dùng',
      key: 'user',
      width: 140,
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {record.username ? (
            <Tooltip title={`User ID: ${record.userId ?? 'N/A'}`}>
              <span style={{ font: "500 12px 'IBM Plex Sans', sans-serif", color: '#1B1B19' }}>
                {record.username}
              </span>
            </Tooltip>
          ) : (
            <span style={{ color: '#A3A29C', fontStyle: 'italic', fontSize: 12 }}>—</span>
          )}
          {record.role && (
            <div style={{ marginTop: 2 }}>
              <Tag color={getRoleColor(record.role)} style={{ fontSize: 10, margin: 0, padding: '0 4px', lineHeight: '16px' }}>
                {record.role.replace(/^ROLE_/, '')}
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: t('v2.colDealer'),
      dataIndex: 'dealerName',
      key: 'dealerName',
      width: 140,
      render: (val: string | null, record) => {
        const dealerText = val || (record.dealerId ? `ID: ${record.dealerId}` : null)
        if (!dealerText) return <span style={{ color: '#A3A29C', fontSize: 12 }}>—</span>
        return (
          <Tooltip title={record.dealerId ? `Dealer ID: ${record.dealerId}` : undefined}>
            <span
              style={{
                font: "500 12px 'IBM Plex Sans', sans-serif",
                color: '#334155',
                maxWidth: 130,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'inline-block',
              }}
            >
              {dealerText}
            </span>
          </Tooltip>
        )
      },
    },
    {
      title: 'Method & Endpoint',
      key: 'endpoint',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              padding: '2px 6px',
              borderRadius: 4,
              background: '#F1F5F9',
              color: getMethodColor(record.httpMethod),
              font: "700 10.5px 'IBM Plex Mono', monospace",
              border: `1px solid ${getMethodColor(record.httpMethod)}33`,
              flexShrink: 0,
            }}
          >
            {record.httpMethod}
          </span>
          <Tooltip title={record.endpoint}>
            <Text
              style={{
                font: "400 12px 'IBM Plex Mono', monospace",
                color: '#0F172A',
                maxWidth: 240,
              }}
              ellipsis
              copyable={{ text: record.endpoint }}
            >
              {record.endpoint}
            </Text>
          </Tooltip>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 110,
      align: 'center',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Tag color={getStatusTagColor(record.httpStatus)} style={{ margin: 0, font: "600 11px 'IBM Plex Mono', monospace" }}>
            {record.httpStatus}
          </Tag>
          {record.result === 'SUCCESS' ? (
            <Badge status="success" text={<span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>Thành công</span>} />
          ) : (
            <Tooltip title={record.errorCode ? `Mã lỗi: ${record.errorCode}` : 'Thất bại'}>
              <Badge status="error" text={<span style={{ fontSize: 11, color: '#DC2626', fontWeight: 600 }}>Thất bại</span>} />
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: 'Latency',
      dataIndex: 'executionTimeMs',
      key: 'executionTimeMs',
      width: 90,
      align: 'right',
      render: (ms: number) => (
        <span
          style={{
            font: "600 12px 'IBM Plex Mono', monospace",
            color: getLatencyColor(ms),
          }}
        >
          {ms} ms
        </span>
      ),
    },
    {
      title: 'IP & Request ID',
      key: 'ipRequestId',
      width: 140,
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ font: "400 11px 'IBM Plex Mono', monospace", color: '#475569' }}>
            {record.clientIp || '—'}
          </span>
          <Tooltip title={`Request ID: ${record.requestId}`}>
            <Text
              style={{ font: "400 10px 'IBM Plex Mono', monospace", color: '#94A3B8', maxWidth: 120 }}
              ellipsis
              copyable={{ text: record.requestId }}
            >
              {record.requestId}
            </Text>
          </Tooltip>
        </div>
      ),
    },
    {
      title: t('v2.colActions'),
      key: 'action',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Button
          size="small"
          type="link"
          onClick={(e) => {
            e.stopPropagation()
            onSelectRecord(record)
          }}
          style={{ fontSize: 12, padding: '0 4px', color: '#7C3AED' }}
        >
          Chi tiết
        </Button>
      ),
    },
  ]

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 8,
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      <Table<AuditLogV2Record>
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        size="middle"
        scroll={{ x: 1200 }}
        onRow={(record) => ({
          onClick: () => onSelectRecord(record),
          style: { cursor: 'pointer' },
        })}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} bản ghi`,
          onChange,
        }}
      />
    </div>
  )
}
