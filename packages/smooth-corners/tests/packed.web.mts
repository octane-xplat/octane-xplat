import { spawnSync } from 'node:child_process'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
} from 'node:fs'

import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkg = fileURLToPath(new URL('../', import.meta.url))
const scratch = mkdtempSync(join(tmpdir(), 'smooth-packed-'))
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { cwd: pkg, stdio: 'inherit', ...options })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(`${command} failed (${result.status ?? result.signal})`)
  }
}

try {
  const archive = join(scratch, 'smooth.tgz')

  run('bun', ['pm', 'pack', '--ignore-scripts', '--filename', archive])

  const modules = join(scratch, 'node_modules')
  const installed = join(modules, '@octane-xplat', 'smooth-corners')

  mkdirSync(installed, { recursive: true })
  run('tar', ['-xzf', archive, '--strip-components=1', '-C', installed])
  // Only the package under test comes from its tarball. Reuse installed, pinned
  // dependencies (including the patched Octane runtime), without source aliases.
  for (const dependency of ['@lisse/core', '@octane-xplat/jsx', 'octane']) {
    const destination = join(modules, dependency)

    mkdirSync(join(destination, '..'), { recursive: true })
    symlinkSync(realpathSync(join(pkg, 'node_modules', dependency)), destination, 'dir')
  }

  const fixture = join(scratch, 'fixture')

  cpSync(join(pkg, 'e2e', 'fixture'), fixture, { recursive: true })
  console.log(
    `SmoothCorners tarball sha256=${createHash('sha256').update(readFileSync(archive)).digest('hex')}`,
  )

  run(process.execPath, ['e2e/overflow.web.mts'], {
    env: { ...process.env, XPLAT_SMOOTH_FIXTURE: fixture },
  })
} finally {
  rmSync(scratch, { recursive: true, force: true })
}
