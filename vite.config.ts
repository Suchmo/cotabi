import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'COTABI',
        short_name: 'COTABI',
        description: 'カップル2人だけの旅行記録アプリ',
        lang: 'ja',
        start_url: '/',
        display: 'standalone',
        background_color: '#11141a',
        theme_color: '#11141a',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // SPAなので、オフライン時に直接URLを開いても(例: /trips/xxx)
        // アプリ本体(index.html)を返し、React Router側でルーティングさせる
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Firebase Storageの写真。一度表示した画像はオフラインでも
            // 表示できるよう、取得済みレスポンスをそのまま使い回す
            urlPattern: ({ url }) =>
              url.hostname === 'firebasestorage.googleapis.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'cotabi-photos',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
