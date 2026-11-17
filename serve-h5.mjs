/**
 * serve-h5.mjs — 本地预览 H5 构建产物（零依赖，Node 18+）
 *   node serve-h5.mjs [端口]   默认 8767
 *   npm run preview:h5
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'dist', 'build', 'h5')
const PORT = Number(process.argv[2] || process.env.PORT || 8767)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
}

if (!fs.existsSync(path.join(ROOT, 'index.html'))) {
  console.error('未找到 H5 产物，请先运行：npm run build:h5')
  process.exit(1)
}

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p === '/') p = '/index.html'
  const file = path.join(ROOT, p)
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('404 Not Found')
    return
  }
  res.writeHead(200, {
    'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-cache'
  })
  fs.createReadStream(file).pipe(res)
}).listen(PORT, '127.0.0.1', () => {
  console.log('直觉实验室 H5 预览：http://127.0.0.1:' + PORT + '/')
})
