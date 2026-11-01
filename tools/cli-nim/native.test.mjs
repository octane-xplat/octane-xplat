import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { AGENT_COMMANDS } from '../../packages/cli/src/agent/commands.ts'
const root=resolve(import.meta.dirname,'../..')
const binary=resolve(root,`research/nim-cli/native/xplat${process.platform==='win32'?'.exe':''}`)
const run=(args,cwd=root)=>spawnSync(binary,args,{cwd,encoding:'utf8',env:{...process.env,PATH:''}})
const reference=(args)=>spawnSync(process.execPath,[resolve(root,'packages/cli/src/cli.ts'),...args],{cwd:root,encoding:'utf8'})
const normalized=(str)=>{const value=JSON.parse(str);delete value.requestId;return value}
test('every agent schema and help follows TypeScript contracts',()=>{
 for(const cmd of AGENT_COMMANDS){
  const expected=normalized(reference([...cmd.path,'--schema']).stdout)
  expected.data.status=cmd.name==='catalog'?'implemented':'pending'
  const actual=run([...cmd.path,'--schema']);assert.equal(actual.status,0,actual.stderr)
  assert.deepEqual(normalized(actual.stdout),expected)
  assert.equal(run([...cmd.path,'--help']).stdout,reference([...cmd.path,'--help']).stdout)
 }
})
test('catalog reports native coverage and unique request identities',()=>{
 const a=run(['catalog','--json']);assert.equal(a.status,0,a.stderr)
 const b=run(['catalog','--json']);assert.notEqual(JSON.parse(a.stdout).requestId,JSON.parse(b.stdout).requestId)
 const data=JSON.parse(a.stdout).data
 assert.ok(data.cli.version.includes('-nim.'))
 assert.ok(data.commands.every(c=>c.status===(c.command==='catalog'?'implemented':'pending')))
 assert.equal(run(['status','--json']).status,3)
 assert.equal(run(['catalog','--bogus']).status,2)
})
test('clean preserves authored macOS and plugin platforms and unlinks symlinks',()=>{
 const dir=mkdtempSync(join(tmpdir(),'xplat-nim-clean-'))
 writeFileSync(join(dir,'package.json'),'{}')
 for(const name of ['dist','platforms/ios','platforms/macos'])mkdirSync(join(dir,name),{recursive:true})
 const result=run(['clean'],dir);assert.equal(result.status,0,result.stderr)
 assert.equal(existsSync(join(dir,'dist')),false);assert.equal(existsSync(join(dir,'platforms/ios')),false);assert.equal(existsSync(join(dir,'platforms/macos')),true)
 writeFileSync(join(dir,'package.json'),JSON.stringify({nativescript:{platforms:{ios:'1'}}}))
 mkdirSync(join(dir,'platforms/ios'),{recursive:true});assert.equal(run(['clean'],dir).status,0);assert.ok(existsSync(join(dir,'platforms/ios')))
 if(process.platform!=='win32'){
  const authored=mkdtempSync(join(tmpdir(),'xplat-authored-'));writeFileSync(join(authored,'keep'),'keep')
  symlinkSync(authored,join(dir,'dist'));assert.equal(run(['clean'],dir).status,0);assert.ok(existsSync(join(authored,'keep')))
 }
})
