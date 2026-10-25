import React, { useEffect, useState, useMemo } from 'react'
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Alert,
  Button,
  message,
  DatePicker,
  Radio,
  Card,
  Checkbox,
  Spin,
} from 'antd'
import {
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  AppstoreOutlined,
  SearchOutlined,
  KeyOutlined,
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, CreateUserRequest, UpdateUserRequest } from '@/types/user'
import { Role } from '@/types/auth'
import { Dealer, DealerPackageResponse } from '@/types/dealer'
import { PartLibraryCategory } from '@/types/partLibraryCategory'
import { partLibraryCategoryService } from '@/services/admin/partLibraryCategoryService'
import { userService } from '@/services/users/userService'
import { dealerService } from '@/services/dealers/dealerService'
import { useAuthStore } from '@/stores/authStore'
import { extractErrorMessage } from '@/utils/error'
import { UserDevicesPanel } from './UserDevicesPanel'

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

const DURATION_PRESETS = [
  { label: '1 tháng (30 ngày)', days: 30 },
  { label: '3 tháng (90 ngày)', days: 90 },
  { label: '6 tháng (180 ngày)', days: 180 },
  { label: '12 tháng (360 ngày)', days: 360 },
  { label: '18 tháng (540 ngày)', days: 540 },
  { label: '24 tháng (720 ngày)', days: 720 },
  { label: 'Tùy chỉnh', days: -1 },
]

const createSchema = z.object({
  username: z
    .string()
    .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
    .max(100, 'Tối đa 100 ký tự'),
  email: z
    .string()
    .email('Vui lòng nhập địa chỉ email hợp lệ')
    .max(255, 'Tối đa 255 ký tự'),
  fullName: z.string().max(255, 'Tối đa 255 ký tự').nullable().optional().or(z.literal('')),
  phone: z.string().max(50, 'Tối đa 50 ký tự').nullable().optional().or(z.literal('')),
  password: z
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(
      passwordRegex,
      'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt'
    ),
  role: z.enum(['ADMIN', 'AGENT', 'USER'] as const),
  dealerId: z.number().nullable().optional(),
  enabled: z.boolean(),
  allocatedDays: z.number().int().min(1, 'Số ngày phân bổ phải lớn hơn 0').nullable().optional(),
  expirationDate: z.string().nullable().optional(),
  partCategoryIds: z.array(z.number()),
})

const editSchema = z.object({
  email: z
    .string()
    .email('Vui lòng nhập địa chỉ email hợp lệ')
    .max(255, 'Tối đa 255 ký tự'),
  fullName: z.string().max(255, 'Tối đa 255 ký tự').nullable().optional().or(z.literal('')),
  phone: z.string().max(50, 'Tối đa 50 ký tự').nullable().optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'AGENT', 'USER'] as const),
  dealerId: z.number().nullable().optional(),
  enabled: z.boolean(),
  allocatedDays: z.number().int().min(1, 'Số ngày phân bổ phải lớn hơn 0').nullable().optional(),
  expirationDate: z.string().nullable().optional(),
  maxDevices: z.number().int().min(1, 'Tối thiểu 1 máy').max(50, 'Tối đa 50 máy').nullable().optional(),
  partCategoryIds: z.array(z.number()),
})

type CreateFormData = z.infer<typeof createSchema>
type EditFormData = z.infer<typeof editSchema>

interface UserModalProps {
  open: boolean
  user: User | null
  onClose: () => void
  onSuccess: () => void
  onResetPassword?: (user: User) => void
}

export const UserModal: React.FC<UserModalProps> = ({
  open,
  user,
  onClose,
  onSuccess,
  onResetPassword,
}) => {
  const { user: currentUser } = useAuthStore()
  const isAdmin = currentUser?.role === 'ADMIN'
  const isAgent = currentUser?.role === 'AGENT'

  const isEdit = !!user
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeDealers, setActiveDealers] = useState<Dealer[]>([])
  const [loadingDealers, setLoadingDealers] = useState(false)

  // Package info for AGENT (or dealer under review)
  const [agentPackage, setAgentPackage] = useState<DealerPackageResponse | null>(null)
  const [partCategories, setPartCategories] = useState<PartLibraryCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [categorySearch, setCategorySearch] = useState('')

  const filteredPartCategories = useMemo(() => {
    if (!categorySearch.trim()) return partCategories
    return partCategories.filter(c =>
      c.name.toLowerCase().includes(categorySearch.trim().toLowerCase())
    )
  }, [partCategories, categorySearch])

  // Duration selection states
  const [selectedPreset, setSelectedPreset] = useState<number>(360) // default 12 months (360 days)
  const [customDays, setCustomDays] = useState<number>(360)

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateFormData | EditFormData>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: {
      username: '',
      email: '',
      fullName: '',
      phone: '',
      password: '',
      role: 'USER',
      dealerId: undefined,
      enabled: true,
      allocatedDays: 360,
      expirationDate: null,
      partCategoryIds: [],
    },
  })

  const watchedRole = watch('role')

  // Load active part library categories
  useEffect(() => {
    if (open) {
      setLoadingCategories(true)
      setCategoriesError(null)
      partLibraryCategoryService
        .getActiveCategories()
        .then(cats => {
          setPartCategories(cats || [])
        })
        .catch(err => {
          console.error('Không thể tải danh mục kho mẫu & part:', err)
          setCategoriesError('Không thể tải danh mục kho mẫu & part. Vui lòng thử lại.')
        })
        .finally(() => {
          setLoadingCategories(false)
        })
    }
  }, [open])

  // Load package for AGENT
  useEffect(() => {
    if (open && isAgent) {
      dealerService
        .getMyPackage()
        .then(res => {
          setAgentPackage(res)
        })
        .catch(err => {
          console.error('Không thể tải thông tin gói đại lý:', err)
        })
    }
  }, [open, isAgent])

  // Load active dealers for Admin
  useEffect(() => {
    if (open && isAdmin) {
      setLoadingDealers(true)
      dealerService
        .getDealers({ status: 'ACTIVE', size: 200 })
        .then(res => {
          setActiveDealers(res.content || [])
        })
        .catch(err => {
          console.error('Không thể tải danh sách đại lý đang hoạt động', err)
        })
        .finally(() => {
          setLoadingDealers(false)
        })
    }
  }, [open, isAdmin])

  // Reset form
  useEffect(() => {
    if (open) {
      setErrorMessage(null)
      if (user) {
        const existingDays = user.allocatedDays && user.allocatedDays > 0 ? user.allocatedDays : 360
        const isPreset = DURATION_PRESETS.some(p => p.days === existingDays)
        setSelectedPreset(isPreset ? existingDays : -1)
        setCustomDays(existingDays)

        reset({
          email: user.email || '',
          fullName: user.fullName || '',
          phone: user.phone || '',
          role: user.role,
          dealerId: user.dealerId ?? undefined,
          enabled: user.enabled ?? true,
          allocatedDays: existingDays,
          maxDevices: user.maxDevices ?? null,
          expirationDate: user.expirationDate || null,
          partCategoryIds: user.partCategoryIds || [],
        })
      } else {
        setSelectedPreset(360)
        setCustomDays(360)

        reset({
          username: '',
          email: '',
          fullName: '',
          phone: '',
          password: '',
          role: 'USER',
              dealerId: !isAdmin ? currentUser?.dealerId : undefined,
          enabled: true,
          allocatedDays: 360,
          expirationDate: null,
          partCategoryIds: [],
        })
      }
    }
  }, [open, user, reset, isAdmin, currentUser?.dealerId])

  // Calculate effective allocated days
  const effectiveAllocatedDays = useMemo(() => {
    return selectedPreset === -1 ? (customDays || 0) : selectedPreset
  }, [selectedPreset, customDays])

  // Keep form value in sync with selected duration
  useEffect(() => {
    if (effectiveAllocatedDays > 0) {
      setValue('allocatedDays', effectiveAllocatedDays, { shouldValidate: true })
    }
  }, [effectiveAllocatedDays, setValue])

  // Quota and projected expiration calculations
  const quotaCalculations = useMemo(() => {
    const oldDays = isEdit && user?.allocatedDays ? user.allocatedDays : 0
    const deltaDays = isEdit ? effectiveAllocatedDays - oldDays : effectiveAllocatedDays

    // Projected expiration date
    let projectedExp: Dayjs
    if (isEdit && user?.expirationDate && dayjs(user.expirationDate).isAfter(dayjs(), 'day')) {
      projectedExp = dayjs(user.expirationDate).add(deltaDays, 'day')
    } else {
      projectedExp = dayjs().add(effectiveAllocatedDays, 'day')
    }

    const remainingDays = agentPackage ? agentPackage.remainingAllocatedDays : 0
    const projectedRemaining = remainingDays - deltaDays

    // Quota validation errors
    let quotaError: string | null = null
    if (isAgent && agentPackage) {
      if (agentPackage.expired) {
        quotaError = `Gói đại lý đã hết hạn hiệu lực (${dayjs(agentPackage.packageExpiryDate).format('DD/MM/YYYY')}), không thể thao tác!`
      } else if (agentPackage.packageStatus !== 'ACTIVE') {
        quotaError = `Gói đại lý đang ở trạng thái không hoạt động (${agentPackage.packageStatus})!`
      } else if (!isEdit && agentPackage.remainingAccounts <= 0) {
        quotaError = `Đại lý đã đạt giới hạn tối đa ${agentPackage.maxAccounts} tài khoản!`
      } else if (deltaDays > remainingDays) {
        quotaError = `Quỹ ngày còn lại của đại lý không đủ! Còn lại ${remainingDays.toLocaleString()} ngày, cần thêm ${deltaDays.toLocaleString()} ngày.`
      } else if (
        agentPackage.packageExpiryDate &&
        projectedExp.isAfter(dayjs(agentPackage.packageExpiryDate), 'day')
      ) {
        quotaError = `Thời hạn tài khoản (${projectedExp.format('DD/MM/YYYY')}) vượt quá ngày hết hạn của gói đại lý (${dayjs(agentPackage.packageExpiryDate).format('DD/MM/YYYY')})!`
      }
    }

    return {
      oldDays,
      deltaDays,
      projectedExp,
      remainingDays,
      projectedRemaining,
      quotaError,
    }
  }, [isEdit, user, effectiveAllocatedDays, isAgent, agentPackage])

  const onSubmit = async (data: CreateFormData | EditFormData) => {
    if (quotaCalculations.quotaError) {
      message.error(quotaCalculations.quotaError)
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
      if (isEdit && user) {
        const editData = data as EditFormData
        const updatePayload: UpdateUserRequest = {
          email: editData.email.trim(),
          fullName: editData.fullName?.trim() || undefined,
          phone: editData.phone?.trim() || undefined,
          role: editData.role as Role,
          dealerId: editData.dealerId ? editData.dealerId : 0,
          enabled: editData.enabled ?? true,
          allocatedDays: isAgent ? effectiveAllocatedDays : (editData.allocatedDays ?? undefined),
          expirationDate: isAgent
            ? quotaCalculations.projectedExp.format('YYYY-MM-DD')
            : (editData.expirationDate ? editData.expirationDate : null),
          ...(isAdmin ? { maxDevices: editData.maxDevices ?? 0 } : {}),
          partCategoryIds: editData.partCategoryIds || [],
        }
        await userService.updateUser(user.id, updatePayload)
        message.success(`Cập nhật người dùng "${user.username}" thành công`)
      } else {
        const createData = data as CreateFormData
        const createPayload: CreateUserRequest = {
          username: createData.username.trim(),
          email: createData.email.trim(),
          fullName: createData.fullName?.trim() || undefined,
          phone: createData.phone?.trim() || undefined,
          password: createData.password,
          role: !isAdmin ? 'USER' : (createData.role as Role),
          dealerId: !isAdmin ? currentUser?.dealerId : (createData.dealerId ?? undefined),
          enabled: createData.enabled ?? true,
          allocatedDays: isAgent ? effectiveAllocatedDays : (createData.allocatedDays ?? undefined),
          expirationDate: isAgent
            ? quotaCalculations.projectedExp.format('YYYY-MM-DD')
            : (createData.expirationDate ? createData.expirationDate : null),
          partCategoryIds: createData.partCategoryIds || [],
        }
        await userService.createUser(createPayload)
        message.success(`Tạo người dùng "${createPayload.username}" thành công`)
      }
      onSuccess()
      onClose()
    } catch (err) {
      setErrorMessage(extractErrorMessage(err, isEdit ? 'Không thể cập nhật người dùng' : 'Không thể tạo người dùng'))
    } finally {
      setSubmitting(false)
    }
  }

  const onInvalid = (formErrors: Record<string, unknown>) => {
    console.warn('Form validation failed:', formErrors)
    message.error('Vui lòng kiểm tra lại các trường thông tin trên biểu mẫu')
  }

  const isFormBlocked = isAgent && Boolean(quotaCalculations.quotaError)

  return (
    <Modal
      title={isEdit ? `Chỉnh sửa người dùng: ${user?.username}` : 'Thêm mới tài khoản người dùng'}
      open={open}
      onCancel={onClose}
      footer={[
        isAdmin && isEdit && onResetPassword && (
          <Button
            key="reset-password"
            icon={<KeyOutlined style={{ color: '#D97706' }} />}
            onClick={() => {
              onClose()
              if (user) onResetPassword(user)
            }}
            style={{ marginRight: 'auto' }}
          >
            Đặt lại mật khẩu
          </Button>
        ),
        <Button key="cancel" onClick={onClose} disabled={submitting}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit(onSubmit, onInvalid)}
          loading={submitting}
          disabled={isFormBlocked}
          style={{ background: '#6C3BD6', borderColor: '#6C3BD6' }}
        >
          {isEdit ? 'Lưu thay đổi' : 'Tạo người dùng'}
        </Button>,
      ].filter(Boolean)}
      destroyOnClose
      width={620}
    >
      <div style={{ padding: '8px 0' }}>
        {errorMessage && (
          <Alert
            type="error"
            showIcon
            message={isEdit ? 'Cập nhật thất bại' : 'Tạo mới thất bại'}
            description={errorMessage}
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setErrorMessage(null)}
          />
        )}

        {/* Quota error alert for Agent */}
        {quotaCalculations.quotaError && (
          <Alert
            type="error"
            showIcon
            icon={<ExclamationCircleOutlined />}
            message="Không thể thực hiện do hạn mức gói"
            description={quotaCalculations.quotaError}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form layout="vertical">
          {!isEdit && (
            <Form.Item
              label="Tên đăng nhập"
              validateStatus={'username' in errors && errors.username ? 'error' : ''}
              help={'username' in errors ? errors.username?.message : undefined}
              required
            >
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="VD: thocattphcm01" />
                )}
              />
            </Form.Item>
          )}

          <Form.Item
            label="Họ và tên"
            validateStatus={errors.fullName ? 'error' : ''}
            help={errors.fullName?.message}
          >
            <Controller
              name="fullName"
              control={control}
              render={({ field }) => (
                <Input {...field} value={field.value ?? ""} placeholder="VD: Nguyễn Văn Thắng" />
              )}
            />
          </Form.Item>

          {!isAdmin ? (
            <Form.Item
              label="Đại lý & Chi nhánh trực thuộc"
              extra={
                <span style={{ fontSize: 11, color: '#6C3BD6' }}>
                  Tài khoản tự động trực thuộc đại lý của bạn và được phân bổ từ gói đại lý.
                </span>
              }
            >
              <Input
                value={
                  currentUser?.dealerName
                    ? `${currentUser.dealerCode ? currentUser.dealerCode + ' — ' : ''}${currentUser.dealerName}`
                    : (currentUser?.username || 'Đại lý của bạn')
                }
                disabled
                style={{ backgroundColor: '#FAF8FF', color: '#1f1f1f', fontWeight: 500, cursor: 'not-allowed' }}
              />
            </Form.Item>
          ) : (
            <Form.Item
              label="Đại lý & Chi nhánh trực thuộc"
              validateStatus={errors.dealerId ? 'error' : ''}
              help={errors.dealerId?.message}
              extra={
                <span style={{ fontSize: 11, color: '#8A8983' }}>
                  Danh sách đại lý đang hoạt động (Active). Chọn đại lý để liên kết thợ cắt / nhân viên.
                </span>
              }
            >
              <Controller
                name="dealerId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    loading={loadingDealers}
                    placeholder="Chọn đại lý trực thuộc (hoặc để trống nếu độc lập)"
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={activeDealers.map(d => ({
                      value: d.id,
                      label: `${d.code} — ${d.name} (${d.region || 'Toàn quốc'})`,
                    }))}
                  />
                )}
              />
            </Form.Item>
          )}

          <Form.Item
            label="Địa chỉ Gmail / Email đăng nhập"
            validateStatus={errors.email ? 'error' : ''}
            help={errors.email?.message}
            extra={!isEdit && <span style={{ fontSize: 11, color: '#8A8983' }}>Địa chỉ email này cũng sẽ được sử dụng làm tài khoản đăng nhập máy cắt.</span>}
            required
          >
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="VD: thang.nguyen@gmail.com"
                  onChange={e => {
                    field.onChange(e)
                    if (!isEdit) {
                      setValue('username', e.target.value.trim(), { shouldValidate: true })
                    }
                  }}
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            validateStatus={errors.phone ? 'error' : ''}
            help={errors.phone?.message}
          >
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <Input {...field} value={field.value ?? ""} placeholder="VD: 0903123456" />
              )}
            />
          </Form.Item>

          {!isEdit && (
            <Form.Item
              label="Mật khẩu khởi tạo"
              validateStatus={'password' in errors && errors.password ? 'error' : ''}
              help={'password' in errors ? errors.password?.message : undefined}
              required
            >
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    placeholder="Tối thiểu 8 ký tự (chữ hoa, chữ thường, số, ký tự đặc biệt)"
                  />
                )}
              />
            </Form.Item>
          )}

          <Form.Item
            label="Vai trò tài khoản"
            validateStatus={errors.role ? 'error' : ''}
            help={errors.role?.message}
            required
          >
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select {...field} placeholder="Chọn vai trò người dùng" disabled={!isAdmin}>
                  {isAdmin && <Select.Option value="ADMIN">Quản trị viên (ADMIN)</Select.Option>}
                  {isAdmin && <Select.Option value="AGENT">Quản lý đại lý (AGENT)</Select.Option>}
                  <Select.Option value="USER">Thợ cắt / Người dùng (USER)</Select.Option>
                </Select>
              )}
            />
          </Form.Item>

          {/* DURATION ALLOCATION SECTION FOR AGENT (OR ADMIN ALLOCATING PACKAGE) */}
          {(isAgent || (isAdmin && watchedRole === 'USER')) && (
            <Card
              size="small"
              style={{
                marginBottom: 20,
                borderRadius: 8,
                borderColor: '#DDD2FA',
                background: '#FAF9FE',
              }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#4A2A94' }}>
                  <ClockCircleOutlined />
                  <span>Thời hạn tài khoản (Phân bổ từ quỹ đại lý)</span>
                </div>
              }
            >
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#6E6D68', marginBottom: 8 }}>
                  Chọn gói thời hạn (quy ước chuẩn: 1 tháng = 30 ngày, 1 năm = 360 ngày):
                </div>
                <Radio.Group
                  value={selectedPreset}
                  onChange={e => setSelectedPreset(e.target.value)}
                  style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
                >
                  {DURATION_PRESETS.map(preset => (
                    <Radio.Button
                      key={preset.days}
                      value={preset.days}
                      style={{ borderRadius: 4, fontSize: 12 }}
                    >
                      {preset.label}
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </div>

              {selectedPreset === -1 && (
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: '#35342F' }}>Nhập số ngày cụ thể:</span>
                  <InputNumber
                    min={1}
                    max={10000}
                    value={customDays}
                    onChange={val => setCustomDays(val || 30)}
                    style={{ width: 140 }}
                    suffix="ngày"
                  />
                  <span style={{ fontSize: 11, color: '#6E6D68' }}>
                    (~{(customDays / 30).toFixed(1)} tháng)
                  </span>
                </div>
              )}

              {/* Dynamic Quota & Expiry Calculation Box */}
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E9E6F5',
                  borderRadius: 6,
                  padding: '10px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  fontSize: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6E6D68' }}>Số ngày phân bổ chuẩn:</span>
                  <strong style={{ color: '#6C3BD6', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {effectiveAllocatedDays} ngày ({Math.round(effectiveAllocatedDays / 30)} tháng)
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6E6D68' }}>Ngày hết hạn dự kiến:</span>
                  <strong style={{ color: '#1B1B19', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {quotaCalculations.projectedExp.format('DD/MM/YYYY')}
                  </strong>
                </div>

                {isAgent && agentPackage && (
                  <>
                    <div style={{ borderTop: '1px dashed #E4E3DE', marginTop: 4, paddingTop: 4 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6E6D68' }}>Quỹ ngày đại lý hiện có:</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        {agentPackage.remainingAllocatedDays.toLocaleString()} ngày
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6E6D68' }}>Chênh lệch quỹ yêu cầu:</span>
                      <span
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          color: quotaCalculations.deltaDays > 0 ? '#C2452D' : '#16A34A',
                        }}
                      >
                        {quotaCalculations.deltaDays > 0 ? `-${quotaCalculations.deltaDays}` : `+${Math.abs(quotaCalculations.deltaDays)}`} ngày
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6E6D68' }}>Quỹ còn lại sau thao tác:</span>
                      <strong
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          color: quotaCalculations.projectedRemaining >= 0 ? '#16A34A' : '#DC2626',
                        }}
                      >
                        {quotaCalculations.projectedRemaining.toLocaleString()} ngày
                      </strong>
                    </div>

                    {agentPackage.packageExpiryDate && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8A8983' }}>
                        <span>Hạn cuối gói đại lý:</span>
                        <span>{dayjs(agentPackage.packageExpiryDate).format('DD/MM/YYYY')}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          )}

          {/* ADMIN DIRECT DATE PICKER (ONLY FOR ADMIN IF NOT USING ALLOCATION) */}
          {isAdmin && (
            <Form.Item
              label="Ngày hết hạn tài khoản trực tiếp (Admin tùy chỉnh)"
              validateStatus={errors.expirationDate ? "error" : ""}
              help={errors.expirationDate?.message}
              extra={
                watchedRole === "ADMIN" ? (
                  <span style={{ fontSize: 11, color: "#D97706" }}>
                    Ngày hết hạn không áp dụng cho tài khoản ADMIN.
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: "#8A8983" }}>
                    Không bắt buộc. Để trống = không hết hạn. Quá ngày này tài khoản sẽ không thể đăng nhập.
                  </span>
                )
              }
            >
              <Controller
                name="expirationDate"
                control={control}
                render={({ field }) => {
                  const dateObj = field.value ? dayjs(field.value, "YYYY-MM-DD") : null
                  return (
                    <DatePicker
                      value={dateObj && dateObj.isValid() ? dateObj : null}
                      onChange={d => field.onChange(d ? d.format("YYYY-MM-DD") : null)}
                      format="DD/MM/YYYY"
                      placeholder={isEdit && !user?.expirationDate ? "Chưa thiết lập (Không hết hạn)" : "dd/MM/yyyy"}
                      style={{ width: "100%" }}
                      allowClear
                    />
                  )
                }}
              />
            </Form.Item>
          )}

          {/* PHÂN QUYỀN DANH MỤC KHO MẪU & PART */}
          <Card
            size="small"
            style={{
              marginBottom: 20,
              borderRadius: 8,
              borderColor: '#E2E8F0',
              background: '#F8FAFC',
            }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#1E293B', fontWeight: 600 }}>
                <AppstoreOutlined style={{ color: '#6C3BD6' }} />
                <span>Danh mục kho mẫu & part được phép sử dụng</span>
              </div>
            }
          >
            {loadingCategories ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <Spin size="small" />
                <span style={{ marginLeft: 8, fontSize: 12, color: '#64748B' }}>Đang tải danh mục...</span>
              </div>
            ) : categoriesError ? (
              <Alert type="error" showIcon message={categoriesError} style={{ marginBottom: 8 }} />
            ) : (
              <Controller
                name="partCategoryIds"
                control={control}
                render={({ field }) => {
                  const selected = field.value || []
                  return (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 12, color: '#64748B' }}>
                          Chọn các danh mục được phép truy cập ({selected.length}/{partCategories.length}):
                        </span>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Button
                            size="small"
                            type="link"
                            onClick={() => field.onChange(partCategories.map(c => c.id))}
                            disabled={partCategories.length === 0}
                            style={{ padding: 0, fontSize: 12 }}
                          >
                            Chọn tất cả
                          </Button>
                          <span style={{ color: '#CBD5E1' }}>|</span>
                          <Button
                            size="small"
                            type="link"
                            onClick={() => field.onChange([])}
                            disabled={selected.length === 0}
                            style={{ padding: 0, fontSize: 12 }}
                          >
                            Bỏ chọn tất cả
                          </Button>
                        </div>
                      </div>

                      {partCategories.length > 6 && (
                        <div style={{ marginBottom: 8 }}>
                          <Input
                            size="small"
                            placeholder="Tìm nhanh danh mục..."
                            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                            value={categorySearch}
                            onChange={e => setCategorySearch(e.target.value)}
                            allowClear
                          />
                        </div>
                      )}

                      {partCategories.length === 0 ? (
                        <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', padding: '8px 0' }}>
                          Chưa có danh mục kho mẫu & part nào đang hoạt động.
                        </div>
                      ) : filteredPartCategories.length === 0 ? (
                        <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', padding: '8px 0' }}>
                          Không tìm thấy danh mục nào khớp với từ khóa tìm kiếm.
                        </div>
                      ) : (
                        <div
                          style={{
                            maxHeight: 200,
                            overflowY: 'auto',
                            border: '1px solid #E2E8F0',
                            borderRadius: 6,
                            padding: '10px 12px',
                            background: '#FFFFFF',
                          }}
                        >
                          <Checkbox.Group
                            value={selected}
                            onChange={vals => field.onChange(vals)}
                            style={{ width: '100%' }}
                          >
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px 12px' }}>
                              {filteredPartCategories.map(cat => (
                                <Checkbox key={cat.id} value={cat.id} style={{ fontSize: 12.5 }}>
                                  {cat.name}
                                </Checkbox>
                              ))}
                            </div>
                          </Checkbox.Group>
                        </div>
                      )}

                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 10 }}>
                        Khi tạo mới mặc định không cấp quyền nếu chưa chọn. Khi sửa, bỏ chọn danh mục và lưu sẽ thu hồi quyền tương ứng.
                      </div>
                    </div>
                  )
                }}
              />
            )}
          </Card>

          <Form.Item label="Trạng thái tài khoản" valuePropName="checked">
            <Controller
              name="enabled"
              control={control}
              render={({ field }) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                    checkedChildren="Hoạt động"
                    unCheckedChildren="Tạm khóa"
                  />
                  <span style={{ fontSize: 13, color: field.value ? '#1E7E34' : '#C2452D' }}>
                    {field.value ? 'Tài khoản đang được kích hoạt hoạt động' : 'Tài khoản đang bị tạm khóa'}
                  </span>
                </div>
              )}
            />
          </Form.Item>

          {isEdit && isAdmin && (
            <Form.Item
              label="Số máy tối đa"
              validateStatus={'maxDevices' in errors && errors.maxDevices ? 'error' : ''}
              help={'maxDevices' in errors ? errors.maxDevices?.message : undefined}
              extra={
                <span style={{ fontSize: 11, color: '#8A8983' }}>
                  Số máy được đăng nhập phần mềm cắt. Để trống = mặc định hệ thống ({user?.effectiveMaxDevices ?? 1} máy nếu chưa đặt riêng).
                </span>
              }
            >
              <Controller
                name="maxDevices"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    min={1}
                    max={50}
                    precision={0}
                    value={field.value ?? null}
                    onChange={v => field.onChange(v ?? null)}
                    placeholder="Mặc định"
                    style={{ width: 140 }}
                    suffix="máy"
                  />
                )}
              />
            </Form.Item>
          )}
        </Form>

        {isEdit && user && (
          <UserDevicesPanel userId={user.id} username={user.username} maxDevices={user.effectiveMaxDevices} />
        )}
      </div>
    </Modal>
  )
}
