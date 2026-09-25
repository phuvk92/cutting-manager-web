export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REFRESH: '/auth/refresh',
  ME: '/auth/me',
  CHANGE_PASSWORD: '/auth/change-password',

  // Categories
  CATEGORIES: '/categories',
  CATEGORY_DETAIL: (id: number | string) => `/categories/${id}`,
  CATEGORY_CREATE: '/categories',
  CATEGORY_UPDATE: (id: number | string) => `/categories/${id}`,
  CATEGORY_DELETE: (id: number | string) => `/categories/${id}`,
  CATALOG_LEVEL: (level: string) => `/v1/catalog/${level}`,

  // SVG Files
  SVG_LIST: '/svg',
  SVG_UPLOAD: '/svg/upload',
  SVG_DETAIL: (id: number | string) => `/svg/${id}`,
  SVG_PREVIEW: (id: number | string) => `/svg/${id}/preview`,
  SVG_DOWNLOAD: (id: number | string) => `/svg/${id}/download`,
  SVG_DELETE: (id: number | string) => `/svg/${id}`,

  // Users (ADMIN and AGENT)
  USERS_LIST: '/users',
  USER_DETAIL: (id: number | string) => `/users/${id}`,
  USER_CREATE: '/users',
  USER_UPDATE: (id: number | string) => `/users/${id}`,
  USER_STATUS: (id: number | string) => `/users/${id}/status`,
  USER_ROLE: (id: number | string) => `/users/${id}/role`,
  USER_DELETE: (id: number | string) => `/users/${id}`,

  // Actuator
  HEALTH: '/actuator/health',
  INFO: '/actuator/info',
} as const
