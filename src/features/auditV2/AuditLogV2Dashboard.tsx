import React from 'react'
import { Card, Col, Row, Statistic, Table, Tag, Typography, Space, Progress } from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  AppstoreOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { AuditLogV2Stats } from '@/types/auditV2'

const { Text } = Typography

interface AuditLogV2DashboardProps {
  stats: AuditLogV2Stats | null
  loading: boolean
  onSelectEndpoint?: (endpoint: string, method: string) => void
  onSelectClient?: (clientId: string) => void
  onSelectUser?: (username: string) => void
}

export const AuditLogV2Dashboard: React.FC<AuditLogV2DashboardProps> = ({
  stats,
  loading,
  onSelectEndpoint,
  onSelectClient,
  onSelectUser,
}) => {
  if (!stats && !loading) {
    return null
  }

  const successRate = stats?.successRate ?? 100
  const isHealthy = successRate >= 95

  return (
    <div style={{ marginBottom: 16 }}>
      {/* 4 Cards Summary */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title={
                <Space>
                  <ThunderboltOutlined style={{ color: '#1677ff' }} />
                  <Text type="secondary">Tổng số Request</Text>
                </Space>
              }
              value={stats?.totalRequests ?? 0}
              loading={loading}
              valueStyle={{ fontWeight: 600, color: '#1f1f1f' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title={
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <Text type="secondary">Thành công (2xx/3xx)</Text>
                </Space>
              }
              value={stats?.successCount ?? 0}
              loading={loading}
              valueStyle={{ fontWeight: 600, color: '#52c41a' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title={
                <Space>
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                  <Text type="secondary">Thất bại (4xx/5xx)</Text>
                </Space>
              }
              value={stats?.failCount ?? 0}
              loading={loading}
              valueStyle={{ fontWeight: 600, color: '#ff4d4f' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                  Tỷ lệ thành công
                </Text>
                <span style={{ fontSize: 24, fontWeight: 600, color: isHealthy ? '#52c41a' : '#fa8c16' }}>
                  {successRate}%
                </span>
              </div>
              <Progress
                type="circle"
                percent={successRate}
                size={44}
                strokeColor={isHealthy ? '#52c41a' : '#fa8c16'}
                format={() => ''}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Top Endpoints, Top Clients, Top Users */}
      <Row gutter={[12, 12]}>
        <Col xs={24} lg={10}>
          <Card
            size="small"
            title={
              <Space>
                <ThunderboltOutlined style={{ color: '#1677ff' }} />
                <span>Top Endpoint được gọi nhiều nhất</span>
              </Space>
            }
            bordered
            style={{ borderRadius: 8, height: '100%' }}
          >
            <Table
              dataSource={stats?.topEndpoints || []}
              rowKey={rec => `${rec.httpMethod}-${rec.endpoint}`}
              pagination={false}
              size="small"
              loading={loading}
              onRow={onSelectEndpoint ? (record) => ({
                onClick: () => onSelectEndpoint(record.endpoint, record.httpMethod),
                style: { cursor: 'pointer' },
              }) : undefined}
              columns={[
                {
                  title: 'Phương thức & Endpoint',
                  dataIndex: 'endpoint',
                  render: (ep: string, row) => (
                    <Space size="small">
                      <Tag
                        color={
                          row.httpMethod === 'GET'
                            ? 'blue'
                            : row.httpMethod === 'POST'
                            ? 'green'
                            : row.httpMethod === 'PUT'
                            ? 'orange'
                            : 'red'
                        }
                        style={{ margin: 0, fontSize: 11 }}
                      >
                        {row.httpMethod}
                      </Tag>
                      <Text code style={{ fontSize: 12 }}>
                        {ep}
                      </Text>
                    </Space>
                  ),
                },
                {
                  title: 'Số lượt',
                  dataIndex: 'count',
                  width: 80,
                  align: 'right',
                  render: (cnt: number) => <Text strong>{cnt.toLocaleString()}</Text>,
                },
                {
                  title: 'Độ trễ TB',
                  dataIndex: 'avgLatencyMs',
                  width: 90,
                  align: 'right',
                  render: (ms: number) => (
                    <Text type={ms > 500 ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
                      {ms} ms
                    </Text>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} md={12} lg={7}>
          <Card
            size="small"
            title={
              <Space>
                <AppstoreOutlined style={{ color: '#722ed1' }} />
                <span>Top Client / Ứng dụng</span>
              </Space>
            }
            bordered
            style={{ borderRadius: 8, height: '100%' }}
          >
            <Table
              dataSource={stats?.topClients || []}
              rowKey="clientId"
              pagination={false}
              size="small"
              loading={loading}
              onRow={onSelectClient ? (record) => ({
                onClick: () => onSelectClient(record.clientId),
                style: { cursor: 'pointer' },
              }) : undefined}
              columns={[
                {
                  title: 'Ứng dụng / Client ID',
                  dataIndex: 'clientName',
                  render: (cName: string, row) => (
                    <div>
                      <Text strong style={{ fontSize: 13, display: 'block' }}>
                        {cName || row.clientId || 'Chưa xác định'}
                      </Text>
                      {row.clientId && (
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          ID: {row.clientId}
                        </Text>
                      )}
                    </div>
                  ),
                },
                {
                  title: 'Số lượt',
                  dataIndex: 'count',
                  width: 80,
                  align: 'right',
                  render: (cnt: number) => <Text strong>{cnt.toLocaleString()}</Text>,
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} md={12} lg={7}>
          <Card
            size="small"
            title={
              <Space>
                <UserOutlined style={{ color: '#fa8c16' }} />
                <span>Top User thực hiện</span>
              </Space>
            }
            bordered
            style={{ borderRadius: 8, height: '100%' }}
          >
            <Table
              dataSource={stats?.topUsers || []}
              rowKey="username"
              pagination={false}
              size="small"
              loading={loading}
              onRow={onSelectUser ? (record) => ({
                onClick: () => onSelectUser(record.username),
                style: { cursor: 'pointer' },
              }) : undefined}
              columns={[
                {
                  title: 'Tài khoản',
                  dataIndex: 'username',
                  render: (uName: string, row) => (
                    <Space size="small">
                      <Text strong style={{ fontSize: 13 }}>
                        {uName}
                      </Text>
                      {row.role && (
                        <Tag
                          color={
                            row.role === 'ADMIN'
                              ? 'purple'
                              : row.role === 'AGENT'
                              ? 'orange'
                              : 'blue'
                          }
                          style={{ fontSize: 10, margin: 0 }}
                        >
                          {row.role}
                        </Tag>
                      )}
                    </Space>
                  ),
                },
                {
                  title: 'Số lượt',
                  dataIndex: 'count',
                  width: 80,
                  align: 'right',
                  render: (cnt: number) => <Text strong>{cnt.toLocaleString()}</Text>,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
