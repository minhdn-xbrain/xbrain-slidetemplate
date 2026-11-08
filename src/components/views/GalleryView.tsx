import React from 'react';
import { Icon } from '../ui/Icon';

export const GalleryView: React.FC = () => {
  return (
    <div id="gallery-view" className="hidden flex-1 overflow-y-auto bg-[#141A1A] p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Gallery Header & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-5 border-b border-[#2B3737] gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F97C00]/15 text-[#FF991D] text-xs font-heading font-bold uppercase tracking-wider mb-2">
              <Icon name="layers" className="w-3.5 h-3.5" />
              <span>Lưới slide</span>
            </div>
            <h2 className="text-3xl font-heading font-extrabold text-white">Tổng quan bài trình chiếu</h2>
            <p className="text-slate-400 text-sm mt-1">
              Chọn một slide để mở trong Soạn thảo (1920×1080), chỉnh sửa nội dung hoặc trình chiếu.
            </p>
          </div>
          <div id="gallery-filter-bar" className="flex flex-wrap items-center gap-2">
            <button
              data-click-action="filterGallery"
              data-click-arg="'ALL'"
              id="gal-filter-ALL"
              className="px-4 py-2 rounded-lg text-xs font-heading font-bold bg-[#F97C00] text-white"
            >
              Tất cả (89)
            </button>
            <button
              data-click-action="filterGallery"
              data-click-arg="'A'"
              id="gal-filter-A"
              className="px-4 py-2 rounded-lg text-xs font-heading font-bold bg-[#222C2C] text-slate-300 hover:text-white"
            >
              Group A — Structure (4)
            </button>
            <button
              data-click-action="filterGallery"
              data-click-arg="'B'"
              id="gal-filter-B"
              className="px-4 py-2 rounded-lg text-xs font-heading font-bold bg-[#222C2C] text-slate-300 hover:text-white"
            >
              Group B — Content (7)
            </button>
            <button
              data-click-action="filterGallery"
              data-click-arg="'C'"
              id="gal-filter-C"
              className="px-4 py-2 rounded-lg text-xs font-heading font-bold bg-[#222C2C] text-slate-300 hover:text-white"
            >
              Group C — Business & Data (6)
            </button>
            <button
              data-click-action="filterGallery"
              data-click-arg="'D'"
              id="gal-filter-D"
              className="px-4 py-2 rounded-lg text-xs font-heading font-bold bg-[#222C2C] text-slate-300 hover:text-white"
            >
              Group D — Diagrams (30)
            </button>
            <button
              data-click-action="filterGallery"
              data-click-arg="'E'"
              id="gal-filter-E"
              className="px-4 py-2 rounded-lg text-xs font-heading font-semibold bg-[#222C2C] text-slate-300 hover:text-white"
            >
              E · Composer
            </button>
          </div>
        </div>

        {/* Thumbnail Grid Container */}
        <div
          id="gallery-grid-container"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7"
        />
      </div>
    </div>
  );
};
