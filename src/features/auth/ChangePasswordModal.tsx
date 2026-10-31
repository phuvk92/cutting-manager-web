import React, { useState } from 'react'
import { Modal, Form, Input, message } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { authService } from '@/services/auth/authService'
import { ChangePasswordRequest } from '@/types/auth'
import { extractApiError } from '@/utils/error'
import { trimPassword, PASSWORD_REGEX } from '@/utils/passwordRules'

interface ChangePasswordModalProps {
  open: boolean
  onCancel: () => void
  onSuccess?: () => void
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  open,
  onCancel,
  onSuccess,
}) => {
  const { t } = useTranslation(['auth', 'common'])
  const [form] = Form.useForm<ChangePasswordRequest>()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: ChangePasswordRequest) => {
    try {
      setLoading(true)
      const payload: ChangePasswordRequest = {
        currentPassword: trimPassword(values.currentPassword),
        newPassword: trimPassword(values.newPassword),
        confirmPassword: trimPassword(values.confirmPassword),
      }
      const res = await authService.changePassword(payload)
      message.success(res?.message || t('changePassword.success', { ns: 'auth' }))
      form.resetFields()
      onSuccess?.()
      onCancel()
    } catch (err: unknown) {
      const apiError = extractApiError(err, t('changePassword.error', { ns: 'auth' }))
      if (apiError.field) {
        form.setFields([
          {
            name: apiError.field as any,
            errors: [apiError.message],
          },
        ])
      }
      message.error(apiError.message)
    } finally {
      setLoading(false)
    }
  }

  const handleModalClose = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 24 }}>
          <span>{t('changePassword.title', { ns: 'auth' })}</span>
          <span style={{ fontSize: 12, color: '#8A8983', fontWeight: 400 }}>
            {t('labels.requiredLegend', { ns: 'common', defaultValue: '* Trường bắt buộc' })}
          </span>
        </div>
      }
      open={open}
      onCancel={handleModalClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText={t('changePassword.submit', { ns: 'auth' })}
      cancelText={t('actions.cancel', { ns: 'common' })}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="currentPassword"
          label={t('changePassword.currentPassword', { ns: 'auth' })}
          required
          rules={[
            {
              validator(_, value) {
                if (!trimPassword(value)) {
                  return Promise.reject(new Error(t('changePassword.validation.currentRequired', { ns: 'auth' })))
                }
                return Promise.resolve()
              },
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
            placeholder={t('changePassword.currentPasswordPlaceholder', { ns: 'auth' })}
          />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label={t('changePassword.newPassword', { ns: 'auth' })}
          required
          rules={[
            {
              validator(_, value) {
                const trimmed = trimPassword(value)
                if (!trimmed) {
                  return Promise.reject(new Error(t('changePassword.validation.newRequired', { ns: 'auth' })))
                }
                if (trimmed.length < 8 || !PASSWORD_REGEX.test(trimmed)) {
                  return Promise.reject(new Error(t('changePassword.validation.minLength', { ns: 'auth' })))
                }
                return Promise.resolve()
              },
            },
          ]}
          hasFeedback
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
            placeholder={t('changePassword.newPasswordPlaceholder', { ns: 'auth' })}
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label={t('changePassword.confirmPassword', { ns: 'auth' })}
          required
          dependencies={['newPassword']}
          hasFeedback
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                const trimmedConfirm = trimPassword(value)
                if (!trimmedConfirm) {
                  return Promise.reject(new Error(t('changePassword.validation.confirmRequired', { ns: 'auth' })))
                }
                const trimmedNew = trimPassword(getFieldValue('newPassword'))
                if (trimmedNew !== trimmedConfirm) {
                  return Promise.reject(new Error(t('changePassword.validation.mismatch', { ns: 'auth' })))
                }
                return Promise.resolve()
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
            placeholder={t('changePassword.confirmPasswordPlaceholder', { ns: 'auth' })}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
