import React from 'react';

export const AgentConsoleView: React.FC = () => {
  return (
    <section
      id="v1-agent-console"
      className="v1-agent-console"
      data-testid="xb-agent-console"
      role="region"
      aria-label="XBrain AI Console"
      hidden
    >
      <header className="v1-agent-header">
        <div className="v1-agent-brand">
          <div className="v1-agent-title-row">
            <span className="v1-agent-eyebrow">XBRAIN COMPILER &amp; AGENT RUNTIME v1.0</span>
            <span className="v1-agent-api-badge" title="Public programmatic facade available at window.XB.agent">
              window.XB.agent
            </span>
          </div>
          <h1>AI Console · Presentation as Code Workbench</h1>
          <p>
            Môi trường kiểm thử kép cho Người dùng &amp; AI Agent: Candidate tách biệt Studio · Đo lường DOM 1920×1080 thật · Brand QA · Diff/Rebase &amp; Strict Commit
          </p>
        </div>

        <div className="v1-agent-toolbar" role="toolbar" aria-label="AI Console actions">
          <div className="v1-agent-cluster" role="group" aria-label="1. Đồng bộ và xung đột">
            <span className="v1-agent-cluster-label">1. Nạp &amp; Đồng bộ</span>
            <div className="v1-agent-cluster-btns">
              <button type="button" data-testid="xb-agent-sync" data-v1-agent-action="sync" title="Sao chép bộ slide hiện tại từ Studio sang vùng nháp Candidate">
                Sync from Studio
              </button>
              <button type="button" data-testid="xb-agent-diff" data-v1-agent-action="diff" title="So sánh sự khác biệt giữa Candidate và Studio hiện tại">
                Diff vs Studio
              </button>
              <button type="button" data-testid="xb-agent-rebase" data-v1-agent-action="rebase" title="Đồng bộ lại mốc Studio revision mà vẫn giữ nguyên nội dung Candidate">
                Rebase candidate
              </button>
            </div>
          </div>

          <div className="v1-agent-cluster" role="group" aria-label="2. Kiểm tra và đo lường QA">
            <span className="v1-agent-cluster-label">2. Kiểm tra &amp; Đo lường QA</span>
            <div className="v1-agent-cluster-btns">
              <button type="button" data-testid="xb-agent-validate" data-v1-agent-action="validate" title="Kiểm tra nhanh cấu trúc JSON Schema và dữ liệu hợp lệ">
                Validate
              </button>
              <select id="v1-agent-render-scope" data-testid="xb-agent-render-scope" aria-label="Render scope" defaultValue="all">
                <option value="all">All slides</option>
                <option value="selected">Selected slide</option>
              </select>
              <button type="button" className="v1-agent-primary" data-testid="xb-agent-render" data-v1-agent-action="render" title="Render thật trên khung 1920x1080 và đo lường lỗi tràn lề, đè chữ, Brand QA">
                Render preview
              </button>
              <button type="button" data-testid="xb-agent-cancel" data-v1-agent-action="cancel" title="Huỷ lượt render đang chạy">
                Cancel
              </button>
              <button type="button" data-testid="xb-agent-inspect" data-v1-agent-action="inspect" title="Trích xuất danh sách chi tiết các phát hiện QA của lượt render gần nhất">
                Inspect QA
              </button>
            </div>
          </div>

          <div className="v1-agent-cluster" role="group" aria-label="3. Tự động sửa chữa">
            <span className="v1-agent-cluster-label">3. Sửa lỗi tự động</span>
            <div className="v1-agent-cluster-btns">
              <button type="button" data-testid="xb-agent-propose-repair" data-v1-agent-action="propose" title="Đề xuất phương án tự động sửa lỗi deterministic mà không làm mất dữ liệu">
                Propose repair
              </button>
              <button type="button" data-testid="xb-agent-accept-repair" data-v1-agent-action="accept" title="Chấp nhận bản đề xuất sửa lỗi vào Candidate">
                Accept repair
              </button>
            </div>
          </div>

          <div className="v1-agent-cluster" role="group" aria-label="4. Commit và xuất bản">
            <span className="v1-agent-cluster-label">4. Commit &amp; Xuất bản</span>
            <div className="v1-agent-cluster-btns">
              <button type="button" className="v1-agent-accent" data-testid="xb-agent-commit" data-v1-agent-action="commit" title="Đưa Candidate đã vượt qua Strict QA vào trình soạn thảo Studio">
                Commit to Studio
              </button>
              <button type="button" data-testid="xb-agent-export-static" data-v1-agent-action="export" title="Xuất file HTML độc lập (yêu cầu vượt qua Strict QA)">
                Export HTML
              </button>
              <button type="button" data-testid="xb-agent-export-json" data-v1-agent-action="export-json" title="Xuất tài liệu JSON v1.0 đã kiểm định">
                Export JSON
              </button>
              <button type="button" data-testid="xb-agent-export-images" data-v1-agent-action="export-images" title="Kết xuất hàng loạt ảnh slide chuẩn 1920x1080 PNG kèm mã băm SHA-256">
                Export 1920x1080 PNGs
              </button>
              <button type="button" data-testid="xb-agent-export-reviewed" data-v1-agent-action="export-reviewed" title="Xuất HTML kèm chứng nhận đã duyệt thị giác (Visual Review)">
                Export reviewed HTML
              </button>
              <button type="button" data-testid="xb-agent-artifact" data-v1-agent-action="artifact" title="Xem metadata, dung lượng và SHA-256 checksum của gói xuất bản">
                Inspect artifact
              </button>
              <button type="button" data-testid="xb-agent-download" data-v1-agent-action="download" title="Tải tệp artifact về máy">
                Download artifact
              </button>
              <button type="button" className="v1-agent-back-btn" data-v1-agent-action="close" title="Đóng AI Console và quay lại màn hình soạn thảo Studio">
                Studio
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="v1-agent-body">
        {/* Live Telemetry & State Bar (Human + Machine Readable) */}
        <div className="v1-agent-status" role="status" aria-live="polite">
          <div className="v1-agent-status-pills">
            <span className="v1-agent-pill" data-testid="xb-agent-ready" data-state="booting">
              Booting
            </span>
            <span className="v1-agent-pill">
              Candidate rev: <strong data-testid="xb-agent-revision">none</strong>
            </span>
            <span className="v1-agent-pill" data-testid="xb-agent-candidate-status" data-state="empty">
              Candidate state: empty
            </span>
            <span className="v1-agent-pill" data-testid="xb-agent-studio-status" data-state="aligned">
              Studio: <strong data-testid="xb-agent-studio-revision">none</strong> · aligned
            </span>
            <span className="v1-agent-pill" data-testid="xb-agent-qa-summary" data-state="unavailable">
              QA: not measured
            </span>
            <span className="v1-agent-pill" data-testid="xb-agent-brand-summary" data-state="unavailable">
              Brand QA: pending
            </span>
          </div>

          <div className="v1-agent-next-banner" data-testid="xb-agent-next-step" data-recommended-action="sync">
            <span className="v1-agent-next-tag">Gợi ý bước tiếp theo</span>
            <span data-testid="xb-agent-next-text">
              Nhấn &ldquo;Sync from Studio&rdquo; hoặc nạp JSON ở mục Data actions để khởi tạo Candidate.
            </span>
          </div>
        </div>

        {/* 3-Column Visual & Diagnostic Workbench */}
        <div className="v1-agent-grid">
          {/* Column 1: Deck Structure Tree */}
          <section className="v1-agent-panel" aria-label="Deck structure">
            <div className="v1-agent-panel-head">
              <div>
                <h2>Deck structure</h2>
                <span className="v1-agent-subtext" data-testid="xb-agent-slide-count">
                  0 slides
                </span>
              </div>
              <div className="v1-agent-mini-actions">
                <button type="button" data-v1-agent-action="prev-slide" title="Chọn slide trước">
                  ← Prev
                </button>
                <button type="button" data-v1-agent-action="next-slide" title="Chọn slide tiếp theo">
                  Next →
                </button>
              </div>
            </div>

            <div className="v1-agent-tree-filter">
              <input
                type="search"
                data-testid="xb-agent-tree-search"
                placeholder="Lọc nhanh theo tiêu đề, ID, layout..."
                aria-label="Filter candidate slides"
              />
            </div>

            <ol className="v1-agent-tree" data-testid="xb-agent-deck-tree" role="tree" aria-label="Slide structure" />
            <button type="button" data-testid="xb-agent-more-slides" data-v1-agent-action="more" hidden>
              Show more slides
            </button>
          </section>

          {/* Column 2: 1920x1080 Scaled Preview & Provenance Overlay */}
          <section className="v1-agent-panel" aria-label="Rendered preview">
            <div className="v1-agent-panel-head">
              <div>
                <h2>Rendered preview (1920×1080)</h2>
                <span className="v1-agent-subtext" data-testid="xb-agent-active-slide-label">
                  Chưa chọn slide
                </span>
              </div>
              <div className="v1-agent-mini-actions">
                <button
                  type="button"
                  data-v1-agent-action="scope-selected"
                  title="Tự động điền Scope JSON theo slide đang chọn để sửa lỗi nhanh"
                >
                  Scope to slide
                </button>
                <button
                  type="button"
                  data-v1-agent-action="clear-highlight"
                  title="Tắt khung đỏ đánh dấu vùng lỗi trên bản xem trước"
                >
                  Clear highlight
                </button>
              </div>
            </div>

            <div className="v1-agent-preview" data-testid="xb-agent-preview" data-state="empty">
              <iframe title="Rendered slide preview" sandbox="allow-scripts" />
              <div className="v1-agent-highlight" data-testid="xb-agent-highlight" hidden />
            </div>

            <div className="v1-agent-preview-foot">
              <p className="v1-agent-note" data-testid="xb-agent-preview-status">
                No rendered preview.
              </p>
              <span className="v1-agent-coord-hint">
                Click vào bất kỳ lỗi nào bên phải để định vị tọa độ phần tử và tô sáng trên khung 1920×1080.
              </span>
            </div>
          </section>

          {/* Column 3: QA & Brand Inspector */}
          <section className="v1-agent-panel" aria-label="QA inspector">
            <div className="v1-agent-panel-head">
              <div>
                <h2>QA inspector</h2>
                <span className="v1-agent-subtext" data-testid="xb-agent-findings-count">
                  Chưa có kết quả đo
                </span>
              </div>
              <div className="v1-agent-mini-actions">
                <button
                  type="button"
                  data-v1-agent-action="scope-finding"
                  title="Gán Scope JSON chính xác vào đường dẫn dữ liệu (dataPath) của lỗi đang chọn"
                >
                  Scope to finding
                </button>
              </div>
            </div>

            <div className="v1-agent-finding-filters" role="group" aria-label="Filter QA findings">
              <button type="button" data-v1-agent-action="filter-findings" data-filter="all" aria-pressed="true">
                All
              </button>
              <button type="button" data-v1-agent-action="filter-findings" data-filter="error" aria-pressed="false">
                Errors
              </button>
              <button type="button" data-v1-agent-action="filter-findings" data-filter="warning" aria-pressed="false">
                Warnings
              </button>
              <button type="button" data-v1-agent-action="filter-findings" data-filter="brand" aria-pressed="false">
                Brand QA
              </button>
            </div>

            <div className="v1-agent-findings" data-testid="xb-agent-findings">
              No findings.
            </div>
          </section>
        </div>

        {/* Bottom Workbench: Candidate JSON, Patch & Scope, API Response & Execution Log */}
        <div className="v1-agent-inputs">
          <section className="v1-agent-section" aria-label="Data actions">
            <div className="v1-agent-section-head">
              <div>
                <h2>Data actions · Candidate &amp; Scoped Patch</h2>
                <p className="v1-agent-helper-copy">
                  Nạp toàn bộ tài liệu JSON v1.0 hoặc áp dụng JSON Patch theo phạm vi (Scope) cho từng slide/component.
                </p>
              </div>
              <div className="v1-agent-mini-actions">
                <button
                  type="button"
                  data-v1-agent-action="fill-from-studio"
                  title="Chép JSON hiện tại từ Studio vào ô Candidate JSON để chỉnh sửa"
                >
                  Copy from Studio
                </button>
                <button
                  type="button"
                  data-v1-agent-action="template-patch"
                  title="Tạo mẫu JSON Patch mẫu cho slide đang chọn"
                >
                  Insert patch template
                </button>
                <button
                  type="button"
                  data-v1-agent-action="format-json"
                  title="Định dạng đẹp (Pretty-print) các ô JSON bên dưới"
                >
                  Format JSON
                </button>
              </div>
            </div>

            <label htmlFor="v1-agent-deck-input">Candidate deck JSON (schema version &quot;1.0&quot;)</label>
            <textarea
              id="v1-agent-deck-input"
              data-testid="xb-agent-deck-input"
              defaultValue={'{\n  "version": "1.0",\n  "slides": [\n    {\n      "id": "agent-1",\n      "type": "composer",\n      "title": "Agent slide",\n      "components": [\n        { "type": "text", "text": "Edited in AI Console" }\n      ]\n    }\n  ]\n}'}
            />
            <div className="v1-agent-buttons">
              <button type="button" className="v1-agent-primary" data-testid="xb-agent-load-candidate" data-v1-agent-action="load">
                Load candidate JSON
              </button>
              <button type="button" data-v1-agent-action="candidate">
                Show candidate JSON
              </button>
              <button type="button" data-v1-agent-action="state">
                Refresh state
              </button>
              <button type="button" data-testid="xb-agent-reset" data-v1-agent-action="reset">
                Reset candidate
              </button>
            </div>

            <div className="v1-agent-patch-grid">
              <div>
                <label htmlFor="v1-agent-patch-input">JSON Patch operations (RFC 6902)</label>
                <textarea
                  id="v1-agent-patch-input"
                  data-testid="xb-agent-patch-input"
                  defaultValue={'[\n  { "op": "replace", "path": "/slides/0/title", "value": "Patched title" }\n]'}
                />
              </div>
              <div>
                <label htmlFor="v1-agent-scope">Optional scope JSON (slideId + sourcePath)</label>
                <textarea id="v1-agent-scope" data-testid="xb-agent-scope" placeholder='{"slideId":"agent-1","sourcePath":"/slides/0"}' />
              </div>
            </div>

            <label className="v1-agent-checkbox-label">
              <input id="v1-agent-accept-deck" data-testid="xb-agent-accept-deck" type="checkbox" /> Allow deck-wide repair escalation when scoped repair touches shared dependencies
            </label>
            <div className="v1-agent-buttons">
              <button type="button" data-testid="xb-agent-patch-preview" data-v1-agent-action="preview-patch">
                Preview patch
              </button>
              <button type="button" className="v1-agent-primary" data-testid="xb-agent-apply-patch" data-v1-agent-action="apply-patch">
                Apply patch
              </button>
            </div>
          </section>

          <section className="v1-agent-section" aria-label="Response, visual review and log">
            <div className="v1-agent-section-head">
              <div>
                <h2>Response JSON &amp; Telemetry</h2>
                <p className="v1-agent-helper-copy">
                  Phản hồi chuẩn hóa từ <code>window.XB.agent</code> kèm trạng thái revision, mã lỗi và lịch sử thực thi.
                </p>
              </div>
              <div className="v1-agent-buttons">
                <button type="button" data-testid="xb-agent-copy-response" data-v1-agent-action="copy-response">
                  Copy response JSON
                </button>
              </div>
            </div>
            <pre className="v1-agent-output" data-testid="xb-agent-response-json">
              No operation run yet.
            </pre>

            <div className="v1-agent-subblock">
              <h2>External visual review sign-off</h2>
              <label htmlFor="v1-agent-review-evidence">External review evidence (artifact / screenshot / reviewer ref)</label>
              <div className="v1-agent-inline-form">
                <input
                  id="v1-agent-review-evidence"
                  data-testid="xb-agent-review-evidence"
                  type="text"
                  defaultValue="external-screenshot-check"
                  className="v1-agent-text-input"
                />
                <button type="button" data-testid="xb-agent-mark-review" data-v1-agent-action="review">
                  Record external approval
                </button>
              </div>
            </div>

            <div className="v1-agent-subblock">
              <div className="v1-agent-log-head">
                <h2>Execution log</h2>
                <div className="v1-agent-buttons">
                  <label htmlFor="v1-agent-log-filter" className="v1-agent-inline-label">
                    Log filter
                  </label>
                  <select id="v1-agent-log-filter" data-testid="xb-agent-log-filter" defaultValue="all">
                    <option value="all">All</option>
                    <option value="ok">OK</option>
                    <option value="error">Error</option>
                  </select>
                  <button type="button" data-testid="xb-agent-clear-log" data-v1-agent-action="clear-log">
                    Clear log
                  </button>
                </div>
              </div>
              <pre className="v1-agent-log" data-testid="xb-agent-execution-log" />
            </div>
          </section>
        </div>
      </div>
    </section>
  );
};
