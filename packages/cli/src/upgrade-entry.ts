// Release-owned policy worker. No CLI dispatch or project compiler imports.
import { readFileSync, writeFileSync, statSync, realpathSync } from 'node:fs'
import { Console } from 'node:console'
import { upgradeOperation } from './upgrade-worker.ts'

const [, , input, output] = process.argv

if (!input || !output) {
  throw new Error('Usage: node upgrade-worker.mjs REQUEST.json RESULT.json')
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
    request.protocol !== 'octane-build-worker' ||
    request.version !== 1 ||
    typeof id !== 'string' ||
    !['upgrade-plan', 'upgrade-apply', 'upgrade-install', 'upgrade-verify'].includes(
      request.operation,
    )
  ) {
    throw new Error('Unsupported upgrade worker protocol')
  }

  if (
    typeof request.project !== 'string' ||
    realpathSync(request.project) !== realpathSync(process.cwd())
  ) {
    throw new Error('Worker project must match the selected working directory')
  }

  const data = upgradeOperation(request)

  writeFileSync(
    output,
    JSON.stringify({ protocol: request.protocol, version: 1, id, ok: true, data }),
  )
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)

  console.error(message)
  writeFileSync(
    output,
    JSON.stringify({
      protocol: 'octane-build-worker',
      version: 1,
      id,
      ok: false,
      error: { message },
    }),
  )

  process.exitCode = 1
}
