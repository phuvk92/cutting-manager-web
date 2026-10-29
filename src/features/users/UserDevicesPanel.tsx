import React, { useCallback, useEffect, useState } from 'react'
import { Button, Tag, Spin, message } from 'antd'
import { DesktopOutlined, ReloadOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { UserDevice } from '@/types/user'
import { userService } from '@/services/users/userService'
import { extractErrorMessage } from '@/utils/error'
import { formatDateTime } from '@/utils/formatters'
import { DeviceRevokeButton } from '@/features/devices/DeviceRevokeButton'

interface UserDevicesPanelProps {
  userId: number
  username: string
  /** Số máy tối đa đang áp dụng — để hiện "1/1 máy" */
  maxDevices?: number
}

/**
 * F-57 — máy đã đăng ký của một tài khoản thợ (1 tài khoản 1 thiết bị).
 * Gỡ máy = nhả chỗ cho máy khác + phần mềm cắt trên máy cũ bị đăng xuất sau vài phút ân hạn.
 */
export const UserDevicesPanel: React.FC<UserDevicesPanelProps> = ({ userId, username, maxDevices }) => {
  const { t } = useTranslation(['users'])
  const [devices, setDevices] = useState<UserDevice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setDevices(await userService.getUserDevices(userId))
    } catch (err) {
      setError(extractErrorMessage(err, t('userDevices.loadError')))
    } finally {
      setLoading(false)
    }
  }, [userId, t])

  useEffect(() => {
    load()
  }, [load])

  const handleRevoke = async (device: UserDevice) => {
    setRevokingId(device.id)
    try {
      await userService.revokeUserDevice(userId, device.id)
      message.success(
        t('userDevices.revokeSuccess', {
          name: device.name || shortId(device.deviceId),
          user: username,
        })
      )
      await load()
    } catch (err) {
      message.error(extractErrorMessage(err, t('userDevices.revokeError')))
    } finally {
      setRevokingId(null)
    }
  }

  const activeCount = devices.filter(d => d.status === 'ACTIVE').length
  const shortId = (id: string) => (id.length > 12 ? id.slice(0, 12) : id)

  return (
    <div style={{ border: '1px solid #E4E3DE', borderRadius: 6, background: '#FBFBFA' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '9px 12px',
          borderBottom: '1px solid #E4E3DE',
          background: '#F1F0EC',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 12.5 }}>
          <DesktopOutlined style={{ marginRight: 6 }} />
          {t('userDevices.title')}
          {maxDevices !== undefined && (
            <span style={{ marginLeft: 8, fontWeight: 400, color: activeCount >= maxDevices ? '#C2452D' : '#6E6D68' }}>
              {t('userDevices.machines', { count: activeCount, max: maxDevices })}
            </span>
          )}
        </span>
        <Button size="small" type="text" icon={<ReloadOutlined />} onClick={load} loading={loading} />
      </div>

      <div style={{ padding: '4px 12px 8px' }}>
        {loading && devices.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center' }}>
            <Spin size="small" />
          </div>
        ) : error ? (
          <div style={{ padding: '10px 0', color: '#C2452D', fontSize: 12.5 }}>{error}</div>
        ) : devices.length === 0 ? (
          <div style={{ padding: '10px 0', color: '#8A8983', fontSize: 12.5 }}>
            {t('userDevices.empty')}
          </div>
        ) : (
          devices.map(d => (
            <div
              key={d.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 0',
                borderBottom: '1px solid #EFEEEA',
                opacity: d.status === 'REVOKED' ? 0.6 : 1,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.name || t('userDevices.unnamedDevice')}
                  </span>
                  {d.platform && <span style={{ color: '#8A8983', fontWeight: 400 }}>· {d.platform}</span>}
                  {d.status === 'ACTIVE' ? <Tag color="green">{t('userDevices.inUse')}</Tag> : <Tag>{t('userDevices.revoked')}</Tag>}
                </div>
                <div style={{ fontSize: 11.5, color: '#6E6D68', marginTop: 2 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace" }} title={d.deviceId}>
                    {shortId(d.deviceId)}
                  </span>
                  {' · '}{t('userDevices.lastSeen', { time: formatDateTime(d.lastSeenAt) })}
                  {d.lastIp && (
                    <>
                      {' · IP '}
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{d.lastIp}</span>
                    </>
                  )}
                  {d.status === 'REVOKED' && d.revokedAt && (
                    <>
                      {' · '}{t('userDevices.revokedAt', { time: formatDateTime(d.revokedAt), by: d.revokedBy || '' })}
                    </>
                  )}
                </div>
              </div>
              {d.status === 'ACTIVE' && (
                <DeviceRevokeButton loading={revokingId === d.id} onConfirm={() => handleRevoke(d)} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
