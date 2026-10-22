const TOKEN_KEY = 'paperai.token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // localStorage bị chặn: phiên đăng nhập chỉ sống trong bộ nhớ trang này.
  }
}

/** Xoá dữ liệu cục bộ của phiên làm việc (nháp, tin nhắn đã lưu) để người dùng sau không thấy. */
export function clearLocalSessionData() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('paperai.') && k !== 'paperai.theme')
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    // bỏ qua
  }
}

type UnauthorizedHandler = () => void
let onUnauthorized: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler
}

export function notifyUnauthorized() {
  onUnauthorized?.()
}
