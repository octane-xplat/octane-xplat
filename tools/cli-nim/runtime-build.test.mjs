import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { createWebAdapter } from '../../packages/cli/src/mcp/runtime/adapters/web.ts'
import { createLogBuffer } from '../../packages/cli/src/mcp/runtime/logs.ts'
import { fixture,write,cli,waitJob,artifacts,cleanup,until,root,binary } from './runtime-fixtures.mjs'
import { assertCurrentNativeBuild, envProbeInputs } from './native-inputs.mjs'
const macOnly = { skip:process.platform!=='darwin',timeout:40000 }
after(cleanup)
function foreground(app,args) {
 return spawnSync(binary,['build',...args],{ cwd:app,encoding:'utf8',timeout:15000,killSignal:'SIGKILL' })
}
function assertGone(pid) {
 let alive=true
 try { process.kill(pid,0) } catch(error) { if(error.code==='ESRCH'){alive=false;} else {throw error} }
 assert.equal(alive,false,'The engine and descendant must be gone before fixture teardown')
}
async function armed(app) {
 return await until(()=>{
  try { return JSON.parse(readFileSync(join(app,'armed.json'),'utf8')) }
  catch(error) { if(error instanceof SyntaxError || error.code==='ENOENT'){return false;}throw error }
 },'Observe the complete real-engine readiness record')
}
test('real installed Vite builds preserve the TypeScript adapter result and exact artifacts without a CLI payload', macOnly, async () => {
 const dir = fixture(), app = join(dir,'apps/a')
 const started = cli(dir,['runtime','build','--platform','web'])
 assert.equal(started.code,0,JSON.stringify(started.value.error))
 const job = await waitJob(dir,started.value.data.job.jobId)
 assert.equal(job.state,'succeeded',JSON.stringify(job.error))
 assert.equal(job.result.appId,'apps/a')
 const native = artifacts(app)
 assert.ok(Object.values(native).some(value => Buffer.from(value,'base64').toString().includes('.built-web')))
 const logs = cli(dir,['diagnostics','--job',job.jobId,'--cursor','0','--limit','5000'])
 assert.equal(logs.code,0,JSON.stringify(logs.value.error))
 assert.ok(logs.value.data.logs.records.some(record=>record.stream==='stdout'&&record.line==='out π😀'))
 assert.ok(logs.value.data.logs.records.some(record=>record.stream==='stderr'&&record.line==='err β'))
 assert.equal(logs.value.data.coverage.nativeReports.status,'unavailable')
 rmSync(join(app,'dist'),{ recursive:true })
 const reference = await createWebAdapter().build({ app:{ id:'apps/a',root:app },logs:createLogBuffer(),signal:new AbortController().signal,report:()=>{},deps:{} })
 assert.deepEqual({ summary:job.result.summary,buildIdentity:job.result.buildIdentity },JSON.parse(JSON.stringify(reference)))
 assert.deepEqual(artifacts(app),native)
})
test('failed real compiler configuration is retained as a failed job with readable diagnostics', macOnly, async () => {
 const dir = fixture(), app = join(dir,'apps/a')
 write(app,'vite.config.mjs',`export default { plugins:[{ name:'deliberate-error',buildStart(){ throw Error('intentional build rejection') } }] };\n`)
 const reply = cli(dir,['runtime','build','--platform','web'])
 assert.equal(reply.code,0)
 const job = await waitJob(dir,reply.value.data.job.jobId)
 assert.equal(job.state,'failed')
 assert.equal(job.error.code,'execution_failure')
 const logs = cli(dir,['diagnostics','--job',job.jobId]).value.data.logs
 assert.ok(logs.records.some(record=>record.line.includes('intentional build rejection')))
 assert.equal(existsSync(join(app,'dist/index.html')),false)
})
test('invalid app selection and missing platform fail before creating work; project dependencies are required', macOnly, async () => {
 const dir = fixture({ apps:['a','b'] })
 for (const args of [['runtime','build'],['runtime','build','--platform','web'],['runtime','build','--platform','web','--app','missing']]) {
  const reply = cli(dir,args)
  assert.equal(reply.code,2)
  assert.ok(['invalid_selection','ambiguous_selection'].includes(reply.value.error.code))
 }
 const missing = fixture({ installed:false })
 const reply = cli(missing,['runtime','build','--platform','web'])
 assert.equal(reply.code,0)
 const job = await waitJob(missing,reply.value.data.job.jobId)
 assert.equal(job.state,'failed')
 assert.equal(job.error.code,'prerequisite_missing')
 assert.match(job.error.message,/Install Vite in the selected project/)
})
test('live request keys deduplicate by selected app and platform; cancellation releases actual engine processes', macOnly, async () => {
 const dir = fixture({ apps:['a','b'] })
 for (const name of ['a','b']) {write(join(dir,'apps',name),'vite.config.mjs',`import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
export default { plugins:[{ name:'armed-native-build',async buildStart(){
 const child=spawn(process.execPath,['-e','process.on("SIGTERM",()=>{}); setTimeout(()=>process.exit(0),12000)'],{ stdio:'ignore' });
 process.on('SIGTERM',()=>{});writeFileSync('armed.json',JSON.stringify({pid:process.pid,child:child.pid}));
 await new Promise(resolve=>setTimeout(resolve,12000));
} }] };`)}
 const args = ['runtime','build','--platform','web','--request-key','same']
 const first = cli(dir,[...args,'--app','apps/a']).value.data
 await until(()=>existsSync(join(dir,'apps/a/armed.json')),'Observe the real engine before cancelling')
 const again = cli(dir,[...args,'--app','apps/a']).value.data
 assert.equal(again.deduplicated,true)
 assert.equal(again.job.jobId,first.job.jobId)
 const second = cli(dir,[...args,'--app','apps/b']).value.data
 assert.equal(second.deduplicated,false)
 assert.notEqual(second.job.jobId,first.job.jobId)
 await until(()=>existsSync(join(dir,'apps/b/armed.json')),'Observe both independently selected apps')
 for (const [name,id] of [['a',first.job.jobId],['b',second.job.jobId]]) {
  const pids = JSON.parse(readFileSync(join(dir,'apps',name,'armed.json')))
  const cancelledAt = Date.now()
  assert.equal(cli(dir,['job','cancel',id]).code,0)
  assert.equal((await waitJob(dir,id)).state,'cancelled')
  assert.ok(Date.now()-cancelledAt<6000,'Cancellation must finish before the fixture self-expires')
  for (const pid of [pids.pid,pids.child]) {assertGone(pid)}
 }
})
test('foreground build selects declared targets, shares the real engine and refuses unsupported engines before writes', macOnly, () => {
 const dir = fixture(), app = join(dir,'apps/a')
 const explicit = foreground(app,['-t=web','--release'])
 assert.equal(explicit.status,0,explicit.stderr)
 assert.match(explicit.stdout,/Build complete/)
 assert.match(explicit.stdout,/out π😀/)
 assert.match(explicit.stderr,/err β/)
 const outputs = artifacts(app)
 for (const args of [['--targets','web,missing'],['--targets',''],['--targets'],['--unexpected']]) {
  const rejected = foreground(app,args)
  assert.equal(rejected.status,1,JSON.stringify(rejected))
  assert.deepEqual(artifacts(app),outputs,'Rejected selection must preserve existing output')
 }
 rmSync(join(app,'dist'),{ recursive:true })
 assert.equal(foreground(app,[]).status,0,'Noninteractive invocation builds all declared targets')
 assert.deepEqual(artifacts(app),outputs)
 write(app,'package.json',{ name:'build-a',private:true,type:'module',xplat:{ targets:{ web:{},macos:{ runtime:'appkit-node-api' } } } })
 const unsupported = foreground(app,[])
 assert.equal(unsupported.status,1)
 assert.match(unsupported.stderr,/macos build engine integration is pending/)
 assert.deepEqual(artifacts(app),outputs)
 write(app,'package.json','{ malformed')
 assert.equal(foreground(app,['--targets','web']).status,1)
 assert.deepEqual(artifacts(app),outputs,'Invalid manifest must fail before output writes')
})
test('an engine deadline reports timeout after owned real Vite and descendant cleanup', macOnly, () => {
 const probe = join(root,'research/nim-cli/native/env-probe')
 assertCurrentNativeBuild(root,JSON.parse(readFileSync(join(root,'research/nim-cli/native/env-build.json'))),readFileSync(probe),envProbeInputs)
 const dir=fixture(), app=join(dir,'apps/a')
 write(app,'vite.config.mjs',`import { writeFileSync } from 'node:fs'; import { spawn } from 'node:child_process';
export default { plugins:[{ name:'deadline',async buildStart(){
 const child=spawn(process.execPath,['-e','process.on("SIGTERM",()=>{});setTimeout(()=>process.exit(0),12000)'],{stdio:'ignore'});
 process.on('SIGTERM',()=>{});writeFileSync('armed.json',JSON.stringify({pid:process.pid,child:child.pid}));
 await new Promise(resolve=>setTimeout(resolve,12000));
} }] };`)
 const started=Date.now()
 const run=spawnSync(probe,[],{ input:JSON.stringify({operation:'native-build',dir:app,timeoutMs:1500})+'\n',encoding:'utf8',timeout:10000,killSignal:'SIGKILL' })
 assert.equal(run.status,0,run.stderr)
 const reply=JSON.parse(run.stdout)
 assert.equal(reply.ok,true,reply.message)
 assert.equal(reply.value.error.code,'timeout')
 assert.ok(Date.now()-started<8000,'Deadline cleanup must finish before fixture self-expiry')
 const pids=JSON.parse(readFileSync(join(app,'armed.json')))
 for(const pid of [pids.pid,pids.child]){assertGone(pid)}
 assert.equal(existsSync(join(app,'dist/index.html')),false)
})
test('automatic route baking is published before compilation and failed baking preserves last-good outputs', macOnly, async () => {
 const dir=fixture(), app=join(dir,'apps/a')
 write(app,'app/index.tsx','export default function Page() { return null }')
 write(app,'app/data.tsx','export const dataMode="baked";export default function Page() { return null }')
 write(app,'app/data.loader.ts','export function loader() { console.error("bake diagnostic π"); return { meaningful:42 } }')
 const started=cli(dir,['runtime','build','--platform','web']).value.data
 const job=await waitJob(dir,started.job.jobId)
 assert.equal(job.state,'succeeded',JSON.stringify(job.error))
 const generated=readFileSync(join(app,'routes.gen.data.ts'),'utf8')
 assert.match(generated,/meaningful/)
 const previous=artifacts(app)
 const logs=cli(dir,['diagnostics','--job',job.jobId]).value.data.logs
 assert.ok(logs.records.some(record=>record.source==='routes'&&record.line.includes('bake diagnostic π')))
 write(app,'app/data.loader.ts','export function loader() { throw Error("deliberate bake rejection") }')
 const failed=await waitJob(dir,cli(dir,['runtime','build','--platform','web']).value.data.job.jobId)
 assert.equal(failed.state,'failed')
 assert.match(failed.error.message,/deliberate bake rejection/)
 assert.equal(readFileSync(join(app,'routes.gen.data.ts'),'utf8'),generated)
 assert.deepEqual(artifacts(app),previous)
})
test('foreground interruption or loss of its output consumer cleans up the build engine', macOnly, async () => {
 for (const kind of ['signal','pipe']) {
  const dir=fixture(), app=join(dir,'apps/a')
  write(app,'vite.config.mjs',`import { writeFileSync } from 'node:fs';import { spawn } from 'node:child_process';
export default {plugins:[{name:'foreground',async buildStart(){
 const child=spawn(process.execPath,['-e','process.on("SIGTERM",()=>{});setTimeout(()=>process.exit(0),12000)'],{stdio:'ignore'});
 process.on('SIGTERM',()=>{});writeFileSync('armed.json',JSON.stringify({pid:process.pid,child:child.pid}));
 const timer=setInterval(()=>console.log('foreground output'),25);
 await new Promise(resolve=>setTimeout(resolve,12000));clearInterval(timer);
}}]};`)
  const child=spawn(binary,['build','--targets','web'],{cwd:app,stdio:['ignore','pipe','pipe']})
  let stderr='',status
  child.stdout.on('data',()=>{})
  child.stderr.on('data',bytes=>{stderr+=bytes})
  const finished=new Promise(resolve=>child.once('close',(code,signal)=>{status={code,signal};resolve(status)}))
  try {
   const pids=await armed(app)
   if(kind==='signal'){child.kill('SIGTERM');}else {child.stdout.destroy()}
   await Promise.race([finished,delay(7000).then(()=>assert.fail(`Foreground ${kind} cleanup did not settle: ${stderr}`))])
   assert.equal(status.code,kind==='signal'?143:1,stderr)
   for(const pid of [pids.pid,pids.child]){assertGone(pid)}
  } finally {
   if(!status){child.kill('SIGTERM');await finished}
  }
 }
})
