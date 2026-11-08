import React from 'react';
import { Icon } from '../ui/Icon';

export const Modals: React.FC = () => {
  return (
    <>
      {/* MODAL 1: ADD NEW SLIDE FROM LAYOUT TEMPLATES */}
      <div
        id="modal-add-slide"
        className="hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <div className="bg-[#1C2525] border border-[#344444] rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
          <div className="p-5 border-b border-[#2D3B3B] flex items-center justify-between">
            <div>
              <h3 className="text-lg font-heading font-extrabold text-white">
                Thêm Slide Mới Từ Thư Viện Template
              </h3>
              <p className="text-xs text-slate-400">
                Chọn 1 trong 16 kiểu layout chuẩn thương hiệu Xbrain để chèn vào sau slide hiện tại
              </p>
            </div>
            <button
              data-click-action="closeAddSlideModal"
              className="p-1.5 rounded-lg hover:bg-[#2B3737] text-slate-400 hover:text-white"
            >
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>
          <div
            id="modal-layout-picker-grid"
            className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
          />
        </div>
      </div>

      {/* MODAL 2: LIVE SLIDE JSON CONTENT EDITOR */}
      <div
        id="modal-json-editor"
        className="hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <div className="bg-[#1C2525] border border-[#344444] rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
          <div className="p-5 border-b border-[#2D3B3B] flex items-center justify-between">
            <div>
              <h3 className="text-lg font-heading font-extrabold text-white">
                Cấu Trúc Dữ Liệu Slide Hiện Tại (JSON Content Management)
              </h3>
              <p className="text-xs text-slate-400">
                Nội dung hoàn toàn tách biệt khỏi giao diện. Chỉnh sửa JSON bên dưới và nhấn Cập Nhật để render lại ngay lập tức.
              </p>
            </div>
            <button
              data-click-action="closeDataEditorModal"
              className="p-1.5 rounded-lg hover:bg-[#2B3737] text-slate-400 hover:text-white"
            >
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5 flex-1 flex flex-col overflow-hidden">
            <textarea
              id="json-editor-textarea"
              className="w-full flex-1 min-h-[360px] bg-[#111717] text-emerald-300 font-mono text-xs p-4 rounded-xl border border-[#2D3B3B] focus:outline-none focus:border-[#F97C00]"
              spellCheck={false}
            />
            <div id="json-editor-error" className="hidden mt-2 text-xs text-red-400 font-semibold" />
          </div>
          <div className="p-4 border-t border-[#2D3B3B] bg-[#161D1D] flex items-center justify-between">
            <button
              data-click-action="deleteCurrentSlide"
              className="px-3.5 py-2 rounded-lg text-xs font-heading font-bold bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30"
            >
              Xóa Slide Này
            </button>
            <div className="flex items-center gap-2">
              <button
                data-click-action="closeDataEditorModal"
                className="px-4 py-2 rounded-lg text-xs font-heading font-semibold bg-[#263232] text-slate-300 hover:text-white"
              >
                Hủy
              </button>
              <button
                data-click-action="applyJsonEditorChanges"
                className="px-5 py-2 rounded-lg text-xs font-heading font-bold bg-[#F97C00] hover:bg-[#e07000] text-white"
              >
                Cập Nhật Slide
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 3: CONTENT FORM EDITOR */}
      <div
        id="modal-content-editor"
        className="hidden fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
      >
        <div className="bg-[#1C2525] border border-[#344444] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-white">
          <div className="p-5 flex items-center justify-between border-b border-[#344444]">
            <div>
              <h3 className="font-heading font-extrabold text-xl">Sửa toàn bộ nội dung slide</h3>
              <p className="text-sm text-slate-300">
                Trường chữ và số được ánh xạ trực tiếp đến dữ liệu layout; màu/giá trị kỹ thuật chỉnh qua Slide JSON.
              </p>
            </div>
            <button data-click-action="closeContentEditorModal" className="text-2xl">
              ×
            </button>
          </div>
          <div
            id="content-editor-fields"
            className="p-5 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-3"
          />
          <div className="p-4 flex justify-end gap-3 border-t border-[#344444]">
            <button data-click-action="closeContentEditorModal" className="px-5 py-2 rounded bg-[#263232]">
              Hủy
            </button>
            <button
              data-click-action="applyContentEditor"
              className="px-5 py-2 rounded bg-[#F97C00] text-white font-bold"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>

      {/* PRINT CONTAINER (Renders all slides at 1920x1080 for 16:9 PDF Export) */}
      <div id="print-all-slides-container" className="hidden" />

      {/* ABOUT MODAL */}
      <div
        id="v1-about-modal"
        className="v1-modal hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="v1-about-title"
      >
        <div className="v1-modal-body max-w-[520px] w-[96vw]">
          <div className="v1-modal-head">
            <h3 id="v1-about-title">XBrain Presentation as Code</h3>
            <button
              type="button"
              className="v1-modal-close"
              data-click-action="closeHeaderAbout"
              aria-label="Đóng giới thiệu"
            >
              ×
            </button>
          </div>
          <div className="v1-about-copy">
            <p>
              Phiên bản <strong>1.0.0</strong> · JSON schema <strong>1.0</strong>
            </p>
            <p>
              Tạo, chỉnh sửa và trình chiếu slide theo thương hiệu XBrain. Nội dung và dữ liệu được lưu dưới dạng JSON.
            </p>
            <p>
              Nhận diện theo XBrain Brand Guidelines, tháng 12/2025. Mở trực tiếp bằng file HTML; font và thư viện nâng cao được đóng gói hoạt động hoàn toàn offline.
            </p>
          </div>
          <div className="v1-modal-actions">
            <button type="button" className="v1-btn" data-click-action="closeHeaderAbout">
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* DECK JSON EDITOR MODAL */}
      <div id="v1-deck-modal" className="v1-modal hidden" role="dialog" aria-label="Deck JSON Editor">
        <div className="v1-modal-body h-[min(820px,90vh)]">
          <div className="v1-modal-head">
            <div>
              <h3>Deck JSON · Single Source of Truth</h3>
              <p>Theme · datasets · slides · components · customCss. Chỉnh toàn bộ presentation qua JSON.</p>
            </div>
            <button className="v1-modal-close" data-click-action="deckCloseDeckEditor">
              ×
            </button>
          </div>
          <textarea id="v1-deck-text" spellCheck={false} aria-label="Presentation JSON" />
          <p className="v1-modal-error" id="v1-deck-error" />
          <div className="v1-modal-actions">
            <button className="v1-btn" data-click-action="deckCloseDeckEditor">
              Hủy
            </button>
            <button
              className="v1-btn bg-[#F97C00] border-[#F97C00]"
              data-click-action="deckApplyDeckEditor"
            >
              Áp dụng JSON
            </button>
          </div>
        </div>
      </div>

      {/* SCHEMA MODAL */}
      <div
        id="v1-schema-modal"
        className="v1-modal hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="v1-schema-title"
        aria-describedby="v1-schema-description"
      >
        <div className="v1-modal-body v1-schema-body">
          <div className="v1-modal-head">
            <div>
              <h3 id="v1-schema-title">Schema JSON</h3>
              <p id="v1-schema-description">
                Tra cứu schema JSON để tạo slide.
              </p>
            </div>
            <button
              type="button"
              className="v1-modal-close"
              data-click-action="deckCloseSchema"
              aria-label="Đóng Schema JSON"
            >
              ×
            </button>
          </div>
          <div
            id="v1-schema-panel"
            className="v1-schema-panel"
          >
            <pre id="v1-schema-json" className="v1-schema-json" tabIndex={0} aria-label="Schema JSON" />
          </div>
          <p id="v1-schema-status" className="v1-schema-status" role="status" aria-live="polite" />
          <div className="v1-modal-actions v1-schema-actions">
            <button type="button" className="v1-btn" data-click-action="deckCopySchema">
              Sao chép
            </button>
            <button type="button" className="v1-btn" data-click-action="deckDownloadSchema">
              Tải JSON
            </button>
            <button type="button" className="v1-btn" data-click-action="deckCloseSchema">
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* VISUAL REGISTRY LIBRARY MODAL */}
      <div id="v1-visual-modal" className="v1-modal hidden" role="dialog" aria-label="Visual Registry">
        <div className="v1-modal-body h-[min(780px,90vh)]">
          <div className="v1-modal-head">
            <div>
              <h3>Visual Library · XBrain v1.0.0</h3>
              <p>Chọn một variant → tạo slide composer. Có thể sửa JSON để thay data / layout.</p>
            </div>
            <button className="v1-modal-close" data-click-action="deckCloseLibrary">
              ×
            </button>
          </div>
          <div className="v1-modal-toolbar">
            <input
              id="v1-visual-search"
              type="search"
              placeholder="Search diagram, chart, matrix ..."
              data-input-action="deckFilterLibrary"
            />
            <select id="v1-visual-family" data-change-action="deckFilterLibrary">
              <option value="">All families</option>
              <option value="chart">Chart &amp; Analytics</option>
              <option value="flow">Process &amp; Timeline</option>
              <option value="structure">Strategy &amp; Structure</option>
              <option value="mermaid">Mermaid (optional)</option>
            </select>
          </div>
          <div
            className="px-[22px] pt-[2px] pb-[8px] text-[#9AB2A7] text-[12px] font-heading"
            id="v1-library-count"
          />
          <div className="v1-library-grid" id="v1-visual-grid" />
        </div>
      </div>
    </>
  );
};
