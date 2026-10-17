import { createContext, useContext } from 'react'

export type ArticleLang = 'en' | 'vi' | 'fr' | 'es' | 'de' | 'pt' | 'it' | 'id' | 'ru' | 'zh' | 'ja' | 'ko'

const SCRIPTS: [ArticleLang, RegExp][] = [
  ['ko', /[가-힯]/g],
  ['ja', /[぀-ヿ]/g],
  ['zh', /[一-鿿]/g],
  ['ru', /[Ѐ-ӿ]/g],
]
const VI_DISTINCT = /[ạảãậẩẫắằặẳẵẹẻẽệểễịỉĩọỏõộổỗơớờợởỡụủũưứừựửữỳỵỷỹđ]/gi
const STOPWORDS: Record<string, Set<string>> = Object.fromEntries(
  Object.entries({
    en: 'the of and to in is for that with on as are by this from be an or which we',
    fr: 'le la les des du de et en un une est pour que dans sur avec par au aux ce qui',
    es: 'el la los las de y en un una es para que con por del al se como más su',
    de: 'der die das und ist von zu den mit für auf nicht ein eine im dem des auch',
    pt: 'o a os as de e em um uma é para que com por do da dos das não se mais',
    it: 'il lo la i gli le di e in un una è per che con del della dei non si più',
    id: 'yang dan di ke dari untuk dengan pada ini itu adalah dalam tidak akan atau juga',
  }).map(([k, v]) => [k, new Set(v.split(' '))]),
)

/** Nhận diện ngôn ngữ bài báo (đồng bộ với app/agent/language.py) để nhãn cố định khớp nội dung. */
export function detectArticleLang(text: string): ArticleLang {
  const sample = text.slice(0, 6000)
  const letters = (sample.match(/\p{L}/gu) ?? []).length
  if (letters < 20) return 'en'
  for (const [code, rx] of SCRIPTS) {
    const hits = (sample.match(rx) ?? []).length
    if (hits / letters > 0.2) return code === 'zh' && /[぀-ヿ]/.test(sample) ? 'ja' : code
  }
  const vi = (sample.match(VI_DISTINCT) ?? []).length
  if (vi >= 2 && vi / letters > 0.01) return 'vi'
  const words = (sample.toLowerCase().match(/\p{L}+/gu) ?? [])
  let best: ArticleLang = 'en'
  let bestScore = 1
  for (const [code, set] of Object.entries(STOPWORDS)) {
    const score = words.reduce((n, w) => n + (set.has(w) ? 1 : 0), 0)
    if (score > bestScore) {
      best = code as ArticleLang
      bestScore = score
    }
  }
  return best
}

interface Labels {
  figure: string
  table: string
  chart: string
  diagram: string
  diagramFailed: string
  diagramLoading: string
}

const EN: Labels = {
  figure: 'Figure',
  table: 'Table',
  chart: 'Chart',
  diagram: 'Architecture / workflow diagram',
  diagramFailed: 'Diagram (could not be rendered',
  diagramLoading: 'Rendering diagram…',
}

const LABELS: Record<ArticleLang, Labels> = {
  en: EN,
  vi: { figure: 'Hình', table: 'Bảng', chart: 'Biểu đồ', diagram: 'Sơ đồ kiến trúc / luồng xử lý', diagramFailed: 'Sơ đồ (không render được', diagramLoading: 'Đang dựng sơ đồ…' },
  fr: { figure: 'Figure', table: 'Tableau', chart: 'Graphique', diagram: 'Schéma d’architecture / de flux', diagramFailed: 'Schéma (rendu impossible', diagramLoading: 'Rendu du schéma…' },
  es: { figure: 'Figura', table: 'Tabla', chart: 'Gráfico', diagram: 'Diagrama de arquitectura / flujo', diagramFailed: 'Diagrama (no se pudo renderizar', diagramLoading: 'Renderizando diagrama…' },
  de: { figure: 'Abbildung', table: 'Tabelle', chart: 'Diagramm', diagram: 'Architektur- / Ablaufdiagramm', diagramFailed: 'Diagramm (nicht darstellbar', diagramLoading: 'Diagramm wird erstellt…' },
  pt: { figure: 'Figura', table: 'Tabela', chart: 'Gráfico', diagram: 'Diagrama de arquitetura / fluxo', diagramFailed: 'Diagrama (não foi possível renderizar', diagramLoading: 'Renderizando diagrama…' },
  it: { figure: 'Figura', table: 'Tabella', chart: 'Grafico', diagram: 'Diagramma di architettura / flusso', diagramFailed: 'Diagramma (impossibile da renderizzare', diagramLoading: 'Rendering del diagramma…' },
  id: { figure: 'Gambar', table: 'Tabel', chart: 'Grafik', diagram: 'Diagram arsitektur / alur', diagramFailed: 'Diagram (tidak dapat dirender', diagramLoading: 'Merender diagram…' },
  ru: { figure: 'Рис.', table: 'Таблица', chart: 'График', diagram: 'Схема архитектуры / процесса', diagramFailed: 'Схема (не удалось отобразить', diagramLoading: 'Построение схемы…' },
  zh: { figure: '图', table: '表', chart: '图表', diagram: '架构 / 流程图', diagramFailed: '流程图（无法渲染', diagramLoading: '正在生成图…' },
  ja: { figure: '図', table: '表', chart: 'グラフ', diagram: 'アーキテクチャ / フロー図', diagramFailed: '図（描画できません', diagramLoading: '図を生成中…' },
  ko: { figure: '그림', table: '표', chart: '차트', diagram: '아키텍처 / 흐름도', diagramFailed: '다이어그램(렌더링 실패', diagramLoading: '다이어그램 생성 중…' },
}

export const labelsFor = (lang: ArticleLang): Labels => LABELS[lang] ?? EN

export const ArticleLangContext = createContext<ArticleLang>('en')

export function useArticleLabels(): Labels {
  return labelsFor(useContext(ArticleLangContext))
}
