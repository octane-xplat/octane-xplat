import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { assertCurrentNativeBuild, envProbeInputs } from './native-inputs.mjs'
const root = resolve(import.meta.dirname,'../..'), binary = join(root,'research/nim-cli/native/env-probe'+(process.platform==='win32'?'.exe':''))
assertCurrentNativeBuild(root,JSON.parse(readFileSync(join(root,'research/nim-cli/native/env-build.json'))),readFileSync(binary),envProbeInputs)
function native(input) {
 const run = spawnSync(binary,[],{ input:JSON.stringify({ operation:'runtime-logs',dir:root,...input })+'\n',encoding:'utf8',env:{ ...process.env,PATH:'' },timeout:5000 })
 assert.equal(run.status,0,run.stderr)
 const result = JSON.parse(run.stdout)
 assert.equal(result.ok,true,result.message)
 return result.value
}
function normalize(value) {
 if (Array.isArray(value)) {return value.map(normalize)}
 if (value && typeof value === 'object') {return Object.fromEntries(Object.entries(value).map(([key,item]) => [key,['ts','at'].includes(key)?'instant':normalize(item)]))}
 return value
}
function compare(input) {
 const node = spawnSync(process.execPath,[join(import.meta.dirname,'runtime-logs-reference.mjs')],{ input:JSON.stringify(input),encoding:'utf8',timeout:5000 })
 assert.equal(node.status,0,node.stderr)
 const actual = native(input)
 assert.deepEqual(normalize(actual),normalize(JSON.parse(node.stdout)))
 return actual
}
test('bounded log cursors, stream filtering, metadata and reset match the live Node store', () => {
 for (const limit of [0,1,3,2000]) {compare({ limit,steps:[
  { op:'read' },{ op:'append',line:'hello π😀',source:'build',level:'info' },
  { op:'append',line:'stderr',stream:'stderr',lineTruncated:true },{ op:'note',line:'native owner' },
  { op:'append',line:'last' },{ op:'read',cursor:0 },{ op:'read',limit:2 },
  { op:'read',cursor:0,limit:2,stream:'stderr' },{ op:'read',cursor:999 },{ op:'read',cursor:null },
  { op:'reset',reason:'new capture' },{ op:'read',cursor:0 },{ op:'unwatch' },{ op:'append',line:'after unwatch' },{ op:'observed' },
 ] })}
})
test('retention reveals gaps throughout a larger ordered mixed-stream capture', () => {
 const steps = Array.from({ length:1200 },(_,index)=>({ op:'append',line:`line ${index}`,stream:index%3?'stdout':'stderr' }))
 steps.push(...[0,1,1185,1199,1200,1201].flatMap(cursor => [{ op:'read',cursor,limit:5 },{ op:'read',cursor,limit:3,stream:'stderr' }]))
 compare({ limit:15,steps })
})
test('byte bounds, snapshot mutation and throwing observers preserve private log state', () => {
 const [first,,errors,read] = native({ byteLimit:1024,badObserver:true,steps:[
  { op:'append',line:'original' },{ op:'mutate' },{ op:'errors' },{ op:'read' },
 ] })
 assert.equal(first.line,'original')
 assert.equal(errors,1)
 assert.equal(read.records[0].line,'original')
 const result = native({ byteLimit:512,steps:[ ...Array.from({ length:20 },()=>({ op:'append',line:'x'.repeat(200) })),{ op:'read',cursor:0 }] }).at(-1)
 assert.ok(result.records.length<=2)
 assert.equal(result.truncated,true)
 assert.ok(result.dropped>=18)
 assert.equal(result.newestSeq,20)
})
