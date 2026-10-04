/**
 * Vẽ khối ```chart {json}``` do backend sinh (type bar|barh|line, labels, series[{name,values}]) bằng SVG thuần,
 * cùng spec với app/pipeline/export/typst_renderer.render_chart_spec_to_svg để web và PDF nhất quán.
 */

export interface ChartSpec {
  type?: 'bar' | 'barh' | 'line'
  caption?: string
  title?: string
  labels: (string | number)[]
  series: { name?: string; values: number[] }[]
  x_label?: string
  y_label?: string
}

const PALETTE = ['#1f4e79', '#c55a11', '#548235', '#7f6000', '#7030a0', '#2e75b6']
const W = 560
const H = 300
const PAD = { top: 16, right: 16, bottom: 56, left: 56 }

export function parseChartSpec(raw: string): ChartSpec | null {
  try {
    const spec = JSON.parse(raw) as ChartSpec
    if (!Array.isArray(spec.labels) || !Array.isArray(spec.series)) return null
    const series = spec.series.filter((s) => Array.isArray(s.values) && s.values.length === spec.labels.length)
    if (!spec.labels.length || !series.length) return null
    return { ...spec, series }
  } catch {
    return null
  }
}

function niceMax(values: number[]): number {
  const max = Math.max(0, ...values)
  if (max === 0) return 1
  const pow = 10 ** Math.floor(Math.log10(max))
  const unit = max / pow
  const nice = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10
  return nice * pow
}

export default function ChartFigure({ spec, index }: { spec: ChartSpec; index: number }) {
  const kind = spec.type ?? 'bar'
  const labels = spec.labels.map(String)
  const all = spec.series.flatMap((s) => s.values)
  const min = Math.min(0, ...all)
  const max = niceMax(all)
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const ticks = 5
  const scaleVal = (v: number) => ((v - min) / (max - min || 1)) * (kind === 'barh' ? plotW : plotH)

  const caption = spec.caption || spec.title || ''

  return (
    <figure className="article-figure-wrap">
      <svg
        className="article-figure-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={caption || `Biểu đồ ${index}`}
      >
        {/* grid + axis ticks */}
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const v = min + ((max - min) * i) / ticks
          if (kind === 'barh') {
            const x = PAD.left + scaleVal(v)
            return (
              <g key={i}>
                <line className="article-figure-grid" x1={x} x2={x} y1={PAD.top} y2={H - PAD.bottom} />
                <text className="article-figure-value" x={x} y={H - PAD.bottom + 14} textAnchor="middle">
                  {Number.isInteger(v) ? v : v.toFixed(1)}
                </text>
              </g>
            )
          }
          const y = H - PAD.bottom - scaleVal(v)
          return (
            <g key={i}>
              <line className="article-figure-grid" x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} />
              <text className="article-figure-value" x={PAD.left - 6} y={y + 3} textAnchor="end">
                {Number.isInteger(v) ? v : v.toFixed(1)}
              </text>
            </g>
          )
        })}
        <line className="article-figure-axis" x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={H - PAD.bottom} />
        <line className="article-figure-axis" x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} />

        {kind === 'line'
          ? spec.series.map((s, si) => {
              const step = plotW / Math.max(1, labels.length - 1)
              const pts = s.values.map((v, i) => `${PAD.left + i * step},${H - PAD.bottom - scaleVal(v)}`)
              return (
                <g key={si}>
                  <polyline fill="none" stroke={PALETTE[si % PALETTE.length]} strokeWidth={2} points={pts.join(' ')} />
                  {s.values.map((v, i) => (
                    <circle key={i} cx={PAD.left + i * step} cy={H - PAD.bottom - scaleVal(v)} r={3} fill={PALETTE[si % PALETTE.length]} />
                  ))}
                </g>
              )
            })
          : labels.map((_, li) => {
              const n = spec.series.length
              if (kind === 'barh') {
                const band = plotH / labels.length
                const bh = (band * 0.8) / n
                return spec.series.map((s, si) => {
                  const y = PAD.top + li * band + band * 0.1 + si * bh
                  const w = scaleVal(s.values[li])
                  return (
                    <g key={`${li}-${si}`}>
                      <rect x={PAD.left} y={y} width={w} height={bh} fill={PALETTE[si % PALETTE.length]} />
                      <text className="article-figure-value" x={PAD.left + w + 4} y={y + bh / 2 + 3}>
                        {s.values[li]}
                      </text>
                    </g>
                  )
                })
              }
              const band = plotW / labels.length
              const bw = (band * 0.8) / n
              return spec.series.map((s, si) => {
                const x = PAD.left + li * band + band * 0.1 + si * bw
                const h = scaleVal(s.values[li])
                return (
                  <g key={`${li}-${si}`}>
                    <rect x={x} y={H - PAD.bottom - h} width={bw} height={h} fill={PALETTE[si % PALETTE.length]} />
                    <text className="article-figure-value" x={x + bw / 2} y={H - PAD.bottom - h - 4} textAnchor="middle">
                      {s.values[li]}
                    </text>
                  </g>
                )
              })
            })}

        {/* category labels */}
        {labels.map((label, i) => {
          if (kind === 'barh') {
            const band = plotH / labels.length
            return (
              <text key={i} className="article-figure-label" x={PAD.left - 6} y={PAD.top + i * band + band / 2 + 3} textAnchor="end">
                {label.length > 14 ? label.slice(0, 13) + '…' : label}
              </text>
            )
          }
          const step = kind === 'line' ? plotW / Math.max(1, labels.length - 1) : plotW / labels.length
          const x = kind === 'line' ? PAD.left + i * step : PAD.left + i * step + step / 2
          return (
            <text key={i} className="article-figure-label" x={x} y={H - PAD.bottom + 16} textAnchor="middle">
              {label.length > 14 ? label.slice(0, 13) + '…' : label}
            </text>
          )
        })}
        {spec.x_label && (
          <text className="article-figure-label" x={PAD.left + plotW / 2} y={H - 8} textAnchor="middle">
            {spec.x_label}
          </text>
        )}
        {spec.y_label && (
          <text
            className="article-figure-label"
            transform={`translate(12 ${PAD.top + plotH / 2}) rotate(-90)`}
            textAnchor="middle"
          >
            {spec.y_label}
          </text>
        )}
        {/* legend */}
        {(spec.series.length > 1 || spec.series[0]?.name) &&
          spec.series.map((s, si) => (
            <g key={si} transform={`translate(${W - PAD.right - 120} ${PAD.top + si * 14})`}>
              <rect width={10} height={10} fill={PALETTE[si % PALETTE.length]} />
              <text className="article-figure-label" x={14} y={9}>
                {s.name ?? `Series ${si + 1}`}
              </text>
            </g>
          ))}
      </svg>
      <figcaption className="article-caption">
        <strong>Hình {index}.</strong> {caption}
      </figcaption>
    </figure>
  )
}
