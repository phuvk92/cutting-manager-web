import React, { useState } from 'react'
import { Modal, Form, Input, message } from 'antd'
import { LockOutlined } from '@ant-design/icons'
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
  const [form] = Form.useForm<ChangePasswordRequest>()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: ChangePasswordRequest) => {
    try {
      setLoading(true)
      const res = await authService.changePassword(values)
      message.success(res?.message || 'Password changed successfully!')
      form.resetFields()
      onSuccess?.()
      onCancel()
    } catch (err: unknown) {
      message.error(extractErrorMessage(err, 'Failed to change password'))
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
      title="Change Password"
      open={open}
      onCancel={handleModalClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Update Password"
      cancelText="Cancel"
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
          label="Current Password"
          rules={[{ required: true, message: 'Please enter your current password' }]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Enter current password"
          />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="New Password"
          rules={[
            { required: true, message: 'Please enter your new password' },
            {
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/,
              message:
                'Password must be at least 8 characters, contain uppercase, lowercase, number, and special character',
            },
          ]}
          hasFeedback
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Enter new password"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Confirm New Password"
          dependencies={['newPassword']}
          hasFeedback
          rules={[
            { required: true, message: 'Please confirm your new password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('Confirm password does not match new password'))
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Re-enter new password"
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
