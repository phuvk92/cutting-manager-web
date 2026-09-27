export type Role = 'ADMIN' | 'AGENT' | 'USER'

export interface UserSummary {
  id: number
  username: string
  email: string
  role: Role
  dealerId?: number
  dealerName?: string
  dealerCode?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: UserSummary
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword?: string
}

export interface MessageResponse {
  message: string
}
