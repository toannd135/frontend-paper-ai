import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { ConfigProvider, theme as antdThemeApi } from 'antd'
import viVN from 'antd/locale/vi_VN'
import { antdTheme } from '../../theme'

export type ThemeMode = 'light' | 'dark'
const KEY = 'paperai-theme'

function initialMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* localStorage không khả dụng */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const ThemeModeContext = createContext<{ mode: ThemeMode; toggle: () => void }>({ mode: 'light', toggle: () => {} })

export const useThemeMode = () => useContext(ThemeModeContext)

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(initialMode)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode)
    try {
      localStorage.setItem(KEY, mode)
    } catch {
      /* bỏ qua */
    }
  }, [mode])

  const config = {
    ...antdTheme,
    algorithm: mode === 'dark' ? antdThemeApi.darkAlgorithm : antdThemeApi.defaultAlgorithm,
    token: {
      ...antdTheme.token,
      ...(mode === 'dark' ? { colorText: '#e6ece9', colorTextSecondary: '#9fb0aa', colorBorder: '#2c3e3a', colorBorderSecondary: '#2c3e3a', colorBgContainer: '#182624', colorBgElevated: '#1d2d2a' } : {}),
    },
  }

  return (
    <ThemeModeContext.Provider value={{ mode, toggle: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')) }}>
      <ConfigProvider theme={config} locale={viVN}>
        {children}
      </ConfigProvider>
    </ThemeModeContext.Provider>
  )
}
