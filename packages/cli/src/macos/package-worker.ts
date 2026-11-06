// Versioned selected-project packaging operation. The native caller publishes.
import {
  readFileSync,
  writeFileSync,
  statSync,
  realpathSync,
  readdirSync,
  lstatSync,
} from 'node:fs'

import { basename, dirname, join } from 'node:path'
import { Console } from 'node:console'
import { packageMacOS } from './package.ts'
import { installedPackageRoot } from '../package-root.ts'

class WorkerFailure extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

const protocol = 'octane-build-worker',
  version = 1

const [, , input, output] = process.argv
if (!input || !output) {
  throw new Error('Usage: node package-worker.js REQUEST.json RESULT.json')
}

globalThis.console = new Console({ stdout: process.stderr, stderr: process.stderr })
let id: unknown = null
try {
  if (statSync(input).size > 64 * 1024 * 1024) {
    throw new Error('Worker request exceeds 64 MiB')
  }

  const request = JSON.parse(readFileSync(input, 'utf8'))
  id = request.id
  if (request.protocol !== protocol || request.version !== version || typeof id !== 'string') {
    throw new Error('Unsupported build worker protocol')
  }

  if (request.operation !== 'macos-package') {
    throw new Error('Unsupported build operation: ' + request.operation)
  }

  if (process.platform !== 'darwin') {
    throw new WorkerFailure('unavailable', 'macOS packaging requires a Mac')
  }

  if (
    typeof request.project !== 'string' ||
    realpathSync(request.project) !== realpathSync(process.cwd())
  ) {
    throw new Error('Worker project must match the selected working directory')
  }

  const stage = request.stagingRoot
  if (
    typeof stage !== 'string' ||
    !lstatSync(stage).isDirectory() ||
    dirname(realpathSync(stage)) !==
      realpathSync(join(process.cwd(), 'artifacts/macos-universal')) ||
    !basename(stage).startsWith('.xplat-macos-') ||
    readdirSync(stage).length
  ) {
    throw new Error('Expected an empty native-owned macOS staging directory')
  }

  for (const name of ['vite', 'octane', '@nativescript/macos-node-api']) {
    if (!installedPackageRoot(process.cwd(), name)) {
      throw new WorkerFailure(
        'prerequisite_missing',
        `Install ${name} in the selected project before building macOS`,
      )
    }
  }

  const data = await packageMacOS(process.cwd(), { stagingRoot: stage, publish: false })
  writeFileSync(output, JSON.stringify({ protocol, version, id, ok: true, data }))
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  writeFileSync(
    output,
    JSON.stringify({
      protocol,
      version,
      id,
      ok: false,
      error: { code: error instanceof WorkerFailure ? error.code : 'execution_failure', message },
    }),
  )

  process.exitCode = 1
}
