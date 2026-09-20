import React, { useEffect, useState } from 'react'
import { Modal, Form, Input, Select, Switch, Alert, Button, message } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, CreateUserRequest, UpdateUserRequest } from '@/types/user'
import { Role } from '@/types/auth'
import { userService } from '@/services/users/userService'
import { extractErrorMessage } from '@/utils/error'

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

const createSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(100),
  email: z.string().email('Please enter a valid email address').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      passwordRegex,
      'Password must contain uppercase, lowercase, number and special character'
    ),
  role: z.enum(['ADMIN', 'AGENT', 'USER'] as const),
  enabled: z.boolean(),
})

const editSchema = z.object({
  email: z.string().email('Please enter a valid email address').max(255),
  role: z.enum(['ADMIN', 'AGENT', 'USER'] as const),
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
  const isEdit = !!user
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFormData | EditFormData>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      role: 'USER',
      enabled: true,
    },
  })

  useEffect(() => {
    if (open) {
      setErrorMessage(null)
      if (user) {
        reset({
          email: user.email,
          role: user.role,
          enabled: user.enabled,
          password: '',
        })
      } else {
        reset({
          username: '',
          email: '',
          password: '',
          role: 'USER',
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
          role: data.role as Role,
          enabled: data.enabled ?? true,
          ...(data.password ? { password: data.password } : {}),
        }
        await userService.updateUser(user.id, updatePayload)
        message.success(`User "${user.username}" updated successfully`)
      } else {
        const createPayload = data as CreateUserRequest
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
                <Select {...field} placeholder="Select user role">
                  <Select.Option value="ADMIN">ADMIN — Full System Access</Select.Option>
                  <Select.Option value="AGENT">AGENT — Upload & View SVG Files</Select.Option>
                  <Select.Option value="USER">USER — View & Download SVG Files</Select.Option>
                </Select>
              )}
            />
          </Form.Item>

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
