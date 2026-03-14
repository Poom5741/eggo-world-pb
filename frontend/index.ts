import { serve } from 'bun'
import indexHtml from './index.html'
import callbackHtml from './callback.html'

const server = serve({
  port: 3000,
  routes: {
    '/': indexHtml,
    '/frontend/': indexHtml,
    '/frontend/callback.html': callbackHtml,
  },
  development: {
    hmr: true,
    console: true,
  }
})

console.log(`Server running at http://localhost:${server.port}`)
console.log(`Open http://localhost:${server.port}/frontend/ to test OIDC auth`)
