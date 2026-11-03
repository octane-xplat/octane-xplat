// The shipped worker runs the canonical JS contract; no native regex substitute.
import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { spawnSync } from 'node:child_process'
import { writeFileSync, readFileSync, rmSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { scratchRun } from './scratch.mjs'
import { validateActionDeclaration, validateActionInput, validateActionOutput } from '../../packages/cli/src/mcp/contracts/actions.ts'
const root = resolve(import.meta.dirname, '../..'), scratch = scratchRun(root, 'action-validator')
after(() => rmSync(scratch, { recursive: true, force: true }))
const worker = join(root, 'packages/build/dist/build-worker.js')
const base = { id: 'fixture.check', title: 'Check a fixture', description: 'Contract only; no handler executes', effects: { summary: 'none' } }
let sequence = 0
function check(action, phase, value) {
 const id = 'contract-' + (++sequence), input = join(scratch, 'request.json'), output = join(scratch, 'result.json')
 writeFileSync(input, JSON.stringify({ protocol: 'octane-build-worker', version: 1, id, operation: 'action-validate', project: scratch, action, phase, value }))
 const result = spawnSync(process.execPath, [worker, input, output], { cwd: scratch, encoding: 'utf8', timeout: 10000,
  env: { ...process.env, NODE_PATH: '', NODE_OPTIONS: '' } })
 assert.equal(result.status, 0, result.stderr)
 const reply = JSON.parse(readFileSync(output)); assert.equal(reply.id, id); assert.equal(reply.ok, true)
 const declaration = validateActionDeclaration(action)
 assert.deepEqual(reply.data, { declaration, checked: declaration.length ? null : (phase === 'input' ? validateActionInput(action.input, value) : validateActionOutput(action.result, value)) })
 return reply.data
}
test('real JS regex, UTF-16 lengths, defaults, nested fields and enum identity retain the canonical validator', () => {
 for (const [pattern, value] of [[String.raw`^(a+)\1$`, 'aaaa'], [String.raw`(?<=start)end`, 'startend'], [String.raw`^(a+)\1$`, 'aaa'], ['^..$', '😀']]) {
  const result = check({ ...base, input: { fields: { text: { type: 'string', pattern, minLength: 2, maxLength: 20 } } } }, 'input', { text: value })
  assert.equal(result.declaration.length, 0)
 }
 for (const value of [{}, { count: 1, extra: true }, { count: '1' }, { count: 2 }, { count: 1.5 }]) {
  check({ ...base, input: { fields: { count: { type: 'integer', default: 1, minimum: 1, maximum: 2 } } } }, 'input', value)
 }
 check({ ...base, input: { fields: { nested: { type: 'object', fields: { count: { type: 'number', default: 1 } } }, items: { type: 'array', items: { type: 'string' }, maxItems: 2 } } } }, 'input', { nested: {}, items: ['a', 'b', 3] })
 check({ ...base, input: { fields: { choice: { type: 'object', enum: [{ value: 1 }] } } } }, 'input', { choice: { value: 1 } })
})
test('declaration and output failures are structured and do not import or execute project config', () => {
 writeFileSync(join(scratch, 'vite.config.ts'), 'throw new Error("validation must not execute project config")')
 for (const action of [{ ...base, input: { fields: { text: { type: 'string', pattern: '[' } } } }, { ...base, effects: [] }, { ...base, execution: { timeoutMs: -1 } }]) {
  assert.ok(check(action, 'input', {}).declaration.length > 0)
 }
 const action = { ...base, result: { fields: { total: { type: 'integer' } } } }
 assert.equal(check(action, 'output', { total: 3 }).checked.ok, true)
 assert.equal(check(action, 'output', { total: '3' }).checked.ok, false)
})
