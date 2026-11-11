// Node-side devtools host entry — `@octane-xplat/devtools/node`.
// The Go `xplat devtools` command (or a direct `node dist/node.js --serve`)
// launches this module; it serves the panel over loopback and prints the
// endpoint as a single JSON line for the launching process.

import { serveDevtools, type DevtoolsHost } from './host/server.ts'
import { listDevtoolsServers } from './host/records.ts'

export { serveDevtools, listDevtoolsServers }
export type { DevtoolsHost } from './host/server.ts'
export type { ListedDevtoolsServer } from './host/records.ts'

/**
 * Starts the panel host. `--port N` pins a port (default 0 = ephemeral);
 * `--json` reports the endpoint as JSON for launchers, otherwise a URL line
 * is printed. Resolves once the server is listening and stays alive until
 * SIGINT/SIGTERM.
 */
export async function devtoolsHostMain(argv: string[] = process.argv.slice(2)): Promise<void> {
  let port = 0
  let json = false

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--json') {
      json = true
    } else if (argv[i] === '--port') {
      port = Number.parseInt(argv[++i] ?? '', 10)
      if (!Number.isInteger(port) || port < 0 || port > 65535) {
        throw new Error('devtools host port must be an integer from 0 to 65535')
      }
    } else {
      throw new Error(`Unknown devtools host argument: ${argv[i]}`)
    }
  }

  const host = await serveDevtools({ port })

  if (json) {
    process.stdout.write(`${JSON.stringify({ endpoint: host.endpoint })}\n`)
  } else {
    process.stdout.write(`Octane Xplat devtools: ${host.endpoint}\n`)
  }

  const close = async () => {
    await host.close()
    process.exit(0)
  }

  process.once('SIGINT', close)
  process.once('SIGTERM', close)
}

const invoked = process.argv[1]

if (invoked && import.meta.url === new URL(`file://${invoked}`).href) {
  devtoolsHostMain().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exit(1)
  })
}
