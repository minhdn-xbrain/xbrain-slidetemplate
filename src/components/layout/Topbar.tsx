import React from 'react';
import { Icon } from '../ui/Icon';

export const Topbar: React.FC = () => {
  return (
    <header id="app-topbar" aria-label="Điều khiển bài trình chiếu">
      <div className="v1-header-context">
        <div className="v1-header-logo" aria-label="XBrain">
          <svg role="img" aria-label="XBrain">
            <use href="#xbrain-logo-white" />
          </svg>
        </div>
        <div className="v1-header-document">
          <h1 id="v1-document-name">Bộ trình chiếu mẫu</h1>
          <div className="v1-header-meta">
            <span id="v1-document-count">107 slide</span>
            <span id="v1-draft-status" role="status">
              Chưa lưu nháp
            </span>
          </div>
        </div>
        <nav className="v1-header-modes" aria-label="Chế độ xem">
          <button
            id="tab-btn-workspace"
            type="button"
            className="v1-header-tab"
            aria-current="page"
            data-click-action="switchAppMode"
            data-click-arg="'workspace'"
          >
            Soạn thảo
          </button>
          <button
            id="tab-btn-gallery"
            type="button"
            className="v1-header-tab"
            data-click-action="switchAppMode"
            data-click-arg="'gallery'"
          >
            <span>Tổng quan</span>
          </button>
        </nav>
        <div className="v1-header-menu-host" data-v1-menu="options">
          <button
            id="v1-menu-options-trigger"
            type="button"
            className="v1-header-button"
            aria-haspopup="menu"
            aria-controls="v1-menu-options"
            aria-expanded="false"
            data-v1-menu-trigger="options"
            data-click-action="toggleHeaderMenu"
            data-click-arg="'options'"
          >
            Tùy chọn <Icon name="chevron-down" className="v1-header-chevron" />
          </button>
          <div
            id="v1-menu-options"
            className="v1-header-menu v1-header-menu-end"
            role="menu"
            aria-labelledby="v1-menu-options-trigger"
            hidden
          >
            <button
              id="btn-toggle-edit"
              type="button"
              role="menuitemcheckbox"
              aria-checked="true"
              data-click-action="toggleInlineEdit"
            >
              <span className="v1-menu-check" aria-hidden="true">
                ✓
              </span>
              <span id="edit-mode-label">Chỉnh sửa trực tiếp</span>
            </button>
            <div role="separator" />
            <button
              id="tab-btn-brand"
              type="button"
              role="menuitem"
              data-click-action="switchAppMode"
              data-click-arg="'brand'"
            >
              Hướng dẫn thương hiệu
            </button>
            <button type="button" role="menuitem" data-click-action="openHeaderAbout">
              Giới thiệu XBrain <small>v1.0.0</small>
            </button>
          </div>
        </div>
      </div>
      <div className="v1-header-actions" role="group" aria-label="Thao tác bài trình chiếu">
        <div className="v1-header-start">
          <div className="v1-header-menu-host" data-v1-menu="file">
            <button
              id="v1-menu-file-trigger"
              type="button"
              className="v1-header-button"
              aria-haspopup="menu"
              aria-controls="v1-menu-file"
              aria-expanded="false"
              data-v1-menu-trigger="file"
              data-click-action="toggleHeaderMenu"
              data-click-arg="'file'"
            >
              Tệp <Icon name="chevron-down" className="v1-header-chevron" />
            </button>
            <div
              id="v1-menu-file"
              className="v1-header-menu"
              role="menu"
              aria-labelledby="v1-menu-file-trigger"
              hidden
            >
              <button type="button" role="menuitem" data-click-action="importDeckJSON">
                Mở bài trình chiếu JSON
              </button>
              <div role="separator" />
              <button type="button" role="menuitem" data-click-action="saveLocalDraft">
                Lưu nháp trong trình duyệt
              </button>
              <button type="button" role="menuitem" data-click-action="restoreLocalDraft">
                Khôi phục bản nháp
              </button>
            </div>
          </div>
          <div className="v1-header-history" role="group" aria-label="Lịch sử chỉnh sửa">
            <button
              id="v1-undo"
              type="button"
              className="v1-header-button v1-header-icon"
              data-click-action="undoDeck"
              aria-label="Hoàn tác"
              title="Hoàn tác (Ctrl+Z)"
              disabled
            >
              <Icon name="undo-2" />
            </button>
            <button
              id="v1-redo"
              type="button"
              className="v1-header-button v1-header-icon"
              data-click-action="redoDeck"
              aria-label="Làm lại"
              title="Làm lại (Ctrl+Y)"
              disabled
            >
              <Icon name="redo-2" />
            </button>
          </div>
          <div className="v1-header-menu-host" data-v1-menu="add">
            <button
              id="v1-menu-add-trigger"
              type="button"
              className="v1-header-button"
              aria-haspopup="menu"
              aria-controls="v1-menu-add"
              aria-expanded="false"
              data-v1-menu-trigger="add"
              data-click-action="toggleHeaderMenu"
              data-click-arg="'add'"
            >
              <Icon name="plus" /> Thêm slide <Icon name="chevron-down" className="v1-header-chevron" />
            </button>
            <div
              id="v1-menu-add"
              className="v1-header-menu"
              role="menu"
              aria-labelledby="v1-menu-add-trigger"
              hidden
            >
              <button type="button" role="menuitem" data-click-action="openAddSlideModal">
                Slide từ mẫu
              </button>
              <button type="button" role="menuitem" data-click-action="deckOpenLibrary">
                Biểu đồ / sơ đồ
              </button>
            </div>
          </div>
          <button
            type="button"
            className="v1-header-button"
            data-click-action="openContentEditorModal"
            title="Sửa nội dung của slide hiện tại"
          >
            Sửa nội dung
          </button>
          <div className="v1-header-menu-host" data-v1-menu="ai">
            <button
              id="v1-menu-ai-trigger"
              type="button"
              className="v1-header-button"
              aria-haspopup="menu"
              aria-controls="v1-menu-ai"
              aria-expanded="false"
              data-v1-menu-trigger="ai"
              data-click-action="toggleHeaderMenu"
              data-click-arg="'ai'"
            >
              AI / JSON <Icon name="chevron-down" className="v1-header-chevron" />
            </button>
            <div
              id="v1-menu-ai"
              className="v1-header-menu"
              role="menu"
              aria-labelledby="v1-menu-ai-trigger"
              hidden
            >
              <button type="button" role="menuitem" data-click-action="openAgentConsole">
                AI Console
              </button>
              <button
                id="v1-schema-trigger"
                type="button"
                role="menuitem"
                data-click-action="deckOpenSchema"
                aria-haspopup="dialog"
                aria-controls="v1-schema-modal"
                aria-expanded="false"
              >
                Schema JSON
              </button>
              <div role="separator" />
              <button type="button" role="menuitem" data-click-action="openDataEditorModal">
                JSON của slide hiện tại
              </button>
              <button type="button" role="menuitem" data-click-action="deckOpenDeckEditor">
                JSON toàn bộ bài trình chiếu
              </button>
              <div role="separator" />
              <button type="button" role="menuitem" data-click-action="deckReloadRemote">
                Nạp lại dữ liệu URL
              </button>
            </div>
          </div>
        </div>
        <div className="v1-header-end">
          <button
            id="v1-qa-trigger"
            type="button"
            className="v1-header-button"
            data-click-action="runDeckQA"
            title="Chưa kiểm tra"
          >
            <Icon name="check-circle-2" />
            <span id="v1-qa-label">Kiểm tra</span>
            <span id="v1-qa-status" className="v1-qa-badge" hidden />
          </button>
          <div className="v1-header-menu-host" data-v1-menu="export">
            <button
              id="v1-menu-export-trigger"
              type="button"
              className="v1-header-button v1-header-outline"
              aria-haspopup="menu"
              aria-controls="v1-menu-export"
              aria-expanded="false"
              data-v1-menu-trigger="export"
              data-click-action="toggleHeaderMenu"
              data-click-arg="'export'"
            >
              Xuất <Icon name="chevron-down" className="v1-header-chevron" />
            </button>
            <div
              id="v1-menu-export"
              className="v1-header-menu v1-header-menu-end"
              role="menu"
              aria-labelledby="v1-menu-export-trigger"
              hidden
            >
              <button type="button" role="menuitem" data-click-action="downloadEditedHTML">
                HTML có thể chỉnh sửa
              </button>
              <button type="button" role="menuitem" data-click-action="saveDeckJSON">
                Dữ liệu JSON
              </button>
              <div role="separator" />
              <button type="button" role="menuitem" data-click-action="exportPrintPDF">
                In / PDF
              </button>
            </div>
          </div>
          <button
            id="v1-present"
            type="button"
            className="v1-header-button v1-header-primary"
            data-click-action="startFullscreenPresentation"
          >
            <Icon name="play" /> Trình chiếu
          </button>
        </div>
      </div>
      <input
        id="import-deck-json"
        type="file"
        accept="application/json,.json"
        hidden
        data-change-action="receiveDeckJSON"
        data-change-arg="event"
      />
    </header>
  );
};
