import type { User, LoginCredentials, RegisterData } from '@/types/auth'
import { getItem, setItem, generateId, getNow } from './storage'

const USERS_KEY = 'users'
const CURRENT_USER_KEY = 'current_user'
const TOKEN_KEY = 'auth_token'

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const users = getItem<Array<User & { password: string }>>(USERS_KEY) || []
    const found = users.find(
      (u) => u.phone === credentials.phone && u.password === credentials.password
    )

    if (!found) {
      throw new Error('手机号或密码错误')
    }

    const { password: _, ...user } = found
    const token = `local_token_${generateId()}`

    setItem(CURRENT_USER_KEY, user)
    setItem(TOKEN_KEY, token)

    return { user, token }
  },

  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const users = getItem<Array<User & { password: string }>>(USERS_KEY) || []

    if (users.some((u) => u.phone === data.phone)) {
      throw new Error('该手机号已注册')
    }

    const now = getNow()
    const newUser: User & { password: string } = {
      id: generateId(),
      name: data.name,
      phone: data.phone,
      password: data.password,
      businessType: data.businessType,
      businessName: data.businessName,
      createdAt: now,
      updatedAt: now,
    }

    users.push(newUser)
    setItem(USERS_KEY, users)

    const { password: _, ...user } = newUser
    const token = `local_token_${generateId()}`

    setItem(CURRENT_USER_KEY, user)
    setItem(TOKEN_KEY, token)

    return { user, token }
  },

  async logout(): Promise<void> {
    setItem(CURRENT_USER_KEY, null)
    setItem(TOKEN_KEY, null)
  },

  async getCurrentUser(): Promise<User | null> {
    return getItem<User>(CURRENT_USER_KEY)
  },

  async getToken(): Promise<string | null> {
    return getItem<string>(TOKEN_KEY)
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const currentUser = getItem<User>(CURRENT_USER_KEY)
    if (!currentUser) throw new Error('未登录')

    const updatedUser: User = {
      ...currentUser,
      ...updates,
      updatedAt: getNow(),
    }

    setItem(CURRENT_USER_KEY, updatedUser)

    const users = getItem<Array<User & { password: string }>>(USERS_KEY) || []
    const index = users.findIndex((u) => u.id === currentUser.id)
    if (index !== -1) {
      users[index] = { ...users[index], ...updates, updatedAt: getNow() }
      setItem(USERS_KEY, users)
    }

    return updatedUser
  },
}
