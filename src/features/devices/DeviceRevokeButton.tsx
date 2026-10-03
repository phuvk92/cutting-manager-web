import React from 'react'
import { Button, Popconfirm } from 'antd'

interface DeviceRevokeButtonProps {
  loading?: boolean
  onConfirm: () => void
}

/** Cùng một lời cảnh báo gỡ máy giữa màn user và trang Phiên & thiết bị. */
export const DeviceRevokeButton: React.FC<DeviceRevokeButtonProps> = ({ loading, onConfirm }) => (
  <Popconfirm
    title="Gỡ máy này khỏi tài khoản?"
    description={
      <div style={{ maxWidth: 280 }}>
        Phần mềm cắt trên máy này sẽ bị đăng xuất trong vài phút. Thợ đăng nhập lại được trên máy khác.
      </div>
    }
    okText="Gỡ máy"
    cancelText="Hủy"
    okButtonProps={{ danger: true }}
    onConfirm={onConfirm}
  >
    <Button size="small" danger loading={loading}>
      Gỡ máy
    </Button>
  </Popconfirm>
)
