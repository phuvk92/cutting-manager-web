import React, { useEffect, useState, useCallback } from 'react'
import { Card, Row, Col, Typography, Descriptions, Badge, Table, Button, Space, Tag } from 'antd'
import { ReloadOutlined, DatabaseOutlined, HeartOutlined, HistoryOutlined } from '@ant-design/icons'
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

      // 2. Fetch Recent SVGs & Users to aggregate recent audit trail
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

      // Sort by latest timestamp descending
      aggregatedEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setEvents(aggregatedEvents)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAuditData()
  }, [loadAuditData])

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
              <Descriptions.Item label="Authentication Scheme">
                JWT Bearer (HMAC-SHA256) + UUID Refresh Token
              </Descriptions.Item>
              <Descriptions.Item label="Access Token TTL">
                1 Hour (3,600 seconds)
              </Descriptions.Item>
              <Descriptions.Item label="SVG Sanitization">
                OWASP / W3C XML Secure Processing Enabled
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
      >
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Aggregated system activities including user registrations and SVG uploads chronologically recorded.
        </Paragraph>

        <Table<ActivityEvent>
          dataSource={events}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="middle"
          columns={[
            {
              title: 'Timestamp',
              dataIndex: 'timestamp',
              key: 'timestamp',
              width: 170,
              render: (t: string) => formatDateTime(t),
            },
            {
              title: 'Actor',
              dataIndex: 'actor',
              key: 'actor',
              width: 150,
              render: (actor: string, record: ActivityEvent) => (
                <Space size="small">
                  <span>{actor}</span>
                  <RoleTag role={record.actorRole} />
                </Space>
              ),
            },
            {
              title: 'Action',
              dataIndex: 'action',
              key: 'action',
              width: 150,
              render: (action: string) => {
                const color = action.includes('UPLOAD') ? 'blue' : 'green'
                return <Tag color={color}>{action}</Tag>
              },
            },
            {
              title: 'Resource',
              dataIndex: 'resource',
              key: 'resource',
            },
            {
              title: 'Event Details',
              dataIndex: 'details',
              key: 'details',
              render: (text: string) => <Text type="secondary" style={{ fontSize: 12 }}>{text}</Text>,
            },
          ]}
        />
      </Card>
    </div>
  )
}
