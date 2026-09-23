import { useApp } from '../../state/AppContext'
import Citation from './Citation'
import ArticleTable from './ArticleTable'
import ArticleFigure from './ArticleFigure'

const KEYWORDS = ['RAG', 'Large Language Model', 'Customer Service', 'Semantic Retrieval', 'AI Application']

export default function ArticleContent() {
  const { state } = useApp()
  const refs = [...state.selectedIds]
    .map((id) => state.sources.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .sort((a, b) => b.relevance - a.relevance)

  const cite = (n: number) => {
    if (refs.length === 0) return null
    const idx = ((n - 1) % refs.length + refs.length) % refs.length
    return <Citation ref_={refs[idx]} displayIndex={idx + 1} />
  }

  const topic = state.topic || 'Ứng dụng RAG trong hệ thống chăm sóc khách hàng'
  const today = new Date().toLocaleDateString('vi-VN')

  return (
    <div className="article-paper article-prose">
      <p className="article-eyebrow not-article">Research Article</p>
      <h1 className="article-title">{topic}</h1>
      <p className="article-meta not-article">Nguyễn Văn A · PaperAI Research Assistant · {today}</p>

      <div className="article-abstract">
        <h2 className="not-article">Abstract</h2>
        <p>
          Bài báo này trình bày một nghiên cứu về việc ứng dụng kỹ thuật Retrieval-Augmented Generation (RAG) nhằm
          nâng cao chất lượng phản hồi trong các hệ thống chăm sóc khách hàng dựa trên mô hình ngôn ngữ lớn. Thông
          qua khảo sát {refs.length} nguồn tài liệu học thuật, nghiên cứu phân tích kiến trúc hệ thống, đánh giá hiệu
          năng và đề xuất hướng ứng dụng thực tế {cite(1)}
          {cite(2)}.
        </p>
        <p className="article-keywords">
          <strong>Keywords:</strong> {KEYWORDS.join(', ')}
        </p>
      </div>

      <section className="article-section">
        <h2>1. Introduction</h2>
        <p>
          Trong những năm gần đây, các mô hình ngôn ngữ lớn (LLM) đã được ứng dụng rộng rãi trong nhiều lĩnh vực, đặc
          biệt là chăm sóc khách hàng. Tuy nhiên, các mô hình này thường gặp hạn chế về tính cập nhật và độ chính xác
          khi trả lời các câu hỏi mang tính chuyên biệt {cite(3)}. Kỹ thuật Retrieval-Augmented Generation (RAG) ra
          đời nhằm giải quyết vấn đề này bằng cách kết hợp khả năng truy xuất thông tin từ kho dữ liệu bên ngoài với
          khả năng sinh văn bản của LLM {cite(1)}.
        </p>
        <p>
          Nghiên cứu này tập trung phân tích cách RAG được triển khai trong hệ thống chăm sóc khách hàng, đánh giá
          hiệu năng thực tế và đề xuất các hướng cải tiến dựa trên tổng hợp từ {refs.length} nguồn tài liệu học thuật
          đã được lựa chọn.
        </p>
      </section>

      <section className="article-section">
        <h2>2. Related Work</h2>
        <p>
          Nhiều nghiên cứu trước đây đã chỉ ra rằng việc kết hợp truy xuất thông tin với mô hình sinh văn bản giúp
          cải thiện đáng kể độ chính xác của câu trả lời trong các tác vụ đòi hỏi tri thức chuyên sâu {cite(2)}. Các
          chiến lược truy xuất lai (hybrid retrieval) cũng được đề xuất nhằm tối ưu hoá độ liên quan của thông tin
          được truy xuất trong môi trường doanh nghiệp {cite(5)}.
        </p>
        <p>
          Bên cạnh đó, các nghiên cứu về cơ sở dữ liệu vector và tìm kiếm ngữ nghĩa đã cung cấp nền tảng kỹ thuật
          quan trọng cho việc xây dựng các hệ thống truy xuất hiệu quả ở quy mô lớn {cite(6)}.
        </p>
      </section>

      <section className="article-section">
        <h2>3. Methodology</h2>
        <p>
          Nghiên cứu áp dụng phương pháp phân tích tổng hợp (systematic review) kết hợp với đánh giá thực nghiệm trên
          các hệ thống RAG hiện có. Dữ liệu được thu thập từ {refs.length} bài báo học thuật được lựa chọn dựa trên
          mức độ liên quan và số lượng trích dẫn.
        </p>
        <p>
          Quy trình đánh giá bao gồm ba giai đoạn: (1) phân tích kiến trúc hệ thống, (2) đo lường các chỉ số hiệu
          năng như độ trễ và độ chính xác, và (3) tổng hợp các phát hiện thành khuyến nghị ứng dụng thực tế.
        </p>
      </section>

      <section className="article-section">
        <h2>4. Experimental Setup</h2>
        <p>
          Các hệ thống được khảo sát sử dụng kiến trúc truy xuất kết hợp sinh văn bản với cơ sở dữ liệu vector để lưu
          trữ và tìm kiếm ngữ nghĩa. Việc đánh giá được thực hiện trên các bộ dữ liệu mô phỏng tình huống hỗ trợ
          khách hàng thực tế, nhằm phản ánh chính xác điều kiện triển khai trong doanh nghiệp {cite(4)}.
        </p>
      </section>

      <section className="article-section">
        <h2>5. Results</h2>
        <p>
          Kết quả tổng hợp cho thấy các hệ thống ứng dụng RAG có độ chính xác phản hồi cao hơn đáng kể so với các mô
          hình sinh văn bản thuần tuý, đồng thời giảm thiểu hiện tượng "hallucination" — hiện tượng mô hình tạo ra
          thông tin không chính xác {cite(1)}. Tuy nhiên, chi phí suy luận và độ trễ tăng lên do bước truy xuất bổ
          sung {cite(9)}.
        </p>
        <p>
          Về mặt trải nghiệm người dùng, các nghiên cứu ghi nhận mức độ hài lòng cao hơn khi hệ thống có khả năng
          trích dẫn nguồn thông tin rõ ràng trong phản hồi {cite(7)}.
        </p>

        <ArticleTable
          number={1}
          caption="So sánh hiệu năng giữa các kiến trúc hệ thống chăm sóc khách hàng dựa trên LLM."
          columns={['Kiến trúc', 'Độ chính xác (%)', 'Độ trễ (ms)', 'Tỷ lệ hallucination (%)']}
          rows={[
            ['LLM thuần tuý', '71.4', '320', '18.6'],
            ['RAG (dense retrieval)', '86.2', '540', '6.1'],
            ['Hybrid RAG', '91.7', '610', '3.4'],
          ]}
        />

        <ArticleFigure
          number={1}
          caption="Độ chính xác phản hồi (%) theo từng kiến trúc hệ thống được khảo sát."
          data={[
            { label: 'LLM', value: 71.4 },
            { label: 'RAG', value: 86.2 },
            { label: 'Hybrid RAG', value: 91.7 },
          ]}
          unit="%"
        />
      </section>

      <section className="article-section">
        <h2>6. Discussion</h2>
        <p>
          Những phát hiện trên cho thấy RAG là một hướng tiếp cận khả thi để nâng cao chất lượng hệ thống chăm sóc
          khách hàng dựa trên AI, đặc biệt trong bối cảnh doanh nghiệp cần cập nhật thông tin liên tục mà không muốn
          huấn luyện lại toàn bộ mô hình {cite(8)}. Tuy nhiên, việc cân bằng giữa chi phí, độ trễ và độ chính xác vẫn
          là một thách thức cần được nghiên cứu thêm.
        </p>
      </section>

      <section className="article-section">
        <h2>7. Conclusion</h2>
        <p>
          Nghiên cứu đã tổng hợp và phân tích các ứng dụng của kỹ thuật RAG trong hệ thống chăm sóc khách hàng dựa
          trên {refs.length} nguồn tài liệu học thuật. Kết quả cho thấy tiềm năng lớn của phương pháp này trong việc
          cải thiện độ chính xác và độ tin cậy của các hệ thống hỗ trợ tự động, đồng thời gợi mở các hướng nghiên cứu
          tiếp theo liên quan đến tối ưu hoá chi phí và độ trễ trong triển khai thực tế.
        </p>
      </section>

      <section className="article-references">
        <h2 className="not-article">References</h2>
        <ol>
          {refs.map((r, i) => (
            <li id={`ref-${r.id}`} key={r.id}>
              <span className="ref-index">[{i + 1}]</span>
              <span>
                {r.authors} ({r.year}). <em>{r.title}</em>. {r.publisher}.
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
