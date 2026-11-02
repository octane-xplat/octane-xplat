import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { routeCommandDescriptor } from './route-templates.mjs'
const source = readFileSync(new URL('../../packages/cli/src/commands/routes.ts', import.meta.url), 'utf8')

test('native route flags are extracted from the canonical command and reject unsupported type drift', () => {
 const descriptor = routeCommandDescriptor(source)
 assert.deepEqual(descriptor.flags.map(({flag,short,type}) => ({flag,short,type})),[
  {flag:'watch',short:'w',type:'boolean'}, {flag:'dir',short:'d',type:'string'}, {flag:'out',short:'o',type:'string'},
 ])
 assert.equal(descriptor.flags[0].default,false)
 assert.throws(() => routeCommandDescriptor(source.replaceAll('type: optional(string)','type: optional(number)')),/Unsupported routes option type/)
})
