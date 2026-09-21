import type { ReactNode } from 'react'
import { Info } from 'lucide-react'

export default function UnimplementedBanner({ children }: { children: ReactNode }) {
  return (
    <div className="admin-unimplemented-banner">
      <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>{children}</div>
    </div>
  )
}
