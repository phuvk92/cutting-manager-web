import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Typography, Progress, Tag, Space, Tooltip, Spin } from 'antd'
import {
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { DealerPackageResponse } from '@/types/dealer'
import { dealerService } from '@/services/dealers/dealerService'
import { useAuthStore } from '@/stores/authStore'
import dayjs from 'dayjs'

const { Text, Title } = Typography

export const DealerPackageBanner: React.FC = () => {
  const { t } = useTranslation('dealers')
  const { user: currentUser } = useAuthStore()
  const isAgent = currentUser?.role === 'AGENT'
  const [pkg, setPkg] = useState<DealerPackageResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAgent) {
      setLoading(true)
      setError(null)
      dealerService
        .getMyPackage()
        .then(res => {
          setPkg(res)
        })
        .catch(err => {
          console.error('Không thể tải thông tin gói đại lý:', err)
          setError(t('banner.error'))
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [isAgent, t])

  if (!isAgent) {
    return null
  }

  if (loading) {
    return (
      <Card style={{ marginBottom: 14, borderRadius: 8, borderColor: '#DDD2FA', background: '#FAF9FE' }} styles={{ body: { padding: '16px 20px' } }}>
        <Space direction="horizontal">
          <Spin size="small" />
          <Text type="secondary" style={{ fontSize: 13 }}>{t('banner.loading')}</Text>
        </Space>
      </Card>
    )
  }

  if (error || !pkg) {
    if (error) {
      return (
        <Card style={{ marginBottom: 14, borderRadius: 8, borderColor: '#FDE68A', background: '#FFFBEB' }} styles={{ body: { padding: '12px 16px' } }}>
          <Space>
            <ExclamationCircleOutlined style={{ color: '#D97706' }} />
            <Text style={{ fontSize: 13, color: '#92400E' }}>{error}</Text>
          </Space>
        </Card>
      )
    }
    return null
  }

  const accountPercent = pkg.maxAccounts > 0 ? Math.min(100, Math.round((pkg.createdAccounts / pkg.maxAccounts) * 100)) : 0
  const daysPercent = pkg.totalAllocatedDays > 0 ? Math.min(100, Math.round((pkg.usedAllocatedDays / pkg.totalAllocatedDays) * 100)) : 0

  const isExpired = pkg.expired || (pkg.packageExpiryDate ? dayjs(pkg.packageExpiryDate).isBefore(dayjs(), 'day') : false)
  const isSuspended = pkg.packageStatus === 'SUSPENDED'
  const isActive = pkg.packageStatus === 'ACTIVE' && !isExpired

  return (
    <Card
      style={{
        marginBottom: 16,
        borderRadius: 8,
        border: '1px solid #DDD2FA',
        background: 'linear-gradient(135deg, #FAF8FF 0%, #F5F2FD 100%)',
        boxShadow: '0 2px 8px rgba(108, 59, 214, 0.05)',
      }}
      styles={{ body: { padding: '16px 20px' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <Space align="center" size={10}>
          <Title level={5} style={{ margin: 0, color: '#4A2A94', font: "600 15px 'IBM Plex Sans', sans-serif" }}>
            {t('banner.title', { name: pkg.dealerName })}
          </Title>
          <Tag color="purple" style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>
            {pkg.dealerCode}
          </Tag>
        </Space>

        <Space size={8}>
          {isActive && (
            <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontWeight: 500, padding: '2px 8px' }}>
              {t('banner.active')}
            </Tag>
          )}
          {isExpired && (
            <Tag icon={<ClockCircleOutlined />} color="error" style={{ fontWeight: 500, padding: '2px 8px' }}>
              {t('banner.expired')}
            </Tag>
          )}
          {isSuspended && (
            <Tag icon={<ExclamationCircleOutlined />} color="warning" style={{ fontWeight: 500, padding: '2px 8px' }}>
              {t('banner.suspended')}
            </Tag>
          )}
          {pkg.packageExpiryDate && (
            <Tooltip title={t('banner.expiryTooltip')}>
              <span style={{ fontSize: 12, color: '#6E6D68', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CalendarOutlined style={{ color: '#6C3BD6' }} />
                {t('banner.expiryLabel')}{' '}
                <strong style={{ color: isExpired ? '#DC2626' : '#1B1B19' }}>
                  {dayjs(pkg.packageExpiryDate).format('DD/MM/YYYY')}
                </strong>
              </span>
            </Tooltip>
          )}
        </Space>
      </div>

      <Row gutter={[20, 14]}>
        {/* Metric 1: Số account */}
        <Col xs={24} sm={12} md={12} lg={12}>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E9E6F5',
              borderRadius: 6,
              padding: '12px 14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#6E6D68', display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserOutlined style={{ color: '#6C3BD6' }} /> {t('banner.accountsQuota')}
              </span>
              <span style={{ font: "600 13px 'IBM Plex Mono', monospace", color: '#1B1B19' }}>
                {pkg.createdAccounts} / {pkg.maxAccounts}
              </span>
            </div>
            <Progress
              percent={accountPercent}
              size="small"
              status={pkg.remainingAccounts <= 0 ? 'exception' : 'active'}
              strokeColor="#6C3BD6"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: '#6E6D68' }}>
              <span>{t('banner.created', { count: pkg.createdAccounts })}</span>
              <span style={{ color: pkg.remainingAccounts > 0 ? '#16A34A' : '#DC2626' }}>
                {t('banner.remainingAccounts', { count: pkg.remainingAccounts })}
              </span>
            </div>
          </div>
        </Col>

        {/* Metric 2: Tổng quỹ ngày */}
        <Col xs={24} sm={12} md={12} lg={12}>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E9E6F5',
              borderRadius: 6,
              padding: '12px 14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#6E6D68', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CalendarOutlined style={{ color: '#6C3BD6' }} /> {t('banner.daysQuota')}
              </span>
              <span style={{ font: "600 13px 'IBM Plex Mono', monospace", color: '#1B1B19' }}>
                {t('banner.daysUnit', {
                  used: pkg.usedAllocatedDays.toLocaleString(),
                  total: pkg.totalAllocatedDays.toLocaleString()
                })}
              </span>
            </div>
            <Progress
              percent={daysPercent}
              size="small"
              status={pkg.remainingAllocatedDays <= 0 ? 'exception' : 'active'}
              strokeColor="#6C3BD6"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: '#6E6D68' }}>
              <span>{t('banner.allocatedDays', { days: pkg.usedAllocatedDays.toLocaleString() })}</span>
              <span style={{ color: pkg.remainingAllocatedDays > 0 ? '#16A34A' : '#DC2626' }}>
                {t('banner.remainingDaysPool', {
                  days: pkg.remainingAllocatedDays.toLocaleString(),
                  months: Math.round(pkg.remainingAllocatedDays / 30)
                })}
              </span>
            </div>
          </div>
        </Col>
      </Row>

      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6E6D68' }}>
        <InfoCircleOutlined style={{ color: '#8A8983' }} />
        <span>{t('banner.conventionHint')}</span>
      </div>
    </Card>
  )
}
