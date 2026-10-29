import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Space,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  DownOutlined,
  UpOutlined,
  DownloadOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { AuditLogV2Filter } from '@/types/auditV2'

const { RangePicker } = DatePicker

export interface AuditLogV2FilterBarProps {
  filter: AuditLogV2Filter
  loading: boolean
  exporting?: boolean
  onFilterChange: (filters: AuditLogV2Filter) => void
  onReset: () => void
  onRefresh?: () => void
  onExportCsv?: () => void
}

export const AuditLogV2FilterBar: React.FC<AuditLogV2FilterBarProps> = ({
  filter,
  loading,
  exporting = false,
  onFilterChange,
  onReset,
  onRefresh,
  onExportCsv,
}) => {
  const { t } = useTranslation('audit')
  const [form] = Form.useForm()
  const [expanded, setExpanded] = useState(false)

  // Sync external filter changes to form fields
  useEffect(() => {
    form.setFieldsValue({
      keyword: filter.keyword,
      clientId: filter.clientId,
      username: filter.username,
      role: filter.role,
      dealerId: filter.dealerId,
      endpoint: filter.endpoint,
      httpMethod: filter.httpMethod,
      httpStatus: filter.httpStatus,
      result: filter.result,
      requestId: filter.requestId,
      dateRange:
        filter.from && filter.to
          ? [dayjs(filter.from), dayjs(filter.to)]
          : undefined,
    })
  }, [filter, form])

  const handleFinish = (values: any) => {
    const newFilter: AuditLogV2Filter = {}

    if (values.keyword?.trim()) newFilter.keyword = values.keyword.trim()
    if (values.clientId) newFilter.clientId = values.clientId
    if (values.username?.trim()) newFilter.username = values.username.trim()
    if (values.role) newFilter.role = values.role
    if (values.dealerId) newFilter.dealerId = Number(values.dealerId)
    if (values.endpoint?.trim()) newFilter.endpoint = values.endpoint.trim()
    if (values.httpMethod) newFilter.httpMethod = values.httpMethod
    if (values.httpStatus) newFilter.httpStatus = Number(values.httpStatus)
    if (values.result) newFilter.result = values.result
    if (values.requestId?.trim()) newFilter.requestId = values.requestId.trim()

    if (values.dateRange && values.dateRange[0] && values.dateRange[1]) {
      newFilter.from = values.dateRange[0].startOf('day').toISOString()
      newFilter.to = values.dateRange[1].endOf('day').toISOString()
    }

    onFilterChange(newFilter)
  }

  const handleResetClick = () => {
    form.resetFields()
    onReset()
  }

  return (
    <Card size="small" bordered style={{ marginBottom: 16, borderRadius: 8 }}>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        {/* Row 1: Quick Search */}
        <Row gutter={[12, 8]} align="bottom">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="Tìm kiếm chung" name="keyword" style={{ marginBottom: 8 }}>
              <Input
                placeholder="Request ID, endpoint, username..."
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                allowClear
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="Khoảng thời gian" name="dateRange" style={{ marginBottom: 8 }}>
              <RangePicker
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
                placeholder={['Từ ngày', 'Đến ngày']}
                presets={[
                  { label: 'Hôm nay', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
                  {
                    label: '7 ngày qua',
                    value: [dayjs().subtract(7, 'day').startOf('day'), dayjs().endOf('day')],
                  },
                  {
                    label: '30 ngày qua',
                    value: [dayjs().subtract(30, 'day').startOf('day'), dayjs().endOf('day')],
                  },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={12} sm={8} md={4} lg={3}>
            <Form.Item label="Kết quả" name="result" style={{ marginBottom: 8 }}>
              <Select
                placeholder="Tất cả"
                allowClear
                options={[
                  { label: 'SUCCESS (Thành công)', value: 'SUCCESS' },
                  { label: 'FAIL (Thất bại / Lỗi)', value: 'FAIL' },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={12} sm={8} md={4} lg={3}>
            <Form.Item label="HTTP Method" name="httpMethod" style={{ marginBottom: 8 }}>
              <Select
                placeholder="Tất cả"
                allowClear
                options={[
                  { label: 'GET', value: 'GET' },
                  { label: 'POST', value: 'POST' },
                  { label: 'PUT', value: 'PUT' },
                  { label: 'DELETE', value: 'DELETE' },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={16} md={24} lg={6} style={{ marginBottom: 8 }}>
            <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
                Lọc
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleResetClick} disabled={loading}>{t("v2.resetBtn")}</Button>
              {onRefresh && (
                <Button icon={<SyncOutlined />} onClick={onRefresh} loading={loading}>
                  Làm mới
                </Button>
              )}
              {onExportCsv && (
                <Button icon={<DownloadOutlined />} onClick={onExportCsv} loading={exporting}>
                  Xuất CSV
                </Button>
              )}
              <Button
                type="link"
                size="small"
                onClick={() => setExpanded(!expanded)}
                icon={expanded ? <UpOutlined /> : <DownOutlined />}
              >
                {expanded ? 'Thu gọn' : 'Mở rộng'}
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Row 2: Advanced filters (collapsible) */}
        {expanded && (
          <Row gutter={[12, 8]} style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #f0f0f0' }}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Client / Ứng dụng" name="clientId" style={{ marginBottom: 8 }}>
                <Select
                  placeholder="Chọn Client ID"
                  allowClear
                  options={[
                    { label: 'Cutting Machine Client (cutting-client)', value: 'cutting-client' },
                    { label: 'Web Admin Portal (cutting-manager-web)', value: 'cutting-manager-web' },
                    { label: 'Admin CLI Tool (admin-cli)', value: 'admin-cli' },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={12} sm={6} md={4}>
              <Form.Item label="Tài khoản (Username)" name="username" style={{ marginBottom: 8 }}>
                <Input placeholder="vd: tho.cat01" allowClear />
              </Form.Item>
            </Col>

            <Col xs={12} sm={6} md={3}>
              <Form.Item label="Vai trò" name="role" style={{ marginBottom: 8 }}>
                <Select
                  placeholder="Tất cả"
                  allowClear
                  options={[
                    { label: 'USER', value: 'USER' },
                    { label: 'AGENT', value: 'AGENT' },
                    { label: 'ADMIN', value: 'ADMIN' },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={12} sm={6} md={3}>
              <Form.Item label="Mã Đại lý (ID)" name="dealerId" style={{ marginBottom: 8 }}>
                <Input placeholder="ID đại lý" type="number" allowClear />
              </Form.Item>
            </Col>

            <Col xs={12} sm={6} md={4}>
              <Form.Item label="HTTP Status" name="httpStatus" style={{ marginBottom: 8 }}>
                <Select
                  placeholder="Mã trạng thái"
                  allowClear
                  options={[
                    { label: '200 OK', value: 200 },
                    { label: '201 Created', value: 201 },
                    { label: '204 No Content', value: 204 },
                    { label: '400 Bad Request', value: 400 },
                    { label: '401 Unauthorized', value: 401 },
                    { label: '403 Forbidden', value: 403 },
                    { label: '404 Not Found', value: 404 },
                    { label: '500 Server Error', value: 500 },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Form.Item label="Đường dẫn API (Endpoint)" name="endpoint" style={{ marginBottom: 8 }}>
                <Input placeholder="vd: /api/internal/v2/user-files" allowClear />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Request ID" name="requestId" style={{ marginBottom: 8 }}>
                <Input placeholder="Chuỗi Request ID..." allowClear />
              </Form.Item>
            </Col>
          </Row>
        )}
      </Form>
    </Card>
  )
}
