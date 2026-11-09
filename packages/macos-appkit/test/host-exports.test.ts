import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

// Consumers resolve `./host` types to src/host.d.ts while bundlers load
// src/host.ts. The facade is hand-maintained, so drift is possible — compare
// the export names of both module entry points.
const runtime = readFileSync(new URL('../src/host.ts', import.meta.url), 'utf8')
const facade = readFileSync(new URL('../src/host.d.ts', import.meta.url), 'utf8')

function exportedNames(code: string): string[] {
  const stripped = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  const names: string[] = []

  for (const match of stripped.matchAll(
    /export\s+(?:declare\s+)?(?:function|class|interface|type|const|let|var)\s+([A-Za-z_$][\w$]*)/g,
  )) {
    names.push(match[1])
  }

  for (const match of stripped.matchAll(/export\s+(?:type\s+)?\{([^}]+)\}/g)) {
    for (const part of match[1].split(',')) {
      const name = part
        .trim()
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/)
        .pop()

      if (name) {
        names.push(name)
      }
    }
  }

  return [...new Set(names)].sort()
}

test('host type facade mirrors the host module export surface', () => {
  assert.deepEqual(exportedNames(runtime), exportedNames(facade))
})
