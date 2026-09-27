import React, { useState, useEffect } from 'react'
import {
  Drawer,
  Descriptions,
  Button,
  Space,
  Typography,
  Popconfirm,
  Tag,
  Tabs,
  Table,
  Switch,
  Select,
  message,
  Alert,
  Tooltip,
} from 'antd'
import {
  DownloadOutlined,
  DeleteOutlined,
  SaveOutlined,
  CarOutlined,
  TeamOutlined,
  LockOutlined,
} from '@ant-design/icons'
import { SvgFile, SvgFileDealerPermission } from '@/types/svg'
import { SafeSvgViewer } from '@/components/svg/SafeSvgViewer'
import { RoleTag } from '@/components/common/RoleTag'
import { formatBytes, formatDateTime } from '@/utils/formatters'
import { svgService } from '@/services/svg/svgService'
import { vehicleConfigurationService } from '@/services/vehicle/vehicleConfigurationService'
import { dealerService } from '@/services/dealers/dealerService'
import { VehicleConfiguration } from '@/types/vehicleConfiguration'
import { Dealer } from '@/types/dealer'
import { useAuthStore } from '@/stores/authStore'
import { extractErrorMessage } from '@/utils/error'

const { Text, Paragraph } = Typography

interface SvgDetailDrawerProps {
  svg: SvgFile | null
  open: boolean
  onClose: () => void
  onUpdateSuccess?: () => void
  onDeleteSuccess?: () => void
}

export const SvgDetailDrawer: React.FC<SvgDetailDrawerProps> = ({
  svg,
  open,
  onClose,
  onUpdateSuccess,
  onDeleteSuccess,
}) => {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'

  // Vehicle configs assignment state
  const [allConfigs, setAllConfigs] = useState<VehicleConfiguration[]>([])
  const [assignedConfigIds, setAssignedConfigIds] = useState<number[]>([])
  const [savingConfigs, setSavingConfigs] = useState(false)

  // Dealer permissions state
  const [allActiveDealers, setAllActiveDealers] = useState<Dealer[]>([])
  const [dealerPermissions, setDealerPermissions] = useState<SvgFileDealerPermission[]>([])
  const [savingDealers, setSavingDealers] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    if (open && svg) {
      // Initialize vehicle config IDs
      const currentConfigIds = (svg.vehicleConfigurations || []).map(c => c.id)
      setAssignedConfigIds(currentConfigIds)

      if (isAdmin) {
        loadAdminData()
      }
    }
  }, [open, svg, isAdmin])

  const loadAdminData = async () => {
    if (!svg) return
    setLoadingDetails(true)
    try {
      const [configsRes, dealersRes, permissionsRes] = await Promise.all([
        vehicleConfigurationService.getConfigurations({ size: 100 }),
        dealerService.getAllDealers(),
        svgService.getSvgDealers(svg.id),
      ])
      setAllConfigs(configsRes.content || [])
      setAllActiveDealers((dealersRes || []).filter(d => d.status === 'ACTIVE'))
      setDealerPermissions(permissionsRes || [])
    } catch (err) {
      message.error(extractErrorMessage(err, 'Lỗi khi tải thông tin chi tiết file SVG'))
    } finally {
      setLoadingDetails(false)
    }
  }

  if (!svg) return null

  const handleDownload = () => {
    if (!isAdmin && !svg.canDownload) {
      message.warning('Đại lý của bạn không có quyền tải file này')
      return
    }
    svgService.downloadSvg(svg.id, svg.originalFilename)
  }

  const handleDelete = async () => {
    try {
      await svgService.deleteSvg(svg.id)
      message.success(`Đã xóa file SVG "${svg.originalFilename}"`)
      onClose()
      if (onDeleteSuccess) {
        onDeleteSuccess()
      }
    } catch (err) {
      message.error(extractErrorMessage(err, 'Xóa file SVG thất bại'))
    }
  }

  const handleSaveConfigs = async () => {
    setSavingConfigs(true)
    try {
      await svgService.updateSvgConfigurations(svg.id, assignedConfigIds)
      message.success('Đã cập nhật danh sách cấu hình xe thành công')
      if (onUpdateSuccess) onUpdateSuccess()
    } catch (err) {
      message.error(extractErrorMessage(err, 'Cập nhật cấu hình xe thất bại'))
    } finally {
      setSavingConfigs(false)
    }
  }

  const handleDealerSelection = (selectedIds: number[]) => {
    const updated: SvgFileDealerPermission[] = selectedIds.map(id => {
      const existing = dealerPermissions.find(p => p.dealerId === id)
      if (existing) return existing
      const dealer = allActiveDealers.find(d => d.id === id)
      return {
        dealerId: id,
        dealerCode: dealer?.code,
        dealerName: dealer?.name,
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
            canView: checked ? true : p.canView,
          }
        }
        return p
      })
    )
  }

  const handleSaveDealers = async () => {
    setSavingDealers(true)
    try {
      const payload = dealerPermissions.map(p => ({
        dealerId: p.dealerId,
        canView: p.canView,
        canDownload: p.canDownload,
      }))
      const res = await svgService.updateSvgDealers(svg.id, payload)
      setDealerPermissions(res)
      message.success('Đã cập nhật phân quyền đại lý thành công')
      if (onUpdateSuccess) onUpdateSuccess()
    } catch (err) {
      message.error(extractErrorMessage(err, 'Cập nhật phân quyền đại lý thất bại'))
    } finally {
      setSavingDealers(false)
    }
  }

  const renderDownloadButton = () => {
    if (isAdmin || svg.canDownload) {
      return (
        <Button icon={<DownloadOutlined />} onClick={handleDownload} type="primary">
          Tải file
        </Button>
      )
    }
    return (
      <Tooltip title="Đại lý của bạn chỉ có quyền xem, không được quyền tải xuống">
        <Button icon={<LockOutlined />} disabled>
          Không có quyền tải
        </Button>
      </Tooltip>
    )
  }

  return (
    <Drawer
      title="Chi tiết & Phân quyền File SVG"
      placement="right"
      width={640}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          {renderDownloadButton()}
          {isAdmin && (
            <Popconfirm
              title="Xóa File SVG"
              description={`Bạn có chắc chắn muốn xóa file "${svg.originalFilename}" không?`}
              onConfirm={handleDelete}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          )}
        </Space>
      }
    >
      <div style={{ marginBottom: 20 }}>
        <Typography.Title level={5} style={{ marginBottom: 12 }}>
          Xem trước
        </Typography.Title>
        <SafeSvgViewer svgId={svg.id} height={240} />
      </div>

      <Tabs
        defaultActiveKey="info"
        items={[
          {
            key: 'info',
            label: 'Thông tin chung',
            children: (
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="ID">{svg.id}</Descriptions.Item>
                <Descriptions.Item label="Tên file gốc">
                  <Text strong>{svg.originalFilename}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Dung lượng">
                  {formatBytes(svg.fileSize)} ({svg.fileSize.toLocaleString()} bytes)
                </Descriptions.Item>
                <Descriptions.Item label="Định dạng">
                  <code>{svg.contentType}</code>
                </Descriptions.Item>
                <Descriptions.Item label="Mã Checksum (SHA-256)">
                  <Paragraph
                    copyable={{ text: svg.checksum }}
                    style={{ margin: 0, fontSize: 11, wordBreak: 'break-all' }}
                  >
                    {svg.checksum || '-'}
                  </Paragraph>
                </Descriptions.Item>
                <Descriptions.Item label="Người tải lên">
                  <Space>
                    <Text strong>{svg.uploadedBy?.username || 'Unknown'}</Text>
                    {svg.uploadedBy?.role && <RoleTag role={svg.uploadedBy.role} />}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                  {formatDateTime(svg.createdAt)}
                </Descriptions.Item>
              </Descriptions>
            ),
          },
          {
            key: 'configurations',
            label: (
              <span>
                <CarOutlined style={{ marginRight: 6 }} />
                Cấu hình xe ({assignedConfigIds.length})
              </span>
            ),
            children: (
              <div>
                {isAdmin ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Alert
                      type="info"
                      showIcon
                      message="Quản lý cấu hình xe gán cho file"
                      description="Nếu không gán cấu hình nào, file sẽ được coi là file dùng chung hiển thị cho tất cả cấu hình."
                    />
                    <Select
                      mode="multiple"
                      placeholder="Tìm & chọn cấu hình xe..."
                      value={assignedConfigIds}
                      onChange={setAssignedConfigIds}
                      style={{ width: '100%' }}
                      allowClear
                      optionFilterProp="label"
                      options={allConfigs.map(c => {
                        const groupName =
                          c.productGroup === 'PPF_EXTERIOR'
                            ? 'Ngoại thất'
                            : c.productGroup === 'PPF_INTERIOR'
                            ? 'Nội thất'
                            : 'Window Film'
                        const gen = c.generationCode ? ` (${c.generationCode})` : ''
                        return {
                          value: c.id,
                          label: `[${groupName}] ${c.brand?.name || ""} ${c.model?.name || ""} ${c.yearFrom}-${c.yearTo}${gen}`,
                        }
                      })}
                    />
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={handleSaveConfigs}
                      loading={savingConfigs}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      Lưu gán cấu hình
                    </Button>
                  </div>
                ) : (
                  <div>
                    {svg.vehicleConfigurations && svg.vehicleConfigurations.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {svg.vehicleConfigurations.map(c => (
                          <Tag key={c.id} color="blue" style={{ padding: '4px 8px', fontSize: 13 }}>
                            {c.fullName}
                          </Tag>
                        ))}
                      </div>
                    ) : (
                      <Text type="secondary">File dùng chung (Không gắn cấu hình xe cụ thể)</Text>
                    )}
                  </div>
                )}
              </div>
            ),
          },
          ...(isAdmin
            ? [
                {
                  key: 'dealers',
                  label: (
                    <span>
                      <TeamOutlined style={{ marginRight: 6 }} />
                      Quyền Đại lý ({dealerPermissions.length})
                    </span>
                  ),
                  children: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <Alert
                        type="info"
                        showIcon
                        message="Phân quyền Đại lý"
                        description="User thuộc đại lý sẽ kế thừa quyền Xem và Tải file. Nếu không có đại lý nào được phân quyền, chỉ ADMIN mới xem được file này."
                      />

                      <Select
                        mode="multiple"
                        placeholder="Chọn các đại lý được phân quyền..."
                        loading={loadingDetails}
                        value={dealerPermissions.map(p => p.dealerId)}
                        onChange={handleDealerSelection}
                        style={{ width: '100%' }}
                        allowClear
                        optionFilterProp="label"
                        options={allActiveDealers.map(d => ({
                          value: d.id,
                          label: `${d.code} - ${d.name}`,
                        }))}
                      />

                      {dealerPermissions.length > 0 && (
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
                              width: 110,
                            },
                            {
                              title: 'Tên Đại lý',
                              dataIndex: 'dealerName',
                              key: 'dealerName',
                            },
                            {
                              title: 'Xem',
                              key: 'canView',
                              width: 80,
                              align: 'center',
                              render: (_, record) => (
                                <Switch
                                  checked={record.canView}
                                  onChange={checked =>
                                    handleToggleView(record.dealerId, checked)
                                  }
                                  size="small"
                                />
                              ),
                            },
                            {
                              title: 'Tải',
                              key: 'canDownload',
                              width: 80,
                              align: 'center',
                              render: (_, record) => (
                                <Switch
                                  checked={record.canDownload}
                                  onChange={checked =>
                                    handleToggleDownload(record.dealerId, checked)
                                  }
                                  size="small"
                                />
                              ),
                            },
                          ]}
                        />
                      )}

                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleSaveDealers}
                        loading={savingDealers}
                        style={{ alignSelf: 'flex-start' }}
                      >
                        Lưu phân quyền đại lý
                      </Button>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
      />
    </Drawer>
  )
}
