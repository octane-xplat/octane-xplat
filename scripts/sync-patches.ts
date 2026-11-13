// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Propagates the canonical framework patch set —
// packages/cli/patches/manifest.json + *.patch — to every consumer:
//
//   1. root package.json             patchedDependencies points at
//                                      packages/cli/patches/ directly — no
//                                      second copy lives at the repo root.
//   2. creator templates               local patch files + Bun registrations,
//                                      available before the first install.
//
// `bun run sync:patches` rewrites these outputs. `bun run check:patches` diffs and
// exits 1 on drift.
// --templates regenerates only the starter patch files — those copies are
// generated, not tracked; create's build/prepack and in-repo scaffolds run this
// scope before the files can be read.
//
// Maintainer flow: `bun patch <pkg@version>` → edit → `bun patch --commit`.
// Retain the canonical path in packages/cli/patches/ and the manifest, then
// `bun run sync:patches` + update manifest.json why/dropWhen.

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { managedPackage } from '../packages/create/compatibility.ts'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const CLI_PATCHES = join(repo, 'packages/cli/patches')
const CHECK = process.argv.includes('--check')
const TEMPLATES = process.argv.includes('--templates')

for (const arg of process.argv.slice(2)) {
  if (arg !== '--check' && arg !== '--templates') {
    throw new Error(`sync-patches: unknown option ${arg}`)
  }
}

const manifest = JSON.parse(readFileSync(join(CLI_PATCHES, 'manifest.json'), 'utf8')).patches

const relative = (f) => f.slice(repo.length + 1)

const templates = ['template', 'library-template']
const templatePatches = manifest.filter((patch) => {
  const at = patch.specifier.indexOf('@', 1)
  const pin = managedPackage(patch.specifier.slice(0, at))

  return patch.template !== false && (!pin || pin.version === patch.specifier.slice(at + 1))
})

const syncTemplateFiles = (failures) => {
  const wanted = new Set(templatePatches.map((patch) => patch.file))

  for (const template of templates) {
    const destination = join(repo, 'packages/create', template, 'patches')

    if (!CHECK) {
      mkdirSync(destination, { recursive: true })
    }

    for (const name of existsSync(destination) ? readdirSync(destination) : []) {
      if (!wanted.has(name)) {
        failures.push(`${relative(destination)}/${name} — obsolete starter patch`)
        if (!CHECK) {
          rmSync(join(destination, name))
        }
      }
    }

    for (const patch of templatePatches) {
      const src = join(CLI_PATCHES, patch.file)
      const dst = join(destination, patch.file)

      if (!existsSync(dst) || !readFileSync(src).equals(readFileSync(dst))) {
        failures.push(`${relative(dst)} — starter patch is stale`)
        if (!CHECK) {
          copyFileSync(src, dst)
        }
      }
    }
  }
}

const failures = []

if (!TEMPLATES) {
  const file = join(repo, 'package.json')
  const before = readFileSync(file, 'utf8')
  const pkg = JSON.parse(before)

  pkg.patchedDependencies = Object.fromEntries(
    manifest
      .filter((patch) => patch.repository !== false)
      .flatMap((patch) =>
        (patch.bunSpecifiers ?? [patch.specifier]).map((specifier) => [
          specifier,
          `packages/cli/patches/${patch.file}`,
        ]),
      ),
  )

  const after = JSON.stringify(pkg, null, '\t') + '\n'

  if (before !== after) {
    failures.push('package.json — Bun patchedDependencies are stale')
    if (!CHECK) {
      writeFileSync(file, after)
    }
  }

  for (const template of templates) {
    const file = join(repo, 'packages/create', template, 'package.json')
    const pkg = JSON.parse(readFileSync(file, 'utf8'))

    pkg.patchedDependencies = Object.fromEntries(
      templatePatches.map((patch) => [patch.specifier, `patches/${patch.file}`]),
    )

    const after = JSON.stringify(pkg, null, '\t') + '\n'

    if (after !== readFileSync(file, 'utf8')) {
      failures.push(`${relative(file)} — patch registrations are stale`)
      if (!CHECK) {
        writeFileSync(file, after)
      }
    }
  }
}

syncTemplateFiles(failures)

if (failures.length) {
  console.error(`${CHECK ? 'patch drift' : 'synced'} — ${failures.length} file(s):`)

  for (const f of failures) {
    console.error(`  ${f}`)
  }

  if (CHECK) {
    console.error('\nrun `bun run sync:patches` to regenerate')
    process.exit(1)
  }
} else {
  console.log('patch set in sync')
}
