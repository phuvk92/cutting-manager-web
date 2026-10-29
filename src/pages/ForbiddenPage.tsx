import React from 'react'
import { Result, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation(['errors'])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Result
        status="403"
        title="403"
        subTitle={t('403.subtitle')}
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            {t('403.backHome')}
          </Button>
        }
      />
    </div>
  )
}
