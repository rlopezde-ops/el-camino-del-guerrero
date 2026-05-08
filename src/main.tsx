import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

// Register service worker — enables offline support and "Add to Home Screen".
// onNeedRefresh fires when a new version has been downloaded and is waiting;
// we reload automatically since this is a game (no user-composed state to lose).
registerSW({
  onNeedRefresh() {
    // Auto-reload when a new SW version is ready — safe for a game app since
    // all durable state lives in IndexedDB, not in-memory.
    window.location.reload();
  },
  onOfflineReady() {
    console.log('[PWA] App is ready to work offline.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
