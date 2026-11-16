// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Check every applicable platform separately; Linux/GTK keep their legacy union.
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import {
  assertPlatformIsolation,
  expandEnvPrograms,
  loadEnvManifest,
} from '../packages/cli/src/tsconfig-envs.ts'

const dir = process.cwd()
const manifest = loadEnvManifest(dir)

if (!manifest) {
  console.error(
    `scripts/typecheck.ts: no ${join(dir, 'tsconfig.envs.json')} — this runner only expands environment manifests`,
  )

  process.exit(1)
}

let programs

try {
  programs = expandEnvPrograms(dir, manifest)
} catch (e) {
  console.error(String(e.message ?? e))
  process.exit(1)
}

for (const { env, configPath } of programs) {
  console.log(`typecheck[${env}]: tsc --runExternalCode --noEmit -p ${configPath}`)

  const listing = spawnSync(
    'bun',
    ['run', 'tsc', '--runExternalCode', '--noEmit', '--listFilesOnly', '-p', configPath],
    {
      cwd: dir,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    },
  )

  if (listing.status !== 0) {
    console.error(listing.stdout, listing.stderr)
    process.exit(listing.status ?? 1)
  }

  try {
    assertPlatformIsolation(env, listing.stdout.split(/\r?\n/))
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }

  const res = spawnSync('bun', ['run', 'tsc', '--runExternalCode', '--noEmit', '-p', configPath], {
    shell: process.platform === 'win32',
    cwd: dir,
    stdio: 'inherit',
  })

  if (res.status !== 0) {
    process.exit(res.status ?? 1)
  }
}
