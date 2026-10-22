import { useState, type FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import logo from '../assets/logo.png'
import './LoginPage.css'

export default function LoginPage() {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const loginState = location.state as { from?: string; entry?: unknown; mode?: 'login' | 'register' } | null
  const from = loginState?.from ?? '/home'
  const entry = loginState?.entry ?? null

  const [mode, setMode] = useState<'login' | 'register'>(loginState?.mode === 'register' ? 'register' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  const socialSignIn = (provider: string) =>
    setError(`Đăng nhập bằng ${provider} chưa được kết nối. Vui lòng dùng email và mật khẩu.`)

  if (user) return <Navigate to={from} replace state={entry} />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'login') await login(email.trim(), password)
      else await register(email.trim(), password, fullName.trim())
      navigate(from, { replace: true, state: entry })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thực hiện được, thử lại sau.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <aside className="auth-hero auth-enter-left" aria-hidden="true">
        <div className="auth-hero-brand">
          <img src={logo} alt="" />
          <span>PaperAI</span>
        </div>
        <div className="auth-hero-body">
          <h2>Từ câu hỏi đến bài báo khoa học có trích dẫn</h2>
          <p>Tìm tài liệu, phân tích nguồn và tổng hợp thành bài báo học thuật chỉ trong vài phút.</p>
          <div className="auth-hero-visual">
            <div className="auth-hero-glow" />
            <svg className="auth-hero-graph" viewBox="0 0 370 230" role="img">
              <defs>
                <filter id="auth-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <g stroke="rgba(255,255,255,0.32)" strokeWidth="1.3" fill="none">
              <line x1="190" y1="120" x2="80" y2="55" />
              <line x1="190" y1="120" x2="300" y2="50" />
              <line x1="190" y1="120" x2="50" y2="150" />
              <line x1="190" y1="120" x2="320" y2="160" />
              <line x1="190" y1="120" x2="190" y2="45" />
              <line x1="190" y1="120" x2="125" y2="185" />
              <line x1="190" y1="120" x2="255" y2="190" />
              <line x1="190" y1="120" x2="125" y2="105" />
              <line x1="190" y1="120" x2="265" y2="110" />
              <line x1="80" y1="55" x2="190" y2="45" />
              <line x1="300" y1="50" x2="190" y2="45" />
              <line x1="80" y1="55" x2="125" y2="105" strokeDasharray="4 4" />
              <line x1="300" y1="50" x2="265" y2="110" strokeDasharray="4 4" />
              <line x1="50" y1="150" x2="125" y2="185" />
              <line x1="320" y1="160" x2="255" y2="190" />
              <line x1="50" y1="150" x2="20" y2="95" strokeDasharray="4 4" />
              <line x1="320" y1="160" x2="350" y2="105" strokeDasharray="4 4" />
              <line x1="255" y1="190" x2="215" y2="215" />
              <line x1="190" y1="45" x2="160" y2="10" strokeDasharray="4 4" />
              <line x1="80" y1="55" x2="20" y2="95" strokeDasharray="4 4" />
              <line x1="300" y1="50" x2="350" y2="105" />
              <line x1="125" y1="185" x2="215" y2="215" strokeDasharray="4 4" />
              </g>
              <g className="auth-pulses" filter="url(#auth-glow)">
              <circle r="2.2" fill="#fff"><animateMotion dur="3.0s" begin="-0.0s" repeatCount="indefinite" path="M80 55 L125 105" /></circle>
              <circle r="2.2" fill="#fff"><animateMotion dur="3.5s" begin="-0.8s" repeatCount="indefinite" path="M300 50 L265 110" /></circle>
              <circle r="2.2" fill="#fff"><animateMotion dur="4.0s" begin="-1.6s" repeatCount="indefinite" path="M50 150 L20 95" /></circle>
              <circle r="2.2" fill="#fff"><animateMotion dur="4.5s" begin="-2.4s" repeatCount="indefinite" path="M320 160 L350 105" /></circle>
              <circle r="2.2" fill="#fff"><animateMotion dur="5.0s" begin="-3.2s" repeatCount="indefinite" path="M190 45 L160 10" /></circle>
              <circle r="2.2" fill="#fff"><animateMotion dur="5.5s" begin="-4.0s" repeatCount="indefinite" path="M80 55 L20 95" /></circle>
              <circle r="2.2" fill="#fff"><animateMotion dur="6.0s" begin="-4.8s" repeatCount="indefinite" path="M125 185 L215 215" /></circle>
              </g>
              <g filter="url(#auth-glow)">
              <circle className="auth-node auth-node-core" style={{ animationDelay: '-0.0s' }} cx="190" cy="120" r="22" fill="#f1c27d" opacity="1" />
              <circle className="auth-node" style={{ animationDelay: '-1.3s' }} cx="80" cy="55" r="13" fill="#fff" opacity="0.9" />
              <circle className="auth-node" style={{ animationDelay: '-2.6s' }} cx="300" cy="50" r="15" fill="#fff" opacity="0.9" />
              <circle className="auth-node" style={{ animationDelay: '-3.9s' }} cx="50" cy="150" r="11" fill="#fff" opacity="0.9" />
              <circle className="auth-node" style={{ animationDelay: '-5.2s' }} cx="320" cy="160" r="13" fill="#fff" opacity="0.9" />
              <circle className="auth-node" style={{ animationDelay: '-6.5s' }} cx="190" cy="45" r="9" fill="#fff" opacity="0.9" />
              <circle className="auth-node" style={{ animationDelay: '-0.8s' }} cx="125" cy="185" r="10" fill="#fff" opacity="0.9" />
              <circle className="auth-node" style={{ animationDelay: '-2.1s' }} cx="255" cy="190" r="8" fill="#fff" opacity="0.75" />
              <circle className="auth-node" style={{ animationDelay: '-3.4s' }} cx="125" cy="105" r="7" fill="#d8f3ee" opacity="0.75" />
              <circle className="auth-node" style={{ animationDelay: '-4.7s' }} cx="265" cy="110" r="8" fill="#d8f3ee" opacity="0.75" />
              <circle className="auth-node" style={{ animationDelay: '-6.0s' }} cx="20" cy="95" r="6" fill="#d8f3ee" opacity="0.75" />
              <circle className="auth-node" style={{ animationDelay: '-0.3s' }} cx="350" cy="105" r="6" fill="#d8f3ee" opacity="0.75" />
              <circle className="auth-node" style={{ animationDelay: '-1.6s' }} cx="215" cy="215" r="6" fill="#d8f3ee" opacity="0.75" />
              <circle className="auth-node" style={{ animationDelay: '-2.9s' }} cx="160" cy="10" r="5" fill="#d8f3ee" opacity="0.75" />
              </g>
            </svg>
            <span className="auth-float-card f1">📄 PDF Analysis</span>
            <span className="auth-float-card f2">IEEE Format</span>
            <span className="auth-float-card f3">❝ Auto Citation</span>
          </div>
          <ul>
            <li>Bản đồ tri thức liên kết các nguồn</li>
            <li>Mọi nhận định đều có trích dẫn</li>
            <li>Hỏi đáp trực tiếp với tài liệu PDF</li>
          </ul>
        </div>
      </aside>

      <main className="auth-main auth-enter-up">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand">
          <img src={logo} alt="PaperAI" />
          <div>
            <h1>PaperAI</h1>
            <p>AI Research Assistant</p>
          </div>
        </div>
        <h2>{mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản'}</h2>
        <p className="auth-sub">
          {mode === 'login' ? 'Đăng nhập để tiếp tục nghiên cứu.' : 'Bắt đầu nghiên cứu cùng PaperAI.'}
        </p>

        {mode === 'register' && (
          <label>
            Họ tên
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
          </label>
        )}
        <label>
          {mode === 'login' ? 'Email hoặc tên đăng nhập' : 'Email'}
          <input
            type={mode === 'register' ? 'email' : 'text'}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
          />
        </label>
        <label>
          <span className="auth-label-row">
            Mật khẩu
            {mode === 'login' && (
              <button type="button" className="auth-forgot" onClick={() => setShowForgot((v) => !v)}>
                Quên mật khẩu?
              </button>
            )}
          </span>
          <div className="auth-password">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={mode === 'register' ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            <button
              type="button"
              className="auth-eye"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {mode === 'login' && showForgot && (
            <small className="auth-forgot-note">
              Đặt lại mật khẩu qua email chưa được bật. Vui lòng liên hệ quản trị viên để được cấp lại mật khẩu.
            </small>
          )}
          {mode === 'register' && <small>Tối thiểu 8 ký tự.</small>}
        </label>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="auth-submit" disabled={busy}>
          {busy && <span className="auth-spinner" aria-hidden="true" />}
          {busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
        </button>
        <div className="auth-divider">
          <span>hoặc tiếp tục với</span>
        </div>
        <div className="auth-social">
          <button type="button" className="auth-social-btn" onClick={() => socialSignIn('Google')}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
              <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.200.8-4.700l-7.900-6.100C.9 16.400 0 20.100 0 24s.9 7.600 2.600 10.800l7.900-6.100z" />
              <path fill="#34A853" d="M24 48c6.500 0 11.900-2.100 15.900-5.800l-7.500-5.800c-2.100 1.400-4.800 2.300-8.400 2.300-6.300 0-11.600-4.100-13.500-9.800l-7.900 6.100C6.500 42.600 14.600 48 24 48z" />
            </svg>
            Google
          </button>
          <button type="button" className="auth-social-btn" onClick={() => socialSignIn('GitHub')}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
            </svg>
            GitHub
          </button>
        </div>
        <button
          type="button"
          className="auth-switch"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login')
            setError(null)
          }}
        >
          {mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
        </button>
      </form>
      </main>
    </div>
  )
}
