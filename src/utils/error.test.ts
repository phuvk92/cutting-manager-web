import { describe, it, expect, beforeEach } from 'vitest'
import { extractErrorMessage } from './error'
import { AxiosError, AxiosHeaders } from 'axios'
import i18n from '@/i18n'

describe('extractErrorMessage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('vi')
  })

  it('maps known error codes to Vietnamese messages when language is vi', () => {
    const error = new AxiosError(
      'Request failed with status code 400',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        data: {
          timestamp: '2026-10-30T20:00:00',
          status: 400,
          error: 'Bad Request',
          message: 'Default server msg',
          path: '/api/v1/test',
          code: 'ONE_VEHICLE_PER_FILE',
        },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: { headers: new AxiosHeaders() },
      }
    )

    const msg = extractErrorMessage(error)
    expect(msg).toBe('Mỗi file chỉ được chứa mẫu của một loại xe.')
  })

  it('maps known error codes to English messages when language is en', async () => {
    await i18n.changeLanguage('en')
    const error = new AxiosError(
      'Request failed with status code 400',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        data: {
          timestamp: '2026-10-30T20:00:00',
          status: 400,
          error: 'Bad Request',
          message: 'Default server msg',
          path: '/api/v1/test',
          code: 'ONE_VEHICLE_PER_FILE',
        },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: { headers: new AxiosHeaders() },
      }
    )

    const msg = extractErrorMessage(error)
    expect(msg).toBe('Each SVG file may only contain patterns for one vehicle model.')
  })

  it('falls back to server response message when code is not in codes map', () => {
    const error = new AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        data: {
          timestamp: '2026-10-30T20:00:00',
          status: 400,
          error: 'Bad Request',
          message: 'Tài khoản chưa liên kết số điện thoại',
          path: '/api/v1/test',
        },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: { headers: new AxiosHeaders() },
      }
    )

    const msg = extractErrorMessage(error)
    expect(msg).toBe('Tài khoản chưa liên kết số điện thoại')
  })

  it('localizes Network Error', async () => {
    const error = new AxiosError('Network Error')
    expect(extractErrorMessage(error)).toBe('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối tới máy chủ.')

    await i18n.changeLanguage('en')
    expect(extractErrorMessage(error)).toBe('Network connection error. Please verify backend server is running.')
  })
})
