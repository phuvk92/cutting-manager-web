import dayjs from 'dayjs'

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export const formatDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return '-'
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss')
}

export const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '-'
  return dayjs(dateStr).format('YYYY-MM-DD')
}

export const truncateString = (str: string, maxLength = 30): string => {
  if (!str || str.length <= maxLength) return str
  return `${str.substring(0, maxLength)}...`
}

/**
 * Chuẩn hoá tên file SVG khi tải xuống:
 * - Luôn có đuôi .svg (không phân biệt hoa thường: .svg hoặc .SVG đã có thì giữ nguyên)
 * - Tên rỗng hoặc chỉ khoảng trắng -> dùng tên dự phòng file-<id>.svg
 * - Giữ nguyên các phần sau dấu chấm giữa (ví dụ: Audi Q6 2024 v1.2 -> Audi Q6 2024 v1.2.svg)
 * - Bỏ ký tự không hợp lệ cho tên file Windows (\ / : * ? " < > |)
 */
export const normalizeSvgFilename = (
  name?: string | null,
  fallbackId?: number | string | null
): string => {
  const sanitized = (name ?? '').replace(/[\\/:*?"<>|]/g, '').trim()

  if (!sanitized || sanitized.toLowerCase() === '.svg') {
    return fallbackId !== undefined && fallbackId !== null && String(fallbackId).trim() !== ''
      ? `file-${fallbackId}.svg`
      : 'file.svg'
  }

  if (/\.svg$/i.test(sanitized)) {
    return sanitized
  }

  return `${sanitized}.svg`
}
