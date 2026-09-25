import React, { useEffect, useState, useMemo } from 'react'
import { Modal, Form, Input, InputNumber, TreeSelect, Alert, Tag, Button, message } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@/types/category'
import { categoryService } from '@/services/category/categoryService'
import { extractErrorMessage } from '@/utils/error'

const categoryFormSchema = z.object({
  value: z
    .string()
    .min(1, 'Mã / Giá trị danh mục là bắt buộc')
    .max(100, 'Tối đa 100 ký tự'),
  label: z.string().max(255, 'Tối đa 255 ký tự').optional(),
  parentId: z.number().nullable().optional(),
  displayOrder: z.number().min(0, 'Thứ tự hiển thị phải lớn hơn hoặc bằng 0').optional(),
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
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      value: '',
      label: '',
      parentId: null,
      displayOrder: 0,
    },
  })

  const watchedParentId = watch('parentId')

  // Find a category by ID anywhere in the tree
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
        reset({
          value: category.value,
          label: category.label,
          parentId: category.parentId || 0,
          displayOrder: category.displayOrder || 0,
        })
      } else {
        reset({
          value: '',
          label: '',
          parentId: defaultParentId || 0,
          displayOrder: 0,
        })
      }
    }
  }, [open, category, defaultParentId, reset])

  const onSubmit = async (values: CategoryFormValues) => {
    setSubmitting(true)
    setServerError(null)

    try {
      const parentId = values.parentId && values.parentId !== 0 ? values.parentId : null
      const payload: CreateCategoryRequest | UpdateCategoryRequest = {
        value: values.value.trim(),
        label: values.label?.trim() || values.value.trim(),
        parentId,
        displayOrder: values.displayOrder ?? 0,
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
      width={560}
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
                onChange={val => field.onChange(val)}
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
                placeholder="Ví dụ: Ngoại thất, Toyota, Camry, 2024..."
                maxLength={100}
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
                placeholder="Tên hiển thị trong danh mục và báo cáo (mặc định lấy theo Giá trị)"
                maxLength={255}
              />
            )}
          />
        </Form.Item>

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
