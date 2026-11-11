// Enumerates live `xplat dev` server discovery records for the panel picker.
// Mirrors dev_server_record.go: records live under the native history cache in
// dev-servers-v1/<app-key>/server.json, one per app, each carrying the panel's
// devtoolsToken. The RPC token is never returned to the panel.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import { isAbsolute, join } from 'node:path'
import {
  parseDevtoolsServerRecord,
  type ListedDevtoolsServer,
} from '../record.ts'

export type { ListedDevtoolsServer } from '../record.ts'

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

      const server = parseDevtoolsServerRecord(key, readFileSync(file, 'utf8'), isAbsolute)
      if (server) found.push({ server, written: info.mtimeMs })
    } catch {
      continue
    }
  }

  return found.sort((a, b) => b.written - a.written).map(({ server }) => server)
}
