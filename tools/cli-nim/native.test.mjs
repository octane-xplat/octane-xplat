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
  expected.data.status=['catalog','status','capabilities','permissions','app select','code search','code read','guidance','docs read','docs search','docs index','actions list','actions invoke','actions status','session list','session status','session end','session start','session attach','targets','diagnostics','job status','job cancel','runtime build'].includes(cmd.name)?'implemented':'pending'
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
 assert.ok(data.commands.every(c=>c.status===(['catalog','status','capabilities','permissions','app select','code search','code read','guidance','docs read','docs search','docs index','actions list','actions invoke','actions status','session list','session status','session end','session start','session attach','targets','diagnostics','job status','job cancel','runtime build'].includes(c.command)?'implemented':'pending')))
 assert.equal(run(['targets','--json']).status,2)
 assert.equal(run(['catalog','--bogus']).status,2)
})
test('clean preserves authored macOS and plugin platforms and unlinks symlinks',()=>{
 const dir=mkdtempSync(join(tmpdir(),'xplat-nim-clean-'))
 writeFileSync(join(dir,'package.json'),'{}')
 for(const name of ['dist','platforms/ios','platforms/macos']){mkdirSync(join(dir,name),{recursive:true})}
 const result=run(['clean'],dir);assert.equal(result.status,0,result.stderr)
 assert.equal(existsSync(join(dir,'dist')),false);assert.equal(existsSync(join(dir,'platforms/ios')),false);assert.equal(existsSync(join(dir,'platforms/macos')),true)
 writeFileSync(join(dir,'package.json'),JSON.stringify({nativescript:{platforms:{ios:'1'}}}))
 mkdirSync(join(dir,'platforms/ios'),{recursive:true});assert.equal(run(['clean'],dir).status,0);assert.ok(existsSync(join(dir,'platforms/ios')))
 if(process.platform!=='win32'){
  const authored=mkdtempSync(join(tmpdir(),'xplat-authored-'));writeFileSync(join(authored,'keep'),'keep')
  symlinkSync(authored,join(dir,'dist'));assert.equal(run(['clean'],dir).status,0);assert.ok(existsSync(join(authored,'keep')))
 }
})

test('agent groups preserve help, schema and JSON selection failures',()=>{
 const groups=[...new Set(AGENT_COMMANDS.filter(c=>c.path.length>1).map(c=>c.path[0]))]
 for(const head of groups){
  for(const suffix of [[],['--help'],['--json'],['missing','--json'],['--schema']]) {
   const args=[head,...suffix]
   const expected=reference(args),actual=run(args)
   assert.equal(actual.status,expected.status,actual.stderr)
   if(suffix.includes('--schema')) {
    const value=normalized(expected.stdout)
    for(const schema of value.data.commands){schema.status=['catalog','status','capabilities','permissions','app select','code search','code read','guidance','docs read','docs search','docs index','actions list','actions invoke','actions status','session list','session status','session end','session start','session attach','targets','diagnostics','job status','job cancel','runtime build'].includes(schema.command)?'implemented':'pending'}
    assert.deepEqual(normalized(actual.stdout),value)
   } else if(suffix.includes('--json')) {assert.deepEqual(normalized(actual.stdout),normalized(expected.stdout))}
   else {assert.equal(actual.stdout,expected.stdout)}
  }
 }
})

test('clean rejects malformed strict JSON before deleting any output',()=>{
 const dir=mkdtempSync(join(tmpdir(),'xplat-nim-invalid-manifest-'))
 mkdirSync(join(dir,'dist'))
 for(const source of ['// comment\n{}','{"name":"demo",}','{"value":01}','{"value":1_0}','{"value":.1}','{"value":1.}','{"value":true} false']){
  writeFileSync(join(dir,'package.json'),source)
  const result=run(['clean'],dir)
  assert.equal(result.status,5,source)
  assert.equal(result.stdout,'')
  assert.ok(existsSync(join(dir,'dist')),source)
 }
})

test('agent argument failures preserve human stderr and JSON envelopes',()=>{
 for(const args of [['catalog','--unknown'],['catalog','extra'],['docs','search'],['docs','search','hello','--limit=1.5'],['status','--platform=invalid'],['catalog','--help','--json=false']]) {
  for(const json of [false,true]){
   const argv=[...args,...(json?['--json']:[])]
   const expected=reference(argv), actual=run(argv)
   assert.equal(actual.status,expected.status,argv.join(' '))
   if(json){assert.deepEqual(normalized(actual.stdout),normalized(expected.stdout))}
   else {assert.equal(actual.stdout,expected.stdout);assert.equal(actual.stderr,expected.stderr)}
  }
 }
})
