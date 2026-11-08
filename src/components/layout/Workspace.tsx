import React from 'react';
import { Icon } from '../ui/Icon';

export const Workspace: React.FC = () => {
  return (
    <main
      id="main-workspace"
      className="flex-1 relative flex flex-col items-center justify-center bg-[#121717] overflow-hidden p-6"
    >
      {/* Responsive Wrapper that holds the 1920x1080 logical canvas */}
      <div id="canvas-scale-wrapper" className="relative flex items-center justify-center">
        <div id="active-slide-viewport" className="slide-viewport edit-mode-active" />
      </div>

      {/* Floating Presentation Controls (Visible at bottom of workspace & on hover in Fullscreen) */}
      <div
        id="floating-pres-controls"
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-[#1E2727]/95 backdrop-blur-md px-4 py-2 rounded-full border border-[#374746] shadow-2xl"
      >
        <button
          data-click-action="prevSlide"
          className="p-1.5 rounded-full hover:bg-[#2E3B3B] text-slate-200 transition"
          title="Slide trước (Mũi tên trái)"
        >
          <Icon name="chevron-left" className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 px-2">
          <span id="slide-counter-badge" className="font-heading font-extrabold text-sm text-[#FF991D]">
            01 / 16
          </span>
          <span className="text-slate-500">•</span>
          <span id="active-layout-badge" className="text-xs font-heading font-semibold text-slate-200">
            Cover Slide
          </span>
          <span
            id="active-group-badge"
            className="text-[10px] font-heading font-bold uppercase px-2 py-0.5 rounded bg-[#25AC9D]/20 text-[#7FD7BB]"
          >
            Group A
          </span>
        </div>

        <button
          data-click-action="nextSlide"
          className="p-1.5 rounded-full hover:bg-[#2E3B3B] text-slate-200 transition"
          title="Slide tiếp theo (Mũi tên phải / Space)"
        >
          <Icon name="chevron-right" className="w-5 h-5" />
        </button>

        <div className="h-4 w-[1px] bg-[#374746] mx-1" />

        <button
          data-click-action="switchAppMode"
          data-click-arg="'gallery'"
          className="p-1.5 rounded-full hover:bg-[#2E3B3B] text-slate-300 hover:text-white transition"
          title="Tổng quan các slide trong bài trình chiếu"
        >
          <Icon name="grid" className="w-4 h-4" />
        </button>
        <button
          data-click-action="toggleFullscreenPresentation"
          className="p-1.5 rounded-full hover:bg-[#2E3B3B] text-slate-300 hover:text-white transition"
          title="Toàn màn hình (ESC để thoát)"
        >
          <Icon name="maximize-2" className="w-4 h-4" />
        </button>
      </div>
    </main>
  );
};
