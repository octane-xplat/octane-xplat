import { resolve } from 'node:path'
import { runRendererFixture } from './renderer-fixture-core.mjs'

const fixtures = {
  projection: {
    entry: resolve(import.meta.dirname, 'port/projection-smoke.mjs'),
    title: 'GTK projection smoke',
    marker: 'GTK_PROJECTION',
    input: false,
    checks: 14,
  },
  'ui-popover': {
    title: 'Octane GTK Popover test',
    marker: 'GTK_POPOVER',
    input: true,
    checks: { properties: 38, os: 70 },
  },
  'ui-sheet': {
    title: 'Octane GTK Sheet test',
    marker: 'GTK_SHEET',
    input: true,
    checks: { properties: 8, os: 60 },
  },
  'ui-focus': {
    title: 'Octane GTK Focus test',
    marker: 'GTK_FOCUS',
    input: true,
    checks: { properties: 20, os: 45 },
  },
  'ui-theme': {
    title: 'Octane GTK Theme test',
    marker: 'GTK_THEME',
    input: true,
    checks: { properties: 8, os: 4 },
  },
}

const stem = process.argv[2] ?? 'ui-popover'
const engine = process.argv[3] ?? process.env.LINUX_RUNTIME_EVAL_ENGINE ?? 'native'
const fixture = fixtures[stem]
if (!fixture) {
  throw Error(`Unsupported renderer fixture: ${stem}; supported: ${Object.keys(fixtures).join(', ')}`)
}

await runRendererFixture({ stem, ...fixture, engine })
