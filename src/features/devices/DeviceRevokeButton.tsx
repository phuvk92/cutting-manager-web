import React from 'react'
import { Button, Popconfirm } from 'antd'
import { useTranslation } from 'react-i18next'

interface DeviceRevokeButtonProps {
  loading?: boolean
  onConfirm: () => void
}

/** Cùng một lời cảnh báo gỡ máy giữa màn user và trang Phiên & thiết bị. */
export const DeviceRevokeButton: React.FC<DeviceRevokeButtonProps> = ({ loading, onConfirm }) => {
  const { t } = useTranslation(['devices', 'common'])
  return (
    <Popconfirm
      title={t('revokeModal.title')}
      description={
        <div style={{ maxWidth: 280 }}>
          {t('revokeModal.description')}
        </div>
      }
      okText={t('revokeModal.okText')}
      cancelText={t('revokeModal.cancelText')}
      okButtonProps={{ danger: true }}
      onConfirm={onConfirm}
    >
      <Button size="small" danger loading={loading}>
        {t('revokeModal.okText')}
      </Button>
    </Popconfirm>
  )
}
