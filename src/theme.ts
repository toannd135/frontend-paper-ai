import type { ThemeConfig } from 'antd'

export const colors = {
  primary: '#087F73',
  primaryLight: '#0E9F91',
  gold: '#D9A441',
  goldHover: '#B8862D',
  goldLight: '#F1C27D',
  creamBg: '#F7E8C6',
  creamSurface: '#FFF8E8',
  ink: '#1E1E1E',
  inkMuted: '#6B6B6B',
  hairline: '#E8DCC4',
  msgAi: '#E3F3EF',
  msgUser: '#FCEBCB',
  danger: '#E06C75',
}

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: colors.primary,
    colorLink: colors.primary,
    colorInfo: colors.primary,
    colorError: colors.danger,
    colorText: colors.ink,
    colorTextSecondary: colors.inkMuted,
    colorBorder: colors.hairline,
    colorBorderSecondary: colors.hairline,
    fontFamily:
      "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
    borderRadius: 10,
    borderRadiusLG: 14,
    controlHeight: 36,
  },
  components: {
    Button: {
      borderRadius: 9,
      controlHeight: 36,
      fontWeight: 600,
    },
    Input: {
      borderRadius: 9,
      colorBorder: colors.hairline,
    },
    Modal: {
      borderRadiusLG: 16,
    },
    Tag: {
      borderRadiusSM: 999,
    },
    Tooltip: {
      colorBgSpotlight: colors.ink,
    },
  },
}
