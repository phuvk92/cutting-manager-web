import React, { useState, useEffect } from 'react'
import { Spin } from 'antd'
import { FileImageOutlined } from '@ant-design/icons'
import { svgService } from '@/services/svg/svgService'

interface SvgThumbnailProps {
  svgId: number
  size?: number
  onClick?: () => void
}

export const SvgThumbnail: React.FC<SvgThumbnailProps> = ({
  svgId,
  size = 42,
  onClick,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)

    svgService
      .getPreviewBlobUrl(svgId)
      .then(url => {
        if (active) {
          setBlobUrl(url)
          setLoading(false)
        } else {
          URL.revokeObjectURL(url)
        }
      })
      .catch(() => {
        if (active) {
          setError(true)
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [svgId])

  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        border: '1px solid #E4E3DE',
        background: '#FAF9F5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        padding: 2,
        flexShrink: 0,
      }}
    >
      {loading ? (
        <Spin size="small" />
      ) : error || !blobUrl ? (
        <FileImageOutlined style={{ fontSize: size * 0.45, color: '#8A8983' }} />
      ) : (
        <img
          src={blobUrl}
          alt="thumbnail"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
        />
      )}
    </div>
  )
}
