import React, { useEffect, useState } from 'react'
import { Modal, Form, Input, Select, message, Alert } from 'antd'
import { PartLibraryCategory, PartLibraryCategoryCreateRequest, PartLibraryCategoryUpdateRequest } from '@/types/partLibraryCategory'
import { partLibraryCategoryService } from '@/services/admin/partLibraryCategoryService'
import { extractErrorMessage } from '@/utils/error'

interface PartLibraryCategoryModalProps {
  open: boolean
  editing: PartLibraryCategory | null
  onClose: () => void
  onSuccess: () => void
}

export const PartLibraryCategoryModal: React.FC<PartLibraryCategoryModalProps> = ({
  open,
  editing,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isEdit = !!editing

  useEffect(() => {
    if (open) {
      setErrorMsg(null)
      if (editing) {
        form.setFieldsValue({
          code: editing.code,
          name: editing.name,
          status: editing.status,
        })
      } else {
        form.resetFields()
        form.setFieldsValue({
          status: 'ACTIVE',
        })
      }
    }
  }, [open, editing, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      setErrorMsg(null)

      if (isEdit && editing) {
        const payload: PartLibraryCategoryUpdateRequest = {
          code: values.code.trim().toUpperCase(),
          name: values.name.trim(),
          status: values.status,
        }
        await partLibraryCategoryService.updateCategory(editing.id, payload)
        message.success('Cập nhật danh mục kho mẫu & part thành công!')
      } else {
        const payload: PartLibraryCategoryCreateRequest = {
          code: values.code.trim().toUpperCase(),
          name: values.name.trim(),
          status: values.status || 'ACTIVE',
        }
        await partLibraryCategoryService.createCategory(payload)
        message.success('Tạo danh mục kho mẫu & part thành công!')
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        return // Validation error in form
      }
      const msg = extractErrorMessage(err, isEdit ? 'Không thể cập nhật danh mục' : 'Không thể tạo danh mục')
      setErrorMsg(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Chỉnh sửa Danh mục kho mẫu & part' : 'Thêm mới Danh mục kho mẫu & part'}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={submitting}
      okText={isEdit ? 'Lưu thay đổi' : 'Tạo mới'}
      cancelText="Hủy"
      destroyOnClose
      width={520}
    >
      <div style={{ marginTop: 12 }}>
        <Alert
          type="info"
          showIcon
          message="Phân biệt với Danh mục xe"
          description="Đây là danh mục dùng để phân loại Kho mẫu & Part file (Nội thất, Ngoại thất, Phim cách nhiệt...). Không nhầm lẫn với Danh mục xe (Hãng › Dòng › Model)."
          style={{ marginBottom: 16 }}
        />

        {errorMsg && (
          <Alert
            type="error"
            showIcon
            message={errorMsg}
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setErrorMsg(null)}
          />
        )}

        <Form form={form} layout="vertical" requiredMark="optional">
          <Form.Item
            name="code"
            label="Mã danh mục"
            rules={[
              { required: true, message: 'Vui lòng nhập mã danh mục' },
              {
                pattern: /^[A-Za-z0-9_-]+$/,
                message: 'Mã danh mục chỉ chứa chữ cái, số, gạch dưới hoặc gạch ngang',
              },
            ]}
            extra="Ví dụ: INTERIOR, EXTERIOR, WINDOW_FILM, LIGHTS_GLASS"
          >
            <Input
              placeholder="Nhập mã (ví dụ: INTERIOR)"
              style={{ textTransform: 'uppercase' }}
              onChange={e => {
                form.setFieldsValue({ code: e.target.value.toUpperCase() })
              }}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}
            extra="Ví dụ: Nội thất, Ngoại thất, Phim cách nhiệt, Đèn & kính"
          >
            <Input placeholder="Nhập tên hiển thị" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select>
              <Select.Option value="ACTIVE">Hoạt động (ACTIVE)</Select.Option>
              <Select.Option value="INACTIVE">Tạm dừng (INACTIVE)</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}
