import { spawnSync } from 'node:child_process'
import { cpSync } from 'node:fs'

const result = spawnSync('tsc', ['--runExternalCode', '-p', 'tsconfig.types.json'], {
  stdio: 'inherit',
})

if (result.error) {
  throw result.error
}

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

cpSync('src/engine.d.ts', 'types/generated/engine.d.ts')
cpSync('src/types', 'types/generated/types', { recursive: true })
