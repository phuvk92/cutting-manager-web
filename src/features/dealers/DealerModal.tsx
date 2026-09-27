import React, { useEffect, useState, useCallback } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  Alert,
  Button,
  message,
  Row,
  Col,
  Tooltip,
  DatePicker,
} from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dayjs, { Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { Dealer, CreateDealerRequest, UpdateDealerRequest } from '@/types/dealer'
import { dealerService, generateDealerCodeLocal } from '@/services/dealers/dealerService'
import { extractErrorMessage } from '@/utils/error'

dayjs.extend(customParseFormat)

const dealerFormSchema = z.object({
  code: z.string().max(50, 'Tối đa 50 ký tự').optional(),
  name: z
    .string()
    .min(1, 'Tên đại lý là bắt buộc')
    .max(255, 'Tối đa 255 ký tự'),
  region: z.string().max(100, 'Tối đa 100 ký tự').optional(),
  address: z.string().max(255, 'Tối đa 255 ký tự').optional(),
  contactPerson: z.string().max(100, 'Tối đa 100 ký tự').optional(),
  phone: z.string().max(50, 'Tối đa 50 ký tự').optional(),
  email: z.string().max(100, 'Tối đa 100 ký tự').optional(),
  plan: z.string().min(1, 'Gói dịch vụ là bắt buộc'),
  dueDate: z.string().max(50, 'Tối đa 50 ký tự').optional(),
  status: z.string().min(1, 'Trạng thái là bắt buộc'),
  notes: z.string().optional(),
})

type DealerFormValues = z.infer<typeof dealerFormSchema>

interface DealerModalProps {
  open: boolean
  dealer?: Dealer | null
  onClose: () => void
  onSuccess: () => void
}

const REGION_OPTIONS = [
  { value: 'TP.HCM', label: 'TP.HCM' },
  { value: 'Hà Nội', label: 'Hà Nội' },
  { value: 'Đà Nẵng', label: 'Đà Nẵng' },
  { value: 'Cần Thơ', label: 'Cần Thơ' },
  { value: 'Hải Phòng', label: 'Hải Phòng' },
  { value: 'Bình Dương', label: 'Bình Dương' },
  { value: 'Đồng Nai', label: 'Đồng Nai' },
  { value: 'Khánh Hoà', label: 'Khánh Hoà' },
  { value: 'Quảng Ninh', label: 'Quảng Ninh' },
  { value: 'Nghệ An', label: 'Nghệ An' },
]

const PLAN_OPTIONS = [
  { value: 'Cơ bản', label: 'Cơ bản' },
  { value: 'Chuyên nghiệp', label: 'Chuyên nghiệp' },
  { value: 'Chuỗi', label: 'Chuỗi' },
  { value: 'Enterprise', label: 'Enterprise' },
]

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'EXPIRING', label: 'Sắp hết hạn' },
  { value: 'LOCKED', label: 'Tạm khóa' },
]

export const DealerModal: React.FC<DealerModalProps> = ({
  open,
  dealer,
  onClose,
  onSuccess,
}) => {
  const isEdit = Boolean(dealer)
  const [submitting, setSubmitting] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DealerFormValues>({
    resolver: zodResolver(dealerFormSchema),
    defaultValues: {
      code: '',
      name: '',
      region: 'TP.HCM',
      address: '',
      contactPerson: '',
      phone: '',
      email: '',
      plan: 'Cơ bản',
      dueDate: '',
      status: 'ACTIVE',
      notes: '',
    },
  })

  const refreshGeneratedCode = useCallback(async () => {
    setGeneratingCode(true)
    try {
      const code = await dealerService.generateCode()
      setValue('code', code)
    } catch {
      setValue('code', generateDealerCodeLocal())
    } finally {
      setGeneratingCode(false)
    }
  }, [setValue])

  useEffect(() => {
    if (open) {
      setServerError(null)
      if (dealer) {
        reset({
          code: dealer.code,
          name: dealer.name,
          region: dealer.region || 'TP.HCM',
          address: dealer.address || '',
          contactPerson: dealer.contactPerson || '',
          phone: dealer.phone || '',
          email: dealer.email || '',
          plan: dealer.plan || 'Cơ bản',
          dueDate: dealer.dueDate || '',
          status: dealer.status || 'ACTIVE',
          notes: dealer.notes || '',
        })
      } else {
        const initialCode = generateDealerCodeLocal()
        reset({
          code: initialCode,
          name: '',
          region: 'TP.HCM',
          address: '',
          contactPerson: '',
          phone: '',
          email: '',
          plan: 'Cơ bản',
          dueDate: '',
          status: 'ACTIVE',
          notes: '',
        })
        refreshGeneratedCode()
      }
    }
  }, [open, dealer, reset, refreshGeneratedCode])

  const onSubmit = async (values: DealerFormValues) => {
    setSubmitting(true)
    setServerError(null)

    try {
      if (isEdit && dealer) {
        const payload: UpdateDealerRequest = {
          code: (values.code || dealer.code).trim().toUpperCase(),
          name: values.name.trim(),
          region: values.region?.trim(),
          address: values.address?.trim(),
          contactPerson: values.contactPerson?.trim(),
          phone: values.phone?.trim(),
          email: values.email?.trim(),
          plan: values.plan,
          dueDate: values.dueDate?.trim(),
          status: values.status,
          notes: values.notes?.trim(),
        }
        await dealerService.updateDealer(dealer.id, payload)
        message.success('Cập nhật thông tin đại lý thành công!')
      } else {
        const payload: CreateDealerRequest = {
          code: values.code?.trim().toUpperCase() || '',
          name: values.name.trim(),
          region: values.region?.trim(),
          address: values.address?.trim(),
          contactPerson: values.contactPerson?.trim(),
          phone: values.phone?.trim(),
          email: values.email?.trim(),
          plan: values.plan,
          dueDate: values.dueDate?.trim(),
          status: values.status,
          notes: values.notes?.trim(),
        }
        await dealerService.createDealer(payload)
        message.success('Thêm mới đại lý thành công!')
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = extractErrorMessage(err)
      setServerError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={isEdit ? `Chỉnh sửa đại lý: ${dealer?.name}` : 'Thêm mới Đại lý & Chi nhánh'}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={680}
    >
      {serverError && (
        <Alert
          message={serverError}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setServerError(null)}
        />
      )}

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        <Row gutter={16}>
          <Col span={10}>
            <Form.Item
              label="Mã đại lý (Tự động)"
              help={errors.code?.message}
              validateStatus={errors.code ? 'error' : ''}
              extra={
                <span style={{ fontSize: 11, color: '#8A8983' }}>
                  Auto: ddMMyyyy + 6 ký tự ngẫu nhiên
                </span>
              }
            >
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Controller
                  name="code"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      disabled
                      placeholder="ddMMyyyyXXXXXX"
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontWeight: 600,
                        color: '#5B2BB0',
                        backgroundColor: '#F7F6F3',
                      }}
                    />
                  )}
                />
                {!isEdit && (
                  <Tooltip title="Tạo lại mã khác">
                    <Button
                      icon={<ReloadOutlined spin={generatingCode} />}
                      onClick={refreshGeneratedCode}
                      disabled={generatingCode}
                      style={{ flexShrink: 0 }}
                    />
                  </Tooltip>
                )}
              </div>
            </Form.Item>
          </Col>
          <Col span={14}>
            <Form.Item
              label="Tên đại lý / Chi nhánh"
              required
              help={errors.name?.message}
              validateStatus={errors.name ? 'error' : ''}
            >
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="VD: Decal Ô Tô Sài Gòn"
                    maxLength={255}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Khu vực / Tỉnh thành"
              help={errors.region?.message}
              validateStatus={errors.region ? 'error' : ''}
            >
              <Controller
                name="region"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={REGION_OPTIONS}
                    placeholder="Chọn khu vực"
                    showSearch
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item
              label="Địa chỉ chi tiết"
              help={errors.address?.message}
              validateStatus={errors.address ? 'error' : ''}
            >
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="VD: 124 Cộng Hoà, P.12, Q.Tân Bình"
                    maxLength={255}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Người đại diện / Quản lý"
              help={errors.contactPerson?.message}
              validateStatus={errors.contactPerson ? 'error' : ''}
            >
              <Controller
                name="contactPerson"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="VD: Nguyễn Văn Thắng"
                    maxLength={100}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Số điện thoại"
              help={errors.phone?.message}
              validateStatus={errors.phone ? 'error' : ''}
            >
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="VD: 0903123456"
                    maxLength={50}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Email"
              help={errors.email?.message}
              validateStatus={errors.email ? 'error' : ''}
            >
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="VD: contact@decaloto.vn"
                    maxLength={100}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Gói dịch vụ"
              help={errors.plan?.message}
              validateStatus={errors.plan ? 'error' : ''}
            >
              <Controller
                name="plan"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={PLAN_OPTIONS}
                    placeholder="Chọn gói cước"
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Hạn dùng"
              help={errors.dueDate?.message}
              validateStatus={errors.dueDate ? 'error' : ''}
            >
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => {
                  const val = field.value
                  let dateObj: Dayjs | null = null
                  if (val && val !== '—') {
                    const parsed = dayjs(val, ['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/YYYY', 'D/M/YYYY'])
                    if (parsed.isValid()) {
                      dateObj = parsed
                    }
                  }
                  return (
                    <DatePicker
                      value={dateObj}
                      onChange={d => field.onChange(d ? d.format('DD/MM/YYYY') : '')}
                      format="DD/MM/YYYY"
                      placeholder="Chọn ngày hết hạn"
                      style={{ width: '100%' }}
                      allowClear
                    />
                  )
                }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Trạng thái"
              help={errors.status?.message}
              validateStatus={errors.status ? 'error' : ''}
            >
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={STATUS_OPTIONS}
                    placeholder="Chọn trạng thái"
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Ghi chú nội bộ"
          help={errors.notes?.message}
          validateStatus={errors.notes ? 'error' : ''}
        >
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                rows={3}
                placeholder="Ghi chú thêm về đại lý, hợp đồng, thiết bị máy cắt..."
              />
            )}
          />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <Button onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={submitting} style={{ background: '#6C3BD6', borderColor: '#6C3BD6' }}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo đại lý'}
          </Button>
        </div>
      </Form>
    </Modal>
  )
}
