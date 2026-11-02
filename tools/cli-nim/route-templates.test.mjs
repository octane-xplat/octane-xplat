import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { routeTemplateData } from './route-templates.mjs'
import { assertCurrentNativeBuild, envProbeInputs } from './native-inputs.mjs'
const root = resolve(import.meta.dirname, '../..')
const binary = join(root, `research/nim-cli/native/env-probe${process.platform === 'win32' ? '.exe' : ''}`)
assertCurrentNativeBuild(root, JSON.parse(readFileSync(join(root, 'research/nim-cli/native/env-build.json'))), readFileSync(binary), envProbeInputs)
const source = readFileSync(join(root, 'packages/cli/src/commands/routes.ts'), 'utf8')

test('dynamic template expression drift changes its reviewed fingerprint even at the same arity', () => {
 const original = routeTemplateData(source)
 const changed = routeTemplateData(source.replace('export type RootContext = ${contextType}', 'export type RootContext = ${differentContext}'))
 assert.equal(original.data.contracts.parts.length, changed.data.contracts.parts.length)
 assert.deepEqual(original.data.contracts.parts, changed.data.contracts.parts)
 assert.notEqual(original.data.contracts.shapeHash, changed.data.contracts.shapeHash)
})

test('checkout line endings preserve both template text and expression fingerprints', () => {
 assert.deepEqual(routeTemplateData(source.replaceAll('\n', '\r\n')).data, routeTemplateData(source).data)
})

test('the native renderer rejects a mismatched expression shape before producing source', () => {
 const changed = routeTemplateData(source.replace('export type RootContext = ${contextType}', 'export type RootContext = ${differentContext}'))
 const request = { operation: 'route-template', dir: root, name: 'contracts', shape: changed.data.contracts.shapeHash,
  values: changed.data.contracts.parts.slice(1).map(() => '') }
 const run = spawnSync(binary, [], { input: JSON.stringify(request) + '\n', encoding: 'utf8', env: { ...process.env, PATH: '' }, timeout: 5000 })
 assert.equal(run.status, 0, run.stderr)
 // The generated data contains the current canonical shape; a caller still
 // bound to another reviewed shape must fail even with the right slot count.
 const result = JSON.parse(run.stdout)
 assert.equal(result.ok, false)
 assert.match(result.message, /changed its dynamic structure/)
 assert.equal(result.value, undefined)
})
