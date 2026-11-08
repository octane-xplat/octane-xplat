// Selected-project platform diagnostics; host payloads stay in macos-build.
import { readFileSync, writeFileSync, statSync, realpathSync } from 'node:fs'
import { join } from 'node:path'
import { Console } from 'node:console'
import { inspectMacOSDoctor } from './doctor-checks.ts'
import { discoverMacOSNative } from './native.ts'

const protocol = 'octane-build-worker',
  version = 1

const [, , input, output] = process.argv

if (!input || !output) {
  throw new Error('Usage: node doctor-worker.js REQUEST.json RESULT.json')
}

globalThis.console = new Console({ stdout: process.stderr, stderr: process.stderr })

let id: unknown = null

try {
  if (statSync(input).size > 64 * 1024 * 1024) {
    throw new Error('Worker request exceeds 64 MiB')
  }

  const request = JSON.parse(readFileSync(input, 'utf8'))

  id = request.id
  if (
    request.protocol !== protocol ||
    request.version !== version ||
    typeof id !== 'string' ||
    !['macos-doctor', 'macos-dev-preflight'].includes(request.operation)
  ) {
    throw new Error('Unsupported macOS diagnostic worker protocol')
  }

  const root = realpathSync(process.cwd())

  if (typeof request.project !== 'string' || realpathSync(request.project) !== root) {
    throw new Error('Worker project must match the selected working directory')
  }

  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('Expected project package.json object')
  }

  const data =
    request.operation === 'macos-dev-preflight'
      ? { version: 1, root, hasNativeLeaves: discoverMacOSNative(root).leaves.length > 0 }
      : {
          version: 1,
          root,
          rows: await inspectMacOSDoctor(root, manifest, '@octane-xplat/macos-build'),
        }

  writeFileSync(output, JSON.stringify({ protocol, version, id, ok: true, data }))
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)

  console.error(message)
  writeFileSync(output, JSON.stringify({ protocol, version, id, ok: false, error: { message } }))
  process.exitCode = 1
}
