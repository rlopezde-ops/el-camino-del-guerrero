import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { viteStaticCopy } from 'vite-plugin-static-copy'

/** e.g. /deazuadesign-portfolio/apps/spanish/ for portfolio; omit for local dev (/) */
const rawBase = process.env.VITE_PAGES_BASE?.trim() || '/'
const base = rawBase === '/' ? '/' : rawBase.endsWith('/') ? rawBase : `${rawBase}/`

export default defineConfig({
  base,
  optimizeDeps: {
    exclude: ['@mintplex-labs/piper-tts-web', '@xenova/transformers'],
  },
  server: {
    headers: {
      // Required for SharedArrayBuffer (ONNX Runtime Web WASM threading)
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  build: {
    // Never inline WASM files as base64 — they must be fetched from a URL
    assetsInlineLimit: 0,
  },
  plugins: [
    react(),
    tailwindcss(),
    // Copy onnxruntime-web WASM files to public/ort-wasm/ so piper-tts-web
    // can load them locally (no CDN required, works offline in PWA mode)
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/onnxruntime-web/dist/*.wasm',
          dest: 'ort-wasm',
        },
      ],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'audio/**/*'],
      manifest: {
        name: 'El Camino del Guerrero - Spanish for Kids',
        short_name: 'SpanishKids',
        description: 'A martial-arts-themed Spanish learning app for the whole family',
        theme_color: '#f59e0b',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'gstatic-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
})
