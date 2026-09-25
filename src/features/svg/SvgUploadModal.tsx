import React, { useState, useEffect } from 'react'
import { Modal, Upload, Progress, Alert, Button, Cascader, Form, message } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { svgService } from '@/services/svg/svgService'
import { categoryService } from '@/services/category/categoryService'
import { Category } from '@/types/category'
import { extractErrorMessage } from '@/utils/error'

const { Dragger } = Upload


interface SvgUploadModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface CascaderOption {
  value: number
  label: string
  children?: CascaderOption[]
}

const mapCategoryToCascader = (cat: Category): CascaderOption => ({
  value: cat.id,
  label: `${cat.label} (${cat.level})`,
  children: cat.children && cat.children.length > 0 ? cat.children.map(mapCategoryToCascader) : undefined,
})

export const SvgUploadModal: React.FC<SvgUploadModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [fileList, setFileList] = useState<File[]>([])
  const [categories, setCategories] = useState<CascaderOption[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadCategories()
    }
  }, [open])

  const loadCategories = async () => {
    setLoadingCategories(true)
    try {
      const data = await categoryService.getCategories()
      const options = data.map(mapCategoryToCascader)
      setCategories(options)
    } catch (err) {
      message.error('Failed to load categories catalog')
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('Please select an SVG file to upload.')
      return
    }

    if (!selectedCategoryId) {
      message.warning('Please select a category for this SVG file.')
      return
    }

    const file = fileList[0]
    setUploading(true)
    setProgress(0)
    setErrorMessage(null)

    try {
      await svgService.uploadSvg(file, selectedCategoryId, percent => {
        setProgress(percent)
      })
      message.success(`File "${file.name}" uploaded successfully!`)
      setFileList([])
      setSelectedCategoryId(null)
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
      const isSvg = file.name.toLowerCase().endsWith('.svg') || file.type === 'image/svg+xml'
      if (!isSvg) {
        message.error('Only SVG files (.svg) are allowed!')
        return Upload.LIST_IGNORE
      }

      const isLt10M = file.size / 1024 / 1024 < 10
      if (!isLt10M) {
        message.error('SVG file must be smaller than 10MB!')
        return Upload.LIST_IGNORE
      }

      setFileList([file])
      setErrorMessage(null)
      return false
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
      setSelectedCategoryId(null)
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
          disabled={fileList.length === 0 || !selectedCategoryId}
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

        <Form layout="vertical">
          <Form.Item
            label="Category Catalog (Mandatory)"
            required
            help="Select vehicle hierarchy (Category / Brand / Model / Variant / Year / Submodel)"
          >
            <Cascader
              options={categories}
              loading={loadingCategories}
              placeholder="Select Category Hierarchy"
              changeOnSelect
              onChange={(value) => {
                if (value && value.length > 0) {
                  setSelectedCategoryId(value[value.length - 1] as number)
                } else {
                  setSelectedCategoryId(null)
                }
              }}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>

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
