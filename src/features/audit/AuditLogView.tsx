import React, { useEffect, useState, useCallback } from 'react'
import { Card, Row, Col, Typography, Descriptions, Badge, Table, Button, Space, Tag, Input, Select } from 'antd'
import { ReloadOutlined, DatabaseOutlined, HeartOutlined, HistoryOutlined, SearchOutlined } from '@ant-design/icons'
import { auditService, ActuatorHealth } from '@/services/audit/auditService'
import { svgService } from '@/services/svg/svgService'
import { userService } from '@/services/users/userService'
import { formatDateTime } from '@/utils/formatters'
import { RoleTag } from '@/components/common/RoleTag'

const { Text, Paragraph } = Typography

interface ActivityEvent {
  id: string
  timestamp: string
  actor: string
  actorRole: string
  action: string
  resource: string
  details: string
}

export const AuditLogView: React.FC = () => {
  const [health, setHealth] = useState<ActuatorHealth | null>(null)
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined)
  const [searchKeyword, setSearchKeyword] = useState<string>('')

  const loadAuditData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Fetch Actuator Health
      try {
        const healthRes = await auditService.getHealth()
        setHealth(healthRes)
      } catch {
        setHealth({ status: 'DOWN' })
      }

      // 2. Fetch Real Audit Logs from Backend
      try {
        const auditRes = await auditService.getAuditLogs({
          page: 0,
          size: 100,
          actorRole: roleFilter,
          keyword: searchKeyword || undefined,
          sortBy: 'timestamp',
          sortDirection: 'DESC',
        })

        if (auditRes && auditRes.content && auditRes.content.length > 0) {
          const mappedEvents: ActivityEvent[] = auditRes.content.map(log => ({
            id: `audit-${log.id}`,
            timestamp: log.timestamp,
            actor: log.actor || 'System',
            actorRole: log.actorRole || 'USER',
            action: log.action,
            resource: log.resource || log.entity || 'General',
            details: log.details || '',
          }))
          setEvents(mappedEvents)
          return
        }
      } catch (err) {
        console.warn('Backend /api/audit-logs returned error or is unreachable, falling back:', err)
      }

      // 3. Fallback: Aggregate from SVGs & Users if database logs are empty or during local transition
      const [svgRes, userRes] = await Promise.allSettled([
        svgService.getSvgFiles({ page: 0, size: 10, sortBy: 'createdAt', sortDirection: 'DESC' }),
        userService.getUsers({ page: 0, size: 10, sortBy: 'createdAt', sortDirection: 'DESC' }),
      ])

      const aggregatedEvents: ActivityEvent[] = []

      if (svgRes.status === 'fulfilled' && svgRes.value.content) {
        svgRes.value.content.forEach(svg => {
          aggregatedEvents.push({
            id: `svg-${svg.id}`,
            timestamp: svg.createdAt,
            actor: svg.uploadedBy?.username || 'System',
            actorRole: svg.uploadedBy?.role || 'USER',
            action: 'UPLOAD_SVG',
            resource: `SVG: ${svg.originalFilename} (ID: ${svg.id})`,
            details: `Size: ${svg.fileSize} bytes, Checksum: ${svg.checksum?.slice(0, 16)}...`,
          })
        })
      }

      if (userRes.status === 'fulfilled' && userRes.value.content) {
        userRes.value.content.forEach(user => {
          aggregatedEvents.push({
            id: `user-${user.id}`,
            timestamp: user.createdAt,
            actor: 'Admin / Registration',
            actorRole: 'ADMIN',
            action: 'USER_CREATED',
            resource: `User: ${user.username} (ID: ${user.id})`,
            details: `Role: ${user.role}, Status: ${user.enabled ? 'Active' : 'Disabled'}, Email: ${user.email}`,
          })
        })
      }

      aggregatedEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setEvents(aggregatedEvents)
    } finally {
      setLoading(false)
    }
  }, [roleFilter, searchKeyword])

  useEffect(() => {
    loadAuditData()
  }, [loadAuditData])

  const getActionColor = (action: string): string => {
    const act = action.toUpperCase()
    if (act.includes('DELETE') || act.includes('REVOKE')) return 'red'
    if (act.includes('PUT') || act.includes('UPDATE')) return 'orange'
    if (act.includes('POST') || act.includes('UPLOAD') || act.includes('SAVE') || act.includes('CREATE')) return 'cyan'
    if (act.includes('LOGIN') || act.includes('AUTH')) return 'purple'
    if (act.includes('GET') || act.includes('DOWNLOAD') || act.includes('PREVIEW')) return 'blue'
    return 'geekblue'
  }

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <HeartOutlined style={{ color: '#eb2f96' }} />
                <span>Backend Health Status</span>
              </Space>
            }
            extra={
              <Button size="small" icon={<ReloadOutlined />} onClick={loadAuditData} loading={loading}>
                Refresh
              </Button>
            }
          >
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="System Health">
                <Badge
                  status={health?.status === 'UP' ? 'success' : 'error'}
                  text={<Text strong>{health?.status || 'UNKNOWN'}</Text>}
                />
              </Descriptions.Item>
              <Descriptions.Item label="API Gateway / Service">
                <Text code>/api/**</Text> — Spring Boot 3.x
              </Descriptions.Item>
              <Descriptions.Item label="Actuator Endpoint">
                <Text code>/actuator/health</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <DatabaseOutlined style={{ color: '#1890ff' }} />
                <span>Security & Authorization Info</span>
              </Space>
            }
          >
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Audit Trail Logging">
                Active — Tự động lưu vết toàn bộ API của User & Đại lý
              </Descriptions.Item>
              <Descriptions.Item label="Authentication Scheme">
                JWT Bearer (Keycloak) + UUID Refresh Token
              </Descriptions.Item>
              <Descriptions.Item label="Data Encryption">
                AES-256-GCM Envelope Encryption (Internal V2)
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <HistoryOutlined style={{ color: '#722ed1' }} />
            <span>Audit Trail & Activity Log</span>
          </Space>
        }
        extra={
          <Space wrap>
            <Input.Search
              placeholder="Tìm kiếm actor, action, chi tiết..."
              allowClear
              onSearch={val => setSearchKeyword(val)}
              style={{ width: 240 }}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="Lọc vai trò"
              allowClear
              style={{ width: 140 }}
              value={roleFilter}
              onChange={val => setRoleFilter(val)}
              options={[
                { label: 'Tất cả vai trò', value: '' },
                { label: 'USER (Thợ cắt)', value: 'USER' },
                { label: 'AGENT (Đại lý)', value: 'AGENT' },
                { label: 'ADMIN (Quản trị)', value: 'ADMIN' },
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={loadAuditData} loading={loading}>
              Làm mới
            </Button>
          </Space>
        }
      >
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Nhật ký hoạt động hệ thống ghi nhận tự động toàn bộ API gọi từ người dùng máy cắt (USER) và đại lý (AGENT) theo trình tự thời gian.
        </Paragraph>

        <Table<ActivityEvent>
          dataSource={events}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15, showSizeChanger: true }}
          size="middle"
          columns={[
            {
              title: 'Thời gian',
              dataIndex: 'timestamp',
              key: 'timestamp',
              width: 170,
              render: (t: string) => formatDateTime(t),
            },
            {
              title: 'Người thực hiện',
              dataIndex: 'actor',
              key: 'actor',
              width: 170,
              render: (actor: string, record: ActivityEvent) => (
                <Space size="small">
                  <span>{actor}</span>
                  <RoleTag role={record.actorRole} />
                </Space>
              ),
            },
            {
              title: 'Hành động / API',
              dataIndex: 'action',
              key: 'action',
              width: 220,
              render: (action: string) => (
                <Tag color={getActionColor(action)} style={{ maxWidth: 210, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {action}
                </Tag>
              ),
            },
            {
              title: 'Tài nguyên',
              dataIndex: 'resource',
              key: 'resource',
              width: 160,
              render: (res: string) => <Tag color="default">{res}</Tag>,
            },
            {
              title: 'Chi tiết thông số (Status, IP, Device, Latency)',
              dataIndex: 'details',
              key: 'details',
              render: (text: string) => (
                <Text type="secondary" style={{ fontSize: 12, wordBreak: 'break-all' }}>
                  {text}
                </Text>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}
