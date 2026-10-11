import React, { useEffect, useState, useCallback } from 'react'
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Alert,
  Button,
  message,
  Row,
  Col,
  Tooltip,
  DatePicker,
  Card,
  Space,
} from 'antd'
import {
  ReloadOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { Dealer, CreateDealerRequest, UpdateDealerRequest } from '@/types/dealer'
import { dealerService, generateDealerCodeLocal } from '@/services/dealers/dealerService'
import { extractErrorMessage } from '@/utils/error'

dayjs.extend(customParseFormat)

const dealerFormSchema = z.object({
  code: z.string().max(50, 'Tối đa 50 ký tự').optional(),
  name: z
    .string()
    .min(1, 'Tên đại lý là bắt buộc')
    .max(255, 'Tối đa 255 ký tự'),
  region: z.string().max(100, 'Tối đa 100 ký tự').optional(),
  address: z.string().max(255, 'Tối đa 255 ký tự').optional(),
  contactPerson: z.string().max(100, 'Tối đa 100 ký tự').optional(),
  phone: z.string().max(50, 'Tối đa 50 ký tự').optional(),
  email: z.string().max(100, 'Tối đa 100 ký tự').optional(),
  status: z.string().min(1, 'Trạng thái là bắt buộc'),
  notes: z.string().optional(),
  // Gói account đại lý
  maxAccounts: z.number().int().min(1, 'Tối thiểu 1 tài khoản'),
  totalAllocatedDays: z.number().int().min(1, 'Tối thiểu 1 ngày'),
  packageStartDate: z.string().optional().nullable(),
  packageExpiryDate: z.string().optional().nullable(),
  packageStatus: z.string().min(1, 'Trạng thái gói là bắt buộc'),
})

type DealerFormValues = z.infer<typeof dealerFormSchema>

interface DealerModalProps {
  open: boolean
  dealer?: Dealer | null
  onClose: () => void
  onSuccess: () => void
}

const REGION_OPTIONS = [
  { value: 'TP.HCM', label: 'TP.HCM' },
  { value: 'Hà Nội', label: 'Hà Nội' },
  { value: 'Đà Nẵng', label: 'Đà Nẵng' },
  { value: 'Cần Thơ', label: 'Cần Thơ' },
  { value: 'Hải Phòng', label: 'Hải Phòng' },
  { value: 'Bình Dương', label: 'Bình Dương' },
  { value: 'Đồng Nai', label: 'Đồng Nai' },
  { value: 'Khánh Hoà', label: 'Khánh Hoà' },
  { value: 'Quảng Ninh', label: 'Quảng Ninh' },
  { value: 'Nghệ An', label: 'Nghệ An' },
]

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'EXPIRING', label: 'Sắp hết hạn' },
  { value: 'LOCKED', label: 'Tạm khóa' },
]

const PACKAGE_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'ACTIVE — Đang hoạt động' },
  { value: 'EXPIRED', label: 'EXPIRED — Đã hết hạn' },
  { value: 'SUSPENDED', label: 'SUSPENDED — Tạm đình chỉ' },
]

export const DealerModal: React.FC<DealerModalProps> = ({
  open,
  dealer,
  onClose,
  onSuccess,
}) => {
  const isEdit = Boolean(dealer)
  const [submitting, setSubmitting] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DealerFormValues>({
    resolver: zodResolver(dealerFormSchema),
    defaultValues: {
      code: '',
      name: '',
      region: 'TP.HCM',
      address: '',
      contactPerson: '',
      phone: '',
      email: '',
      status: 'ACTIVE',
      notes: '',
      maxAccounts: 10,
      totalAllocatedDays: 3600,
      packageStartDate: dayjs().format('YYYY-MM-DD'),
      packageExpiryDate: dayjs().add(1, 'year').format('YYYY-MM-DD'),
      packageStatus: 'ACTIVE',
    },
  })

  const watchedMaxAccounts = watch('maxAccounts')
  const watchedTotalDays = watch('totalAllocatedDays')

  const refreshGeneratedCode = useCallback(async () => {
    setGeneratingCode(true)
    try {
      const code = await dealerService.generateCode()
      setValue('code', code)
    } catch {
      setValue('code', generateDealerCodeLocal())
    } finally {
      setGeneratingCode(false)
    }
  }, [setValue])

  useEffect(() => {
    if (open) {
      setServerError(null)
      if (dealer) {
        reset({
          code: dealer.code,
          name: dealer.name,
          region: dealer.region || 'TP.HCM',
          address: dealer.address || '',
          contactPerson: dealer.contactPerson || '',
          phone: dealer.phone || '',
          email: dealer.email || '',
          status: dealer.status || 'ACTIVE',
          notes: dealer.notes || '',
          maxAccounts: dealer.maxAccounts ?? 10,
          totalAllocatedDays: dealer.totalAllocatedDays ?? 3600,
          packageStartDate: dealer.packageStartDate || null,
          packageExpiryDate: dealer.packageExpiryDate || null,
          packageStatus: dealer.packageStatus || 'ACTIVE',
        })
      } else {
        const initialCode = generateDealerCodeLocal()
        reset({
          code: initialCode,
          name: '',
          region: 'TP.HCM',
          address: '',
          contactPerson: '',
          phone: '',
          email: '',
          status: 'ACTIVE',
          notes: '',
          maxAccounts: 10,
          totalAllocatedDays: 3600,
          packageStartDate: dayjs().format('YYYY-MM-DD'),
          packageExpiryDate: dayjs().add(1, 'year').format('YYYY-MM-DD'),
          packageStatus: 'ACTIVE',
        })
        refreshGeneratedCode()
      }
    }
  }, [open, dealer, reset, refreshGeneratedCode])

  // Preset package helper
  const applyPackageTemplate = (accounts: number, days: number, years: number = 1) => {
    setValue('maxAccounts', accounts, { shouldValidate: true })
    setValue('totalAllocatedDays', days, { shouldValidate: true })
    setValue('packageStartDate', dayjs().format('YYYY-MM-DD'), { shouldValidate: true })
    setValue('packageExpiryDate', dayjs().add(years, 'year').format('YYYY-MM-DD'), { shouldValidate: true })
  }

  // Warnings when reducing below current usage in edit mode
  const accountsBelowUsage = isEdit && dealer && (watchedMaxAccounts ?? 0) < (dealer.usersCount ?? 0)
  const daysBelowUsage = isEdit && dealer && (watchedTotalDays ?? 0) < (dealer.usedAllocatedDays ?? 0)

  const onSubmit = async (values: DealerFormValues) => {
    if (accountsBelowUsage) {
      message.error(`Không thể giảm số lượng account xuống ${values.maxAccounts} vì đại lý đã tạo ${dealer?.usersCount} account!`)
      return
    }
    if (daysBelowUsage) {
      message.error(`Không thể giảm tổng quỹ ngày xuống ${values.totalAllocatedDays} ngày vì đại lý đã phân bổ ${dealer?.usedAllocatedDays} ngày!`)
      return
    }

    setSubmitting(true)
    setServerError(null)

    try {
      if (isEdit && dealer) {
        const payload: UpdateDealerRequest = {
          code: (values.code || dealer.code).trim().toUpperCase(),
          name: values.name.trim(),
          region: values.region?.trim(),
          address: values.address?.trim(),
          contactPerson: values.contactPerson?.trim(),
          phone: values.phone?.trim(),
          email: values.email?.trim(),
          status: values.status,
          notes: values.notes?.trim(),
          maxAccounts: values.maxAccounts,
          totalAllocatedDays: values.totalAllocatedDays,
          packageStartDate: values.packageStartDate || null,
          packageExpiryDate: values.packageExpiryDate || null,
          packageStatus: values.packageStatus,
        }
        await dealerService.updateDealer(dealer.id, payload)
        message.success('Cập nhật thông tin đại lý và cấu hình gói thành công!')
      } else {
        const payload: CreateDealerRequest = {
          code: values.code?.trim().toUpperCase() || '',
          name: values.name.trim(),
          region: values.region?.trim(),
          address: values.address?.trim(),
          contactPerson: values.contactPerson?.trim(),
          phone: values.phone?.trim(),
          email: values.email?.trim(),
          status: values.status,
          notes: values.notes?.trim(),
          maxAccounts: values.maxAccounts,
          totalAllocatedDays: values.totalAllocatedDays,
          packageStartDate: values.packageStartDate || null,
          packageExpiryDate: values.packageExpiryDate || null,
          packageStatus: values.packageStatus,
        }
        await dealerService.createDealer(payload)
        message.success('Thêm mới đại lý và cấp gói thành công!')
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = extractErrorMessage(err)
      setServerError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={isEdit ? `Chỉnh sửa đại lý: ${dealer?.name}` : 'Thêm mới Đại lý & Cấp gói Account'}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={720}
    >
      {serverError && (
        <Alert
          type="error"
          showIcon
          message="Lỗi xử lý"
          description={serverError}
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setServerError(null)}
        />
      )}

      {/* Usage warnings */}
      {accountsBelowUsage && (
        <Alert
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message="Số account tối đa nhỏ hơn số lượng đã tạo"
          description={`Đại lý hiện đã có ${dealer?.usersCount} account đang hoạt động. Số account tối đa mới (${watchedMaxAccounts}) không thể thấp hơn số này.`}
          style={{ marginBottom: 16 }}
        />
      )}

      {daysBelowUsage && (
        <Alert
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message="Tổng quỹ ngày nhỏ hơn số ngày đã phân bổ"
          description={`Đại lý hiện đã phân bổ ${(dealer?.usedAllocatedDays ?? 0).toLocaleString()} ngày cho các tài khoản. Quỹ ngày mới (${(watchedTotalDays ?? 0).toLocaleString()} ngày) không thể thấp hơn số này.`}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        {/* THÔNG TIN CƠ BẢN */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Mã đại lý"
              help={errors.code?.message}
              validateStatus={errors.code ? 'error' : ''}
              extra={
                <span style={{ fontSize: 11, color: '#8A8983' }}>
                  {isEdit ? 'Mã định danh duy nhất' : 'Để trống để tự tạo mã'}
                </span>
              }
            >
              <div style={{ display: 'flex', gap: 6 }}>
                <Controller
                  name="code"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="VD: 27092026A1B2C3"
                      maxLength={50}
                      style={{ textTransform: 'uppercase' }}
                    />
                  )}
                />
                {!isEdit && (
                  <Tooltip title="Tạo mã ngẫu nhiên mới">
                    <Button
                      icon={<ReloadOutlined spin={generatingCode} />}
                      onClick={refreshGeneratedCode}
                      disabled={generatingCode}
                    />
                  </Tooltip>
                )}
              </div>
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item
              label="Tên đại lý"
              required
              help={errors.name?.message}
              validateStatus={errors.name ? 'error' : ''}
            >
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="VD: Decal Ô Tô Sài Gòn"
                    maxLength={255}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Khu vực / Tỉnh thành"
              help={errors.region?.message}
              validateStatus={errors.region ? 'error' : ''}
            >
              <Controller
                name="region"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={REGION_OPTIONS}
                    placeholder="Chọn khu vực"
                    showSearch
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item
              label="Địa chỉ chi tiết"
              help={errors.address?.message}
              validateStatus={errors.address ? 'error' : ''}
            >
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="VD: 124 Cộng Hoà, P.12, Q.Tân Bình"
                    maxLength={255}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Người đại diện"
              help={errors.contactPerson?.message}
              validateStatus={errors.contactPerson ? 'error' : ''}
            >
              <Controller
                name="contactPerson"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="VD: Nguyễn Văn Thắng"
                    maxLength={100}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Số điện thoại"
              help={errors.phone?.message}
              validateStatus={errors.phone ? 'error' : ''}
            >
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="VD: 0903123456"
                    maxLength={50}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Email"
              help={errors.email?.message}
              validateStatus={errors.email ? 'error' : ''}
            >
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="VD: contact@decaloto.vn"
                    maxLength={100}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* CẤU HÌNH GÓI ACCOUNT ĐẠI LÝ */}
        <Card
          size="small"
          style={{
            marginBottom: 20,
            borderRadius: 8,
            borderColor: '#DDD2FA',
            background: '#FAF8FF',
          }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#4A2A94', fontWeight: 600 }}>
                Cấu hình gói account đại lý (Quỹ ngày phân bổ)
              </span>
              <span style={{ fontSize: 11, color: '#6E6D68', fontWeight: 400 }}>
                1 năm = 360 ngày · 1 tháng = 30 ngày
              </span>
            </div>
          }
        >
          {/* Quick presets */}
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: '#6E6D68', marginRight: 8 }}>Gói mẫu nhanh:</span>
            <Space size={6} wrap>
              <Button
                size="small"
                onClick={() => applyPackageTemplate(10, 3600, 1)}
                style={{ fontSize: 11 }}
              >
                10 acc / 3.600 ngày (1 năm)
              </Button>
              <Button
                size="small"
                onClick={() => applyPackageTemplate(5, 1800, 1)}
                style={{ fontSize: 11 }}
              >
                5 acc / 1.800 ngày (1 năm)
              </Button>
              <Button
                size="small"
                onClick={() => applyPackageTemplate(20, 7200, 1)}
                style={{ fontSize: 11 }}
              >
                20 acc / 7.200 ngày (1 năm)
              </Button>
              <Button
                size="small"
                onClick={() => applyPackageTemplate(10, 7200, 2)}
                style={{ fontSize: 11 }}
              >
                10 acc / 7.200 ngày (2 năm)
              </Button>
            </Space>
          </div>

          {/* Current usage banner in edit mode */}
          {isEdit && dealer && (
            <div
              style={{
                marginBottom: 14,
                padding: '8px 12px',
                background: '#FFFFFF',
                border: '1px solid #E9E6F5',
                borderRadius: 6,
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
              }}
            >
              <span>
                Account đã tạo: <strong>{dealer.usersCount ?? 0}</strong> / {dealer.maxAccounts ?? 10}
              </span>
              <span>
                Ngày đã phân bổ: <strong>{(dealer.usedAllocatedDays ?? 0).toLocaleString()}</strong> / {(dealer.totalAllocatedDays ?? 3600).toLocaleString()} ngày
              </span>
              <span style={{ color: '#16A34A', fontWeight: 500 }}>
                Quỹ còn lại: {(dealer.remainingAllocatedDays ?? Math.max(0, (dealer.totalAllocatedDays ?? 3600) - (dealer.usedAllocatedDays ?? 0))).toLocaleString()} ngày
              </span>
            </div>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Số account tối đa"
                required
                help={errors.maxAccounts?.message}
                validateStatus={errors.maxAccounts ? 'error' : ''}
                extra={<span style={{ fontSize: 11, color: '#8A8983' }}>Số lượng tài khoản tối đa đại lý được phép tạo</span>}
              >
                <Controller
                  name="maxAccounts"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      min={1}
                      max={1000}
                      precision={0}
                      style={{ width: '100%' }}
                      addonAfter="account"
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tổng quỹ ngày sử dụng"
                required
                help={errors.totalAllocatedDays?.message}
                validateStatus={errors.totalAllocatedDays ? 'error' : ''}
                extra={<span style={{ fontSize: 11, color: '#8A8983' }}>Tổng số ngày thời hạn đại lý được phân bổ cho các account</span>}
              >
                <Controller
                  name="totalAllocatedDays"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      min={1}
                      max={1000000}
                      precision={0}
                      style={{ width: '100%' }}
                      addonAfter="ngày"
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Ngày bắt đầu gói"
                help={errors.packageStartDate?.message}
                validateStatus={errors.packageStartDate ? 'error' : ''}
              >
                <Controller
                  name="packageStartDate"
                  control={control}
                  render={({ field }) => {
                    const dateObj = field.value ? dayjs(field.value, 'YYYY-MM-DD') : null
                    return (
                      <DatePicker
                        value={dateObj && dateObj.isValid() ? dateObj : null}
                        onChange={d => field.onChange(d ? d.format('YYYY-MM-DD') : null)}
                        format="DD/MM/YYYY"
                        placeholder="dd/MM/yyyy"
                        style={{ width: '100%' }}
                        allowClear
                      />
                    )
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Ngày hết hạn gói đại lý"
                help={errors.packageExpiryDate?.message}
                validateStatus={errors.packageExpiryDate ? 'error' : ''}
                extra={<span style={{ fontSize: 11, color: '#8A8983' }}>Mốc cuối quyền tạo/quản lý</span>}
              >
                <Controller
                  name="packageExpiryDate"
                  control={control}
                  render={({ field }) => {
                    const dateObj = field.value ? dayjs(field.value, 'YYYY-MM-DD') : null
                    return (
                      <DatePicker
                        value={dateObj && dateObj.isValid() ? dateObj : null}
                        onChange={d => field.onChange(d ? d.format('YYYY-MM-DD') : null)}
                        format="DD/MM/YYYY"
                        placeholder="dd/MM/yyyy"
                        style={{ width: '100%' }}
                        allowClear
                      />
                    )
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Trạng thái gói"
                required
                help={errors.packageStatus?.message}
                validateStatus={errors.packageStatus ? 'error' : ''}
              >
                <Controller
                  name="packageStatus"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={PACKAGE_STATUS_OPTIONS}
                      placeholder="Chọn trạng thái gói"
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* TRẠNG THÁI ĐẠI LÝ */}
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Trạng thái đại lý"
              help={errors.status?.message}
              validateStatus={errors.status ? 'error' : ''}
            >
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={STATUS_OPTIONS}
                    placeholder="Chọn trạng thái"
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Ghi chú nội bộ"
          help={errors.notes?.message}
          validateStatus={errors.notes ? 'error' : ''}
        >
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                rows={2}
                placeholder="Ghi chú thêm về đại lý, hợp đồng, thiết bị máy cắt..."
              />
            )}
          />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <Button onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            disabled={Boolean(accountsBelowUsage || daysBelowUsage)}
            style={{ background: '#6C3BD6', borderColor: '#6C3BD6' }}
          >
            {isEdit ? 'Lưu thay đổi' : 'Tạo đại lý'}
          </Button>
        </div>
      </Form>
    </Modal>
  )
}
