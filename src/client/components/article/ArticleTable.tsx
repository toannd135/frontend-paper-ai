interface ArticleTableProps {
  number: number
  caption: string
  columns: string[]
  rows: (string | number)[][]
}

export default function ArticleTable({ number, caption, columns, rows }: ArticleTableProps) {
  return (
    <div className="article-table-wrap not-article">
      <table className="article-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="article-caption">
        <strong>Table {number}.</strong> {caption}
      </p>
    </div>
  )
}
