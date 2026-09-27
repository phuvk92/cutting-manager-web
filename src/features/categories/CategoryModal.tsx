import React, { useEffect, useState, useMemo } from 'react'
import {
  Modal,
  Form,
  Input,
  InputNumber,
  TreeSelect,
  Alert,
  Tag,
  Button,
  message,
  Row,
  Col,
  Divider,
  AutoComplete,
} from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@/types/category'
import { categoryService } from '@/services/category/categoryService'
import { extractErrorMessage } from '@/utils/error'

const COMMON_YEARS = [
  '2026', '2025', '2024', '2023', '2022', '2021', '2020',
  '2019', '2018', '2017', '2016', '2015', '2010-2015', 'Trước 2010',
]

const categoryFormSchema = z.object({
  value: z
    .string()
    .min(1, 'Mã / Giá trị danh mục là bắt buộc')
    .max(100, 'Tối đa 100 ký tự'),
  label: z.string().max(255, 'Tối đa 255 ký tự').optional(),
  parentId: z.number().nullable().optional(),
  displayOrder: z.number().min(0, 'Thứ tự hiển thị phải lớn hơn hoặc bằng 0').optional(),
  brand: z.string().max(100, 'Tối đa 100 ký tự').optional(),
  model: z.string().max(100, 'Tối đa 100 ký tự').optional(),
  year: z.string().max(50, 'Tối đa 50 ký tự').optional(),
})

type CategoryFormValues = z.infer<typeof categoryFormSchema>

interface CategoryModalProps {
  open: boolean
  category?: Category | null
  defaultParentId?: number | null
  categoriesTree: Category[]
  onClose: () => void
  onSuccess: () => void
}

const LEVEL_COLOR_MAP: Record<string, string> = {
  category: 'blue',
  brand: 'purple',
  model: 'cyan',
  variant: 'green',
  year: 'orange',
  submodel: 'magenta',
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  open,
  category,
  defaultParentId,
  categoriesTree,
  onClose,
  onSuccess,
}) => {
  const isEdit = Boolean(category)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      value: '',
      label: '',
      parentId: null,
      displayOrder: 0,
      brand: '',
      model: '',
      year: '',
    },
  })

  const watchedParentId = watch('parentId')
  const watchedBrand = watch('brand')

  // Find category by ID anywhere in the tree
  const findCategoryById = (nodes: Category[], id: number): Category | null => {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children && node.children.length > 0) {
        const found = findCategoryById(node.children, id)
        if (found) return found
      }
    }
    return null
  }

  // Get ancestor chain of a node
  const getAncestorChain = (nodes: Category[], targetId: number, currentPath: Category[] = []): Category[] | null => {
    for (const node of nodes) {
      if (node.id === targetId) {
        return [...currentPath, node]
      }
      if (node.children && node.children.length > 0) {
        const res = getAncestorChain(node.children, targetId, [...currentPath, node])
        if (res) return res
      }
    }
    return null
  }

  // Collect all descendant IDs of a category to prevent circular assignment during edit
  const getDescendantIds = (node: Category): number[] => {
    const ids: number[] = [node.id]
    if (node.children) {
      for (const child of node.children) {
        ids.push(...getDescendantIds(child))
      }
    }
    return ids
  }

  const disabledIds = useMemo(() => {
    if (!category) return new Set<number>()
    return new Set(getDescendantIds(category))
  }, [category])

  // Collect all nodes by level
  const getNodesByLevel = (nodes: Category[], level: string): Category[] => {
    const result: Category[] = []
    const traverse = (list: Category[]) => {
      for (const item of list) {
        if (item.level === level) result.push(item)
        if (item.brand && level === 'brand') result.push({ ...item, label: item.brand, value: item.brand })
        if (item.model && level === 'model') result.push({ ...item, label: item.model, value: item.model })
        if (item.year && level === 'year') result.push({ ...item, label: item.year, value: item.year })
        if (item.children && item.children.length > 0) {
          traverse(item.children)
        }
      }
    }
    traverse(nodes)
    return result
  }

  // AutoComplete options for Brand
  const brandOptions = useMemo(() => {
    const brandNodes = getNodesByLevel(categoriesTree, 'brand')
    const uniqueValues = Array.from(new Set(brandNodes.map(b => b.brand || b.label || b.value).filter(Boolean)))
    return uniqueValues.sort().map(val => ({ value: val as string, label: val as string }))
  }, [categoriesTree])

  // AutoComplete options for Model
  const modelOptions = useMemo(() => {
    const modelNodes = getNodesByLevel(categoriesTree, 'model')
    const uniqueValues = Array.from(new Set(modelNodes.map(m => m.model || m.label || m.value).filter(Boolean)))
    return uniqueValues.sort().map(val => ({ value: val as string, label: val as string }))
  }, [categoriesTree, watchedBrand])

  // AutoComplete options for Year
  const yearOptions = useMemo(() => {
    const yearNodes = getNodesByLevel(categoriesTree, 'year')
    const existingYears = yearNodes.map(y => y.year || y.label || y.value).filter(Boolean) as string[]
    const merged = Array.from(new Set([...existingYears, ...COMMON_YEARS]))
    return merged.sort().reverse().map(val => ({ value: val, label: val }))
  }, [categoriesTree])

  // Map category tree to Ant Design TreeSelect data
  const mapTreeData = (nodes: Category[]): any[] => {
    return nodes.map(node => ({
      title: `${node.label} (${node.level})`,
      value: node.id,
      key: node.id,
      disabled: disabledIds.has(node.id) || (node.level === 'submodel' && !isEdit),
      children: node.children && node.children.length > 0 ? mapTreeData(node.children) : undefined,
    }))
  }

  const treeSelectData = useMemo(() => {
    return [
      {
        title: '📁 Thư mục gốc (Root - category)',
        value: 0,
        key: 0,
      },
      ...mapTreeData(categoriesTree),
    ]
  }, [categoriesTree, disabledIds])

  // Determine the calculated level
  const selectedParent = useMemo(() => {
    if (!watchedParentId || watchedParentId === 0) return null
    return findCategoryById(categoriesTree, watchedParentId)
  }, [watchedParentId, categoriesTree])

  const calculatedLevel = useMemo(() => {
    if (!selectedParent) return 'category'
    switch (selectedParent.level.toLowerCase()) {
      case 'category':
        return 'brand'
      case 'brand':
        return 'model'
      case 'model':
        return 'variant'
      case 'variant':
        return 'year'
      case 'year':
        return 'submodel'
      default:
        return 'Không hợp lệ (quá 6 cấp)'
    }
  }, [selectedParent])

  useEffect(() => {
    if (open) {
      setServerError(null)
      if (category) {
        let editBrand = category.brand || ''
        let editModel = category.model || ''
        let editYear = category.year || ''

        // Derive if missing
        if (!editBrand && category.level === 'brand') editBrand = category.label || category.value
        if (!editModel && category.level === 'model') editModel = category.label || category.value
        if (!editYear && category.level === 'year') editYear = category.label || category.value

        if ((!editBrand || !editModel || !editYear) && category.parentId) {
          const chain = getAncestorChain(categoriesTree, category.parentId)
          if (chain) {
            for (const item of chain) {
              if (!editBrand && (item.level === 'brand' || item.brand)) editBrand = item.brand || item.label || item.value
              if (!editModel && (item.level === 'model' || item.model)) editModel = item.model || item.label || item.value
              if (!editYear && (item.level === 'year' || item.year)) editYear = item.year || item.label || item.value
            }
          }
        }

        reset({
          value: category.value,
          label: category.label,
          parentId: category.parentId || 0,
          displayOrder: category.displayOrder || 0,
          brand: editBrand,
          model: editModel,
          year: editYear,
        })
      } else {
        // When creating, try to inherit brand, model, year from ancestors if applicable
        let initBrand = ''
        let initModel = ''
        let initYear = ''

        const parentIdToInspect = defaultParentId && defaultParentId !== 0 ? defaultParentId : watchedParentId
        if (parentIdToInspect && parentIdToInspect !== 0) {
          const chain = getAncestorChain(categoriesTree, parentIdToInspect)
          if (chain) {
            for (const item of chain) {
              if (item.level === 'brand' || item.brand) initBrand = item.brand || item.label || item.value
              if (item.level === 'model' || item.model) initModel = item.model || item.label || item.value
              if (item.level === 'year' || item.year) initYear = item.year || item.label || item.value
            }
          }
        }

        reset({
          value: '',
          label: '',
          parentId: defaultParentId || 0,
          displayOrder: 0,
          brand: initBrand,
          model: initModel,
          year: initYear,
        })
      }
    }
  }, [open, category, defaultParentId, reset, categoriesTree])

  const onSubmit = async (values: CategoryFormValues) => {
    setSubmitting(true)
    setServerError(null)

    try {
      const parentId = values.parentId && values.parentId !== 0 ? values.parentId : null

      let finalBrand = values.brand?.trim() || undefined
      let finalModel = values.model?.trim() || undefined
      let finalYear = values.year?.trim() || undefined

      const effectiveLevel = isEdit && category ? category.level : calculatedLevel
      if (!finalBrand && effectiveLevel === 'brand') finalBrand = values.value.trim()
      if (!finalModel && effectiveLevel === 'model') finalModel = values.value.trim()
      if (!finalYear && effectiveLevel === 'year') finalYear = values.value.trim()

      const payload: CreateCategoryRequest | UpdateCategoryRequest = {
        value: values.value.trim(),
        label: values.label?.trim() || values.value.trim(),
        parentId,
        displayOrder: values.displayOrder ?? 0,
        brand: finalBrand,
        model: finalModel,
        year: finalYear,
      }

      if (isEdit && category) {
        await categoryService.updateCategory(category.id, payload)
        message.success('Cập nhật danh mục thành công')
      } else {
        await categoryService.createCategory(payload)
        message.success('Tạo danh mục mới thành công')
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
      title={isEdit ? `Chỉnh sửa danh mục: ${category?.label}` : 'Thêm mới danh mục'}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={600}
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
        {/* Parent Category Selector */}
        <Form.Item
          label="Danh mục cha (Parent Category)"
          help={errors.parentId?.message}
          validateStatus={errors.parentId ? 'error' : ''}
        >
          <Controller
            name="parentId"
            control={control}
            render={({ field }) => (
              <TreeSelect
                {...field}
                showSearch
                style={{ width: '100%' }}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                placeholder="Chọn danh mục cha hoặc chọn Gốc (Root)"
                allowClear={false}
                treeDefaultExpandAll
                treeData={treeSelectData}
                onChange={val => {
                  field.onChange(val)
                  // When parent changes in create mode, auto-suggest inherited vehicle metadata
                  if (!isEdit && val && val !== 0) {
                    const chain = getAncestorChain(categoriesTree, val)
                    if (chain) {
                      for (const item of chain) {
                        if (item.level === 'brand' || item.brand) {
                          setValue('brand', item.brand || item.label || item.value)
                        }
                        if (item.level === 'model' || item.model) {
                          setValue('model', item.model || item.label || item.value)
                        }
                        if (item.level === 'year' || item.year) {
                          setValue('year', item.year || item.label || item.value)
                        }
                      }
                    }
                  }
                }}
              />
            )}
          />
          <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>
            Cấp bậc dự kiến (Hierarchy level):{' '}
            <Tag color={LEVEL_COLOR_MAP[calculatedLevel] || 'default'}>
              {calculatedLevel.toUpperCase()}
            </Tag>
            {selectedParent?.level === 'submodel' && (
              <span style={{ color: '#ff4d4f', marginLeft: 8 }}>
                * Cấp submodel là cấp sâu nhất (cấp 6), không thể tạo thêm cấp con.
              </span>
            )}
          </div>
        </Form.Item>

        {/* Code / Value */}
        <Form.Item
          label="Mã / Giá trị (Value / Code)"
          required
          help={errors.value?.message}
          validateStatus={errors.value ? 'error' : ''}
        >
          <Controller
            name="value"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Ví dụ: Camry, 2024, Ngoại thất..."
                maxLength={100}
                onChange={e => {
                  const val = e.target.value
                  field.onChange(val)
                  // Auto sync with brand/model/year if user hasn't explicitly customized them
                  if (!isEdit) {
                    if (calculatedLevel === 'brand' && !getValues('brand')) {
                      setValue('brand', val)
                    }
                    if (calculatedLevel === 'model' && !getValues('model')) {
                      setValue('model', val)
                    }
                    if (calculatedLevel === 'year' && !getValues('year')) {
                      setValue('year', val)
                    }
                  }
                }}
              />
            )}
          />
        </Form.Item>

        {/* Display Name / Label */}
        <Form.Item
          label="Tên hiển thị (Label)"
          help={errors.label?.message}
          validateStatus={errors.label ? 'error' : ''}
        >
          <Controller
            name="label"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Tên hiển thị (mặc định lấy theo Mã / Giá trị)"
                maxLength={255}
              />
            )}
          />
        </Form.Item>

        {/* Vehicle Metadata Section */}
        <Divider titlePlacement="left" style={{ margin: '14px 0 16px', fontSize: 13, color: '#374151' }}>
          🚗 Thông tin xe (Hãng xe, Dòng xe, Năm sản xuất)
        </Divider>

        <Row gutter={12}>
          <Col span={8}>
            <Form.Item
              label="Hãng xe (Brand)"
              help={errors.brand?.message}
              validateStatus={errors.brand ? 'error' : ''}
            >
              <Controller
                name="brand"
                control={control}
                render={({ field }) => (
                  <AutoComplete
                    {...field}
                    options={brandOptions}
                    placeholder="VD: Toyota, Kia..."
                    filterOption={(inputValue, option) =>
                      (option?.value ?? '').toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                    }
                    allowClear
                    onChange={val => field.onChange(val)}
                  />
                )}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              label="Dòng xe (Model)"
              help={errors.model?.message}
              validateStatus={errors.model ? 'error' : ''}
            >
              <Controller
                name="model"
                control={control}
                render={({ field }) => (
                  <AutoComplete
                    {...field}
                    options={modelOptions}
                    placeholder="VD: Camry, Morning..."
                    filterOption={(inputValue, option) =>
                      (option?.value ?? '').toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                    }
                    allowClear
                    onChange={val => field.onChange(val)}
                  />
                )}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              label="Năm (Year)"
              help={errors.year?.message}
              validateStatus={errors.year ? 'error' : ''}
            >
              <Controller
                name="year"
                control={control}
                render={({ field }) => (
                  <AutoComplete
                    {...field}
                    options={yearOptions}
                    placeholder="VD: 2024, 2025..."
                    filterOption={(inputValue, option) =>
                      (option?.value ?? '').toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                    }
                    allowClear
                    onChange={val => field.onChange(val)}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>
        <div style={{ marginTop: -8, marginBottom: 16, fontSize: 12, color: '#6b7280' }}>
          * Nếu để trống, hệ thống sẽ tự động xác định và lưu Hãng xe, Dòng xe, Năm theo cấp bậc và nhánh danh mục cha.
        </div>

        {/* Display Order */}
        <Form.Item
          label="Thứ tự hiển thị (Display Order)"
          help={errors.displayOrder?.message}
          validateStatus={errors.displayOrder ? 'error' : ''}
        >
          <Controller
            name="displayOrder"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                min={0}
                style={{ width: '100%' }}
                placeholder="0"
                onChange={val => field.onChange(val ?? 0)}
              />
            )}
          />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
          <Button onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={submitting}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo danh mục'}
          </Button>
        </div>
      </Form>
    </Modal>
  )
}
