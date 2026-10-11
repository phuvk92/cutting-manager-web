import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, Button, Alert, message } from 'antd'
import { LockOutlined, KeyOutlined } from '@ant-design/icons'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User } from '@/types/user'
import { userService } from '@/services/users/userService'
import { extractErrorMessage } from '@/utils/error'

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .regex(
        passwordRegex,
        'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt'
      ),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không trùng khớp với mật khẩu mới',
    path: ['confirmPassword'],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

interface ResetPasswordModalProps {
  open: boolean
  user: User | null
  onClose: () => void
  onSuccess?: () => void
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  open,
  user,
  onClose,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (open) {
      setErrorMessage(null)
      reset({
        newPassword: '',
        confirmPassword: '',
      })
    }
  }, [open, reset])

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!user) return
    setSubmitting(true)
    setErrorMessage(null)

    try {
      await userService.resetPassword(user.id, {
        newPassword: data.newPassword,
      })
      message.success(`Đặt lại mật khẩu cho tài khoản "${user.username}" thành công`)
      onSuccess?.()
      onClose()
    } catch (err) {
      setErrorMessage(extractErrorMessage(err, 'Không thể đặt lại mật khẩu cho người dùng'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <KeyOutlined style={{ color: '#D97706' }} />
          <span>Đặt lại mật khẩu người dùng</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={submitting}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit(onSubmit)}
          loading={submitting}
          style={{ background: '#6C3BD6', borderColor: '#6C3BD6' }}
        >
          Xác nhận đặt lại mật khẩu
        </Button>,
      ]}
      destroyOnClose
      width={500}
    >
      <div style={{ padding: '8px 0' }}>
        {user && (
          <div
            style={{
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: 6,
              padding: '10px 14px',
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 13, color: '#4B5563', marginBottom: 4 }}>
              <strong>Tài khoản:</strong> <span style={{ color: '#111827' }}>{user.username}</span>
            </div>
            <div style={{ fontSize: 13, color: '#4B5563' }}>
              <strong>Email:</strong> <span style={{ color: '#111827' }}>{user.email}</span>
              {user.fullName && <span> ({user.fullName})</span>}
            </div>
          </div>
        )}

        {errorMessage && (
          <Alert
            type="error"
            showIcon
            message="Đặt lại mật khẩu thất bại"
            description={errorMessage}
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setErrorMessage(null)}
          />
        )}

        <Form layout="vertical">
          <Form.Item
            label="Mật khẩu mới"
            validateStatus={errors.newPassword ? 'error' : ''}
            help={errors.newPassword?.message}
            extra={
              <span style={{ fontSize: 11, color: '#8A8983' }}>
                Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
              </span>
            }
            required
          >
            <Controller
              name="newPassword"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
                  placeholder="Nhập mật khẩu mới"
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu mới"
            validateStatus={errors.confirmPassword ? 'error' : ''}
            help={errors.confirmPassword?.message}
            required
          >
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
                  placeholder="Nhập lại mật khẩu mới để xác nhận"
                />
              )}
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}
