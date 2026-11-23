#!/usr/bin/env node
// Regenerate (or verify with --check) the tracked xplat-typecheck/ platform
// programs from every workspace tsconfig.envs.json manifest. The generator's
// output is committed so editors discover platform projects right after a
// dependency install; rerun this after editing a manifest, its roots, or the
// dependency/SDK layout it resolves through.
import { globSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import {
  checkEnvPrograms,
  expandEnvPrograms,
  loadEnvManifest,
} from '../packages/cli/src/tsconfig-envs.ts'

const check = process.argv.includes('--check')
const root = resolve(process.cwd(), '.')

const dirs = globSync('{packages,apps,tools,examples}/*/tsconfig.envs.json', { cwd: root })
  .map((path) => dirname(join(root, path)))
  .sort()

const failures: string[] = []

for (const dir of dirs) {
  try {
    const loaded = loadEnvManifest(dir)

    if (!loaded) {
      continue
    }

    if (check) {
      checkEnvPrograms(dir, loaded)
    } else {
      expandEnvPrograms(dir, loaded)
    }
  } catch (error) {
    failures.push(
      `${relative(root, dir)}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

if (failures.length) {
  console.error(
    `${check ? 'check:envs' : 'sync:envs'}: ${failures.length} manifest(s) failed\n` +
      failures.join('\n\n'),
  )
  process.exit(1)
}

console.log(
  `${check ? 'check:envs' : 'sync:envs'}: ${dirs.length} manifests ${check ? 'current' : 'regenerated'}`,
)
