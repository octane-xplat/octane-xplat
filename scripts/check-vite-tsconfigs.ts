#!/usr/bin/env node
// Package vite build configs must pin the oxc transform tsconfig when the
// package's root tsconfig.json is a references-style solution: Vite 8
// resolves each transformed file's governing tsconfig and follows its project
// references — which point at env programs `xplat typecheck` generates under
// node_modules/.cache/xplat-typecheck. Those programs are absent on a fresh
// checkout, so an unpinned `vite build` fails every transform
// (`build:packages`). Affected configs pin the committed env manifest
// (tsconfig.envs.json) like the per-package vitest pins.
import { existsSync, globSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import ts from 'typescript-classic'

const root = resolve(process.cwd(), process.argv[2] ?? '.')

// References-style root tsconfig pointing at generated programs (under
// node_modules/.cache) — they dangle until a typecheck run, so vite
// transforms must not follow them. References to committed configs resolve
// on every checkout and need no pin.
const hasGeneratedReferences = (dir: string) => {
  const file = join(dir, 'tsconfig.json')
  if (!existsSync(file)) {
    return false
  }

  const { config } = ts.readConfigFile(file, ts.sys.readFile)
  const references = Array.isArray(config?.references) ? config.references : []

  return references.some(
    (ref) => typeof ref?.path === 'string' && ref.path.includes('node_modules'),
  )
}

// Every `vite build` invocation's config: the `--config` operand, or the
// default vite.config.* discovery a bare invocation performs.
const buildConfigs = (dir: string, build: string) => {
  const configs = new Set<string>()

  for (const match of build.matchAll(/\bvite\s+build(?:\s+--config[=\s](\S+))?/g)) {
    const config = match[1]
    if (config) {
      configs.add(resolve(dir, config))
      continue
    }

    const discovered = globSync(join(dir, 'vite.config.*'))
    if (discovered[0]) {
      configs.add(discovered[0])
    }
  }

  return configs
}

// The config must pin `tsconfig` to a committed file that exists; a bare
// property check alone would pass on a typo'd manifest path.
const PIN = /\btsconfig\s*:\s*(?:new URL\(\s*)?['"]([^'"]+)['"]/m

const stripComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '')

let failed = false

for (const manifest of globSync(join(root, 'packages/*/package.json'))) {
  const dir = dirname(manifest)
  const build = JSON.parse(readFileSync(manifest, 'utf8')).scripts?.build
  if (typeof build !== 'string' || !hasGeneratedReferences(dir)) {
    continue
  }

  if (!/\bvite\s+build\b/.test(build)) {
    continue
  }

  const configs = buildConfigs(dir, build)
  if (configs.size === 0) {
    failed = true
    console.error(
      `UNPINNED: ${manifest} runs vite build with no config file — the package's ` +
        `references-style tsconfig.json dangles on a fresh checkout`,
    )
    continue
  }

  for (const config of configs) {
    const pin = existsSync(config) ? PIN.exec(stripComments(readFileSync(config, 'utf8'))) : null
    const target = pin && resolve(dirname(config), pin[1])

    if (target && existsSync(target)) {
      console.log(`vite build transform pinned: ${config} -> ${pin[1]}`)
    } else {
      failed = true
      console.error(
        `UNPINNED: ${config} — the package's references-style tsconfig.json ` +
          `dangles on a fresh checkout; pin tsconfig to the committed env manifest`,
      )
    }
  }
}

if (failed) {
  console.error(
    'check-vite-tsconfigs: references-style packages must pin their vite build transform tsconfig',
  )
  process.exit(1)
}
