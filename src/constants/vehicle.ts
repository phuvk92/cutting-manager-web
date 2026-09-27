import { ProductGroup } from '@/types/vehicleConfiguration'

export const PRODUCT_GROUPS: {
  value: ProductGroup
  label: string
  categoryId: number
  color: string
  bg: string
  border: string
}[] = [
  {
    value: 'PPF_EXTERIOR',
    label: 'Ngoại thất (PPF Exterior)',
    categoryId: 1,
    color: '#0284C7',
    bg: '#E0F2FE',
    border: '#BAE6FD',
  },
  {
    value: 'PPF_INTERIOR',
    label: 'Nội thất (PPF Interior)',
    categoryId: 2,
    color: '#7C3AED',
    bg: '#F3E8FF',
    border: '#DDD6FE',
  },
  {
    value: 'WINDOW_FILM',
    label: 'Window Film',
    categoryId: 3,
    color: '#D97706',
    bg: '#FEF3C7',
    border: '#FDE68A',
  },
]

export const PRODUCT_GROUP_MAP: Record<ProductGroup, { label: string; color: string; bg: string; border: string }> = {
  PPF_EXTERIOR: {
    label: 'Ngoại thất (PPF Exterior)',
    color: '#0284C7',
    bg: '#E0F2FE',
    border: '#BAE6FD',
  },
  PPF_INTERIOR: {
    label: 'Nội thất (PPF Interior)',
    color: '#7C3AED',
    bg: '#F3E8FF',
    border: '#DDD6FE',
  },
  WINDOW_FILM: {
    label: 'Window Film',
    color: '#D97706',
    bg: '#FEF3C7',
    border: '#FDE68A',
  },
}
