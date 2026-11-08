import React from 'react';

export const Sidebar: React.FC = () => {
  return (
    <aside
      id="app-sidebar"
      className="w-72 bg-[#1A2222] border-r border-[#2B3737] flex flex-col shrink-0 z-20"
    >
      {/* Category Filter Pills (Dynamically synced with active deck groups) */}
      <div
        id="sidebar-filter-bar"
        className="p-3 border-b border-[#2B3737] flex flex-wrap items-center justify-between gap-1"
      >
        <button
          data-click-action="filterSidebarSlides"
          data-click-arg="'ALL'"
          id="side-filter-ALL"
          className="flex-1 py-1 rounded text-[11px] font-heading font-bold bg-[#F97C00] text-white"
        >
          Tất cả
        </button>
        <button
          data-click-action="filterSidebarSlides"
          data-click-arg="'A'"
          id="side-filter-A"
          className="flex-1 py-1 rounded text-[11px] font-heading font-semibold bg-[#242F2F] text-slate-300 hover:text-white"
          title="Group A: Structure Slides"
        >
          Group A
        </button>
        <button
          data-click-action="filterSidebarSlides"
          data-click-arg="'B'"
          id="side-filter-B"
          className="flex-1 py-1 rounded text-[11px] font-heading font-semibold bg-[#242F2F] text-slate-300 hover:text-white"
          title="Group B: Content Slides"
        >
          Group B
        </button>
        <button
          data-click-action="filterSidebarSlides"
          data-click-arg="'C'"
          id="side-filter-C"
          className="flex-1 py-1 rounded text-[11px] font-heading font-semibold bg-[#242F2F] text-slate-300 hover:text-white"
          title="Group C: Business & Data Slides"
        >
          Group C
        </button>
        <button
          data-click-action="filterSidebarSlides"
          data-click-arg="'D'"
          id="side-filter-D"
          className="flex-1 py-1 rounded text-[11px] font-heading font-semibold bg-[#242F2F] text-slate-300 hover:text-white"
          title="Group D: Editable Diagrams"
        >
          Group D
        </button>
        <button
          data-click-action="filterSidebarSlides"
          data-click-arg="'E'"
          id="side-filter-E"
          className="flex-1 py-1 rounded text-[11px] font-heading font-semibold bg-[#242F2F] text-slate-300"
          title="Composer v1"
        >
          E
        </button>
      </div>

      {/* Slide List */}
      <div id="sidebar-slide-list" className="flex-1 overflow-y-auto p-3 space-y-2.5" />

      {/* Bottom Sidebar Info */}
      <div className="p-3 border-t border-[#2B3737] bg-[#151C1C] text-[11px] text-slate-400 flex items-center justify-between">
        <span>
          Phím tắt:{' '}
          <kbd className="px-1.5 py-0.5 bg-[#263232] rounded text-slate-200">←</kbd>{' '}
          <kbd className="px-1.5 py-0.5 bg-[#263232] rounded text-slate-200">→</kbd>{' '}
          <kbd className="px-1.5 py-0.5 bg-[#263232] rounded text-slate-200">Space</kbd>
        </span>
        <button
          data-click-action="DuplicateCurrentSlide"
          className="text-[#FF991D] hover:underline font-semibold"
        >
          Nhân bản
        </button>
      </div>
    </aside>
  );
};
