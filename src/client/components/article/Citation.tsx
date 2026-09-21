import { Tooltip } from 'antd'
import type { ResearchSource } from '../../../types'
import { useApp } from '../../state/AppContext'

interface CitationProps {
  ref_: ResearchSource
  displayIndex: number
}

export default function Citation({ ref_, displayIndex }: CitationProps) {
  const { onCitationClick } = useApp()
  return (
    <Tooltip
      title={
        <span>
          <strong>{ref_.title}</strong>
          <br />
          <span style={{ opacity: 0.75 }}>
            {ref_.year} · {ref_.publisher} · {ref_.relevance}% relevance
          </span>
        </span>
      }
    >
      <sup className="citation-chip" onClick={() => onCitationClick(ref_.id)}>
        [{displayIndex}]
      </sup>
    </Tooltip>
  )
}
