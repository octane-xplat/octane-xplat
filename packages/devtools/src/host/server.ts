// Loopback HTTP host for the devtools panel: serves the static panel app, the
// compiled client module, and the live dev-server records the picker lists.
// Loopback only and no CORS headers — records carry the panel credential, so
// the API stays unreadable to other origins while remaining trivially usable
// by the served page.

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
  const app = join(root, 'app')
  const dist = join(root, 'dist')

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

    // '/app/...' maps to the static panel sources; '/dist/...' exposes the
    // compiled client module so the panel can import connectDevtools. Both
    // are strict containment checks — no traversal out of either root.
    const base = path === '/' ? null : path.startsWith('/app/') ? app : path.startsWith('/dist/') ? dist : null
    const file =
      path === '/'
        ? join(app, 'index.html')
        : base
          ? join(base, path.slice(base === app ? '/app'.length : '/dist'.length))
          : null

    if (!file || (base && !file.startsWith(base + sep))) {
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
