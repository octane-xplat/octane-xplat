// Enumerates live `xplat dev` server discovery records for the panel picker.
// Mirrors dev_server_record.go: records live under the native history cache in
// dev-servers-v1/<app-key>/server.json, one per app, each carrying the panel's
// devtoolsToken. The RPC token is never returned to the panel.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import { isAbsolute, join } from 'node:path'

function cacheRoot(): string {
  if (platform() === 'darwin') return join(homedir(), 'Library', 'Caches')
  if (process.platform === 'win32') {
    return process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local')
  }
  return process.env.XDG_CACHE_HOME ?? join(homedir(), '.cache')
}

export function devServerRecordsDir(): string {
  return process.env.XPLAT_DEV_RECORDS_DIR ?? join(cacheRoot(), 'octane-xplat', 'cli-go', 'dev-servers-v1')
}

export interface ListedDevtoolsServer {
  /** app-key directory the record was published under. */
  key: string
  appRoot: string
  endpoint: string
  instanceId: string
  devtoolsToken: string
}

const ENDPOINT = /^http:\/\/127\.0\.0\.1:\d{1,5}\/rpc$/

// Light validation only — connectDevtools enforces the full contract before
// opening a socket. Records that fail here are omitted, not fatal.
function parseRecord(key: string, data: string): ListedDevtoolsServer | null {
  let record: unknown

  try {
    record = JSON.parse(data)
  } catch {
    return null
  }

  if (
    typeof record !== 'object' ||
    record === null ||
    (record as { protocol?: unknown }).protocol !== 'octane-dev-server' ||
    (record as { version?: unknown }).version !== 1
  ) {
    return null
  }

  const {
    appRoot,
    endpoint,
    instanceId,
    devtoolsToken,
  } = record as {
    appRoot?: unknown
    endpoint?: unknown
    instanceId?: unknown
    devtoolsToken?: unknown
  }

  if (
    typeof appRoot !== 'string' ||
    !isAbsolute(appRoot) ||
    typeof endpoint !== 'string' ||
    !ENDPOINT.test(endpoint) ||
    typeof instanceId !== 'string' ||
    !/^[a-f0-9]{32}$/.test(instanceId) ||
    typeof devtoolsToken !== 'string' ||
    !/^[a-f0-9]{64}$/.test(devtoolsToken)
  ) {
    return null
  }

  return { key, appRoot, endpoint, instanceId, devtoolsToken }
}

/** Returns every structurally valid live record, newest first. */
export function listDevtoolsServers(): ListedDevtoolsServer[] {
  const root = devServerRecordsDir()
  const found: { server: ListedDevtoolsServer; written: number }[] = []

  if (!existsSync(root)) return []

  for (const key of readdirSync(root)) {
    const file = join(root, key, 'server.json')

    try {
      const info = statSync(file)
      if (!info.isFile()) continue

      const server = parseRecord(key, readFileSync(file, 'utf8'))
      if (server) found.push({ server, written: info.mtimeMs })
    } catch {
      continue
    }
  }

  return found.sort((a, b) => b.written - a.written).map(({ server }) => server)
}
