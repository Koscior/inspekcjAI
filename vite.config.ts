import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === 'production'
      ? [
          VitePWA({
            registerType: 'autoUpdate',
            manifest: {
              name: 'InspekcjAI',
              short_name: 'InspekcjAI',
              description: 'Aplikacja do inspekcji budowlanych i odbiorów',
              theme_color: '#2563eb',
              background_color: '#ffffff',
              display: 'standalone',
              icons: [
                { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
              ],
            },
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}))
