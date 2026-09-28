export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface ErrorResponse {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
  /** Mã lỗi máy đọc được, vd SESSION_LIMIT, USER_WEB_LOGIN_FORBIDDEN — chỉ có khi cần phân nhánh */
  code?: string
}
