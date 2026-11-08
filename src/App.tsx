import React from 'react';
import { initOfflineLibraries } from './lib/offlineLibs';
import { useXBrainEngine } from './hooks/useXBrainEngine';
import { SvgDefs } from './components/ui/SvgDefs';
import { Topbar } from './components/layout/Topbar';
import { Sidebar } from './components/layout/Sidebar';
import { Workspace } from './components/layout/Workspace';
import { GalleryView } from './components/views/GalleryView';
import { BrandSystemView } from './components/views/BrandSystemView';
import { Modals } from './components/modals/Modals';
import { AgentConsoleView } from './components/views/AgentConsole';

// Ensure ECharts and Mermaid are bound to window synchronously on module import
initOfflineLibraries();

export default function App() {
  const { currentAppMode, slides, currentSlideIndex } = useXBrainEngine({ autoMount: true });

  return (
    <>
      <SvgDefs />
      <div
        id="app-shell"
        data-app-mode={currentAppMode}
        data-slide-count={slides.length}
        data-active-slide-index={currentSlideIndex}
        className="flex flex-col h-screen w-screen overflow-hidden bg-[#161D1D]"
      >
        <Topbar />
        <div id="studio-view" className="flex-1 flex overflow-hidden">
          <Sidebar />
          <Workspace />
        </div>
        <GalleryView />
        <BrandSystemView />
      </div>
      <Modals />
      <AgentConsoleView />
    </>
  );
}
