export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'cutting_access_token',
  REFRESH_TOKEN: 'cutting_refresh_token',
  USER: 'cutting_user',
} as const

export const ROLES = {
  ADMIN: 'ADMIN',
  AGENT: 'AGENT',
  USER: 'USER',
} as const

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
  AGENT: 'Agent',
  USER: 'Regular User',
}

export const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'magenta',
  AGENT: 'blue',
  USER: 'green',
}
