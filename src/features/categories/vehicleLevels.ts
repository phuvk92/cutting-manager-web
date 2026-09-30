import { VehicleLevel } from '@/types/vehicleNode'

export interface LevelMeta {
  code: VehicleLevel
  vi: string
  bg: string
  color: string
  ph: string
}

// Màu/badge theo đúng design Admin Portal (META_TYPES)
export const LEVEL_ORDER: LevelMeta[] = [
  { code: 'BRAND', vi: 'Hãng', bg: '#EEF3FC', color: '#2F5BA8', ph: 'VD: Toyota' },
  { code: 'SERIES', vi: 'Dòng xe', bg: '#E9F5EE', color: '#2E7D5B', ph: 'VD: Camry' },
  { code: 'MODEL', vi: 'Model', bg: '#FBF0DF', color: '#8A5A12', ph: 'VD: Camry 2.5Q' },
  { code: 'SUBTYPE', vi: 'Phiên bản', bg: '#FAE7E3', color: '#A93823', ph: 'VD: Bản nhập Thái' },
]

export const LEVEL_META: Record<VehicleLevel, LevelMeta> = Object.fromEntries(
  LEVEL_ORDER.map(l => [l.code, l])
) as Record<VehicleLevel, LevelMeta>

export const nextLevel = (level: VehicleLevel): LevelMeta | null => {
  const i = LEVEL_ORDER.findIndex(l => l.code === level)
  return i >= 0 && i < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[i + 1] : null
}
