// Enumerates live `xplat dev` server discovery records on the macOS JSC host —
// the Foundation counterpart of src/host/records.ts's node:fs reader. Records
// live in ~/Library/Caches/octane-xplat/cli-go/dev-servers-v1/<key>/server.json
// (XPLAT_DEV_RECORDS_DIR overrides for tests). Unreadable dirs and malformed
// entries are skipped; connectivity failures surface through the connection's
// closed state, not here.
import {
  NSFileManager,
  NSFileModificationDate,
  NSHomeDirectory,
  NSString,
} from '@octane-xplat/platform/macos'
import {
  parseDevtoolsServerRecord,
  type ListedDevtoolsServer,
} from '../record.ts'

export type { ListedDevtoolsServer } from '../record.ts'

const RECORDS_DIR = 'Library/Caches/octane-xplat/cli-go/dev-servers-v1'

function recordsDir(): string {
  return process.env.XPLAT_DEV_RECORDS_DIR ?? `${NSHomeDirectory()}/${RECORDS_DIR}`
}

function readEntries(): ListedDevtoolsServer[] {
  const dir = recordsDir()
  const manager = NSFileManager.defaultManager
  let names: { count: number; objectAtIndex(index: number): unknown } | undefined
  try {
    names = manager.contentsOfDirectoryAtPathError(dir, null)
  } catch {
    return []
  }
  if (!names) return []
  const found: { server: ListedDevtoolsServer; written: number }[] = []
  for (let i = 0; i < names.count; i++) {
    const name = String(names.objectAtIndex(i))
    const file = `${dir}/${name}/server.json`
    try {
      const attrs = manager.attributesOfItemAtPathError(file, null)
      if (!attrs) continue
      const text = NSString.stringWithContentsOfFileEncodingError(
        file,
        4, // NSUTF8StringEncoding
        null,
      )
      const server = parseDevtoolsServerRecord(name, String(text), (path) => path.startsWith('/'))
      if (!server) continue
      const modified = attrs.objectForKey(NSFileModificationDate)
      const written =
        modified && typeof (modified as { timeIntervalSince1970?: unknown }).timeIntervalSince1970 === 'number'
          ? (modified as { timeIntervalSince1970: number }).timeIntervalSince1970
          : 0
      found.push({ server, written })
    } catch {
      continue
    }
  }
  return found.sort((a, b) => b.written - a.written).map(({ server }) => server)
}

/** Returns every structurally valid live record, newest first. */
export function listDevtoolsServers(): ListedDevtoolsServer[] {
  return readEntries()
}
