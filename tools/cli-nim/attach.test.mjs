// Read-only macOS process discovery, separate from real app qualification.
import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { spawn, spawnSync } from 'node:child_process'
import { once } from 'node:events'
import { mkdirSync, writeFileSync, readFileSync, rmSync, realpathSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild, envProbeInputs } from './native-inputs.mjs'
import { createMacosAdapter } from '../../packages/cli/src/mcp/runtime/adapters/macos.ts'
const root=resolve(import.meta.dirname,'../..'), scratch=scratchRun(root,'attach')
const binary=join(root,'research/nim-cli/native/env-probe')
assertCurrentNativeBuild(root,JSON.parse(readFileSync(join(root,'research/nim-cli/native/env-build.json'))),readFileSync(binary),envProbeInputs)
after(()=>rmSync(scratch,{recursive:true,force:true}))
const directory=join(scratch,'app [雪].space'), prefix=directory+'-other'
for(const dir of [directory,prefix]) {mkdirSync(dir);writeFileSync(join(dir,'package.json'),JSON.stringify({xplat:{targets:{macos:{dev:{bundleFile:'dist/dev main.cjs'}}}}}))}
mkdirSync(join(directory,'dist'));writeFileSync(join(directory,'dist/dev main.cjs'),'')
const app={id:'.',root:directory}
function query(operation,extra={},env=process.env) {
 const result=spawnSync(binary,[],{input:JSON.stringify({operation,dir:directory,...extra})+'\n',encoding:'utf8',timeout:10000,env})
 assert.equal(result.status,0,result.stderr+(result.error?.message??''));assert.equal(result.stderr,'')
 const reply=JSON.parse(result.stdout);assert.equal(reply.ok,true,reply.message);return reply.value
}
function observation(pid,parent=1,extra={}) {return {pid,parent,executable:'/usr/local/bin/node',cwd:realpathSync(directory),command:`node ${directory}/node_modules/pkg/dist/macos/dev-worker.js request.json ready.json --secret=DO_NOT_RETURN`,...extra}}
function groups(processes) {return query('attach-groups',{app,processes})}

test('groups related engines deterministically and returns no private command arguments',()=>{
 const child=observation(22,21,{executable:'/private/a.app/Contents/MacOS/Host',command:`/private/a.app/Contents/MacOS/Host /sdk/NativeScript.framework/Versions/A/NativeScript ${directory}/dist/dev main.cjs`})
 const candidate=groups([child,observation(21)])
 assert.deepEqual(candidate.map(row=>({targetId:row.targetId,pids:row.pids,processKind:row.processKind})),[{targetId:'macos',pids:[21,22],processKind:'warm'}])
 assert.equal(JSON.stringify(candidate).includes('DO_NOT_RETURN'),false)
 assert.deepEqual(Object.keys(candidate[0]).sort(),['detail','name','pids','processKind','targetId'])
 const independent=groups([observation(22),observation(21)])
 assert.deepEqual(independent.map(row=>row.targetId),['macos:21','macos:22'])
 assert.deepEqual(groups([observation(22,21),observation(21)]),candidate.map(row=>({...row,detail:row.detail})))
})

test('rejects unrelated cwd, eval lookalikes, suffix collisions and undeclared app bundles',()=>{
 const rejected=[
  observation(21,1,{cwd:prefix}),observation(22,1,{command:'node unrelated.js'}),
  observation(23,1,{command:'node -e "'+directory+'/macos/dev-worker.js"'}),
  observation(24,1,{command:'node --eval='+directory+'/macos/dev-worker.js'}),
  observation(25,1,{command:'node '+directory+'/macos/dev-worker.js.backup'}),
  observation(26,1,{executable:'/Host.app/Contents/MacOS/Host',command:`/Host.app/Contents/MacOS/Host /sdk/NativeScript.framework/Versions/A/NativeScript ${prefix}/dist/dev main.cjs`}),
 ]
 assert.deepEqual(groups(rejected),[])
})

test('single-engine discovery preserves reference identity and lifecycle-only capture',async()=>{
 const native=groups([observation(21)])
 const adapter=createMacosAdapter()
 const reference=await adapter.attachables(app,{host:'darwin',exec:(command,args)=>{
  assert.equal(command,'pgrep');assert.equal(args[0],'-fl')
  return `21 node ${directory}/macos/dev-worker.js\n`
 }})
 for(const key of ['targetId','name','processKind','pids']){assert.deepEqual(native[0][key],reference[0][key])}
 const notes=[]
 await adapter.attach({target:reference[0],logs:{note:value=>notes.push(value)}})
 assert.match(notes[0],/only lifecycle events are captured/)
})

test('macOS SDK observations bind birth time and cwd; discovery works with an empty PATH', {skip:process.platform!=='darwin'},async()=>{
 const fixture=join(directory,'macos/dev-worker.js');mkdirSync(join(directory,'macos'))
 writeFileSync(fixture,'process.stdout.write("ready\\n");setInterval(()=>{},1000)\n')
 const child=spawn(process.execPath,[fixture,'--private-argument=DO_NOT_RETURN'],{cwd:directory,stdio:['ignore','pipe','pipe']})
 const finished=once(child,'exit')
 try {
  await once(child.stdout,'data')
  const observations=query('process-observations'), seen=observations.find(row=>row.pid===child.pid)
  assert.ok(seen,'must observe the directly spawned fixture');assert.equal(seen.cwd,realpathSync(directory))
  assert.ok(BigInt(seen.birth)>BigInt(Date.now()-60000)*1000n)
  assert.equal(query('same-process',{pid:seen.pid,birth:seen.birth}),true)
  assert.equal(query('same-process',{pid:seen.pid,birth:String(BigInt(seen.birth)+1n)}),false)
  assert.equal(query('same-process',{pid:seen.pid,birth:'0'}),false)
  const observedElsewhere=query('process-observations',{dir:prefix});assert.equal(observedElsewhere.some(row=>row.pid===child.pid),false)
  const discovered=query('discover-attach',{app},{...process.env,PATH:''})
  assert.deepEqual(discovered.map(row=>row.pids),[[child.pid]])
  assert.equal(JSON.stringify([...observations,...discovered]).includes('DO_NOT_RETURN'),false)
  child.kill('SIGTERM');await finished
  assert.equal(query('same-process',{pid:seen.pid,birth:seen.birth}),false)
  assert.deepEqual(query('discover-attach',{app}),[])
 } finally {if(child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await finished}}
})
