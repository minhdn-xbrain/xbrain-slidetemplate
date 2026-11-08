import { createRoot } from 'react-dom/client';
import { initOfflineLibraries } from './lib/offlineLibs';
import App from './App';
import './index.css';

// Initialize offline ECharts and Mermaid before React renders
initOfflineLibraries();

const rootEl = document.getElementById('root');
if (rootEl) {
  // Clear any static snapshot DOM if opened from an exported index-edited.html file
  rootEl.innerHTML = '';
  createRoot(rootEl).render(<App />);
}
