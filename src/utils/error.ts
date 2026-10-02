import axios, { AxiosError } from 'axios'
import { ErrorResponse } from '@/types/common'

/** Mã lỗi server có ý nghĩa nghiệp vụ → câu tiếng Việt cụ thể, không hiện mã thô. */
const SERVER_CODE_MESSAGES: Record<string, string> = {
  CUT_AREA_INCOMPLETE: 'Khổ cắt chưa đủ — cần khai cả dài dọc cuộn lẫn khổ phim (mm).',
  CUT_AREA_OUT_OF_RANGE: 'Khổ cắt ngoài giới hạn — dài dọc cuộn 100–50.000 mm, khổ phim 100–2.000 mm.',
}

export const extractErrorMessage = (error: unknown, fallbackMessage = 'An unexpected error occurred'): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>
    const code = axiosError.response?.data?.code
    if (code && SERVER_CODE_MESSAGES[code]) {
      return SERVER_CODE_MESSAGES[code]
    }
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message
    }
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error
    }
    if (axiosError.message) {
      if (axiosError.message === 'Network Error') {
        return 'Network connection error. Please verify backend server is running.'
      }
      return axiosError.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallbackMessage
}
