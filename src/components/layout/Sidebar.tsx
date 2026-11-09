import React from 'react';
import { Icon } from '../ui/Icon';

export const Sidebar: React.FC = () => {
  return (
    <>
      {/* Mobile / Tablet Backdrop when Sidebar Drawer is open */}
      <div
        id="sidebar-mobile-backdrop"
        data-click-action="closeMobileSidebar"
        className="v1-sidebar-backdrop hidden"
        aria-hidden="true"
      />

      <aside
        id="app-sidebar"
        aria-label="Danh sách và quản lý slide"
        className="v1-sidebar bg-[#1A2222] border-r border-[#2B3737] flex flex-col shrink-0 z-30"
      >
        {/* Top Sidebar Header: Title, Active Count, Quick Add & Collapse */}
        <div className="v1-sidebar-header px-3 pt-3 pb-2 border-b border-[#2B3737] bg-[#161E1E]">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-heading font-extrabold text-xs uppercase tracking-wider text-slate-200 truncate">
                Danh sách Slide
              </span>
              <span
                id="sidebar-visible-count"
                className="px-1.5 py-0.5 rounded-md bg-[#243131] border border-[#344646] font-mono text-[10px] font-bold text-[#7FD7BB]"
                title="Số slide hiển thị / Tổng số slide"
              >
                16
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                data-click-action="sidebarOpenAddSlide"
                className="v1-sidebar-add-btn inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#F97C00] hover:bg-[#e07000] text-white font-heading font-bold text-[11px] transition shadow-sm"
                title="Chèn slide mới vào sau trang hiện tại"
              >
                <Icon name="plus" className="w-3.5 h-3.5" />
                <span>Thêm</span>
              </button>
              <button
                type="button"
                id="sidebar-collapse-btn"
                data-click-action="toggleSidebarCollapsed"
                className="v1-sidebar-icon-btn p-1 rounded-md bg-[#222D2D] hover:bg-[#2E3C3C] text-slate-300 hover:text-white border border-[#314141] transition"
                title="Thu gọn bảng danh sách slide để mở rộng vùng soạn thảo"
                aria-label="Thu gọn danh sách slide"
              >
                <Icon name="chevron-left" className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Search / Filter Input */}
          <div className="v1-sidebar-search-wrap relative flex items-center">
            <input
              id="sidebar-search-input"
              type="search"
              data-input-action="searchSidebarSlides"
              data-input-arg="event"
              placeholder="Tìm tiêu đề, layout, nhóm hoặc số trang..."
              aria-label="Tìm kiếm slide trong danh sách"
              className="v1-sidebar-search w-full rounded-lg bg-[#111717] border border-[#2B3939] focus:border-[#F97C00] focus:outline-none px-2.5 py-1.5 text-[11px] text-slate-100 placeholder-slate-500 transition"
            />
          </div>
        </div>

        {/* Dynamic Group Filter Pills (Synced with active deck groups) */}
        <div
          id="sidebar-filter-bar"
          role="toolbar"
          aria-label="Lọc slide theo nhóm"
          className="v1-sidebar-filters px-3 py-2 border-b border-[#2B3737] flex items-center gap-1.5 overflow-x-auto"
        >
          <button
            type="button"
            data-click-action="filterSidebarSlides"
            data-click-arg="'ALL'"
            id="side-filter-ALL"
            className="v1-sidebar-chip active shrink-0 py-1 px-2.5 rounded-md text-[11px] font-heading font-bold bg-[#F97C00] text-white"
          >
            Tất cả
          </button>
        </div>

        {/* Slide List */}
        <div
          id="sidebar-slide-list"
          role="listbox"
          aria-label="Các trang trình chiếu"
          className="v1-sidebar-list flex-1 overflow-y-auto p-2.5 space-y-2"
        />

        {/* Bottom Sidebar Quick Actions & Shortcuts */}
        <div className="v1-sidebar-footer px-3 py-2.5 border-t border-[#2B3737] bg-[#151C1C] text-[11px] text-slate-400 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              data-click-action="sidebarOpenContentEditor"
              className="v1-sidebar-foot-btn flex-1 py-1 px-2 rounded-md bg-[#222D2D] hover:bg-[#2C3A3A] border border-[#324242] text-slate-200 font-heading font-semibold text-[11px] transition text-center"
              title="Mở biểu mẫu chỉnh sửa chi tiết nội dung slide đang chọn"
            >
              Sửa biểu mẫu
            </button>
            <button
              type="button"
              data-click-action="DuplicateCurrentSlide"
              className="v1-sidebar-foot-btn flex-1 py-1 px-2 rounded-md bg-[#222D2D] hover:bg-[#2C3A3A] border border-[#324242] text-[#FF991D] font-heading font-bold text-[11px] transition text-center"
              title="Nhân bản slide hiện tại (Ctrl+D)"
            >
              Nhân bản
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
            <span>
              Phím tắt:{' '}
              <kbd className="px-1 py-0.5 bg-[#243030] rounded text-slate-200 font-mono">←</kbd>{' '}
              <kbd className="px-1 py-0.5 bg-[#243030] rounded text-slate-200 font-mono">→</kbd>{' '}
              <kbd className="px-1 py-0.5 bg-[#243030] rounded text-slate-200 font-mono">Ctrl+D</kbd>
            </span>
            <span className="text-slate-500">Kéo-thả để sắp xếp</span>
          </div>
        </div>
      </aside>
    </>
  );
};
