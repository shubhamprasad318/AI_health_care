import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || 'http://localhost:8000'
  const apiOriginPattern = escapeRegex(apiUrl.replace(/\/$/, ''))

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['heart-beat.png', 'user.png'],
        manifest: {
          name: 'AI Health Care Platform',
          short_name: 'AI-Health',
          description: 'AI-powered healthcare platform with disease prediction, health tracking, and virtual doctor consultations',
          theme_color: '#2563EB',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/heart-beat.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/heart-beat.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: new RegExp(`^${apiOriginPattern}/auth/status`),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'auth-cache',
                expiration: { maxEntries: 1, maxAgeSeconds: 300 },
              },
            },
            {
              urlPattern: new RegExp(`^${apiOriginPattern}/health`),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'health-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 600 },
              },
            },
            {
              urlPattern: /^https?:\/\/fonts\.googleapis\.com/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-stylesheets',
              },
            },
            {
              urlPattern: /^https?:\/\/fonts\.gstatic\.com/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
        },
      }),
    ],
  }
})
