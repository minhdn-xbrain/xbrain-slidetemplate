import * as echarts from 'echarts';
import mermaid from 'mermaid';

export function initOfflineLibraries(): void {
  if (typeof window !== 'undefined') {
    window.echarts = echarts;
    window.mermaid = mermaid;
    window.dispatchEvent(new Event('deck-library-loaded'));
  }
}
