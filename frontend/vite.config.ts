import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

const isHttps = process.env.VITE_HTTPS === 'true' || process.argv.includes('--https')

const backendUrl = 'http://127.0.0.1:8000'

const backendRoutes = [
  '/auth',
  '/plant-health',
  '/crops',
  '/farms',
  '/regions',
  '/markets',
  '/weather',
  '/dashboard',
  '/analytics',
  '/cctv',
  '/api',
  '/demand',
  '/prices',
  '/recommendations',
  '/production',
  '/supply-demand',
  '/schedule',
  '/risk',
  '/market',
  '/simulation',
  '/mandi',
  '/marketplace',
  '/admin',
  '/vision',
]

const proxyConfig: Record<string, any> = {}
backendRoutes.forEach((route) => {
  proxyConfig[route] = {
    target: backendUrl,
    changeOrigin: true,
    secure: false,
    bypass(req: any) {
      if (req.headers.accept?.includes('html')) {
        return '/index.html'
      }
    },
  }
})

export default defineConfig({
  envDir: '..',
  plugins: [
    react(),
    ...(isHttps ? [basicSsl()] : []),
  ],
  server: {
    port: 5173,
    host: true,
    proxy: proxyConfig,
  },
})
