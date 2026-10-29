import React from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/common/PageHeader'
import { UserList } from '@/features/users/UserList'
import { useNavigate } from 'react-router-dom'

export const UsersPage: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation(['users'])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <UserList />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
          <div style={{ padding: '14px 16px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
            <div style={{ font: "600 12px 'IBM Plex Sans', sans-serif" }}>{t('infoCards.roles')}</div>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>
                <span>{t('infoCards.admin')}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#1B1B19' }}>4</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>
                <span>{t('infoCards.agent')}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#1B1B19' }}>38</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>
                <span>{t('infoCards.user')}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#1B1B19' }}>370</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '14px 16px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
            <div style={{ font: "600 12px 'IBM Plex Sans', sans-serif" }}>{t('infoCards.sessionPolicy')}</div>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>
                <span>{t('infoCards.maxDevices')}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#1B1B19' }}>2</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>
                <span>{t('infoCards.sessionExpiry')}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#1B1B19' }}>{t('infoCards.hours8')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>
                <span>{t('infoCards.concurrentLogin')}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#C2452D' }}>{t('infoCards.blocked')}</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '14px 16px', background: '#FBFBFA', border: '1px solid #E4E3DE', borderRadius: 6 }}>
            <div style={{ font: "600 12px 'IBM Plex Sans', sans-serif" }}>{t('infoCards.devicesExceeded')}</div>
            <div style={{ marginTop: 10, font: "400 11.5px/1.6 'IBM Plex Sans', sans-serif", color: '#6E6D68' }}>
              {t('infoCards.devicesExceededDesc')}
            </div>
            <button
              onClick={() => navigate('/sessions')}
              style={{
                marginTop: 12,
                padding: '6px 11px',
                border: '1px solid #D8D7D2',
                borderRadius: 5,
                background: '#FFF',
                cursor: 'pointer',
                font: "500 11.5px 'IBM Plex Sans', sans-serif",
                color: '#35342F',
              }}
            >
              {t('infoCards.viewOpenSessions')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
