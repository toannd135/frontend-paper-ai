import { useEffect, useState } from 'react'
import { BookOpenCheck, Check, FileSearch, Languages, Moon, Quote, ShieldCheck, Sparkles, Sun, Telescope, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'
import { researchingSteps } from '../client/constants'
import { useAuth } from '../auth/AuthContext'
import { useThemeMode } from '../client/state/themeMode'
import './LandingPage.css'

const FEATURES = [
  {
    icon: Telescope,
    tag: 'OpenAlex + kho nội bộ',
    title: 'Tìm kiếm và đọc thông minh',
    text: 'Tìm trong kho tài liệu nội bộ và OpenAlex, rồi phân tích các nguồn liên quan đến chủ đề của bạn.',
  },
  {
    icon: BookOpenCheck,
    tag: 'Tự động',
    title: 'Bài tổng hợp có trích dẫn',
    text: 'Nhận bài báo học thuật có dẫn nguồn rõ ràng, trích dẫn được kiểm tra lại trước khi giao cho bạn.',
  },
  {
    icon: FileSearch,
    tag: 'Có trang và đoạn gốc',
    title: 'Hỏi đáp trực tiếp trên PDF',
    text: 'Tải bài báo PDF lên và hỏi về nội dung. Câu trả lời kèm trang và đoạn trích gốc để bạn đối chiếu.',
  },
]

const FAQ = [
  {
    q: 'PaperAI tìm tài liệu ở đâu?',
    a: 'Trong kho tài liệu nội bộ, kho công bố mở OpenAlex và các file PDF bạn tự tải lên.',
  },
  {
    q: 'Trích dẫn trong bài có đáng tin không?',
    a: 'Mỗi trích dẫn trỏ về trang và đoạn gốc, và agent tự kiểm tra lại trước khi giao kết quả. Dù vậy bạn vẫn nên đối chiếu với nguồn trước khi dùng trong bài nộp.',
  },
  {
    q: 'Tôi có thể hỏi đáp trên PDF của riêng mình không?',
    a: 'Có. Tải PDF lên và đặt câu hỏi, câu trả lời sẽ kèm trang và đoạn trích để bạn kiểm tra.',
  },
  {
    q: 'Giao diện có hỗ trợ tiếng Việt không?',
    a: 'Toàn bộ giao diện, tiến độ xử lý và kết quả đều dùng tiếng Việt.',
  },
]

const DEMO_SENTENCE =
  'Truy xuất kết hợp giúp tăng độ phủ khi tra cứu tài liệu học thuật [1], đồng thời giữ được độ chính xác với các thuật ngữ chuyên ngành [2].'

/** Gõ chữ từng ký tự một lần; bỏ qua hiệu ứng khi người dùng bật giảm chuyển động. */
function useTyping(text: string): string {
  const [n, setN] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? text.length : 0,
  )
  useEffect(() => {
    if (n >= text.length) return
    const t = setTimeout(() => setN((v) => v + 1), 28)
    return () => clearTimeout(t)
  }, [n, text])
  return text.slice(0, n)
}

function renderCited(text: string) {
  return text.split(/(\[\d\])/).map((part, i) =>
    /^\[\d\]$/.test(part) ? (
      <em key={i} className="lp-cite-glow">
        {part}
      </em>
    ) : (
      part
    ),
  )
}

/** Sơ đồ minh hoạ: các nguồn dữ liệu đổ về PaperAI. */
function SourcesDiagram() {
  const nodes = [
    { x: 70, y: 50, label: 'OpenAlex' },
    { x: 70, y: 130, label: 'Kho nội bộ' },
    { x: 70, y: 210, label: 'PDF của bạn' },
  ]
  return (
    <svg viewBox="0 0 360 260" role="img" aria-label="Sơ đồ: OpenAlex, kho nội bộ và PDF của bạn cùng kết nối vào PaperAI" className="lp-svg">
      {nodes.map((n) => (
        <path key={n.label} d={`M ${n.x + 56} ${n.y} C 200 ${n.y}, 190 130, 246 130`} className="lp-svg-link" />
      ))}
      {nodes.map((n) => (
        <g key={n.label}>
          <rect x={n.x - 56} y={n.y - 20} width={112} height={40} rx={8} className="lp-svg-node" />
          <text x={n.x} y={n.y + 5} textAnchor="middle" className="lp-svg-text">
            {n.label}
          </text>
        </g>
      ))}
      <circle cx={280} cy={130} r={38} className="lp-svg-hub" />
      <text x={280} y={135} textAnchor="middle" className="lp-svg-hub-text">
        PaperAI
      </text>
    </svg>
  )
}

export default function LandingPage() {
  const typed = useTyping(DEMO_SENTENCE)
  const { mode, toggle: toggleTheme } = useThemeMode()
  const { user, loading: authLoading, logout } = useAuth()
  // Đã đăng nhập: mọi lời kêu gọi dẫn thẳng vào không gian làm việc.
  const ctaTo = user ? '/workspace' : '/login'
  const ctaState = user ? undefined : { from: '/workspace', mode: 'register' }

  useEffect(() => {
    document.title = 'PaperAI · Nghiên cứu khoa học thông minh hơn'
  }, [])

  return (
    <div className="lp">
      <a className="lp-skip" href="#lp-main">
        Bỏ qua điều hướng
      </a>
      <header className="lp-header">
        <div className="lp-wrap lp-header-inner">
          <Link to="/home" className="lp-brand" aria-label="PaperAI, trang chủ">
            <img src={logo} alt="" />
            <span>PaperAI</span>
          </Link>
          <nav className="lp-nav" aria-label="Điều hướng chính">
            <a href="#tinh-nang">Tính năng</a>
            <a href="#vi-sao">Vì sao PaperAI</a>
            <a href="#hoi-dap">Hỏi đáp</a>
          </nav>
          <div className="lp-actions">
            <button
              type="button"
              className="lp-icon-btn"
              onClick={toggleTheme}
              aria-label={mode === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              title="Đổi giao diện sáng/tối"
            >
              {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {authLoading ? null : user ? (
              <>
                <button type="button" className="lp-btn lp-btn-ghost lp-hide-xs" onClick={logout}>
                  Đăng xuất
                </button>
                <Link to="/workspace" className="lp-btn lp-btn-primary">
                  Vào không gian làm việc
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" state={{ from: '/workspace' }} className="lp-btn lp-btn-ghost">
                  Đăng nhập
                </Link>
                <Link to="/login" state={{ from: '/workspace', mode: 'register' }} className="lp-btn lp-btn-primary lp-hide-xs">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="lp-main">
        <section className="lp-hero lp-wrap" aria-labelledby="lp-title">
          <div className="lp-hero-copy">
            <p className="lp-eyebrow">
              <Zap size={14} aria-hidden /> Trợ lý nghiên cứu khoa học bằng AI
            </p>
            <h1 id="lp-title">Nghiên cứu khoa học thông minh hơn với PaperAI</h1>
            <p className="lp-lead">
              Tìm tài liệu, tổng hợp thành bài báo có trích dẫn tự động và hỏi đáp trực tiếp trên file PDF của bạn.
            </p>
            <div className="lp-cta-row">
              <Link to={ctaTo} state={ctaState} className="lp-btn lp-btn-primary lp-btn-lg">
                Bắt đầu nghiên cứu
              </Link>
              <a href="#tinh-nang" className="lp-btn lp-btn-ghost lp-btn-lg">
                Xem tính năng
              </a>
            </div>
            <div className="lp-proof">
              <p>Dữ liệu qua OpenAlex, gồm công bố từ</p>
              <ul aria-label="Nguồn dữ liệu">
                {['OpenAlex', 'arXiv', 'IEEE', 'Crossref'].map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
            {!user && (
              <p className="lp-note">Đã có tài khoản? <Link to="/login" state={{ from: '/workspace' }}>Đăng nhập</Link></p>
            )}
          </div>

          {/* Minh hoạ giao diện làm việc, chỉ mang tính trang trí. */}
          <figure className="lp-demo" aria-hidden="true">
            <div className="lp-demo-bar">
              <span /> <span /> <span />
              <em>paperai · không gian làm việc</em>
            </div>
            <div className="lp-demo-cols">
              <aside className="lp-demo-side">
                <b>Lịch sử</b>
                <span className="lp-side-active">RAG trong giáo dục</span>
                <span>Học máy y tế</span>
                <span>Mô hình ngôn ngữ</span>
              </aside>
              <div className="lp-demo-body">
                <div className="lp-bubble lp-bubble-user">Ứng dụng RAG trong giáo dục đại học</div>
                <ul className="lp-steps">
                  {researchingSteps.slice(0, 3).map((s) => (
                    <li key={s}>
                      <Check size={14} />
                      {s}
                    </li>
                  ))}
                </ul>
                <div className="lp-bubble lp-bubble-ai">
                  <span className="lp-sticker">
                    <Sparkles size={12} /> AI Generated
                  </span>
                  <strong>1. Giới thiệu</strong>
                  <p>
                    {renderCited(typed)}
                    <span className="lp-caret" />
                  </p>
                  <div className="lp-cites">
                    <span className="lp-cite-badge lp-cite-target">
                      [1] OpenAlex
                      <span className="lp-demo-tip">
                        <b>Trang 4 · 3. Phương pháp</b>
                        “…kết hợp BM25 với vector dày đặc cho độ phủ cao hơn…”
                      </span>
                    </span>
                    <span className="lp-cite-badge">[2] Kho nội bộ</span>
                  </div>
                  <svg className="lp-fake-cursor" viewBox="0 0 16 16" width="16" height="16">
                    <path d="M2 1l11 6-5 1.5L6 14z" />
                  </svg>
                </div>
              </div>
            </div>
            <figcaption className="lp-sr">Minh hoạ giao diện làm việc của PaperAI</figcaption>
          </figure>
        </section>

        <section id="tinh-nang" className="lp-section lp-wrap" aria-labelledby="lp-features">
          <h2 id="lp-features">Bạn có thể làm gì với PaperAI</h2>
          <p className="lp-sub">Từ tìm tài liệu đến viết bài tổng hợp, mọi bước nghiên cứu nằm trong một nơi.</p>
          <ul className="lp-grid lp-bento">
            {FEATURES.map(({ icon: Icon, tag, title, text }, i) => (
              <li key={title} className="lp-card">
                {i === 0 && (
                  <div className="lp-card-visual" aria-hidden="true">
                    <span className="lp-cv-search">Ứng dụng RAG trong giáo dục</span>
                    <span className="lp-cv-line" />
                    <span className="lp-cv-line short" />
                    <span className="lp-cv-line" />
                  </div>
                )}
                <span className="lp-card-icon">
                  <Icon size={26} aria-hidden />
                  <span className="lp-tag">{tag}</span>
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="vi-sao" className="lp-section lp-wrap" aria-labelledby="lp-why">
          <h2 id="lp-why">Vì sao chọn PaperAI</h2>
          <p className="lp-sub">Nguồn mở, trích dẫn kiểm chứng được và giao diện tiếng Việt.</p>
          <ul className="lp-grid lp-why-grid lp-bento-why">
            <li className="lp-why">
              <div className="lp-why-visual">
                <SourcesDiagram />
              </div>
              <span className="lp-card-icon">
                <Telescope size={26} aria-hidden />
                <span className="lp-tag">Tích hợp sẵn</span>
              </span>
              <h3>Nguồn học thuật mở</h3>
              <p>Truy cập dữ liệu công bố từ OpenAlex bên cạnh kho tài liệu riêng và PDF bạn tải lên, tất cả trong một lần tìm.</p>
            </li>
            <li className="lp-why lp-why-hero">
              <div className="lp-why-visual" aria-hidden="true">
                <p className="lp-quote-sentence">
                  Truy xuất kết hợp giúp tăng độ phủ khi tra cứu <span className="lp-hl">tài liệu học thuật<em>[1]</em></span>.
                </p>
                <div className="lp-tooltip">
                  <div className="lp-tooltip-head">
                    <Quote size={14} /> [1] · Trang 4 · 3. Phương pháp
                  </div>
                  <p>“…kết hợp BM25 với vector dày đặc cho độ phủ cao hơn trên truy vấn dài…”</p>
                  <span className="lp-tooltip-src">Trích từ PDF gốc</span>
                </div>
              </div>
              <span className="lp-card-icon">
                <ShieldCheck size={26} aria-hidden />
                <span className="lp-tag">Tự phản biện</span>
              </span>
              <h3>Trích dẫn đáng tin</h3>
              <p>Mỗi trích dẫn chỉ tới trang và đoạn trích gốc, agent tự phản biện để giảm nguy cơ dẫn sai hoặc dẫn nguồn không tồn tại.</p>
            </li>
            <li className="lp-why">
              <div className="lp-why-visual" aria-hidden="true">
                <div className="lp-bubble lp-bubble-user lp-vi-q">Ứng dụng LLM trong chăm sóc khách hàng</div>
                <ul className="lp-steps">
                  {researchingSteps.slice(0, 3).map((st) => (
                    <li key={st}>
                      <Check size={14} />
                      {st}
                    </li>
                  ))}
                  <li className="lp-steps-run">
                    <Sparkles size={14} />
                    {researchingSteps[4]}…
                  </li>
                </ul>
              </div>
              <span className="lp-card-icon">
                <Languages size={26} aria-hidden />
                <span className="lp-tag">100% tiếng Việt</span>
              </span>
              <h3>Giao diện tiếng Việt</h3>
              <p>Hỏi, đọc kết quả và theo dõi tiến độ hoàn toàn bằng tiếng Việt.</p>
            </li>
          </ul>
        </section>

        <section id="hoi-dap" className="lp-section lp-wrap lp-faq" aria-labelledby="lp-faq">
          <h2 id="lp-faq">Câu hỏi thường gặp</h2>
          <div className="lp-faq-list">
            {FAQ.map(({ q, a }) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="lp-band" aria-labelledby="lp-final-title">
          <div className="lp-wrap lp-band-inner">
            <h2 id="lp-final-title">Sẵn sàng bắt đầu bài nghiên cứu tiếp theo?</h2>
            <p>Tạo tài khoản và để PaperAI lo phần tìm tài liệu, trích dẫn và tổng hợp.</p>
            <Link to={ctaTo} state={ctaState} className="lp-btn lp-btn-white lp-btn-lg">
              {user ? 'Vào không gian làm việc' : 'Tạo tài khoản và bắt đầu'}
            </Link>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-inner">
          <div className="lp-footer-brand">
            <Link to="/home" className="lp-brand" aria-label="PaperAI, trang chủ">
              <img src={logo} alt="" />
              <span>PaperAI</span>
            </Link>
            <p>Trợ lý nghiên cứu khoa học bằng AI: tìm tài liệu, tổng hợp trích dẫn và hỏi đáp trên PDF.</p>
          </div>
          <nav className="lp-footer-col" aria-label="Sản phẩm">
            <h2>Sản phẩm</h2>
            <a href="#tinh-nang">Tính năng</a>
            <a href="#vi-sao">Vì sao PaperAI</a>
            <a href="#hoi-dap">Câu hỏi thường gặp</a>
          </nav>
          <nav className="lp-footer-col" aria-label="Tài khoản">
            <h2>Tài khoản</h2>
            {user ? (
              <Link to="/workspace">Không gian làm việc</Link>
            ) : (
              <>
                <Link to="/login" state={{ from: '/workspace' }}>Đăng nhập</Link>
                <Link to="/login" state={{ from: '/workspace', mode: 'register' }}>Đăng ký</Link>
              </>
            )}
          </nav>
        </div>
        <div className="lp-wrap lp-footer-bottom">
          <p>© {new Date().getFullYear()} PaperAI. Kết quả có thể chưa đầy đủ, hãy đối chiếu với nguồn gốc trước khi trích dẫn.</p>
        </div>
      </footer>
    </div>
  )
}
