import { Alert } from 'antd'

export default function ApiErrorBanner({ error, onRetry }: { error: string | null; onRetry?: () => void }) {
  if (!error) return null
  return (
    <Alert
      type="error"
      showIcon
      style={{ marginBottom: 16 }}
      message="Không kết nối được backend"
      description={error}
      action={
        onRetry ? (
          <button className="toolbar-btn" onClick={onRetry}>
            Thử lại
          </button>
        ) : undefined
      }
    />
  )
}
