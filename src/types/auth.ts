export type Role = 'ADMIN' | 'AGENT' | 'USER'

export interface UserSummary {
  id: number
  username: string
  email: string
  role: Role
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

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}
