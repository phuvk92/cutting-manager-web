import React, { useEffect, useState, useCallback } from 'react'
import {
  Modal,
  Input,
  Select,
  InputNumber,
  Alert,
  Button,
  message,
  Row,
  Col,
} from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  VehicleConfiguration,
  CarBrand,
  CarModel,
  CreateVehicleConfigurationPayload,
  UpdateVehicleConfigurationPayload,
} from '@/types/vehicleConfiguration'
import { vehicleConfigurationService } from '@/services/vehicle/vehicleConfigurationService'
import { PRODUCT_GROUPS } from '@/constants/vehicle'
import { extractErrorMessage } from '@/utils/error'

const currentYear = new Date().getFullYear()

const vehicleConfigurationSchema = z
  .object({
    productGroup: z.enum(['PPF_EXTERIOR', 'PPF_INTERIOR', 'WINDOW_FILM']),
    brandId: z.number({ message: 'Vui lòng chọn Hãng xe' }),
    modelId: z.number({ message: 'Vui lòng chọn Dòng xe' }),
    yearFrom: z
      .number({ message: 'Vui lòng nhập năm sản xuất từ' })
      .int()
      .min(1980, 'Năm sản xuất từ không nhỏ hơn 1980')
      .max(currentYear + 10, `Năm không vượt quá ${currentYear + 10}`),
    yearTo: z
      .number({ message: 'Vui lòng nhập năm sản xuất đến' })
      .int()
      .min(1980, 'Năm sản xuất đến không nhỏ hơn 1980')
      .max(currentYear + 10, `Năm không vượt quá ${currentYear + 10}`),
    generationCode: z
      .string()
      .min(1, 'Mã khung / Mã đời là bắt buộc')
      .max(100, 'Tối đa 100 ký tự'),
    status: z.string(),
  })
  .refine(data => data.yearFrom <= data.yearTo, {
    message: 'Năm sản xuất từ không được lớn hơn năm sản xuất đến',
    path: ['yearTo'],
  })

type FormValues = z.infer<typeof vehicleConfigurationSchema>

interface VehicleConfigurationModalProps {
  open: boolean
  configuration?: VehicleConfiguration | null
  onClose: () => void
  onSuccess: () => void
}

export const VehicleConfigurationModal: React.FC<VehicleConfigurationModalProps> = ({
  open,
  configuration,
  onClose,
  onSuccess,
}) => {
  const isEdit = !!configuration
  const [brands, setBrands] = useState<CarBrand[]>([])
  const [models, setModels] = useState<CarModel[]>([])
  const [loadingBrands, setLoadingBrands] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(vehicleConfigurationSchema),
    defaultValues: {
      productGroup: 'PPF_EXTERIOR',
      brandId: undefined as unknown as number,
      modelId: undefined as unknown as number,
      yearFrom: currentYear - 2,
      yearTo: currentYear + 1,
      generationCode: '',
      status: 'ACTIVE',
    },
  })

  const selectedBrandId = watch('brandId')

  // Load brands on modal open
  useEffect(() => {
    if (open) {
      setLoadingBrands(true)
      vehicleConfigurationService
        .getBrands('ACTIVE')
        .then(data => setBrands(data))
        .catch(err => message.error(`Không thể tải hãng xe: ${extractErrorMessage(err)}`))
        .finally(() => setLoadingBrands(false))
    }
  }, [open])

  // Load models whenever brandId changes
  const fetchModelsForBrand = useCallback(async (brandId: number, preserveModelId?: number) => {
    if (!brandId) {
      setModels([])
      return
    }
    setLoadingModels(true)
    try {
      const data = await vehicleConfigurationService.getModels(brandId, 'ACTIVE')
      setModels(data)
      if (!preserveModelId) {
        setValue('modelId', undefined as unknown as number)
      }
    } catch (err) {
      message.error(`Không thể tải dòng xe: ${extractErrorMessage(err)}`)
      setModels([])
    } finally {
      setLoadingModels(false)
    }
  }, [setValue])

  useEffect(() => {
    if (open && selectedBrandId) {
      // If editing and same brand, preserve model
      const isInitialEditLoad = configuration && configuration.brand.id === selectedBrandId
      fetchModelsForBrand(selectedBrandId, isInitialEditLoad ? configuration.model.id : undefined)
    } else {
      setModels([])
    }
  }, [selectedBrandId, open, configuration, fetchModelsForBrand])

  // Populate form on edit / open
  useEffect(() => {
    if (open) {
      setServerError(null)
      if (configuration) {
        reset({
          productGroup: configuration.productGroup,
          brandId: configuration.brand.id,
          modelId: configuration.model.id,
          yearFrom: configuration.yearFrom,
          yearTo: configuration.yearTo,
          generationCode: configuration.generationCode,
          status: configuration.status || 'ACTIVE',
        })
      } else {
        reset({
          productGroup: 'PPF_EXTERIOR',
          brandId: undefined as unknown as number,
          modelId: undefined as unknown as number,
          yearFrom: currentYear - 2,
          yearTo: currentYear + 1,
          generationCode: '',
          status: 'ACTIVE',
        })
      }
    }
  }, [open, configuration, reset])

  const onSubmit = async (data: FormValues) => {
    setServerError(null)
    try {
      const selectedProduct = PRODUCT_GROUPS.find(g => g.value === data.productGroup)
      const payload: CreateVehicleConfigurationPayload | UpdateVehicleConfigurationPayload = {
        categoryId: selectedProduct?.categoryId,
        productGroup: data.productGroup,
        brandId: data.brandId,
        modelId: data.modelId,
        yearFrom: data.yearFrom,
        yearTo: data.yearTo,
        generationCode: data.generationCode.trim().toUpperCase(),
        status: data.status,
      }

      if (isEdit && configuration) {
        await vehicleConfigurationService.updateConfiguration(configuration.id, payload)
        message.success('Cập nhật cấu hình xe thành công')
      } else {
        await vehicleConfigurationService.createConfiguration(payload)
        message.success('Tạo mới cấu hình xe thành công')
      }
      onSuccess()
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err)
      setServerError(errorMsg)
    }
  }

  return (
    <Modal
      open={open}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#1B1B19' }}>
            {isEdit ? 'Chỉnh sửa cấu hình xe' : 'Thêm mới cấu hình xe'}
          </span>
        </div>
      }
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={640}
      styles={{
        header: { borderBottom: '1px solid #E4E3DE', paddingBottom: 12 },
        body: { paddingTop: 20 },
      }}
    >
      {serverError && (
        <Alert
          type="error"
          message="Không thể lưu cấu hình"
          description={serverError}
          showIcon
          closable
          style={{ marginBottom: 18 }}
          onClose={() => setServerError(null)}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Nhóm sản phẩm */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
            <span style={{ color: '#E11D48', marginRight: 4 }}>*</span>
            Nhóm sản phẩm
          </label>
          <Controller
            name="productGroup"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                size="large"
                style={{ width: '100%' }}
                options={PRODUCT_GROUPS.map(g => ({
                  value: g.value,
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: g.color,
                        }}
                      />
                      <span style={{ fontWeight: 500 }}>{g.label}</span>
                    </div>
                  ),
                }))}
              />
            )}
          />
          {errors.productGroup && (
            <span style={{ color: '#E11D48', fontSize: 12, marginTop: 4, display: 'block' }}>
              {errors.productGroup.message}
            </span>
          )}
        </div>

        {/* Hãng xe & Dòng xe */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              <span style={{ color: '#E11D48', marginRight: 4 }}>*</span>
              Hãng xe (Car Brand)
            </label>
            <Controller
              name="brandId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  size="large"
                  placeholder="Chọn hãng xe"
                  loading={loadingBrands}
                  showSearch
                  optionFilterProp="label"
                  style={{ width: '100%' }}
                  onChange={val => {
                    field.onChange(val)
                    // Reset model when brand changes
                    setValue('modelId', undefined as unknown as number)
                  }}
                  options={brands.map(b => ({
                    value: b.id,
                    label: `${b.name} (${b.code})`,
                  }))}
                />
              )}
            />
            {errors.brandId && (
              <span style={{ color: '#E11D48', fontSize: 12, marginTop: 4, display: 'block' }}>
                {errors.brandId.message}
              </span>
            )}
          </Col>

          <Col span={12}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              <span style={{ color: '#E11D48', marginRight: 4 }}>*</span>
              Dòng xe (Car Model)
            </label>
            <Controller
              name="modelId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  size="large"
                  placeholder={selectedBrandId ? 'Chọn dòng xe' : 'Hãy chọn hãng xe trước'}
                  disabled={!selectedBrandId || loadingModels}
                  loading={loadingModels}
                  showSearch
                  optionFilterProp="label"
                  style={{ width: '100%' }}
                  options={models.map(m => ({
                    value: m.id,
                    label: `${m.name} (${m.code})`,
                  }))}
                />
              )}
            />
            {errors.modelId && (
              <span style={{ color: '#E11D48', fontSize: 12, marginTop: 4, display: 'block' }}>
                {errors.modelId.message}
              </span>
            )}
          </Col>
        </Row>

        {/* Năm sản xuất từ -> đến */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              <span style={{ color: '#E11D48', marginRight: 4 }}>*</span>
              Năm sản xuất từ
            </label>
            <Controller
              name="yearFrom"
              control={control}
              render={({ field }) => (
                <InputNumber
                  {...field}
                  size="large"
                  placeholder="Ví dụ: 2019"
                  style={{ width: '100%' }}
                  min={1980}
                  max={currentYear + 10}
                />
              )}
            />
            {errors.yearFrom && (
              <span style={{ color: '#E11D48', fontSize: 12, marginTop: 4, display: 'block' }}>
                {errors.yearFrom.message}
              </span>
            )}
          </Col>

          <Col span={12}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              <span style={{ color: '#E11D48', marginRight: 4 }}>*</span>
              Năm sản xuất đến
            </label>
            <Controller
              name="yearTo"
              control={control}
              render={({ field }) => (
                <InputNumber
                  {...field}
                  size="large"
                  placeholder="Ví dụ: 2023"
                  style={{ width: '100%' }}
                  min={1980}
                  max={currentYear + 10}
                />
              )}
            />
            {errors.yearTo && (
              <span style={{ color: '#E11D48', fontSize: 12, marginTop: 4, display: 'block' }}>
                {errors.yearTo.message}
              </span>
            )}
          </Col>
        </Row>

        {/* Mã khung / Mã đời */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
            <span style={{ color: '#E11D48', marginRight: 4 }}>*</span>
            Mã khung / Mã đời (Generation Code)
          </label>
          <Controller
            name="generationCode"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                size="large"
                placeholder="Ví dụ: XV70, G05, VF8-GEN1, W206..."
                style={{ textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}
                onChange={e => field.onChange(e.target.value.toUpperCase())}
              />
            )}
          />
          <span style={{ fontSize: 12, color: '#73726C', marginTop: 4, display: 'block' }}>
            Mã định danh thế hệ hoặc chassis code của dòng xe.
          </span>
          {errors.generationCode && (
            <span style={{ color: '#E11D48', fontSize: 12, marginTop: 4, display: 'block' }}>
              {errors.generationCode.message}
            </span>
          )}
        </div>

        {/* Trạng thái */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
            Trạng thái hoạt động
          </label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                size="large"
                style={{ width: '100%' }}
                options={[
                  { value: 'ACTIVE', label: '🟢 Hoạt động (ACTIVE)' },
                  { value: 'INACTIVE', label: '⚪ Tạm ngưng (INACTIVE)' },
                ]}
              />
            )}
          />
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            borderTop: '1px solid #E4E3DE',
            paddingTop: 16,
          }}
        >
          <Button onClick={onClose} size="large">
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
            size="large"
            style={{
              background: '#7C3AED',
              borderColor: '#7C3AED',
              fontWeight: 500,
            }}
          >
            {isEdit ? 'Lưu thay đổi' : 'Tạo cấu hình'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
