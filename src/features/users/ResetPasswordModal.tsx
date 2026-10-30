import React, { useState, useMemo } from 'react'
import { Modal, Form, Input, Button, Alert, message } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { User, ResetPasswordRequest } from '@/types/user'
import { userService } from '@/services/users/userService'
import { extractErrorMessage } from '@/utils/error'

const createResetPasswordSchema = (t: (key: string, options?: any) => string) =>
  z
    .object({
      newPassword: z
        .string()
        .min(8, t('resetModal.minLength', { defaultValue: 'Mật khẩu phải có ít nhất 8 ký tự' }))
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\Default;':"\|,.<>/?]).{8,}$/,
          t('resetModal.complexity', {
            defaultValue: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
          })
        ),
      confirmPassword: z
        .string()
        .min(1, t('resetModal.confirmRequired', { defaultValue: 'Vui lòng xác nhận mật khẩu mới' })),
    })
    .refine(data => data.newPassword === data.confirmPassword, {
      message: t('resetModal.mismatch', { defaultValue: 'Mật khẩu xác nhận không khớp' }),
      path: ['confirmPassword'],
    })

const defaultResetSchema = createResetPasswordSchema((_k, opts) => opts?.defaultValue || '')
type ResetPasswordFormData = z.infer<typeof defaultResetSchema>

interface ResetPasswordModalProps {
  open: boolean
  user: User | null
  onClose: () => void
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  open,
  user,
  onClose,
}) => {
  const { t } = useTranslation(['users', 'common'])
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const schema = useMemo(() => createResetPasswordSchema(t), [t])
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!user) return

    setSubmitting(true)
    setErrorMessage(null)

    try {
      const payload: ResetPasswordRequest = {
        newPassword: data.newPassword,
      }
      await userService.resetPassword(user.id, payload)
      message.success(t('resetModal.success'))
      handleClose()
    } catch (err: unknown) {
      setErrorMessage(extractErrorMessage(err, t('resetModal.error')))
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    setErrorMessage(null)
    onClose()
  }

  return (
    <Modal
      open={open}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LockOutlined style={{ color: '#D97706' }} />
          <span>
            {t('resetModal.title')} <strong>{user?.username}</strong>
          </span>
        </div>
      }
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={submitting}>
          {t('actions.cancel', { ns: 'common' })}
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit(onSubmit)}
          loading={submitting}
          style={{ background: '#D97706', borderColor: '#D97706' }}
        >
          {t('resetModal.save')}
        </Button>,
      ]}
      destroyOnClose
      width={480}
    >
      <div style={{ padding: '8px 0' }}>
        {user && (
          <div
            style={{
              marginBottom: 16,
              padding: '10px 14px',
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <UserOutlined style={{ color: '#6B7280' }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                {t('modal.username')}: <strong style={{ color: '#111827' }}>{user.username}</strong>
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#4B5563' }}>
              <strong>{t('labels.email', { ns: 'common' })}:</strong> <span style={{ color: '#111827' }}>{user.email}</span>
              {user.fullName && <span> ({user.fullName})</span>}
            </div>
          </div>
        )}

        {errorMessage && (
          <Alert
            type="error"
            showIcon
            message={t('resetModal.error')}
            description={errorMessage}
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setErrorMessage(null)}
          />
        )}

        <Form layout="vertical">
          <Form.Item
            label={t('resetModal.newPassword')}
            validateStatus={errors.newPassword ? 'error' : ''}
            help={errors.newPassword?.message}
            extra={
              <span style={{ fontSize: 11, color: '#8A8983' }}>
                {t('resetModal.passwordHelp')}
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
                  placeholder={t('resetModal.newPasswordPlaceholder')}
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label={t('resetModal.confirmPassword')}
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
                  placeholder={t('resetModal.confirmPasswordPlaceholder')}
                />
              )}
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}
