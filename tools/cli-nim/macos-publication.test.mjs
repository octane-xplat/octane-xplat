import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild, envProbeInputs } from './native-inputs.mjs'
const root=resolve(import.meta.dirname,'../..'), binary=join(root,'research/nim-cli/native/env-probe'+(process.platform==='win32'?'.exe':''))
assertCurrentNativeBuild(root,JSON.parse(readFileSync(join(root,'research/nim-cli/native/env-build.json'))),readFileSync(binary),envProbeInputs)
const scratch=scratchRun(root,'macos-publication'), macOnly={skip:process.platform!=='darwin'}
after(()=>rmSync(scratch,{recursive:true,force:true}))
let sequence=0
function write(file,value){mkdirSync(dirname(file),{recursive:true});writeFileSync(file,value)}
function fixture(){
 const release=join(scratch,String(++sequence)), stage=join(release,'.xplat-macos-owned'), name='Native App'
 const app=join(stage,name+'.app'), dmg=join(stage,name+'-macos-universal.dmg')
 write(join(app,'Contents/MacOS',name),'new executable');write(join(app,'Contents/Info.plist'),'new plist');write(dmg,'new disk image')
 write(join(release,name+'.app/Contents/MacOS',name),'old executable');write(join(release,name+'.app/Contents/Info.plist'),'old plist');write(join(release,name+'-macos-universal.dmg'),'old disk image')
 return {release,stage,name,app,dmg,plan:{version:1,executableName:name,appPath:app,dmgPath:dmg}}
}
function publish(f,plan=f.plan){
 const run=spawnSync(binary,[],{input:JSON.stringify({operation:'publish-macos',dir:f.release,stage:f.stage,plan})+'\n',encoding:'utf8',timeout:5000,env:{...process.env,PATH:''}})
 assert.equal(run.status,0,run.stderr)
 const reply=JSON.parse(run.stdout);assert.equal(reply.ok,true,reply.message);return reply.value
}
function assertOld(f){
 assert.equal(readFileSync(join(f.release,f.name+'.app/Contents/MacOS',f.name),'utf8'),'old executable')
 assert.equal(readFileSync(join(f.release,f.name+'-macos-universal.dmg'),'utf8'),'old disk image')
}
test('validated macOS publication replaces an app and DMG while retaining old pairs until cleanup',macOnly,()=>{
 const f=fixture(), result=publish(f)
 assert.deepEqual(result,{appPath:join(f.release,f.name+'.app'),dmgPath:join(f.release,f.name+'-macos-universal.dmg')})
 assert.equal(readFileSync(join(result.appPath,'Contents/MacOS',f.name),'utf8'),'new executable')
 assert.equal(readFileSync(result.dmgPath,'utf8'),'new disk image')
 assert.equal(readFileSync(join(f.stage,'previous.app/Contents/MacOS',f.name),'utf8'),'old executable')
 assert.equal(readFileSync(join(f.stage,'previous.dmg'),'utf8'),'old disk image')
})
test('malformed, escaping, incomplete and unexpected-backup plans preserve previous artifacts',macOnly,()=>{
 for(const transform of [p=>({...p,version:2}),p=>({...p,executableName:'../escape'}),p=>({...p,appPath:'/outside'}),p=>({...p,dmgPath:'/outside'})]){
  const f=fixture();assert.ok(publish(f,transform(f.plan)).error);assertOld(f)
 }
 const f=fixture();rmSync(f.dmg);assert.ok(publish(f).error);assertOld(f)
 const extra=fixture();write(join(extra.stage,'previous.dmg'),'unrelated');assert.ok(publish(extra).error);assertOld(extra)
})
test('an actual rename failure after app publication restores both old artifacts',macOnly,()=>{
 const f=fixture()
 const lock=spawnSync('chflags',['uchg',f.dmg],{encoding:'utf8'});assert.equal(lock.status,0,lock.stderr)
 try{
  const failed=publish(f);assert.ok(failed.error);assert.equal(failed.preserveStage,false)
  assertOld(f);assert.equal(existsSync(join(f.stage,'previous.app')),false);assert.equal(existsSync(join(f.stage,'previous.dmg')),false)
  assert.equal(readFileSync(join(f.app,'Contents/MacOS',f.name),'utf8'),'new executable')
 }finally{const unlock=spawnSync('chflags',['nouchg',f.dmg],{encoding:'utf8'});assert.equal(unlock.status,0,unlock.stderr)}
})
