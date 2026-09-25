import React, { useEffect, useState } from 'react'
import { Modal, Form, Input, Select, Switch, Alert, Button, message } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, CreateUserRequest, UpdateUserRequest } from '@/types/user'
import { Role } from '@/types/auth'
import { userService } from '@/services/users/userService'
import { useAuthStore } from '@/stores/authStore'
import { extractErrorMessage } from '@/utils/error'

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

const createSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(100),
  email: z.string().email('Please enter a valid email address').max(255),
  fullName: z.string().max(255).optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      passwordRegex,
      'Password must contain uppercase, lowercase, number and special character'
    ),
  role: z.enum(['ADMIN', 'AGENT', 'USER'] as const),
  agentId: z.number().optional(),
  enabled: z.boolean(),
})

const editSchema = z.object({
  email: z.string().email('Please enter a valid email address').max(255),
  fullName: z.string().max(255).optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'AGENT', 'USER'] as const),
  agentId: z.number().optional(),
  enabled: z.boolean(),
  password: z
    .string()
    .optional()
    .refine(
      val => !val || passwordRegex.test(val),
      'If provided, password must be at least 8 chars with uppercase, lowercase, number and special char'
    ),
})

type CreateFormData = z.infer<typeof createSchema>
type EditFormData = z.infer<typeof editSchema>

interface UserModalProps {
  open: boolean
  user: User | null // If null -> Create mode, If not null -> Edit mode
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

  const {
    control,
    handleSubmit,
    reset,
    watch,
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
      enabled: true,
    },
  })

  const watchedRole = watch('role')

  // Load agents list for Admin assigning Agent to User
  useEffect(() => {
    if (open && isAdmin) {
      userService.getUsers({ role: 'AGENT', size: 100 })
        .then(res => {
          setAgents(res.content.map(u => ({ id: u.id, username: u.username, fullName: u.fullName })))
        })
        .catch(err => {
          console.error('Failed to load agents list', err)
        })
    }
  }, [open, isAdmin])

  useEffect(() => {
    if (open) {
      setErrorMessage(null)
      if (user) {
        reset({
          email: user.email,
          fullName: user.fullName || '',
          phone: user.phone || '',
          role: user.role,
          agentId: user.agentId,
          enabled: user.enabled,
          password: '',
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
          enabled: true,
        })
      }
    }
  }, [open, user, reset])

  const onSubmit = async (data: CreateFormData | EditFormData) => {
    setSubmitting(true)
    setErrorMessage(null)

    try {
      if (isEdit && user) {
        const updatePayload: UpdateUserRequest = {
          email: data.email,
          fullName: data.fullName || undefined,
          phone: data.phone || undefined,
          role: data.role as Role,
          agentId: data.role === 'USER' ? data.agentId : undefined,
          enabled: data.enabled ?? true,
          ...(data.password ? { password: data.password } : {}),
        }
        await userService.updateUser(user.id, updatePayload)
        message.success(`User "${user.username}" updated successfully`)
      } else {
        const createData = data as CreateFormData
        const createPayload: CreateUserRequest = {
          username: createData.username,
          email: createData.email,
          fullName: createData.fullName || undefined,
          phone: createData.phone || undefined,
          password: createData.password,
          role: createData.role as Role,
          agentId: createData.role === 'USER' ? createData.agentId : undefined,
          enabled: createData.enabled ?? true,
        }
        await userService.createUser(createPayload)
        message.success(`User "${createPayload.username}" created successfully`)
      }
      onSuccess()
      onClose()
    } catch (err) {
      setErrorMessage(extractErrorMessage(err, isEdit ? 'Failed to update user' : 'Failed to create user'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={isEdit ? `Edit User: ${user?.username}` : 'Create New User'}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit(onSubmit)}
          loading={submitting}
        >
          {isEdit ? 'Save Changes' : 'Create User'}
        </Button>,
      ]}
      destroyOnClose
    >
      <div style={{ padding: '12px 0' }}>
        {errorMessage && (
          <Alert
            type="error"
            showIcon
            message={isEdit ? 'Update Failed' : 'Creation Failed'}
            description={errorMessage}
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setErrorMessage(null)}
          />
        )}

        <Form layout="vertical">
          {!isEdit && (
            <Form.Item
              label="Username"
              validateStatus={'username' in errors && errors.username ? 'error' : ''}
              help={'username' in errors ? errors.username?.message : undefined}
              required
            >
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter unique username" />
                )}
              />
            </Form.Item>
          )}

          <Form.Item
            label="Full Name"
            validateStatus={errors.fullName ? 'error' : ''}
            help={errors.fullName?.message}
          >
            <Controller
              name="fullName"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="e.g. Nguyen Van A" />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Phone"
            validateStatus={errors.phone ? 'error' : ''}
            help={errors.phone?.message}
          >
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="e.g. +84901234567" />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Email Address"
            validateStatus={errors.email ? 'error' : ''}
            help={errors.email?.message}
            required
          >
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="user@example.com" />
              )}
            />
          </Form.Item>

          <Form.Item
            label={isEdit ? 'New Password (leave empty to keep current)' : 'Password'}
            validateStatus={errors.password ? 'error' : ''}
            help={errors.password?.message}
            required={!isEdit}
          >
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  placeholder={
                    isEdit
                      ? 'Enter new password if changing'
                      : 'Min 8 chars, uppercase, digit & special'
                  }
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Role"
            validateStatus={errors.role ? 'error' : ''}
            help={errors.role?.message}
            required
          >
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select {...field} placeholder="Select user role" disabled={!isAdmin}>
                  {isAdmin && <Select.Option value="ADMIN">ADMIN — Full System Access</Select.Option>}
                  {isAdmin && <Select.Option value="AGENT">AGENT — Agent Management</Select.Option>}
                  <Select.Option value="USER">USER — Business User</Select.Option>
                </Select>
              )}
            />
          </Form.Item>

          {isAdmin && watchedRole === 'USER' && (
            <Form.Item
              label="Assigned Agent"
              validateStatus={errors.agentId ? 'error' : ''}
              help={errors.agentId?.message}
            >
              <Controller
                name="agentId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="None (Direct / No Agent assigned)"
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

          <Form.Item label="Account Status" valuePropName="checked">
            <Controller
              name="enabled"
              control={control}
              render={({ field }) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                    checkedChildren="Active"
                    unCheckedChildren="Disabled"
                  />
                  <span>{field.value ? 'User is enabled' : 'User is locked/disabled'}</span>
                </div>
              )}
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}
