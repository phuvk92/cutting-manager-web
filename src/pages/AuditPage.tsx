import React, { useState } from 'react'
import { Tabs } from 'antd'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/common/PageHeader'
import { AuditLogView } from '@/features/audit/AuditLogView'
import { AuditLogV2View } from '@/features/auditV2/AuditLogV2View'
import { ApiOutlined, HistoryOutlined } from '@ant-design/icons'

export const AuditPage: React.FC = () => {
  const { t } = useTranslation(['audit'])
  const [activeTab, setActiveTab] = useState<string>('v2')

  const tabItems = [
    {
      key: 'v2',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
          <ApiOutlined style={{ fontSize: 15 }} />
          {t('tabs.v2')}
        </span>
      ),
      children: <AuditLogV2View />,
    },
    {
      key: 'v1',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
          <HistoryOutlined style={{ fontSize: 15 }} />
          {t('tabs.v1')}
        </span>
      ),
      children: <AuditLogView />,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="line"
          size="large"
          tabBarStyle={{ marginBottom: 16 }}
        />
      </div>
    </div>
  )
}
