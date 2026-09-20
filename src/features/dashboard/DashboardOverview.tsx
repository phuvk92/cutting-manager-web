import React, { useEffect, useState, useCallback } from 'react'
import {
  Row,
  Col,
  Card,
  Statistic,
  Button,
  Space,
  Table,
  Typography,
  Tag,
  Tooltip,
} from 'antd'
import {
  FileImageOutlined,
  TeamOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  DownloadOutlined,
  RightOutlined,
  SyncOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { svgService } from '@/services/svg/svgService'
import { userService } from '@/services/users/userService'
import { auditService } from '@/services/audit/auditService'
import { SvgFile } from '@/types/svg'
import { formatBytes, formatDateTime, truncateString } from '@/utils/formatters'
import { RoleTag } from '@/components/common/RoleTag'
import { SvgUploadModal } from '@/features/svg/SvgUploadModal'
import { SvgPreviewModal } from '@/features/svg/SvgPreviewModal'

const { Text, Title, Paragraph } = Typography

export const DashboardOverview: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'
  const isAgentOrAdmin = user?.role === 'ADMIN' || user?.role === 'AGENT'

  const [svgTotal, setSvgTotal] = useState<number>(0)
  const [usersTotal, setUsersTotal] = useState<number>(0)
  const [backendHealth, setBackendHealth] = useState<string>('UNKNOWN')
  const [recentSvgs, setRecentSvgs] = useState<SvgFile[]>([])
  const [loading, setLoading] = useState(true)

  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [selectedSvg, setSelectedSvg] = useState<SvgFile | null>(null)

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Fetch SVGs
      const svgRes = await svgService.getSvgFiles({ page: 0, size: 5, sortBy: 'createdAt', sortDirection: 'DESC' })
      setSvgTotal(svgRes.totalElements || 0)
      setRecentSvgs(svgRes.content || [])

      // 2. Fetch Users count if admin
      if (isAdmin) {
        try {
          const userRes = await userService.getUsers({ page: 0, size: 1 })
          setUsersTotal(userRes.totalElements || 0)
        } catch {
          // Ignore if permission denied
        }
      }

      // 3. Check Actuator Health
      try {
        const healthRes = await auditService.getHealth()
        setBackendHealth(healthRes.status || 'UP')
      } catch {
        setBackendHealth('DOWN')
      }
    } catch {
      // Fail gracefully
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handlePreview = (svg: SvgFile) => {
    setSelectedSvg(svg)
    setPreviewModalOpen(true)
  }

  const handleDownload = (svg: SvgFile) => {
    svgService.downloadSvg(svg.id, svg.originalFilename)
  }

  return (
    <div>
      {/* Welcome Banner */}
      <Card
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, #1890ff 0%, #391085 100%)',
          borderRadius: 12,
          border: 'none',
          color: '#ffffff',
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Title level={3} style={{ color: '#ffffff', margin: 0 }}>
              Welcome back, {user?.username}!
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.85)', margin: '8px 0 0 0', fontSize: 14 }}>
              Enterprise SVG asset repository with automatic XML sanitization, role-based access, and direct previewing.
            </Paragraph>
            <div style={{ marginTop: 12 }}>
              <Space>
                <Tag color="#108ee9" style={{ border: 'none', padding: '4px 12px', fontSize: 12 }}>
                  Role: {user?.role}
                </Tag>
                <Tag color="cyan" style={{ border: 'none', padding: '4px 12px', fontSize: 12 }}>
                  Session: Active
                </Tag>
              </Space>
            </div>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Button
                icon={<SyncOutlined spin={loading} />}
                onClick={loadDashboardData}
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}
              >
                Refresh
              </Button>
              {isAgentOrAdmin && (
                <Button
                  type="primary"
                  icon={<CloudUploadOutlined />}
                  size="large"
                  style={{ background: '#ffffff', color: '#1890ff', border: 'none', fontWeight: 600 }}
                  onClick={() => setUploadModalOpen(true)}
                >
                  Upload SVG
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Metrics Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered hoverable onClick={() => navigate('/svg')} style={{ cursor: 'pointer' }}>
            <Statistic
              title="Total SVG Files"
              value={svgTotal}
              prefix={<FileImageOutlined style={{ color: '#1890ff' }} />}
              loading={loading}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              Managed in file repository <RightOutlined style={{ fontSize: 10 }} />
            </div>
          </Card>
        </Col>

        {isAdmin ? (
          <Col xs={24} sm={12} lg={6}>
            <Card bordered hoverable onClick={() => navigate('/users')} style={{ cursor: 'pointer' }}>
              <Statistic
                title="Registered Users"
                value={usersTotal}
                prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
                loading={loading}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
                System accounts & permissions <RightOutlined style={{ fontSize: 10 }} />
              </div>
            </Card>
          </Col>
        ) : (
          <Col xs={24} sm={12} lg={6}>
            <Card bordered>
              <Statistic
                title="Your Access Role"
                value={user?.role || 'USER'}
                prefix={<SafetyCertificateOutlined style={{ color: '#722ed1' }} />}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
                {user?.role === 'AGENT' ? 'Upload & Download access' : 'View & Download access'}
              </div>
            </Card>
          </Col>
        )}

        <Col xs={24} sm={12} lg={6}>
          <Card bordered>
            <Statistic
              title="Backend Service Status"
              value={backendHealth}
              valueStyle={{ color: backendHealth === 'UP' ? '#52c41a' : '#f5222d' }}
              prefix={
                backendHealth === 'UP' ? (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <CloseCircleOutlined style={{ color: '#f5222d' }} />
                )
              }
              loading={loading}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              Spring Boot Actuator: {backendHealth === 'UP' ? 'Healthy' : 'Disconnected'}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered>
            <Statistic
              title="Max File Upload Size"
              value="10 MB"
              prefix={<CloudUploadOutlined style={{ color: '#fa8c16' }} />}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              Server enforced limit
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent SVGs Table */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Recent SVG Uploads</span>
            <Button type="link" onClick={() => navigate('/svg')}>
              View All <RightOutlined />
            </Button>
          </div>
        }
        bordered
      >
        <Table<SvgFile>
          dataSource={recentSvgs}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
          columns={[
            {
              title: 'Filename',
              dataIndex: 'originalFilename',
              key: 'originalFilename',
              render: (text: string) => (
                <Space>
                  <FileImageOutlined style={{ color: '#1890ff' }} />
                  <Text strong>{truncateString(text, 32)}</Text>
                </Space>
              ),
            },
            {
              title: 'Size',
              dataIndex: 'fileSize',
              key: 'fileSize',
              width: 110,
              render: (bytes: number) => formatBytes(bytes),
            },
            {
              title: 'Uploaded By',
              dataIndex: 'uploadedBy',
              key: 'uploadedBy',
              render: (uploader: SvgFile['uploadedBy']) =>
                uploader ? (
                  <Space size="small">
                    <span>{uploader.username}</span>
                    <RoleTag role={uploader.role} />
                  </Space>
                ) : (
                  '-'
                ),
            },
            {
              title: 'Upload Date',
              dataIndex: 'createdAt',
              key: 'createdAt',
              render: (dateStr: string) => formatDateTime(dateStr),
            },
            {
              title: 'Quick Actions',
              key: 'actions',
              align: 'right',
              render: (_: unknown, record: SvgFile) => (
                <Space size="small">
                  <Tooltip title="Preview">
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => handlePreview(record)}
                    />
                  </Tooltip>
                  <Tooltip title="Download">
                    <Button
                      type="text"
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownload(record)}
                    />
                  </Tooltip>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <SvgUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={loadDashboardData}
      />

      <SvgPreviewModal
        svg={selectedSvg}
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
      />
    </div>
  )
}
