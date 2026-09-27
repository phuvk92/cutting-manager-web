export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REFRESH: '/auth/refresh',
  ME: '/auth/me',
  CHANGE_PASSWORD: '/auth/change-password',
  AUTH_LOGIN: '/auth/login',
  AUTH_ME: '/auth/me',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_LOGOUT: '/auth/logout',

  // Categories (Catalog)
  CATEGORIES: '/categories',
  CATEGORIES_TREE: '/categories',
  CATEGORIES_LIST: '/categories',
  CATEGORY_DETAIL: (id: number | string) => `/categories/${id}`,
  CATEGORY_CREATE: '/categories',
  CATEGORY_UPDATE: (id: number | string) => `/categories/${id}`,
  CATEGORY_DELETE: (id: number | string) => `/categories/${id}`,
  CATALOG_LEVEL: (level: string) => `/v1/catalog/${level}`,

  // SVG Files
  SVG_LIST: '/svg',
  SVG_UPLOAD: '/svg/upload',
  SVG_BATCH_UPLOAD: '/svg/batch',
  SVG_DETAIL: (id: number | string) => `/svg/${id}`,
  SVG_PREVIEW: (id: number | string) => `/svg/${id}/preview`,
  SVG_DOWNLOAD: (id: number | string) => `/svg/${id}/download`,
  SVG_DELETE: (id: number | string) => `/svg/${id}`,
  SVG_DEALERS: (id: number | string) => `/svg/${id}/dealers`,
  SVG_CONFIGURATIONS: (id: number | string) => `/svg/${id}/vehicle-configurations`,

  // Users (ADMIN and AGENT)
  USERS_LIST: '/users',
  USER_DETAIL: (id: number | string) => `/users/${id}`,
  USER_CREATE: '/users',
  USER_UPDATE: (id: number | string) => `/users/${id}`,
  USER_ROLE: (id: number | string) => `/users/${id}/role`,
  USER_STATUS: (id: number | string) => `/users/${id}/status`,
  USER_DELETE: (id: number | string) => `/users/${id}`,

  // Actuator
  HEALTH: '/actuator/health',
  INFO: '/actuator/info',

  // Audit Logs (ADMIN only)
  AUDIT_LOGS_LIST: '/audit-logs',
  AUDIT_LOG_DETAIL: (id: number | string) => `/audit-logs/${id}`,

  // Dealers (ADMIN only)
  DEALERS_LIST: '/dealers',
  DEALERS_ALL: '/dealers/all',
  DEALER_STATS: '/dealers/stats',
  DEALER_GENERATE_CODE: '/dealers/generate-code',
  DEALER_DETAIL: (id: number | string) => `/dealers/${id}`,
  DEALER_CREATE: '/dealers',
  DEALER_UPDATE: (id: number | string) => `/dealers/${id}`,
  DEALER_STATUS: (id: number | string) => `/dealers/${id}/status`,
  DEALER_DELETE: (id: number | string) => `/dealers/${id}`,

  // Vehicle Configurations
  VEHICLE_CONFIGURATIONS: '/vehicle-configurations',
  VEHICLE_CONFIGURATION_DETAIL: (id: number | string) => `/vehicle-configurations/${id}`,
  CAR_BRANDS: '/vehicle-configurations/brands',
  CAR_MODELS: '/vehicle-configurations/models',
} as const
