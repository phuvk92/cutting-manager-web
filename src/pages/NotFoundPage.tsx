import React from 'react'
import { Result, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation(['errors'])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Result
        status="404"
        title="404"
        subTitle={t('404.subtitle')}
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            {t('404.backHome')}
          </Button>
        }
      />
    </div>
  )
}
