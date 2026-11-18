#!/usr/bin/env node
// Package vite build and vitest configs must pin the oxc transform tsconfig
// when the package's root tsconfig.json is a references-style solution: Vite
// 8 resolves each transformed file's governing tsconfig and follows its
// project references — which point at env programs `xplat typecheck`
// generates under node_modules/.cache/xplat-typecheck. Those programs are
// absent on a fresh checkout, so an unpinned `vite build` or `vitest run`
// fails every transform (`build:packages`, `turbo run test`). Affected
// configs pin the committed env manifest (tsconfig.envs.json), or the
// declaration config (tsconfig.types.json) where no env manifest exists.
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

const CONFIG_OPERAND = /(?:^|\s)(?:--config|-c)[=\s]+['"]?(\S+?)['"]?(?=\s|$)/

const firstGlob = (pattern: string) => globSync(pattern)[0]

// Every `vite build` or `vitest` invocation's config. `vite build --config x`
// and `vitest --config x`/`-c x` name the file; a bare `vite build`
// discovers vite.config.*, and a bare `vitest` discovers vitest.config.*
// before falling back to vite.config.*. Each command in a script is
// checked independently.
const collectConfigs = (dir: string, scripts: Record<string, string>) => {
  const configs = new Map<string, string>()
  const missing: string[] = []

  for (const [name, script] of Object.entries(scripts)) {
    for (const command of script.split(/&&|\|\||;/)) {
      const isBuild = /\bvite\s+build\b/.test(command)
      const isVitest = /\bvitest\b/.test(command)
      if (!isBuild && !isVitest) {
        continue
      }

      const operand = CONFIG_OPERAND.exec(command)?.[1]
      if (operand) {
        configs.set(resolve(dir, operand), `${name}: ${command.trim()}`)
        continue
      }

      const discovered = isVitest
        ? (firstGlob(join(dir, 'vitest.config.*')) ?? firstGlob(join(dir, 'vite.config.*')))
        : firstGlob(join(dir, 'vite.config.*'))

      if (discovered) {
        configs.set(discovered, `${name}: ${command.trim()}`)
      } else {
        missing.push(`${name}: ${command.trim()}`)
      }
    }
  }

  return { configs, missing }
}

// The config must pin `tsconfig` to a committed file that exists. A literal
// pin (`tsconfig: 'path'` or `tsconfig: new URL('path', ...)`) must resolve;
// the existsSync fallback chain used by the native suites instead binds
// `tsconfig` to the first existing tsconfig.*.json literal it names.
const PIN = /\btsconfig\s*:\s*(?:new URL\(\s*)?['"]([^'"]+)['"]/m
const MANIFEST_LITERAL = /['"]([^'"]*tsconfig[^'"]*\.json)['"]/g

const stripComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '')

const pinTarget = (config: string) => {
  if (!existsSync(config)) {
    return null
  }

  const source = stripComments(readFileSync(config, 'utf8'))
  const literal = PIN.exec(source)
  if (literal) {
    const target = resolve(dirname(config), literal[1])
    return existsSync(target) ? literal[1] : null
  }

  if (!/\btsconfig\b/.test(source)) {
    return null
  }

  for (const match of source.matchAll(MANIFEST_LITERAL)) {
    if (existsSync(resolve(dirname(config), match[1]))) {
      return match[1]
    }
  }

  return null
}

let failed = false

for (const manifest of globSync(join(root, 'packages/*/package.json'))) {
  const dir = dirname(manifest)
  const scripts = JSON.parse(readFileSync(manifest, 'utf8')).scripts ?? {}
  if (!hasGeneratedReferences(dir)) {
    continue
  }

  const { configs, missing } = collectConfigs(dir, scripts)

  for (const origin of missing) {
    failed = true
    console.error(
      `UNPINNED: ${manifest} runs "${origin}" with no config file — the package's ` +
        `references-style tsconfig.json dangles on a fresh checkout`,
    )
  }

  for (const [config, origin] of configs) {
    const target = pinTarget(config)

    if (target) {
      console.log(`vite transform pinned: ${config} -> ${target} (${origin})`)
    } else {
      failed = true
      console.error(
        `UNPINNED: ${config} (${origin}) — the package's references-style ` +
          `tsconfig.json dangles on a fresh checkout; pin tsconfig to the committed env manifest`,
      )
    }
  }
}

if (failed) {
  console.error(
    'check-vite-tsconfigs: references-style packages must pin their vite/vitest transform tsconfig',
  )
  process.exit(1)
}
