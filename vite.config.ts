import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

const SPA_SHOP_GETS = new Set(['/shop', '/shop/', '/shop/verify-email', '/shop/reset-password'])

function contentSecurityPolicy(): Plugin {
  const policy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data: https://trovara.farm https://www.trovara.farm",
    "media-src 'self'",
    "font-src 'self' data:",
    "connect-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
  ].join('; ')

  return {
    name: 'trovara-shop-csp-meta',
    apply: 'build',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => ({
        html,
        tags: [
          {
            tag: 'meta',
            attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
            injectTo: 'head-prepend',
          },
        ],
      }),
    },
  }
}

export default defineConfig(({ mode }) => {
  loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue(), contentSecurityPolicy()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: '127.0.0.1',
      port: 5174,
      strictPort: true,
      proxy: {
        '/shop': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          bypass(req) {
            const path = (req.url ?? '').split('?')[0]
            if ((req.method === 'GET' || req.method === 'HEAD') && SPA_SHOP_GETS.has(path)) {
              return '/index.html'
            }
          },
        },
      },
    },
    preview: {
      host: '127.0.0.1',
      port: 4174,
      strictPort: true,
    },
  }
})
