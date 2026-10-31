import { REGION_OPTIONS } from '@/constants/provinces'
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Alert,
  Button,
  message,
  Row,
  Col,
  Tooltip,
  DatePicker,
  Card,
  Space,
  Tag,
} from 'antd'
import {
  ReloadOutlined,
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { Dealer, CreateDealerRequest, UpdateDealerRequest } from '@/types/dealer'
import { dealerService, generateDealerCodeLocal } from '@/services/dealers/dealerService'
import { extractApiError } from '@/utils/error'
import { disablePastDates, disableDatesBefore, isNotPastDate, isDateRangeValid } from '@/utils/dateRules'
import { trimOptionalPassword, PASSWORD_REGEX } from '@/utils/passwordRules'
import { createUsernameZodSchema } from '@/utils/usernameRules'

dayjs.extend(customParseFormat)


const getDealerFormSchema = (
  t: (key: string, options?: any) => string,
  initialStartDate?: string | null,
  initialExpiryDate?: string | null,
  isEdit?: boolean
) =>
  z
    .object({
      code: z.string().max(50).optional(),
      name: z.string().min(1, t('modal.validationNameRequired', { defaultValue: 'Tên đại lý không được để trống' })).max(255),
      region: z.string().max(100).optional(),
      address: z.string().max(255).optional(),
      contactPerson: z.string().max(100).optional(),
      phone: z.string().max(50).optional(),
      email: z.string().max(100).optional(),
      status: z.string().min(1, t('modal.validationStatusRequired', { defaultValue: 'Trạng thái đại lý không được để trống' })),
      notes: z.string().optional(),

      // Thông tin tài khoản AGENT
      agentUsername: createUsernameZodSchema(t, Boolean(isEdit)),
      agentEmail: z.string().email().max(255).optional().or(z.literal('')),
      agentPassword: z.string().transform(trimOptionalPassword).optional(),
      agentFullName: z.string().max(255).optional().or(z.literal('')),
      agentPhone: z.string().max(50).optional().or(z.literal('')),

      // Gói account đại lý
      maxAccounts: z.number().int().min(1, t('modal.validationMinAccounts', { defaultValue: 'Số tài khoản tối đa phải lớn hơn 0' })),
      totalAllocatedDays: z.number().int().min(1, t('modal.validationMinDays', { defaultValue: 'Tổng quỹ ngày phải lớn hơn 0' })),
      packageStartDate: z
        .string()
        .optional()
        .nullable()
        .refine(
          (val) => isNotPastDate(val, initialStartDate),
          {
            message: t('modal.validationPastDateNotAllowed', { defaultValue: 'Không được chọn ngày trong quá khứ.' }),
          }
        ),
      packageExpiryDate: z
        .string()
        .optional()
        .nullable()
        .refine(
          (val) => isNotPastDate(val, initialExpiryDate),
          {
            message: t('modal.validationPastDateNotAllowed', { defaultValue: 'Không được chọn ngày trong quá khứ.' }),
          }
        ),
      packageStatus: z.string().min(1, t('modal.validationPackageStatusRequired', { defaultValue: 'Trạng thái gói không được để trống' })),
    })
    .refine(
      (data) => isDateRangeValid(data.packageStartDate, data.packageExpiryDate),
      {
        message: t('modal.validationExpiryBeforeStart', { defaultValue: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.' }),
        path: ['packageExpiryDate'],
      }
    )

const defaultDealerFormSchema = getDealerFormSchema((_k, opts) => opts?.defaultValue || '')
type DealerFormValues = z.infer<typeof defaultDealerFormSchema>

interface DealerModalProps {
  open: boolean
  dealer?: Dealer | null
  onClose: () => void
  onSuccess: () => void
}

export const DealerModal: React.FC<DealerModalProps> = ({
  open,
  dealer,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation(['dealers', 'common'])
  const isEdit = Boolean(dealer)
  const [submitting, setSubmitting] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const statusOptions = useMemo(() => [
    { value: 'ACTIVE', label: t('modal.statusActive') },
    { value: 'EXPIRING', label: t('modal.statusExpiring') },
    { value: 'LOCKED', label: t('modal.statusLocked') },
  ], [t])

  const packageStatusOptions = useMemo(() => [
    { value: 'ACTIVE', label: t('modal.packageActive') },
    { value: 'EXPIRED', label: t('modal.packageExpired') },
    { value: 'SUSPENDED', label: t('modal.packageSuspended') },
  ], [t])

  const schema = useMemo(() => {
    return getDealerFormSchema(t, dealer?.packageStartDate, dealer?.packageExpiryDate, isEdit)
  }, [t, dealer?.packageStartDate, dealer?.packageExpiryDate, isEdit])

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<DealerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: '',
      name: '',
      region: 'TP.HCM',
      address: '',
      contactPerson: '',
      phone: '',
      email: '',
      status: 'ACTIVE',
      notes: '',
      agentUsername: '',
      agentEmail: '',
      agentPassword: '',
      agentFullName: '',
      agentPhone: '',
      maxAccounts: 10,
      totalAllocatedDays: 3600,
      packageStartDate: dayjs().format('YYYY-MM-DD'),
      packageExpiryDate: dayjs().add(1, 'year').format('YYYY-MM-DD'),
      packageStatus: 'ACTIVE',
    },
  })

  const watchedDealerName = watch('name')
  const watchedDealerEmail = watch('email')
  const watchedContactPerson = watch('contactPerson')
  const watchedDealerPhone = watch('phone')
  const watchedMaxAccounts = watch('maxAccounts')
  const watchedTotalDays = watch('totalAllocatedDays')
  const watchedStartDate = watch('packageStartDate')

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
          status: dealer.status || 'ACTIVE',
          notes: dealer.notes || '',
          agentUsername: dealer.agentUsername || '',
          agentEmail: dealer.agentEmail || dealer.email || '',
          agentPassword: '',
          agentFullName: dealer.agentFullName || dealer.contactPerson || '',
          agentPhone: dealer.agentPhone || dealer.phone || '',
          maxAccounts: dealer.maxAccounts ?? 10,
          totalAllocatedDays: dealer.totalAllocatedDays ?? 3600,
          packageStartDate: dealer.packageStartDate || null,
          packageExpiryDate: dealer.packageExpiryDate || null,
          packageStatus: dealer.packageStatus || 'ACTIVE',
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
          status: 'ACTIVE',
          notes: '',
          agentUsername: '',
          agentEmail: '',
          agentPassword: '',
          agentFullName: '',
          agentPhone: '',
          maxAccounts: 10,
          totalAllocatedDays: 3600,
          packageStartDate: dayjs().format('YYYY-MM-DD'),
          packageExpiryDate: dayjs().add(1, 'year').format('YYYY-MM-DD'),
          packageStatus: 'ACTIVE',
        })
        refreshGeneratedCode()
      }
    }
  }, [open, dealer, reset, refreshGeneratedCode])

  const copyDealerInfoToAgent = () => {
    if (watchedDealerEmail) setValue('agentEmail', watchedDealerEmail, { shouldValidate: true })
    if (watchedContactPerson || watchedDealerName) {
      setValue('agentFullName', watchedContactPerson || watchedDealerName, { shouldValidate: true })
    }
    if (watchedDealerPhone) setValue('agentPhone', watchedDealerPhone, { shouldValidate: true })
  }

  const applyPackageTemplate = (accounts: number, days: number, years: number = 1) => {
    setValue('maxAccounts', accounts, { shouldValidate: true })
    setValue('totalAllocatedDays', days, { shouldValidate: true })
    setValue('packageStartDate', dayjs().format('YYYY-MM-DD'), { shouldValidate: true })
    setValue('packageExpiryDate', dayjs().add(years, 'year').format('YYYY-MM-DD'), { shouldValidate: true })
  }

  const accountsBelowUsage = isEdit && dealer && (watchedMaxAccounts ?? 0) < (dealer.createdAccounts ?? dealer.usersCount ?? 0)
  const daysBelowUsage = isEdit && dealer && (watchedTotalDays ?? 0) < (dealer.usedAllocatedDays ?? 0)

  const onSubmit = async (values: DealerFormValues) => {
    if (accountsBelowUsage) {
      message.error(t('modal.warningAccountBelow', { max: values.maxAccounts, used: dealer?.createdAccounts ?? dealer?.usersCount ?? 0 }))
      return
    }
    if (daysBelowUsage) {
      message.error(t('modal.warningDaysBelow', { total: values.totalAllocatedDays.toLocaleString(), used: (dealer?.usedAllocatedDays ?? 0).toLocaleString() }))
      return
    }

    const agentPass = trimOptionalPassword(values.agentPassword)
    if (!isEdit) {
      const effEmail = values.agentEmail?.trim() || values.email?.trim()
      if (!effEmail) {
        setServerError(t('modal.emailRequired'))
        return
      }
      if (!agentPass) {
        setServerError(t('modal.passwordRequiredNew'))
        return
      }
      if (!PASSWORD_REGEX.test(agentPass)) {
        setServerError(t('modal.passwordComplexity'))
        return
      }
    } else {
      if (agentPass && !PASSWORD_REGEX.test(agentPass)) {
        setServerError(t('modal.passwordComplexityEdit'))
        return
      }
    }

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
          status: values.status,
          notes: values.notes?.trim(),
          agentUsername: values.agentUsername?.trim() || undefined,
          agentEmail: values.agentEmail?.trim() || undefined,
          agentPassword: agentPass,
          agentFullName: values.agentFullName?.trim() || undefined,
          agentPhone: values.agentPhone?.trim() || undefined,
          maxAccounts: values.maxAccounts,
          totalAllocatedDays: values.totalAllocatedDays,
          packageStartDate: values.packageStartDate || null,
          packageExpiryDate: values.packageExpiryDate || null,
          packageStatus: values.packageStatus,
        }
        await dealerService.updateDealer(dealer.id, payload)
        message.success(t('modal.updateSuccess'))
      } else {
        const payload: CreateDealerRequest = {
          code: values.code?.trim().toUpperCase() || '',
          name: values.name.trim(),
          region: values.region?.trim(),
          address: values.address?.trim(),
          contactPerson: values.contactPerson?.trim(),
          phone: values.phone?.trim(),
          email: values.email?.trim(),
          status: values.status,
          notes: values.notes?.trim(),
          agentUsername: values.agentUsername?.trim() || undefined,
          agentEmail: values.agentEmail?.trim() || values.email?.trim(),
          agentPassword: agentPass,
          agentFullName: values.agentFullName?.trim() || values.contactPerson?.trim() || values.name.trim(),
          agentPhone: values.agentPhone?.trim() || values.phone?.trim(),
          maxAccounts: values.maxAccounts,
          totalAllocatedDays: values.totalAllocatedDays,
          packageStartDate: values.packageStartDate || null,
          packageExpiryDate: values.packageExpiryDate || null,
          packageStatus: values.packageStatus,
        }
        await dealerService.createDealer(payload)
        message.success(t('modal.createSuccess'))
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const apiError = extractApiError(err, isEdit ? t('modal.updateFailed') : t('modal.createFailed'))
      const msg = apiError.message
      setServerError(msg)
      if (apiError.field) {
        let formField: keyof DealerFormValues | undefined
        if (apiError.field === 'username' || apiError.field === 'agentUsername') {
          formField = 'agentUsername'
        } else if (apiError.field === 'email' || apiError.field === 'agentEmail') {
          formField = 'agentEmail'
        } else if (apiError.field === 'password' || apiError.field === 'agentPassword') {
          formField = 'agentPassword'
        } else if (apiError.field === 'code') {
          formField = 'code'
        } else if (apiError.field === 'name') {
          formField = 'name'
        }
        if (formField) {
          setError(formField, { type: 'server', message: msg })
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              {isEdit ? t('modal.editTitle') + ': ' + (dealer?.name || '') : t('modal.addTitle')}
            </span>
            {isEdit && dealer && (
              <Tag color={dealer.status === 'ACTIVE' ? 'green' : dealer.status === 'LOCKED' ? 'red' : 'gold'}>
                {dealer.status}
              </Tag>
            )}
          </div>
          <span style={{ fontSize: 12, color: '#8A8983', fontWeight: 400 }}>
            {t('labels.requiredLegend', { ns: 'common', defaultValue: '* Trường bắt buộc' })}
          </span>
        </div>
      }
      onCancel={onClose}
      footer={null}
      width={760}
      destroyOnClose
    >
      {serverError && (
        <Alert
          type="error"
          message={t('modal.cantSaveTitle')}
          description={serverError}
          showIcon
          closable
          onClose={() => setServerError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        {/* THÔNG TIN ĐẠI LÝ */}
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#35342F' }}>
            {t('modal.sectionBasic')}
          </span>
        </div>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={t('modal.code')}
              help={errors.code?.message}
              validateStatus={errors.code ? 'error' : ''}
              extra={
                <span style={{ fontSize: 11, color: '#8A8983' }}>
                  {isEdit ? t('modal.codeUniqueExtra') : t('modal.codeAutoExtra')}
                </span>
              }
            >
              <div style={{ display: 'flex', gap: 6 }}>
                <Controller
                  name="code"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder={t('modal.codePlaceholder')}
                      maxLength={50}
                      style={{ textTransform: 'uppercase' }}
                    />
                  )}
                />
                {!isEdit && (
                  <Tooltip title={t('modal.generateCodeTooltip')}>
                    <Button
                      icon={<ReloadOutlined spin={generatingCode} />}
                      onClick={refreshGeneratedCode}
                      disabled={generatingCode}
                    />
                  </Tooltip>
                )}
              </div>
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item
              label={t('modal.name')}
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
                    placeholder={t('modal.namePlaceholder')}
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
              label={t('modal.province')}
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
                    placeholder={t('modal.provincePlaceholder')}
                    showSearch
                    allowClear
                    filterOption={(input, option) => {
                      const label = (option?.label ?? '')
                        .toString()
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[̀-ͯ]/g, '')
                      const query = input
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[̀-ͯ]/g, '')
                      return label.includes(query)
                    }}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item
              label={t('modal.address')}
              help={errors.address?.message}
              validateStatus={errors.address ? 'error' : ''}
            >
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder={t('modal.addressPlaceholder')}
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
              label={t('modal.contact')}
              help={errors.contactPerson?.message}
              validateStatus={errors.contactPerson ? 'error' : ''}
            >
              <Controller
                name="contactPerson"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder={t('modal.contactPlaceholder')}
                    maxLength={100}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={t('modal.phone')}
              help={errors.phone?.message}
              validateStatus={errors.phone ? 'error' : ''}
            >
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder={t('modal.phonePlaceholder')}
                    maxLength={50}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={t('modal.email')}
              help={errors.email?.message}
              validateStatus={errors.email ? 'error' : ''}
            >
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder={t('modal.emailPlaceholder')}
                    maxLength={100}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* TÀI KHOẢN ĐĂNG NHẬP ĐẠI LÝ (ROLE AGENT) */}
        <Card
          size="small"
          style={{
            marginBottom: 20,
            borderRadius: 8,
            borderColor: '#C7D2FE',
            background: '#F5F7FF',
          }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#1E40AF', fontWeight: 600 }}>
                {t('modal.sectionAgent')}
              </span>
              {!isEdit && (
                <Button size="small" onClick={copyDealerInfoToAgent} style={{ fontSize: 11 }}>
                  {t('modal.copyFromDealer')}
                </Button>
              )}
            </div>
          }
        >
          {isEdit && dealer?.agentUsername ? (
            <div style={{ marginBottom: 14 }}>
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                message={
                  <span>
                    {t('modal.agentLinkedNotice')}{' '}
                    <Tag color="purple" style={{ fontSize: 12 }}>{dealer.agentUsername}</Tag>
                    {dealer.agentEmail && <span style={{ color: '#6E6D68' }}>({dealer.agentEmail})</span>}
                  </span>
                }
                description={t('modal.agentLinkedRule')}
              />
            </div>
          ) : (
            <div style={{ marginBottom: 12 }}>
              <Alert
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
                message={t('modal.agentAutoCreateTitle')}
                description={t('modal.agentAutoCreateDesc')}
              />
            </div>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('modal.accountEmail')}
                required={!isEdit}
                help={errors.agentEmail?.message}
                validateStatus={errors.agentEmail ? 'error' : ''}
                extra={<span style={{ fontSize: 11, color: '#8A8983' }}>{t('modal.agentEmailExtra')}</span>}
              >
                <Controller
                  name="agentEmail"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      prefix={<MailOutlined style={{ color: '#8A8983' }} />}
                      placeholder={t('modal.accountEmailPlaceholder')}
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('modal.username')}
                required={!isEdit}
                help={errors.agentUsername?.message}
                validateStatus={errors.agentUsername ? 'error' : ''}
                extra={<span style={{ fontSize: 11, color: '#8A8983' }}>{isEdit ? t('modal.agentUsernameExtraEdit') : t('modal.agentUsernameExtraNew')}</span>}
              >
                <Controller
                  name="agentUsername"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      prefix={<UserOutlined style={{ color: '#8A8983' }} />}
                      placeholder={t('modal.usernamePlaceholder')}
                      disabled={isEdit && Boolean(dealer?.agentUsername)}
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={isEdit ? t('modal.changePassword') : t('modal.initialPassword')}
                required={!isEdit}
                help={errors.agentPassword?.message}
                validateStatus={errors.agentPassword ? 'error' : ''}
                extra={
                  <span style={{ fontSize: 11, color: '#8A8983' }}>
                    {isEdit ? t('modal.agentPasswordExtraEdit') : t('modal.agentPasswordExtraNew')}
                  </span>
                }
              >
                <Controller
                  name="agentPassword"
                  control={control}
                  render={({ field }) => (
                    <Input.Password
                      {...field}
                      prefix={<LockOutlined style={{ color: '#8A8983' }} />}
                      placeholder={isEdit ? t('modal.changePasswordPlaceholder') : t('modal.initialPasswordPlaceholder')}
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('modal.accountContact')}
                help={errors.agentFullName?.message}
                validateStatus={errors.agentFullName ? 'error' : ''}
              >
                <Controller
                  name="agentFullName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder={t('modal.accountContactPlaceholder')}
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('modal.accountPhone')}
                help={errors.agentPhone?.message}
                validateStatus={errors.agentPhone ? 'error' : ''}
              >
                <Controller
                  name="agentPhone"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      prefix={<PhoneOutlined style={{ color: '#8A8983' }} />}
                      placeholder={t('modal.accountPhonePlaceholder')}
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* CẤU HÌNH GÓI ACCOUNT ĐẠI LÝ */}
        <Card
          size="small"
          style={{
            marginBottom: 20,
            borderRadius: 8,
            borderColor: '#DDD2FA',
            background: '#FAF8FF',
          }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#4A2A94', fontWeight: 600 }}>
                {t('modal.sectionPackage')}
              </span>
              <span style={{ fontSize: 11, color: '#6E6D68', fontWeight: 400 }}>
                {t('modal.conventionMini')}
              </span>
            </div>
          }
        >
          {/* Quick presets */}
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: '#6E6D68', marginRight: 8 }}>{t('modal.quickPresets')}</span>
            <Space size={6} wrap>
              <Button
                size="small"
                onClick={() => applyPackageTemplate(10, 3600, 1)}
                style={{ fontSize: 11 }}
              >
                {t('modal.packagePreset2')}
              </Button>
              <Button
                size="small"
                onClick={() => applyPackageTemplate(5, 1800, 1)}
                style={{ fontSize: 11 }}
              >
                {t('modal.packagePreset1')}
              </Button>
              <Button
                size="small"
                onClick={() => applyPackageTemplate(20, 7200, 1)}
                style={{ fontSize: 11 }}
              >
                {t('modal.packagePreset4')}
              </Button>
              <Button
                size="small"
                onClick={() => applyPackageTemplate(10, 7200, 2)}
                style={{ fontSize: 11 }}
              >
                {t('modal.packagePreset3')}
              </Button>
            </Space>
          </div>

          {/* Current usage banner in edit mode */}
          {isEdit && dealer && (
            <div
              style={{
                marginBottom: 14,
                padding: '8px 12px',
                background: '#FFFFFF',
                border: '1px solid #E9E6F5',
                borderRadius: 6,
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
              }}
            >
              <span>
                {t('modal.createdCutters', { used: dealer.createdAccounts ?? dealer.usersCount ?? 0, max: dealer.maxAccounts ?? 10 })}
              </span>
              <span>
                {t('modal.allocatedDays', { used: (dealer.usedAllocatedDays ?? 0).toLocaleString(), total: (dealer.totalAllocatedDays ?? 3600).toLocaleString() })}
              </span>
              <span style={{ color: '#16A34A', fontWeight: 500 }}>
                {t('modal.remainingPool', { days: (dealer.remainingAllocatedDays ?? Math.max(0, (dealer.totalAllocatedDays ?? 3600) - (dealer.usedAllocatedDays ?? 0))).toLocaleString() })}
              </span>
            </div>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('modal.maxCutters')}
                required
                help={errors.maxAccounts?.message}
                validateStatus={errors.maxAccounts ? 'error' : ''}
                extra={<span style={{ fontSize: 11, color: '#8A8983' }}>{t('modal.accountsExtra')}</span>}
              >
                <Controller
                  name="maxAccounts"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      min={1}
                      max={1000}
                      precision={0}
                      style={{ width: '100%' }}
                      addonAfter="account"
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('modal.totalDays')}
                required
                help={errors.totalAllocatedDays?.message}
                validateStatus={errors.totalAllocatedDays ? 'error' : ''}
                extra={<span style={{ fontSize: 11, color: '#8A8983' }}>{t('modal.daysExtra')}</span>}
              >
                <Controller
                  name="totalAllocatedDays"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      min={1}
                      max={1000000}
                      precision={0}
                      style={{ width: '100%' }}
                      addonAfter="ngày"
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label={t('modal.startDate')}
                help={errors.packageStartDate?.message}
                validateStatus={errors.packageStartDate ? 'error' : ''}
              >
                <Controller
                  name="packageStartDate"
                  control={control}
                  render={({ field }) => {
                    const dateObj = field.value ? dayjs(field.value, 'YYYY-MM-DD') : null
                    return (
                      <DatePicker
                        value={dateObj && dateObj.isValid() ? dateObj : null}
                        onChange={d => field.onChange(d ? d.format('YYYY-MM-DD') : null)}
                        format="DD/MM/YYYY"
                        placeholder="dd/MM/yyyy"
                        style={{ width: '100%' }}
                        allowClear
                        disabledDate={disablePastDates}
                      />
                    )
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={t('modal.endDate')}
                help={errors.packageExpiryDate?.message}
                validateStatus={errors.packageExpiryDate ? 'error' : ''}
                extra={<span style={{ fontSize: 11, color: '#8A8983' }}>{t('modal.packageExpiryExtra')}</span>}
              >
                <Controller
                  name="packageExpiryDate"
                  control={control}
                  render={({ field }) => {
                    const dateObj = field.value ? dayjs(field.value, 'YYYY-MM-DD') : null
                    return (
                      <DatePicker
                        value={dateObj && dateObj.isValid() ? dateObj : null}
                        onChange={d => field.onChange(d ? d.format('YYYY-MM-DD') : null)}
                        format="DD/MM/YYYY"
                        placeholder="dd/MM/yyyy"
                        style={{ width: '100%' }}
                        allowClear
                        disabledDate={(current) => disableDatesBefore(current, watchedStartDate)}
                      />
                    )
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={t('modal.packageStatus')}
                required
                help={errors.packageStatus?.message}
                validateStatus={errors.packageStatus ? 'error' : ''}
              >
                <Controller
                  name="packageStatus"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={packageStatusOptions}
                      placeholder={t('modal.packageStatusPlaceholder')}
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* TRẠNG THÁI ĐẠI LÝ */}
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label={t('modal.dealerStatus')}
              required
              help={errors.status?.message}
              validateStatus={errors.status ? 'error' : ''}
            >
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={statusOptions}
                    placeholder={t('modal.dealerStatusPlaceholder')}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={t('modal.notes')}
          help={errors.notes?.message}
          validateStatus={errors.notes ? 'error' : ''}
        >
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                rows={2}
                placeholder={t('modal.notesPlaceholder')}
              />
            )}
          />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <Button onClick={onClose} disabled={submitting}>
            {t('modal.cancel')}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            disabled={Boolean(accountsBelowUsage || daysBelowUsage)}
            style={{ background: '#6C3BD6', borderColor: '#6C3BD6' }}
          >
            {isEdit ? t('modal.saveBtn') : t('modal.createBtn')}
          </Button>
        </div>
      </Form>
    </Modal>
  )
}
