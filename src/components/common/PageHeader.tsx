import React, { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  extra?: ReactNode
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  extra,
}) => {
  return (
    <div
      style={{
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 24px',
        background: '#FBFBFA',
        borderBottom: '1px solid #D8D7D2',
      }}
    >
      <span
        style={{
          width: 3,
          height: 16,
          background: '#7C3AED',
          borderRadius: 2,
          flex: 'none',
        }}
      />
      <span style={{ font: "600 14px 'IBM Plex Sans', sans-serif", color: '#1B1B19' }}>
        {title}
      </span>
      {subtitle && (
        <span style={{ font: "400 11.5px 'IBM Plex Sans', sans-serif", color: '#8A8983' }}>
          {subtitle}
        </span>
      )}
      {extra && <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>{extra}</div>}
    </div>
  )
}
