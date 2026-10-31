import React, { useEffect, useState } from 'react'
import { Modal, Form, Input, Select, message, Alert } from 'antd'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation(['partLibraryCategories', 'common'])
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
        message.success(t('messages.saveSuccess'))
      } else {
        const payload: PartLibraryCategoryCreateRequest = {
          code: values.code.trim().toUpperCase(),
          name: values.name.trim(),
          status: values.status || 'ACTIVE',
        }
        await partLibraryCategoryService.createCategory(payload)
        message.success(t('messages.createSuccess'))
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        return // Validation error in form
      }
      const defaultErr = isEdit ? t('messages.statusError') : t('common.messages.error', { ns: 'common' })
      const msg = extractErrorMessage(err, defaultErr)
      setErrorMsg(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 24 }}>
          <span>{isEdit ? t('modal.editTitle') : t('modal.addTitle')}</span>
          <span style={{ fontSize: 12, color: '#8A8983', fontWeight: 400 }}>
            {t('labels.requiredLegend', { ns: 'common', defaultValue: '* Trường bắt buộc' })}
          </span>
        </div>
      }
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={submitting}
      okText={isEdit ? t('actions.save', { ns: 'common' }) : t('actions.create', { ns: 'common' })}
      cancelText={t('actions.cancel', { ns: 'common' })}
      destroyOnClose
      width={520}
    >
      <div style={{ marginTop: 12 }}>
        <Alert
          type="info"
          showIcon
          message={t('modal.distinctionTitle')}
          description={t('modal.distinctionDesc')}
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

        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label={t('modal.code')}
            rules={[
              { required: true, message: t('modal.codeRequired') },
              {
                pattern: /^[A-Za-z0-9_-]+$/,
                message: t('modal.codePattern'),
              },
            ]}
            extra={t('modal.codeHelp')}
          >
            <Input
              placeholder={t('modal.codePlaceholder')}
              style={{ textTransform: 'uppercase' }}
              onChange={e => {
                form.setFieldsValue({ code: e.target.value.toUpperCase() })
              }}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label={t('modal.name')}
            rules={[{ required: true, message: t('modal.nameRequired') }]}
            extra={t('modal.nameHelp')}
          >
            <Input placeholder={t('modal.namePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="status"
            label={t('modal.status')}
            rules={[{ required: true, message: t('modal.statusRequired') }]}
          >
            <Select>
              <Select.Option value="ACTIVE">{t('modal.active')} (ACTIVE)</Select.Option>
              <Select.Option value="INACTIVE">{t('modal.inactive')} (INACTIVE)</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}
