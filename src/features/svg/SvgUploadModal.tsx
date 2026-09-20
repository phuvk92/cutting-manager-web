import React, { useState } from 'react'
import { Modal, Upload, Progress, Alert, Button, message } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { svgService } from '@/services/svg/svgService'
import { extractErrorMessage } from '@/utils/error'

const { Dragger } = Upload

interface SvgUploadModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export const SvgUploadModal: React.FC<SvgUploadModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [fileList, setFileList] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('Please select an SVG file to upload.')
      return
    }

    const file = fileList[0]
    setUploading(true)
    setProgress(0)
    setErrorMessage(null)

    try {
      await svgService.uploadSvg(file, percent => {
        setProgress(percent)
      })
      message.success(`File "${file.name}" uploaded successfully!`)
      setFileList([])
      setProgress(0)
      onSuccess()
      onClose()
    } catch (err) {
      setErrorMessage(extractErrorMessage(err, 'Failed to upload SVG file.'))
    } finally {
      setUploading(false)
    }
  }

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    maxCount: 1,
    accept: '.svg,image/svg+xml',
    beforeUpload: file => {
      // Validate file extension and MIME
      const isSvg = file.name.toLowerCase().endsWith('.svg') || file.type === 'image/svg+xml'
      if (!isSvg) {
        message.error('Only SVG files (.svg) are allowed!')
        return Upload.LIST_IGNORE
      }

      // 10MB limit
      const isLt10M = file.size / 1024 / 1024 < 10
      if (!isLt10M) {
        message.error('SVG file must be smaller than 10MB!')
        return Upload.LIST_IGNORE
      }

      setFileList([file])
      setErrorMessage(null)
      return false // Prevent automatic upload
    },
    onRemove: () => {
      setFileList([])
      setProgress(0)
    },
    fileList: fileList.map(f => ({
      uid: f.name,
      name: f.name,
      size: f.size,
      type: f.type,
    })),
  }

  const handleModalClose = () => {
    if (!uploading) {
      setFileList([])
      setProgress(0)
      setErrorMessage(null)
      onClose()
    }
  }

  return (
    <Modal
      title="Upload SVG File"
      open={open}
      onCancel={handleModalClose}
      footer={[
        <Button key="cancel" onClick={handleModalClose} disabled={uploading}>
          Cancel
        </Button>,
        <Button
          key="upload"
          type="primary"
          onClick={handleUpload}
          loading={uploading}
          disabled={fileList.length === 0}
        >
          {uploading ? 'Uploading...' : 'Start Upload'}
        </Button>,
      ]}
      destroyOnClose
    >
      <div style={{ padding: '16px 0' }}>
        {errorMessage && (
          <Alert
            type="error"
            showIcon
            message="Upload Failed"
            description={errorMessage}
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setErrorMessage(null)}
          />
        )}

        <Dragger {...uploadProps} disabled={uploading}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">Click or drag SVG file to this area to upload</p>
          <p className="ant-upload-hint">
            Supports valid SVG format only. Max file size: 10MB. Files are sanitized by the backend.
          </p>
        </Dragger>

        {uploading && (
          <div style={{ marginTop: 16 }}>
            <Progress percent={progress} status="active" />
          </div>
        )}
      </div>
    </Modal>
  )
}
