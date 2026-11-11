import { useCallback } from 'react'
import { App as AntApp } from 'antd'
import { ApiError } from '../api/http'
import { fetchResearchExport, researchExportUrl, type ExportKind, type ExportOptions } from '../api/research'

const FILE_EXT: Record<Exclude<ExportKind, 'pdf'>, string> = { latex: 'zip', bib: 'bib' }

/** Lưu Blob thành tệp tải về. */
function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/**
 * Xuất báo cáo: PDF mở ở tab mới, LaTeX zip / BibTeX tải về.
 * PDF: mở tab trống ngay trong sự kiện click (tránh bị chặn popup) rồi nạp Blob vào.
 * Khi backend trả 409 vì Quality Gate chưa đạt: hỏi người dùng có muốn xuất bản nháp (?draft=true).
 */
export function useResearchExport() {
  const { message, modal } = AntApp.useApp()

  return useCallback(
    async (taskId: string, kind: ExportKind, options: ExportOptions = {}) => {
      const win = kind === 'pdf' ? window.open('', '_blank') : null
      if (win) {
        win.document.title = 'paperai — đang xuất PDF'
        win.document.body.textContent = 'Đang biên dịch PDF, lần đầu có thể mất vài giây...'
      }
      const hide = kind === 'pdf' ? null : message.loading('Đang chuẩn bị tệp...', 0)
      try {
        const blob = await fetchResearchExport(taskId, kind, options)
        if (kind === 'pdf') {
          const url = URL.createObjectURL(blob)
          if (win) win.location.href = url
          else window.open(url, '_blank', 'noopener,noreferrer')
          setTimeout(() => URL.revokeObjectURL(url), 60_000)
        } else {
          const suffix = kind === 'latex' ? `-${options.template ?? 'ieee'}` : ''
          saveBlob(blob, `paperai-${taskId.slice(0, 8)}${suffix}.${FILE_EXT[kind]}`)
        }
      } catch (err) {
        win?.close()
        const detail = err instanceof ApiError ? err.message : 'Không xuất được tệp.'
        if (err instanceof ApiError && err.status === 409 && detail.includes('Quality Gate')) {
          modal.confirm({
            title: 'Báo cáo chưa đạt Quality Gate',
            content: `${detail}\n\nVẫn xuất bản nháp (không phải bản publication-ready)?`,
            okText: 'Xuất bản nháp',
            cancelText: 'Huỷ',
            // click OK là thao tác người dùng mới nên mở/tải trực tiếp không bị chặn
            onOk: () => {
              const a = document.createElement('a')
              a.href = researchExportUrl(taskId, kind, { ...options, draft: true })
              if (kind === 'pdf') {
                a.target = '_blank'
                a.rel = 'noopener noreferrer'
              } else {
                a.download = ''
              }
              a.click()
            },
          })
          return
        }
        message.error(detail)
      } finally {
        hide?.()
      }
    },
    [message, modal],
  )
}

/** Giữ API cũ: chỉ mở PDF. */
export function useOpenResearchPdf() {
  const run = useResearchExport()
  return useCallback(
    (taskId: string, engine: ExportOptions['engine'] = 'latex') => run(taskId, 'pdf', { engine }),
    [run],
  )
}
