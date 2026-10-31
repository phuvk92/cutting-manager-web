import { describe, it, expect, beforeEach } from 'vitest'
import { extractErrorMessage, extractApiError } from './error'
import { AxiosError, AxiosHeaders } from 'axios'
import i18n from '@/i18n'

describe('extractErrorMessage & extractApiError', () => {
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

  it('extracts field and code along with localized message in extractApiError', () => {
    const error = new AxiosError(
      'Request failed with status code 400',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        data: {
          timestamp: '2026-10-31T10:00:00',
          status: 400,
          error: 'Bad Request',
          message: 'Raw msg',
          path: '/api/users',
          code: 'USERNAME_INVALID_FORMAT',
          field: 'username',
        },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: { headers: new AxiosHeaders() },
      }
    )

    const result = extractApiError(error)
    expect(result.code).toBe('USERNAME_INVALID_FORMAT')
    expect(result.field).toBe('username')
    expect(result.message).toBe('Tên đăng nhập không hợp lệ. Chỉ được dùng chữ cái tiếng Anh, số, dấu gạch dưới (_) và dấu gạch ngang (-).')
  })

  it('supports bilingual messages for Keycloak error codes', async () => {
    const error = new AxiosError(
      'Request failed with status code 409',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        data: {
          timestamp: '2026-10-31T10:00:00',
          status: 409,
          error: 'Conflict',
          message: 'Conflict msg',
          path: '/api/users',
          code: 'USERNAME_ALREADY_EXISTS',
          field: 'username',
        },
        status: 409,
        statusText: 'Conflict',
        headers: {},
        config: { headers: new AxiosHeaders() },
      }
    )

    // VI
    await i18n.changeLanguage('vi')
    expect(extractErrorMessage(error)).toBe('Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.')

    // EN
    await i18n.changeLanguage('en')
    expect(extractErrorMessage(error)).toBe('Username already exists. Please choose another one.')
  })

  it('sanitizes raw Keycloak JSON message and does not leak stack trace or raw JSON to UI', () => {
    const rawKeycloakMsg = 'Keycloak user creation failed: 400 Bad Request: {"field":"username","errorMessage":"error-username-invalid-character","params":["username"]}'
    const error = new AxiosError(
      'Request failed with status code 400',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        data: {
          timestamp: '2026-10-31T10:00:00',
          status: 400,
          error: 'Bad Request',
          message: rawKeycloakMsg,
          path: '/api/users',
        },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: { headers: new AxiosHeaders() },
      }
    )

    const msg = extractErrorMessage(error)
    expect(msg).not.toContain('Keycloak user creation failed')
    expect(msg).not.toContain('400 Bad Request')
    expect(msg).not.toContain('{"field"')
    expect(msg).toBe('Tên đăng nhập không hợp lệ. Chỉ được dùng chữ cái tiếng Anh, số, dấu gạch dưới (_) và dấu gạch ngang (-).')
  })

  it('localizes Network Error', async () => {
    const error = new AxiosError('Network Error')
    expect(extractErrorMessage(error)).toBe('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối tới máy chủ.')

    await i18n.changeLanguage('en')
    expect(extractErrorMessage(error)).toBe('Network connection error. Please verify backend server is running.')
  })
})
