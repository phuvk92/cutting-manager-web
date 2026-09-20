import React from 'react'
import { Layout, Typography, Card } from 'antd'
import { Outlet } from 'react-router-dom'

const { Content, Footer } = Layout
const { Title, Text } = Typography

export const AuthLayout: React.FC = () => {
  return (
    <Layout
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Content
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 16px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #1890ff, #722ed1)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 28,
              boxShadow: '0 8px 24px rgba(24, 144, 255, 0.3)',
              marginBottom: 16,
            }}
          >
            C
          </div>
          <Title level={2} style={{ color: '#ffffff', margin: 0, letterSpacing: '-0.5px' }}>
            Cutting Manager Web
          </Title>
          <Text style={{ color: '#94a3b8', fontSize: 14 }}>
            Secure Enterprise SVG Asset & File Management
          </Text>
        </div>

        <Card
          style={{
            width: '100%',
            maxWidth: 440,
            borderRadius: 12,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Outlet />
        </Card>
      </Content>

      <Footer style={{ textAlign: 'center', background: 'transparent', padding: '16px' }}>
        <Text style={{ color: '#64748b', fontSize: 13 }}>
          Cutting Manager Web &copy; {new Date().getFullYear()} — Connected to Spring Boot Backend
        </Text>
      </Footer>
    </Layout>
  )
}
