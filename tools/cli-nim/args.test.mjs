import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { AGENT_COMMANDS } from '../../packages/cli/src/agent/commands.ts'
import { parseArgs } from '../../packages/cli/src/agent/parse.ts'
const root = resolve(import.meta.dirname, '../..')
test('native descriptor parser matches the independent TypeScript parser across command and flag boundaries', () => {
 const requests = []
 const add = (command, argv) => requests.push({ command, argv })
 for (const command of AGENT_COMMANDS) {
  for (const argv of [[], ['--help'], ['-h'], ['--help=true'], ['--schema'], ['--unknown'], ['--help','--unknown'], ['--','--json'], ['extra','more'],['--json=false'],['-json'],['---json']]) add(command, argv)
  for (const flag of command.flags) {
   const values = flag.type === 'boolean' ? ['true', 'false', ''] : flag.type === 'integer' ? ['',' ', '0', '-0','1','1.0','1e1','1e20','1e21','1e30','\u00a0','\ufeff1\u00a0','1.5','0x10','0b10','0o10','0x','+0x10','1_0','NaN','Infinity','abc','-1','1000000'] : flag.type === 'enum' ? [...flag.values, 'invalid',''] : ['','hello world','https://example.invalid/a?q=x','-']
   add(command, [`--${flag.flag}`])
   add(command, [`--${flag.flag}`, '--help'])
   for (const value of values) {
    add(command, [`--${flag.flag}=${value}`,'--help'])
    add(command, [`--${flag.flag}`,value,'--help'])
   }
  }
 }
 // UTF-16 length is the contract inherited from JS, not UTF-8 bytes or runes.
 const synthetic={name:'unicode',positionals:[{name:'value',required:true,min:2,max:3}],flags:[]}
 for (const value of ['a','ab','abcd','😀','😀a','😀😀']) add(synthetic,[value])
 const executable=resolve(root,`research/nim-cli/native/args-probe${process.platform==='win32'?'.exe':''}`)
 const run=spawnSync(executable,[],{input:requests.map(r=>JSON.stringify(r)).join('\n')+'\n',encoding:'utf8',maxBuffer:32*1024*1024,env:{...process.env,PATH:''}})
 assert.equal(run.status,0,run.stderr)
 const actual=run.stdout.trim().split('\n').map(line=>JSON.parse(line))
 assert.equal(actual.length,requests.length)
 for(let index=0;index<requests.length;index++) {
  const {command,argv}=requests[index]
  const expected=JSON.parse(JSON.stringify(parseArgs(command,argv)))
  assert.deepEqual(actual[index],expected,`${command.name} ${JSON.stringify(argv)}`)
 }
 console.log(`${requests.length} differential parser cases matched`)
})
