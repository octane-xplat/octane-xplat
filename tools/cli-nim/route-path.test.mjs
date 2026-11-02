import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { routeFor } from '../../packages/cli/src/route-path.ts'
import { normalizeRouteSegment, routeParamName } from '../../packages/lib/src/route-pattern.ts'
import { assertCurrentNativeBuild, envProbeInputs } from './native-inputs.mjs'

const root = resolve(import.meta.dirname, '../..')
const work = join(root, 'research/nim-cli')
const binary = join(work, `native/env-probe${process.platform === 'win32' ? '.exe' : ''}`)
assertCurrentNativeBuild(root, JSON.parse(readFileSync(join(work, 'native/env-build.json'))), readFileSync(binary), envProbeInputs)
function compare(requests) {
 const wanted = requests.map(request => {
  let value
  if (request.operation === 'route-segment') value = normalizeRouteSegment(request.segment)
  else if (request.operation === 'route-param') value = routeParamName(request.segment) ?? null
  else value = routeFor(request.path, request.markdown ? /\.md$/ : undefined)
  return JSON.parse(JSON.stringify({ ok: true, value }))
 })
 const run = spawnSync(binary, [], { input: requests.map(request => JSON.stringify({ dir: root, ...request })).join('\n') + '\n', encoding: 'utf8',
  env: { ...process.env, PATH: '' }, timeout: 30_000, maxBuffer: 32 * 1024 * 1024 })
 assert.equal(run.status, 0, run.stderr)
 const actual = run.stdout.trim().split('\n').map(JSON.parse)
 assert.equal(actual.length, wanted.length)
 const mismatches = []
 for (let i = 0; i < requests.length; i++) {
  try { assert.deepEqual(actual[i], wanted[i]) }
  catch { mismatches.push({ request: requests[i], expected: wanted[i], actual: actual[i] }) }
 }
 if (mismatches.length) writeFileSync(join(work, 'route-path-mismatches.json'), JSON.stringify(mismatches, null, 2))
 assert.deepEqual(mismatches.slice(0, 20), [])
 console.log(`${requests.length} route path differential cases`)
 return wanted
}

test('segment normalization and optional/splat parameter names match the shared vocabulary', () => {
 const segments = ['', 'index', 'static', '[id]', '[[tab]]', '[...path]', '[[...path]]', '[]', '[[]]', '[...]', '[[...]]', '[x', 'x]', '[x]]', '[[x]',
  ':', ':id', ':id?', ':?', '*', '*path', '*?', '[σ😀]', `x${String.fromCharCode(0xd800)}`, '__proto__', '[constructor]']
 const requests = segments.flatMap(segment => ['route-segment', 'route-param'].map(operation => ({ operation, segment })))
 const wanted = compare(requests)
 assert.deepEqual(wanted[segments.indexOf(':') * 2 + 1].value, '', 'empty parameter names remain distinct from static segments')
 assert.equal(wanted[segments.indexOf('*') * 2 + 1].value, '*')
})

test('file names preserve suffix order, layouts, presentations, duplicate params and Markdown', () => {
 const requests = []
 for (const dir of ['', 'group/', '[id]/[id]/', 'directory//', '../'])
  for (const name of ['index', '_layout', '[id]', '[[tab]]', '[...path]', '[[...path]]', 'plain', 'σ😀', '[]', '[[]]', '__proto__'])
   for (const presentation of ['', '+modal', '+fade', '+push', '+other'])
    for (const platform of ['', '.web', '.ios', '.android', '.mobile', '.macos', '.windows', '.linux', '.native', '.gtk'])
     for (const ext of ['tsx', 'tsrx']) requests.push({ operation: 'route-path', path: `${dir}${name}${presentation}${platform}.${ext}` })
 for (const path of ['index.md', '_layout.md', '[param].md', 'guide/[[...path]].md', 'café 😀.md', 'plain.MD']) requests.push({ operation: 'route-path', path, markdown: true })
 for (const path of ['', '/index.tsx', 'a\\b.tsx', 'name.ios+modal.tsx', 'name.web.ios.tsx', '_layout+fade.web.tsx', '[id]/[id].tsrx', '.tsx', 'index.jsx', 'index.jsx.extra']) requests.push({ operation: 'route-path', path })
 const wanted = compare(requests)
 assert.ok(wanted.some(result => result.value === null), 'layouts must actually be excluded')
 assert.ok(wanted.some(result => result.value?.transition === 'fade' && result.value.presentation === 'push'))
 assert.ok(wanted.some(result => result.value?.params.join(',') === 'id,id'), 'parameter collection retains duplicates')
})
