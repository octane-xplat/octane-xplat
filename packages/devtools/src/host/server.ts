// Loopback HTTP host for the devtools panel: serves the built panel bundle
// (dist/panel) and the live dev-server records the picker lists. Loopback only
// and no CORS headers — records carry the panel credential, so the API stays
// unreadable to other origins while remaining trivially usable by the served
// page.

import { createServer, type Server } from 'node:http'
import { readFileSync, realpathSync } from 'node:fs'
import { dirname, extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { listDevtoolsServers } from './records.ts'

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
}

export interface DevtoolsHost {
  /** http://127.0.0.1:<port> the panel is served on. */
  endpoint: string
  close(): Promise<void>
}

function packageRoot(): string {
  // host/ sits under src/ (source runs) or dist/ (published runs).
  return dirname(dirname(dirname(fileURLToPath(import.meta.url))))
}

export async function serveDevtools({ port = 0 }: { port?: number } = {}): Promise<DevtoolsHost> {
  const root = realpathSync(packageRoot())
  const panel = join(root, 'dist', 'panel')

  const server: Server = createServer((req, res) => {
    const send = (status: number, body: string | Buffer, type = 'application/json; charset=utf-8') => {
      res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' })
      res.end(body)
    }

    if (req.method !== 'GET') {
      return send(405, '{"error":"method not allowed"}')
    }

    const path = normalize(new URL(req.url ?? '/', 'http://127.0.0.1').pathname)

    if (path === '/devtools/servers') {
      return send(200, JSON.stringify({ servers: listDevtoolsServers() }))
    }

    // '/' and '/app/...' map to the built panel bundle — strict containment,
    // no traversal out of dist/panel.
    const file =
      path === '/' || path === '/app'
        ? join(panel, 'index.html')
        : path.startsWith('/app/')
          ? join(panel, path.slice('/app'.length))
          : null

    if (!file || (path.startsWith('/app/') && !file.startsWith(panel + sep))) {
      return send(404, '{"error":"not found"}')
    }

    try {
      send(200, readFileSync(file), TYPES[extname(file)] ?? 'application/octet-stream')
    } catch {
      send(404, '{"error":"not found"}')
    }
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', () => resolve())
  })

  const address = server.address()

  return {
    endpoint: `http://127.0.0.1:${typeof address === 'object' && address ? address.port : port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      }),
  }
}
