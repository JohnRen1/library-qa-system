import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/qa-front/' : '/',
  plugins: [
    react(),
    {
      name: 'redirect-root-to-frontend',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const path = req.url?.split('?')[0]
          if (path === '/' || path === '/index.html') {
            res.writeHead(302, { Location: '/frontend/' })
            res.end()
            return
          }
          next()
        })
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        frontend: resolve(root, 'frontend/index.html'),
        backend: resolve(root, 'backend/index.html'),
      },
    },
  },
}))
