interface ArticleFigureDatum {
  label: string
  value: number
}

interface ArticleFigureProps {
  number: number
  caption: string
  data: ArticleFigureDatum[]
  unit?: string
}

const WIDTH = 560
const HEIGHT = 220
const PADDING_LEFT = 32
const PADDING_BOTTOM = 28
const PADDING_TOP = 20
const PADDING_RIGHT = 16
const BAR_GAP = 20

export default function ArticleFigure({ number, caption, data, unit = '' }: ArticleFigureProps) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const chartWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT
  const chartHeight = HEIGHT - PADDING_BOTTOM - PADDING_TOP
  const barWidth = (chartWidth - BAR_GAP * (data.length - 1)) / data.length

  return (
    <div className="article-figure-wrap not-article">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="article-figure-svg" role="img" aria-label={caption}>
        <line
          x1={PADDING_LEFT}
          y1={PADDING_TOP}
          x2={PADDING_LEFT}
          y2={HEIGHT - PADDING_BOTTOM}
          className="article-figure-axis"
        />
        <line
          x1={PADDING_LEFT}
          y1={HEIGHT - PADDING_BOTTOM}
          x2={WIDTH - PADDING_RIGHT}
          y2={HEIGHT - PADDING_BOTTOM}
          className="article-figure-axis"
        />
        {data.map((d, i) => {
          const barHeight = (d.value / max) * chartHeight
          const x = PADDING_LEFT + i * (barWidth + BAR_GAP) + BAR_GAP / 2
          const y = HEIGHT - PADDING_BOTTOM - barHeight
          return (
            <g key={d.label}>
              <rect x={x} y={y} width={barWidth} height={barHeight} className="article-figure-bar" rx={2} />
              <text x={x + barWidth / 2} y={HEIGHT - PADDING_BOTTOM + 14} textAnchor="middle" className="article-figure-label">
                {d.label}
              </text>
              <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" className="article-figure-value">
                {d.value}
                {unit}
              </text>
            </g>
          )
        })}
      </svg>
      <p className="article-caption">
        <strong>Figure {number}.</strong> {caption}
      </p>
    </div>
  )
}
