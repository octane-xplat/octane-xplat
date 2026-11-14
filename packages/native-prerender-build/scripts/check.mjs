import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

for (const name of readdirSync(new URL('../src/', import.meta.url))) {
  if (!name.endsWith('.mjs')) {
    continue
  }

  const result = spawnSync(
    process.execPath,
    ['--check', join(import.meta.dirname, '../src', name)],
    { stdio: 'inherit' },
  )

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}
