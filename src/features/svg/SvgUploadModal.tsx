import React, { useState, useEffect } from 'react'
import {
  Modal,
  Upload,
  Progress,
  Alert,
  Button,
  Form,
  message,
  Select,
  Typography,
  Divider,
  Switch,
  Table,
  Badge,
  Space,
  Tag,
} from 'antd'
import {
  InboxOutlined,
  DeleteOutlined,
  CarOutlined,
  TeamOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { svgService } from '@/services/svg/svgService'
import { vehicleConfigurationService } from '@/services/vehicle/vehicleConfigurationService'
import { dealerService } from '@/services/dealers/dealerService'
import { VehicleConfiguration } from '@/types/vehicleConfiguration'
import { Dealer } from '@/types/dealer'
import { extractErrorMessage } from '@/utils/error'
import { formatBytes } from '@/utils/formatters'

const { Dragger } = Upload
const { Text } = Typography

interface SvgUploadModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface DealerPermissionItem {
  dealerId: number
  dealerCode: string
  dealerName: string
  canView: boolean
  canDownload: boolean
}

export const SvgUploadModal: React.FC<SvgUploadModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [fileList, setFileList] = useState<File[]>([])
  const [vehicleConfigs, setVehicleConfigs] = useState<VehicleConfiguration[]>([])
  const [selectedConfigIds, setSelectedConfigIds] = useState<number[]>([])
  const [activeDealers, setActiveDealers] = useState<Dealer[]>([])
  const [dealerPermissions, setDealerPermissions] = useState<DealerPermissionItem[]>([])
  const [loadingInitialData, setLoadingInitialData] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadInitialData()
    }
  }, [open])

  const loadInitialData = async () => {
    setLoadingInitialData(true)
    try {
      const [configsRes, dealersRes] = await Promise.all([
        vehicleConfigurationService.getConfigurations({ size: 100 }),
        dealerService.getAllDealers(),
      ])
      setVehicleConfigs(configsRes.content || [])
      const active = (dealersRes || []).filter(d => d.status === 'ACTIVE')
      setActiveDealers(active)
    } catch {
      message.error('Không thể tải danh sách cấu hình xe hoặc đại lý')
    } finally {
      setLoadingInitialData(false)
    }
  }

  const handleDealerSelectionChange = (dealerIds: number[]) => {
    const updated: DealerPermissionItem[] = dealerIds.map(id => {
      const existing = dealerPermissions.find(p => p.dealerId === id)
      if (existing) return existing
      const dealer = activeDealers.find(d => d.id === id)
      return {
        dealerId: id,
        dealerCode: dealer?.code || '',
        dealerName: dealer?.name || '',
        canView: true,
        canDownload: false,
      }
    })
    setDealerPermissions(updated)
  }

  const handleToggleView = (dealerId: number, checked: boolean) => {
    setDealerPermissions(prev =>
      prev.map(p => {
        if (p.dealerId === dealerId) {
          return {
            ...p,
            canView: checked,
            // If view is turned off, download must also be turned off
            canDownload: checked ? p.canDownload : false,
          }
        }
        return p
      })
    )
  }

  const handleToggleDownload = (dealerId: number, checked: boolean) => {
    setDealerPermissions(prev =>
      prev.map(p => {
        if (p.dealerId === dealerId) {
          return {
            ...p,
            canDownload: checked,
            // If download is turned on, view must also be turned on
            canView: checked ? true : p.canView,
          }
        }
        return p
      })
    )
  }

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('Vui lòng chọn ít nhất 1 file SVG để tải lên.')
      return
    }

    if (fileList.length > 10) {
      message.error('Chỉ được upload tối đa 10 file SVG trong một lần.')
      return
    }

    setUploading(true)
    setProgress(0)
    setErrorMessage(null)

    try {
      const permissionsPayload = dealerPermissions.map(p => ({
        dealerId: p.dealerId,
        canView: p.canView,
        canDownload: p.canDownload,
      }))

      await svgService.batchUploadSvg(
        fileList,
        selectedConfigIds,
        permissionsPayload,
        percent => setProgress(percent)
      )

      message.success(`Đã tải lên thành công ${fileList.length} file SVG!`)
      resetState()
      onSuccess()
      onClose()
    } catch (err) {
      setErrorMessage(extractErrorMessage(err, 'Tải lên file SVG thất bại.'))
    } finally {
      setUploading(false)
    }
  }

  const resetState = () => {
    setFileList([])
    setSelectedConfigIds([])
    setDealerPermissions([])
    setProgress(0)
    setErrorMessage(null)
  }

  const handleModalClose = () => {
    if (!uploading) {
      resetState()
      onClose()
    }
  }

  const uploadProps: UploadProps = {
    multiple: true,
    accept: '.svg,image/svg+xml',
    showUploadList: false,
    beforeUpload: (file, newFileList) => {
      const totalCount = fileList.length + newFileList.length
      if (totalCount > 10) {
        message.error('Tối đa 10 file trong một lần upload. Vui lòng chọn lại.')
        return Upload.LIST_IGNORE
      }

      const isSvg = file.name.toLowerCase().endsWith('.svg') || file.type === 'image/svg+xml'
      if (!isSvg) {
        message.error(`File "${file.name}" không phải định dạng SVG!`)
        return Upload.LIST_IGNORE
      }

      const isLt10M = file.size / 1024 / 1024 < 10
      if (!isLt10M) {
        message.error(`File "${file.name}" vượt quá giới hạn 10MB!`)
        return Upload.LIST_IGNORE
      }

      setFileList(prev => {
        // Prevent duplicate files by name
        if (prev.some(f => f.name === file.name)) {
          return prev
        }
        return [...prev, file].slice(0, 10)
      })
      setErrorMessage(null)
      return false
    },
  }

  const handleRemoveFile = (index: number) => {
    setFileList(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <Modal
      title={
        <Space>
          <span>Tải lên File SVG (Tối đa 10 file)</span>
          <Badge
            count={`${fileList.length}/10 file`}
            style={{
              backgroundColor: fileList.length > 10 ? '#ff4d4f' : '#1890ff',
            }}
          />
        </Space>
      }
      open={open}
      width={780}
      onCancel={handleModalClose}
      footer={[
        <Button key="cancel" onClick={handleModalClose} disabled={uploading}>
          Hủy bỏ
        </Button>,
        <Button
          key="upload"
          type="primary"
          onClick={handleUpload}
          loading={uploading}
          disabled={fileList.length === 0 || fileList.length > 10}
        >
          {uploading ? `Đang tải lên (${progress}%)...` : `Bắt đầu tải lên (${fileList.length} file)`}
        </Button>,
      ]}
      destroyOnClose
    >
      <div style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: 4 }}>
        {errorMessage && (
          <Alert
            type="error"
            showIcon
            message="Lỗi tải lên"
            description={errorMessage}
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setErrorMessage(null)}
          />
        )}

        {/* 1. Chọn Files */}
        <Typography.Title level={5} style={{ marginTop: 0 }}>
          1. Danh sách file SVG ({fileList.length}/10)
        </Typography.Title>
        <Dragger {...uploadProps} disabled={uploading || fileList.length >= 10}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: 38, color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">Kéo thả hoặc nhấn để chọn các file SVG</p>
          <p className="ant-upload-hint">
            Hỗ trợ định dạng .svg, tối đa 10MB/file. Tối đa 10 file mỗi lần nạp.
          </p>
        </Dragger>

        {fileList.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {fileList.map((file, idx) => (
              <div
                key={file.name + idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#fafafa',
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #f0f0f0',
                }}
              >
                <Space>
                  <Tag color="blue">{idx + 1}</Tag>
                  <Text strong>{file.name}</Text>
                  <Text type="secondary">({formatBytes(file.size)})</Text>
                </Space>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  onClick={() => handleRemoveFile(idx)}
                  disabled={uploading}
                />
              </div>
            ))}
          </div>
        )}

        {uploading && (
          <div style={{ marginTop: 16 }}>
            <Progress percent={progress} status="active" />
          </div>
        )}

        <Divider style={{ margin: '18px 0' }} />

        {/* 2. Gán Cấu hình xe */}
        <Typography.Title level={5}>
          <CarOutlined style={{ marginRight: 6 }} />
          2. Gán Cấu hình xe (Tùy chọn)
        </Typography.Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          Nếu không chọn cấu hình nào, các file này sẽ được coi là <b>file dùng chung</b>.
        </Text>
        <Select
          mode="multiple"
          placeholder="Tìm & chọn cấu hình xe..."
          loading={loadingInitialData}
          value={selectedConfigIds}
          onChange={setSelectedConfigIds}
          style={{ width: '100%' }}
          allowClear
          optionFilterProp="label"
          options={vehicleConfigs.map(c => {
            const groupName =
              c.productGroup === 'PPF_EXTERIOR'
                ? 'Ngoại thất'
                : c.productGroup === 'PPF_INTERIOR'
                ? 'Nội thất'
                : 'Window Film'
            const gen = c.generationCode ? ` (${c.generationCode})` : ''
            const label = `[${groupName}] ${c.brand?.name || ""} ${c.model?.name || ""} ${c.yearFrom}-${c.yearTo}${gen}`
            return {
              value: c.id,
              label,
            }
          })}
        />

        <Divider style={{ margin: '18px 0' }} />

        {/* 3. Phân quyền Đại lý */}
        <Typography.Title level={5}>
          <TeamOutlined style={{ marginRight: 6 }} />
          3. Phân quyền Đại lý (Tùy chọn)
        </Typography.Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          User thuộc Đại lý sẽ tự động kế thừa quyền này. Nếu không gán, chỉ ADMIN mới xem được.
        </Text>

        <Form.Item label="Chọn đại lý được cấp quyền" style={{ marginBottom: 12 }}>
          <Select
            mode="multiple"
            placeholder="Chọn đại lý áp dụng quyền..."
            loading={loadingInitialData}
            value={dealerPermissions.map(p => p.dealerId)}
            onChange={handleDealerSelectionChange}
            style={{ width: '100%' }}
            allowClear
            optionFilterProp="label"
            options={activeDealers.map(d => ({
              value: d.id,
              label: `${d.code} - ${d.name}`,
            }))}
          />
        </Form.Item>

        {dealerPermissions.length > 0 ? (
          <Table
            dataSource={dealerPermissions}
            rowKey="dealerId"
            pagination={false}
            size="small"
            bordered
            columns={[
              {
                title: 'Mã Đại lý',
                dataIndex: 'dealerCode',
                key: 'dealerCode',
                width: 120,
              },
              {
                title: 'Tên Đại lý',
                dataIndex: 'dealerName',
                key: 'dealerName',
              },
              {
                title: 'Quyền xem',
                key: 'canView',
                width: 110,
                align: 'center',
                render: (_, record) => (
                  <Switch
                    checked={record.canView}
                    onChange={checked => handleToggleView(record.dealerId, checked)}
                    size="small"
                  />
                ),
              },
              {
                title: 'Quyền tải',
                key: 'canDownload',
                width: 110,
                align: 'center',
                render: (_, record) => (
                  <Switch
                    checked={record.canDownload}
                    onChange={checked => handleToggleDownload(record.dealerId, checked)}
                    size="small"
                  />
                ),
              },
            ]}
          />
        ) : (
          <div
            style={{
              padding: '10px 14px',
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 6,
              color: '#389e0d',
              fontSize: 13,
            }}
          >
            <InfoCircleOutlined style={{ marginRight: 6 }} />
            Chưa gán đại lý nào. File chỉ hiển thị cho tài khoản ADMIN cho đến khi được phân quyền.
          </div>
        )}
      </div>
    </Modal>
  )
}
