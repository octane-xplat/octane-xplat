import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'

// Workspace wiring drift guards. Turbo tasks must be backed by a package
// script, and literal file arguments inside package.json scripts must
// resolve — both classes have shipped stale entries (dead test scripts,
// unbacked turbo tasks) that nothing caught until a manual audit.

const root = join(import.meta.dirname, '..')

// turbo.json is JSONC — drop line comments outside string literals.
function parseJsonc(path: string) {
  const text = readFileSync(path, 'utf8')
  let out = ''
  let inString = false
  let escaped = false

  for (let index = 0; index < text.length; index++) {
    const char = text[index]

    if (inString) {
      out += char
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      out += char
      continue
    }

    if (char === '/' && text[index + 1] === '/') {
      while (index < text.length && text[index] !== '\n') {
        index++
      }
      out += '\n'
      continue
    }

    out += char
  }

  return JSON.parse(out)
}

const manifests = execFileSync('git', ['ls-files', 'package.json', '**/package.json'], {
  cwd: root,
  encoding: 'utf8',
})
  .trim()
  .split('\n')
  .map((file) => ({
    dir: file === 'package.json' ? '.' : dirname(file),
    ...JSON.parse(readFileSync(join(root, file), 'utf8')),
  }))

const byName = new Map(manifests.filter((pkg) => pkg.name).map((pkg) => [pkg.name, pkg]))
const rootScripts = new Set(Object.keys(manifests.find((pkg) => pkg.dir === '.')?.scripts ?? {}))
const allScripts = new Set(manifests.flatMap((pkg) => Object.keys(pkg.scripts ?? {})))

test('every turbo task is backed by a package script', () => {
  const tasks = Object.keys(parseJsonc(join(root, 'turbo.json')).tasks ?? {})
  const missing: string[] = []

  for (const task of tasks) {
    if (task.startsWith('//#')) {
      if (!rootScripts.has(task.slice(3))) {
        missing.push(`${task}: no root script`)
      }
    } else if (task.includes('#')) {
      const [name, script] = task.split('#')
      const pkg = byName.get(name)

      if (!pkg) {
        missing.push(`${task}: unknown package ${name}`)
      } else if (!Object.hasOwn(pkg.scripts ?? {}, script)) {
        missing.push(`${task}: ${name} has no "${script}" script`)
      }
    } else if (!allScripts.has(task)) {
      missing.push(`${task}: no workspace package defines it`)
    }
  }

  assert.deepEqual(missing, [])
})

// A script argument naming a source file — glob characters allowed, but
// quoted/substituted tokens never match and stay unchecked.
const FILE_ARG = /^\.{0,2}\/?[\w@.~-][\w@./~?*-]*\.(?:mjs|mts|cjs|cts|js|ts|py)$/
const GLOB = /[*?[]/

// `*` crosses one path segment, `**` crosses directories.
function globToRegex(pattern: string) {
  const source = pattern
    .split('/')
    .map((segment) =>
      segment === '**'
        ? '(?:[^/]+/)*'
        : segment
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')
            .replace(/\*/g, '[^/]*')
            .replace(/\?/g, '[^/]'),
    )
    .join('/')
    .replace(/\/\(\?:\[\^\/\]\+\/\)\*$/, '(?:/.*)?')

  return new RegExp(`^${source}$`)
}

function countMatches(dir: string, arg: string) {
  if (!GLOB.test(arg)) {
    return existsSync(join(dir, arg)) ? 1 : 0
  }

  const pattern = globToRegex(arg)
  let found = 0

  const walk = (relative: string) => {
    let entries

    try {
      entries = readdirSync(join(dir, relative), { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      const path = relative ? `${relative}/${entry.name}` : entry.name

      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
          walk(path)
        }
      } else if (pattern.test(path)) {
        found++
      }
    }
  }

  walk('')

  return found
}

test('file arguments in package scripts resolve', () => {
  const missing: string[] = []

  for (const pkg of manifests) {
    const dir = pkg.dir === '.' ? root : join(root, pkg.dir)

    for (const [name, command] of Object.entries(pkg.scripts ?? {})) {
      for (const arg of String(command).split(/\s+/)) {
        if (!FILE_ARG.test(arg) || arg.includes('$') || arg.includes('(')) {
          continue
        }

        if (!countMatches(dir, arg)) {
          missing.push(`${pkg.dir}/package.json "${name}": ${arg}`)
        }
      }
    }
  }

  assert.deepEqual(missing, [])
})
