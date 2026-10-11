import React, { useEffect, useState } from 'react'
import { Modal, Form, Input, InputNumber, Select, Switch, Alert, Button, message, DatePicker } from 'antd'
import dayjs from 'dayjs'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, CreateUserRequest, UpdateUserRequest } from '@/types/user'
import { Role } from '@/types/auth'
import { Dealer } from '@/types/dealer'
import { userService } from '@/services/users/userService'
import { dealerService } from '@/services/dealers/dealerService'
import { useAuthStore } from '@/stores/authStore'
import { extractErrorMessage } from '@/utils/error'
import { UserDevicesPanel } from './UserDevicesPanel'

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

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
  agentId: z.number().nullable().optional(),
  dealerId: z.number().nullable().optional(),
  enabled: z.boolean(),
  expirationDate: z.string().nullable().optional(),
})

const editSchema = z.object({
  email: z
    .string()
    .email('Vui lòng nhập địa chỉ email hợp lệ')
    .max(255, 'Tối đa 255 ký tự'),
  fullName: z.string().max(255, 'Tối đa 255 ký tự').nullable().optional().or(z.literal('')),
  phone: z.string().max(50, 'Tối đa 50 ký tự').nullable().optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'AGENT', 'USER'] as const),
  agentId: z.number().nullable().optional(),
  dealerId: z.number().nullable().optional(),
  enabled: z.boolean(),
  expirationDate: z.string().nullable().optional(),
  // F-57: số máy tối đa — null/không nhập = mặc định hệ thống
  maxDevices: z.number().int().min(1, 'Tối thiểu 1 máy').max(50, 'Tối đa 50 máy').nullable().optional(),
})

type CreateFormData = z.infer<typeof createSchema>
type EditFormData = z.infer<typeof editSchema>

interface UserModalProps {
  open: boolean
  user: User | null
  onClose: () => void
  onSuccess: () => void
}

export const UserModal: React.FC<UserModalProps> = ({
  open,
  user,
  onClose,
  onSuccess,
}) => {
  const { user: currentUser } = useAuthStore()
  const isAdmin = currentUser?.role === 'ADMIN'

  const isEdit = !!user
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [agents, setAgents] = useState<{ id: number; username: string; fullName?: string }[]>([])
  const [activeDealers, setActiveDealers] = useState<Dealer[]>([])
  const [loadingDealers, setLoadingDealers] = useState(false)

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
      agentId: undefined,
      dealerId: undefined,
      enabled: true,
      expirationDate: null,
    },
  })

  const watchedRole = watch('role')

  // Load danh sách đại lý đang ACTIVE để chọn khi tạo hoặc gán người dùng (chỉ dành cho Admin)
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

  // Load danh sách Agent cho Admin nếu cần gán cấp quản lý
  useEffect(() => {
    if (open && isAdmin) {
      userService
        .getUsers({ role: 'AGENT', size: 100 })
        .then(res => {
          setAgents(res.content.map(u => ({ id: u.id, username: u.username, fullName: u.fullName })))
        })
        .catch(err => {
          console.error('Không thể tải danh sách đại lý quản lý', err)
        })
    }
  }, [open, isAdmin])

  useEffect(() => {
    if (open) {
      setErrorMessage(null)
      if (user) {
        reset({
          email: user.email || '',
          fullName: user.fullName || '',
          phone: user.phone || '',
          role: user.role,
          agentId: user.agentId ?? undefined,
          dealerId: user.dealerId ?? undefined,
          enabled: user.enabled ?? true,
          maxDevices: user.maxDevices ?? null,
          expirationDate: user.expirationDate || null,
        })
      } else {
        reset({
          username: '',
          email: '',
          fullName: '',
          phone: '',
          password: '',
          role: 'USER',
          agentId: undefined,
          dealerId: !isAdmin ? currentUser?.dealerId : undefined,
          enabled: true,
          expirationDate: null,
        })
      }
    }
  }, [open, user, reset, isAdmin, currentUser?.dealerId])

  const onSubmit = async (data: CreateFormData | EditFormData) => {
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
          agentId: editData.role === 'USER' ? (editData.agentId ?? 0) : undefined,
          dealerId: editData.dealerId ? editData.dealerId : 0,
          enabled: editData.enabled ?? true,
          expirationDate: editData.expirationDate ? editData.expirationDate : null,
          ...(isAdmin ? { maxDevices: editData.maxDevices ?? 0 } : {}),
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
          agentId: !isAdmin ? undefined : (createData.role === 'USER' ? (createData.agentId ?? undefined) : undefined),
          dealerId: !isAdmin ? currentUser?.dealerId : (createData.dealerId ?? undefined),
          enabled: createData.enabled ?? true,
          expirationDate: createData.expirationDate ? createData.expirationDate : null,
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

  return (
    <Modal
      title={isEdit ? `Chỉnh sửa người dùng: ${user?.username}` : 'Thêm mới tài khoản người dùng'}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={submitting}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit(onSubmit, onInvalid)}
          loading={submitting}
          style={{ background: '#6C3BD6', borderColor: '#6C3BD6' }}
        >
          {isEdit ? 'Lưu thay đổi' : 'Tạo người dùng'}
        </Button>,
      ]}
      destroyOnClose
      width={580}
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
                <span style={{ fontSize: 11, color: '#1677ff' }}>
                  Người dùng mới sẽ tự động trực thuộc đại lý của bạn, không thể chọn đại lý khác.
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
                style={{ backgroundColor: '#fafafa', color: '#1f1f1f', fontWeight: 500, cursor: 'not-allowed' }}
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

          {isAdmin && watchedRole === 'USER' && agents.length > 0 && (
            <Form.Item
              label="Đại lý phụ trách (Agent quản lý)"
              validateStatus={errors.agentId ? 'error' : ''}
              help={errors.agentId?.message}
            >
              <Controller
                name="agentId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Không gán (Người dùng trực tiếp)"
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {agents.map(ag => (
                      <Select.Option key={ag.id} value={ag.id}>
                        {ag.fullName ? `${ag.fullName} (${ag.username})` : ag.username}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          )}

          <Form.Item
            label="Ngày hết hạn tài khoản"
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
