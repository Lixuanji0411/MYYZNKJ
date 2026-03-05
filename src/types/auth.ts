export interface User {
  id: string
  name: string
  phone: string
  email?: string
  avatar?: string
  businessType: BusinessType
  businessName?: string
  taxRegion?: string
  createdAt: string
  updatedAt: string
}

export type BusinessType = 'individual' | 'small_taxpayer'

export interface LoginCredentials {
  phone: string
  password: string
}

export interface RegisterData {
  name: string
  phone: string
  password: string
  confirmPassword: string
  businessType: BusinessType
  businessName?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}
