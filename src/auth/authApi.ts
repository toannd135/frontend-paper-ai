import { ApiError, apiFetch, postJson } from '../client/api/http'

export type UserRole = 'admin' | 'user'

export interface AuthUser {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
}

interface AuthResponse {
  access_token: string
  user: AuthUser
}

export class AuthError extends ApiError {}

export function login(email: string, password: string): Promise<AuthResponse> {
  return postJson<AuthResponse>('/auth/login', { email, password }, AuthError)
}

export function register(email: string, password: string, fullName: string): Promise<AuthResponse> {
  return postJson<AuthResponse>('/auth/register', { email, password, full_name: fullName }, AuthError)
}

export function fetchMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me', {}, AuthError)
}

export function listUsers(): Promise<AuthUser[]> {
  return apiFetch<AuthUser[]>('/auth/users', {}, AuthError)
}

export function updateUser(id: string, patch: { role?: UserRole; is_active?: boolean }): Promise<AuthUser> {
  return apiFetch<AuthUser>(
    `/auth/users/${id}`,
    { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) },
    AuthError,
  )
}
