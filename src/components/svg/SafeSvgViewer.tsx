import React, { useEffect, useState } from 'react'
import { Spin, Alert, Empty } from 'antd'
import { svgService } from '@/services/svg/svgService'

interface SafeSvgViewerProps {
  svgId: number
  height?: number | string
  width?: number | string
  style?: React.CSSProperties
}

export const SafeSvgViewer: React.FC<SafeSvgViewerProps> = ({
  svgId,
  height = 300,
  width = '100%',
  style,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let currentUrl: string | null = null

    setLoading(true)
    setError(null)

    svgService
      .getPreviewBlobUrl(svgId)
      .then(url => {
        if (active) {
          currentUrl = url
          setBlobUrl(url)
          setLoading(false)
        } else {
          URL.revokeObjectURL(url)
        }
      })
      .catch(err => {
        if (active) {
          setError(err.message || 'Failed to load SVG preview')
          setLoading(false)
        }
      })

    return () => {
      active = false
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }
    }
  }, [svgId])

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height,
          width,
          background: '#fafafa',
          borderRadius: 8,
          border: '1px dashed #d9d9d9',
        }}
      >
        <Spin tip="Rendering SVG preview safely..." />
      </div>
    )
  }

  if (error || !blobUrl) {
    return (
      <div style={{ height, width, padding: 16 }}>
        <Alert
          type="warning"
          showIcon
          message="Preview Unavailable"
          description={error || 'Could not display SVG content safely.'}
        />
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height,
        width,
        background: '#ffffff',
        borderRadius: 8,
        border: '1px solid #f0f0f0',
        overflow: 'hidden',
        padding: 16,
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.03)',
        ...style,
      }}
    >
      <object
        data={blobUrl}
        type="image/svg+xml"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
        }}
        aria-label="Safe SVG Graphic"
      >
        <Empty description="SVG cannot be displayed in this browser" />
      </object>
    </div>
  )
}
