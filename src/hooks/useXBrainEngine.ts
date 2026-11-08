import { useEffect, useSyncExternalStore } from 'react';
import { initOfflineLibraries } from '../lib/offlineLibs';
import {
  subscribeEngine,
  getEngineSnapshot,
  mountXBrainStudio,
  selectSlide,
  nextSlide,
  prevSlide,
  filterSidebarSlides,
  filterGallery,
  switchAppMode,
  toggleInlineEdit,
  undoDeck,
  redoDeck,
  addSlideByType,
  DuplicateCurrentSlide,
  deleteCurrentSlide,
  runDeckQA,
  saveDeckJSON,
  downloadEditedHTML,
  XBrainCompiler,
  XB,
} from '../store/xbrainStore';

interface XBrainEngineState {
  slides: any[];
  currentSlide: any | null;
  currentSlideIndex: number;
  currentSidebarFilter: string;
  currentGalleryFilter: string;
  isInlineEditEnabled: boolean;
  currentAppMode: string;
  deckConfig: any;
  layoutCatalog: any[];
  groups: string[];
}

export function useXBrainEngine(options: { autoMount?: boolean } = {}) {
  const { autoMount = false } = options;

  const snapshot = useSyncExternalStore(
    subscribeEngine,
    getEngineSnapshot,
    getEngineSnapshot
  ) as XBrainEngineState;

  useEffect(() => {
    if (autoMount) {
      initOfflineLibraries();
      mountXBrainStudio();
    }
  }, [autoMount]);

  return {
    ...snapshot,
    selectSlide,
    nextSlide,
    prevSlide,
    filterSidebarSlides,
    filterGallery,
    switchAppMode,
    toggleInlineEdit,
    undoDeck,
    redoDeck,
    addSlideByType,
    duplicateCurrentSlide: DuplicateCurrentSlide,
    deleteCurrentSlide,
    runDeckQA,
    saveDeckJSON,
    downloadEditedHTML,
    compiler: XBrainCompiler,
    xb: XB,
  };
}
