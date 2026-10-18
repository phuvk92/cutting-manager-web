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
  Tag,
} from 'antd'
import {
  ReloadOutlined,
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
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

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\|,.<>/?]).{8,}$/

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

  // Thông tin tài khoản AGENT
  agentUsername: z.string().max(255, 'Tối đa 255 ký tự').optional().or(z.literal('')),
  agentEmail: z.string().email('Email đăng nhập không hợp lệ').max(255, 'Tối đa 255 ký tự').optional().or(z.literal('')),
  agentPassword: z.string().optional().or(z.literal('')),
  agentFullName: z.string().max(255, 'Tối đa 255 ký tự').optional().or(z.literal('')),
  agentPhone: z.string().max(50, 'Tối đa 50 ký tự').optional().or(z.literal('')),

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
      agentUsername: '',
      agentEmail: '',
      agentPassword: '',
      agentFullName: '',
      agentPhone: '',
      maxAccounts: 10,
      totalAllocatedDays: 3600,
      packageStartDate: dayjs().format('YYYY-MM-DD'),
      packageExpiryDate: dayjs().add(1, 'year').format('YYYY-MM-DD'),
      packageStatus: 'ACTIVE',
    },
  })

  const watchedMaxAccounts = watch('maxAccounts')
  const watchedTotalDays = watch('totalAllocatedDays')
  const watchedDealerEmail = watch('email')
  const watchedDealerName = watch('name')
  const watchedContactPerson = watch('contactPerson')
  const watchedDealerPhone = watch('phone')

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
          agentUsername: dealer.agentUsername || '',
          agentEmail: dealer.agentEmail || dealer.email || '',
          agentPassword: '',
          agentFullName: dealer.agentFullName || dealer.contactPerson || '',
          agentPhone: dealer.agentPhone || dealer.phone || '',
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
          agentUsername: '',
          agentEmail: '',
          agentPassword: '',
          agentFullName: '',
          agentPhone: '',
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

  // Helper: Sao chép thông tin đại lý sang tài khoản AGENT
  const copyDealerInfoToAgent = () => {
    if (watchedDealerEmail) setValue('agentEmail', watchedDealerEmail, { shouldValidate: true })
    if (watchedContactPerson || watchedDealerName) {
      setValue('agentFullName', watchedContactPerson || watchedDealerName, { shouldValidate: true })
    }
    if (watchedDealerPhone) setValue('agentPhone', watchedDealerPhone, { shouldValidate: true })
  }

  // Preset package helper
  const applyPackageTemplate = (accounts: number, days: number, years: number = 1) => {
    setValue('maxAccounts', accounts, { shouldValidate: true })
    setValue('totalAllocatedDays', days, { shouldValidate: true })
    setValue('packageStartDate', dayjs().format('YYYY-MM-DD'), { shouldValidate: true })
    setValue('packageExpiryDate', dayjs().add(years, 'year').format('YYYY-MM-DD'), { shouldValidate: true })
  }

  // Warnings when reducing below current usage in edit mode (chỉ tính role USER)
  const accountsBelowUsage = isEdit && dealer && (watchedMaxAccounts ?? 0) < (dealer.createdAccounts ?? dealer.usersCount ?? 0)
  const daysBelowUsage = isEdit && dealer && (watchedTotalDays ?? 0) < (dealer.usedAllocatedDays ?? 0)

  const onSubmit = async (values: DealerFormValues) => {
    if (accountsBelowUsage) {
      message.error(`Không thể giảm số lượng account xuống ${values.maxAccounts} vì đại lý đã tạo ${dealer?.createdAccounts ?? dealer?.usersCount} account Thợ cắt!`)
      return
    }
    if (daysBelowUsage) {
      message.error(`Không thể giảm tổng quỹ ngày xuống ${values.totalAllocatedDays} ngày vì đại lý đã phân bổ ${dealer?.usedAllocatedDays} ngày!`)
      return
    }

    // Validate AGENT credentials on creation
    if (!isEdit) {
      const effEmail = values.agentEmail?.trim() || values.email?.trim()
      if (!effEmail) {
        setServerError('Vui lòng nhập Email cho tài khoản đại lý (tại ô Email đại lý hoặc Email đăng nhập)')
        return
      }
      if (!values.agentPassword?.trim()) {
        setServerError('Mật khẩu tài khoản đại lý là bắt buộc khi thêm mới đại lý')
        return
      }
      if (!passwordRegex.test(values.agentPassword)) {
        setServerError('Mật khẩu đại lý phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt')
        return
      }
    } else {
      if (values.agentPassword?.trim() && !passwordRegex.test(values.agentPassword)) {
        setServerError('Mật khẩu đại lý mới phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt')
        return
      }
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
          agentUsername: values.agentUsername?.trim() || undefined,
          agentEmail: values.agentEmail?.trim() || undefined,
          agentPassword: values.agentPassword?.trim() || undefined,
          agentFullName: values.agentFullName?.trim() || undefined,
          agentPhone: values.agentPhone?.trim() || undefined,
          maxAccounts: values.maxAccounts,
          totalAllocatedDays: values.totalAllocatedDays,
          packageStartDate: values.packageStartDate || null,
          packageExpiryDate: values.packageExpiryDate || null,
          packageStatus: values.packageStatus,
        }
        await dealerService.updateDealer(dealer.id, payload)
        message.success('Cập nhật thông tin đại lý và tài khoản AGENT thành công!')
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
          agentUsername: values.agentUsername?.trim() || undefined,
          agentEmail: values.agentEmail?.trim() || values.email?.trim(),
          agentPassword: values.agentPassword?.trim(),
          agentFullName: values.agentFullName?.trim() || values.contactPerson?.trim() || values.name.trim(),
          agentPhone: values.agentPhone?.trim() || values.phone?.trim(),
          maxAccounts: values.maxAccounts,
          totalAllocatedDays: values.totalAllocatedDays,
          packageStartDate: values.packageStartDate || null,
          packageExpiryDate: values.packageExpiryDate || null,
          packageStatus: values.packageStatus,
        }
        await dealerService.createDealer(payload)
        message.success('Thêm mới đại lý, khởi tạo tài khoản AGENT và cấp gói thành công!')
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = extractErrorMessage(err)
      setServerError(msg)
      message.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>
            {isEdit ? `Chỉnh sửa đại lý: ${dealer?.name}` : 'Thêm mới đại lý & chi nhánh'}
          </span>
          {isEdit && dealer && (
            <Tag color={dealer.status === 'ACTIVE' ? 'green' : dealer.status === 'LOCKED' ? 'red' : 'gold'}>
              {dealer.status}
            </Tag>
          )}
        </div>
      }
      onCancel={onClose}
      footer={null}
      width={760}
      destroyOnClose
    >
      {serverError && (
        <Alert
          type="error"
          message="Không thể lưu thông tin"
          description={serverError}
          showIcon
          closable
          onClose={() => setServerError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        {/* THÔNG TIN ĐẠI LÝ */}
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#35342F' }}>
            1. THÔNG TIN DOANH NGHIỆP / ĐẠI LÝ
          </span>
        </div>

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
              label="Số điện thoại đại lý"
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
              label="Email đại lý"
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

        {/* TÀI KHOẢN ĐĂNG NHẬP ĐẠI LÝ (ROLE AGENT) */}
        <Card
          size="small"
          style={{
            marginBottom: 20,
            borderRadius: 8,
            borderColor: '#C7D2FE',
            background: '#F5F7FF',
          }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#1E40AF', fontWeight: 600 }}>
                2. TÀI KHOẢN ĐĂNG NHẬP ĐẠI LÝ (ROLE AGENT)
              </span>
              {!isEdit && (
                <Button size="small" onClick={copyDealerInfoToAgent} style={{ fontSize: 11 }}>
                  Lấy từ thông tin đại lý
                </Button>
              )}
            </div>
          }
        >
          {isEdit && dealer?.agentUsername ? (
            <div style={{ marginBottom: 14 }}>
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                message={
                  <span>
                    Đại lý đã liên kết tài khoản AGENT duy nhất:{' '}
                    <Tag color="purple" style={{ fontSize: 12 }}>{dealer.agentUsername}</Tag>
                    {dealer.agentEmail && <span style={{ color: '#6E6D68' }}>({dealer.agentEmail})</span>}
                  </span>
                }
                description="Quy tắc bắt buộc: Mỗi đại lý chỉ có duy nhất một tài khoản role AGENT. Không tính vào số lượng account Thợ cắt và không tiêu thụ Quỹ ngày."
              />
            </div>
          ) : (
            <div style={{ marginBottom: 12 }}>
              <Alert
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
                message="Tự động tạo tài khoản AGENT khi thêm mới đại lý"
                description="Hệ thống sẽ đồng bộ tài khoản với Keycloak. Mỗi đại lý chỉ có DUY NHẤT một tài khoản AGENT. Tài khoản này chỉ phục vụ quản lý, không tiêu thụ quota account hoặc Quỹ ngày."
              />
            </div>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Email đăng nhập đại lý"
                required={!isEdit}
                help={errors.agentEmail?.message}
                validateStatus={errors.agentEmail ? 'error' : ''}
                extra={<span style={{ fontSize: 11, color: '#8A8983' }}>Địa chỉ email nhận thông tin đăng nhập Keycloak</span>}
              >
                <Controller
                  name="agentEmail"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      prefix={<MailOutlined style={{ color: '#8A8983' }} />}
                      placeholder="VD: agent.saigon@gmail.com"
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên đăng nhập (Username)"
                help={errors.agentUsername?.message}
                validateStatus={errors.agentUsername ? 'error' : ''}
                extra={<span style={{ fontSize: 11, color: '#8A8983' }}>{isEdit ? 'Không thể thay đổi username' : 'Để trống sẽ tự động lấy theo Email'}</span>}
              >
                <Controller
                  name="agentUsername"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      prefix={<UserOutlined style={{ color: '#8A8983' }} />}
                      placeholder="VD: agent_saigon"
                      disabled={isEdit && Boolean(dealer?.agentUsername)}
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={isEdit ? 'Đổi mật khẩu tài khoản đại lý' : 'Mật khẩu ban đầu'}
                required={!isEdit}
                help={errors.agentPassword?.message}
                validateStatus={errors.agentPassword ? 'error' : ''}
                extra={
                  <span style={{ fontSize: 11, color: '#8A8983' }}>
                    {isEdit ? 'Để trống nếu giữ nguyên mật khẩu cũ' : 'Tối thiểu 8 ký tự, gồm chữ hoa, thường, số và ký tự đặc biệt'}
                  </span>
                }
              >
                <Controller
                  name="agentPassword"
                  control={control}
                  render={({ field }) => (
                    <Input.Password
                      {...field}
                      prefix={<LockOutlined style={{ color: '#8A8983' }} />}
                      placeholder={isEdit ? 'Nhập mật khẩu mới nếu muốn đổi' : 'VD: AgentPass123!'}
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Họ tên người đại diện tài khoản"
                help={errors.agentFullName?.message}
                validateStatus={errors.agentFullName ? 'error' : ''}
              >
                <Controller
                  name="agentFullName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="VD: Nguyễn Văn Thắng"
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Số điện thoại tài khoản"
                help={errors.agentPhone?.message}
                validateStatus={errors.agentPhone ? 'error' : ''}
              >
                <Controller
                  name="agentPhone"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      prefix={<PhoneOutlined style={{ color: '#8A8983' }} />}
                      placeholder="VD: 0903123456"
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

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
                3. CẤU HÌNH GÓI ACCOUNT ĐẠI LÝ (QUỸ NGÀY PHÂN BỔ)
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
                Thợ cắt đã tạo: <strong>{dealer.createdAccounts ?? dealer.usersCount ?? 0}</strong> / {dealer.maxAccounts ?? 10}
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
                label="Số account Thợ cắt tối đa"
                required
                help={errors.maxAccounts?.message}
                validateStatus={errors.maxAccounts ? 'error' : ''}
                extra={<span style={{ fontSize: 11, color: '#8A8983' }}>Chỉ tính tài khoản USER (Thợ cắt), không tính AGENT</span>}
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
                extra={<span style={{ fontSize: 11, color: '#8A8983' }}>Chỉ phân bổ cho tài khoản USER (Thợ cắt)</span>}
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
              label="Trạng thái hoạt động đại lý"
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
