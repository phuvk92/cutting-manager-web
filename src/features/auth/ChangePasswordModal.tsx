import React, { useState } from 'react'
import { Modal, Form, Input, message } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { authService } from '@/services/auth/authService'
import { ChangePasswordRequest } from '@/types/auth'
import { extractErrorMessage } from '@/utils/error'

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
      const res = await authService.changePassword(values)
      message.success(res?.message || t('changePassword.success', { ns: 'auth' }))
      form.resetFields()
      onSuccess?.()
      onCancel()
    } catch (err: unknown) {
      message.error(extractErrorMessage(err, t('changePassword.error', { ns: 'auth' })))
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
      title={t('changePassword.title', { ns: 'auth' })}
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
        requiredMark={false}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="currentPassword"
          label={t('changePassword.currentPassword', { ns: 'auth' })}
          rules={[{ required: true, message: t('changePassword.validation.currentRequired', { ns: 'auth' }) }]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
            placeholder={t('changePassword.currentPasswordPlaceholder', { ns: 'auth' })}
          />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label={t('changePassword.newPassword', { ns: 'auth' })}
          rules={[
            { required: true, message: t('changePassword.validation.newRequired', { ns: 'auth' }) },
            {
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/,
              message: t('changePassword.validation.minLength', { ns: 'auth' }),
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
          dependencies={['newPassword']}
          hasFeedback
          rules={[
            { required: true, message: t('changePassword.validation.confirmRequired', { ns: 'auth' }) },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error(t('changePassword.validation.mismatch', { ns: 'auth' })))
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
