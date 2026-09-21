import { createContext, useContext, type ReactNode } from 'react'
import { useAppController, type AppController } from './useAppController'

const AppContext = createContext<AppController | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const controller = useAppController()
  return <AppContext.Provider value={controller}>{children}</AppContext.Provider>
}

export function useApp(): AppController {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
