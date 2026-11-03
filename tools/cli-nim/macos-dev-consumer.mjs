// Real packed development engine, headless app and native ownership. No images.
import assert from 'node:assert/strict'
import { spawn,spawnSync } from 'node:child_process'
import { once } from 'node:events'
import { createHash } from 'node:crypto'
import { createConnection } from 'node:net'
import { homedir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { mkdirSync, writeFileSync, readFileSync, existsSync, realpathSync, cpSync, renameSync, rmSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild } from './native-inputs.mjs'
import { createMacosAdapter } from '../../packages/cli/src/mcp/runtime/adapters/macos.ts'

if (process.platform !== 'darwin') { console.log('macOS execution required; no qualification on this host'); process.exit(0) }
const root=resolve(import.meta.dirname,'../..'), scratch=scratchRun(root,'macos-dev')
const app=join(scratch,'app'), packs=join(scratch,'packs'), native=join(scratch,'native')
mkdirSync(app);mkdirSync(packs)
const evidence={platform:process.platform,arch:process.arch,checks:[]}, sessions=[]
const env={...process.env,NODE_PATH:'',NODE_OPTIONS:'',MACOS_SIGNING_IDENTITY:'',MACOS_NOTARY_PROFILE:'',XPLAT_MACOS_DEV_SIGNING_IDENTITY:'-'}
function write(path,value) {mkdirSync(dirname(path),{recursive:true});writeFileSync(path,typeof value==='string'?value:JSON.stringify(value))}
function checked(message) {evidence.checks.push(message);write(join(root,'research/nim-cli/macos-dev-consumer.json'),evidence);console.log('Qualified: '+message)}
function run(command,args,cwd=app) {
 const result=spawnSync(command,args,{cwd,env,encoding:'utf8',timeout:240000,maxBuffer:16*1024*1024})
 assert.equal(result.status,0,result.stdout+result.stderr+(result.error?.message??''));return result.stdout
}
const binary=join(app,'node_modules/@octane-xplat/cli/bin/xplat.exe')
function call(args,expected=0) {
 const result=spawnSync(binary,[...args,'--project',app,'--json'],{cwd:app,env,encoding:'utf8',timeout:30000,maxBuffer:8*1024*1024})
 assert.equal(result.status,expected,result.stdout+result.stderr+(result.error?.message??''));return JSON.parse(result.stdout)
}
function session(id) {return call(['session','status',id]).data.session}
function logs(id) {return call(['diagnostics','--session',id,'--limit','5000']).data.logs.records}
function alive(pid) {try{process.kill(pid,0);return true}catch(error){if(error.code==='ESRCH'){return false}throw error}}
async function until(read,message,timeout=180000,id) {
 const deadline=Date.now()+timeout
 while(Date.now()<deadline) {
  const value=await read();if(value){return value}
  if(id){const record=session(id);assert.ok(!['failed','stopped','disconnected'].includes(record.state),message+': '+JSON.stringify({record,logs:logs(id)}))}
  await delay(50)
 }
 assert.fail(message+(id?': '+JSON.stringify({record:session(id),logs:logs(id)}):''))
}
function start(key) {const reply=call(['session','start','macos','--request-key',key]).data;sessions.push(reply.session.sessionId);return reply}
let cache
let crashHost,crashEngine,crashDescendant
let externalEngine,externalExit
function resources(id) {return join(cache,'sessions',id)}
async function end(id) {assert.equal(call(['session','end',id]).ok,true);await until(()=>!existsSync(resources(id)),'Owned session resources must be released',15000)}
async function rpc(method,params,grants) {
 const descriptor=JSON.parse(readFileSync(join(cache,'host.json')))
 return await new Promise((resolve,reject)=>{
  const socket=createConnection(descriptor.socketPath),timer=setTimeout(()=>socket.destroy(Error('RPC deadline')),10000)
  let bytes=''
  socket.once('connect',()=>socket.write(JSON.stringify({token:descriptor.token,method,params,appId:'.',...(grants===undefined?{}:{grants})})+'\n'))
  socket.on('data',chunk=>{bytes+=chunk.toString();if(bytes.includes('\n')){socket.destroy();try{resolve(JSON.parse(bytes.split('\n')[0]))}catch(error){reject(error)}}})
  socket.once('error',reject);socket.once('close',()=>clearTimeout(timer))
 })
}
async function stopHost(removeCache=true) {
 if(!cache){return}
 if(!existsSync(join(cache,'host.json'))){if(removeCache){rmSync(cache,{recursive:true,force:true})}return}
 const descriptor=JSON.parse(readFileSync(join(cache,'host.json')))
 await new Promise(resolve=>{
  const socket=createConnection(descriptor.socketPath),timer=setTimeout(()=>{socket.destroy();resolve()},10000)
  socket.once('connect',()=>socket.write(JSON.stringify({token:descriptor.token,method:'host.shutdown',params:{}})+'\n'))
  socket.on('data',()=>socket.destroy());socket.once('error',()=>{});socket.once('close',()=>{clearTimeout(timer);resolve()})
 })
 await until(()=>!alive(descriptor.pid),'Owned workspace host must end',20000)
 if(removeCache){rmSync(cache,{recursive:true,force:true})}
}
async function stopExternal() {
 if(!externalEngine){return}
 if(externalEngine.exitCode===null&&externalEngine.signalCode===null){
  const timer=setTimeout(()=>{try{process.kill(-externalEngine.pid,'SIGKILL')}catch(error){if(error.code!=='ESRCH'){throw error}}},15000)
  externalEngine.kill('SIGTERM')
  try{await externalExit}finally{clearTimeout(timer)}
 }
 externalEngine=null;externalExit=null
}
try {
 assertCurrentNativeBuild(root,JSON.parse(readFileSync(join(root,'research/nim-cli/native/build.json'))),readFileSync(join(root,'research/nim-cli/native/xplat')))
 const workerManifest=JSON.parse(readFileSync(join(root,'packages/macos-build/package.json')))
 run('bun',['pm','pack','--ignore-scripts','--destination',packs],join(root,'packages/macos-build'))
 const workerPack=join(packs,`octane-xplat-macos-build-${workerManifest.version}.tgz`)
 run(process.execPath,[join(root,'tools/cli-nim/pack.mjs'),'--host-only','--destination',native],root)
 const version=JSON.parse(readFileSync(join(native,'stage.json'))).version
 cpSync(join(root,'packages/cli/test/fixtures/macos-native-leaves/c'),join(app,'native-leaf'),{recursive:true})
 write(join(app,'package.json'),{name:'nim-macos-dev-consumer',private:true,type:'module',packageManager:'bun@1.4.4',
  dependencies:{octane:'0.16.3','@nativescript/macos-node-api':'0.4.4-next.2026-08-09-31292056208','xplat-native-c-fixture':'link:./native-leaf'},
  devDependencies:{vite:'8.3.0','@octane-xplat/macos-build':`file:${workerPack}`,'@octane-xplat/cli':`file:${join(native,`octane-xplat-cli-${version}.tgz`)}`},
  xplat:{targets:{macos:{runtime:'appkit-node-api',dev:{viteConfig:'vite.dev.config.mjs',bundleFile:'dist/devmain.cjs'}}}}})
 function source(label) {return `import '@nativescript/macos-node-api';import{writeFileSync}from 'node:fs';
 const app=NSApplication.sharedApplication;app.setActivationPolicy(2);
 writeFileSync('app.pid',String(NSProcessInfo.processInfo.processIdentifier));
 console.log('NIM_DEV_${label}='+xplat_c_value());setInterval(()=>console.log('NIM_DEV_TICK'),1000);\n`}
 write(join(app,'src/main.macos.js'),source('ONE'))
 write(join(app,'vite.dev.config.mjs'),`import{writeFileSync,existsSync}from 'node:fs';import{spawn}from 'node:child_process';
 export default{plugins:[{name:'ownership-probe',async buildStart(){
  writeFileSync('engine.pid',String(process.pid));
  if(existsSync('hold')){
   const child=spawn(process.execPath,['-e','process.on("SIGTERM",()=>{});setInterval(()=>{},1000)'],{stdio:'ignore'});
   writeFileSync('child.pid',String(child.pid));while(existsSync('hold')){await new Promise(resolve=>setTimeout(resolve,20))}
  }
 }}],build:{outDir:'dist',lib:{entry:'src/main.macos.js',formats:['cjs'],fileName:()=> 'devmain.cjs'},rollupOptions:{external:['@nativescript/macos-node-api',/^node:/]}}};\n`)
 run('bun',['install','--ignore-scripts','--linker','isolated'])
 run(process.execPath,[join(app,'node_modules/@octane-xplat/cli/install-native.mjs')])
 assert.equal(existsSync(join(app,'node_modules/@octane-xplat/cli/dist')),false)
 cache=join(homedir(),'.cache/octane-xplat/nim-hosts',createHash('sha256').update(realpathSync(app)).digest('hex').slice(0,32))
 const empty=call(['diagnostics']);assert.deepEqual(empty.data.sessions,[])
 assert.equal(existsSync(join(cache,'host.json')),false,'A diagnostics read must not start an owner')
 const available=call(['targets','--platform','macos']).data
 const reference=await createMacosAdapter().discoverTargets({id:available.app,root:app},{host:'darwin'})
 assert.deepEqual(available.platforms[0].targets,reference.targets.map(target=>({...target,busy:false})))
 assert.equal(available.platforms[0].targets[0].busy,false)
 assert.equal(existsSync(join(cache,'host.json')),false,'Target discovery must not start an owner')
 assert.equal(call(['targets','--platform','web']).data.platforms[0].declared,false)
 for(const args of [['--limit','3'],['--report','missing'],['--session','missing','--job','missing'],['--job','missing','--platform','macos']]){
  assert.equal(call(['diagnostics',...args],2).error.code,'invalid_selection')
 }
 const manifestPath=join(app,'package.json'),savedManifest=readFileSync(manifestPath,'utf8')
 const multiple=JSON.parse(savedManifest);multiple.xplat.targets.web={};write(manifestPath,multiple)
 write(join(app,'vite.config.mjs'),'export default {}\n')
 try{
  assert.equal(call(['session','start'],2).error.code,'ambiguous_selection')
  assert.equal(call(['session','attach','--platform','web'],3).error.code,'unsupported_capability')
 }
 finally{write(manifestPath,savedManifest);rmSync(join(app,'vite.config.mjs'))}
 write(join(app,'hold'),'')
 const first=start('first'),id=first.session.sessionId
 await until(()=>existsSync(join(app,'child.pid')),'Real Vite worker must arm before testing pending launch',180000,id)
 const engine=Number(readFileSync(join(app,'engine.pid'))),child=Number(readFileSync(join(app,'child.pid')))
 const duplicate=start('first');assert.equal(duplicate.deduplicated,true);assert.equal(duplicate.session.sessionId,id)
 for(const params of [{sessionId:id,jobId:'invalid'},{jobId:'invalid',platform:'macos'},{sessionId:42},{limit:2}]){
  const rejected=await rpc('runtime.readDiagnostics',params)
  assert.equal(rejected.ok,false);assert.equal(rejected.error.code,'invalid_selection')
 }
 assert.equal(call(['targets','--platform','macos']).data.platforms[0].targets[0].session.sessionId,id)
 assert.equal(call(['session','start','macos','--request-key','different'],3).error.code,'target_busy')
 await end(id)
 assert.equal(alive(engine),false);assert.equal(alive(child),false)
 await end(id)
 assert.ok(logs(id).length>0)
 checked('pending-launch deduplication, target conflict, cancellation before readiness, descendant cleanup, repeated end and retained logs')
 rmSync(join(app,'hold'));rmSync(join(app,'engine.pid'));rmSync(join(app,'child.pid'))
 const second=start('second'),live=second.session.sessionId
 assert.notEqual(live,id)
 await until(()=>session(live).state==='ready','Real macOS development host must become ready',180000,live)
 await until(()=>logs(live).some(record=>record.line.includes('NIM_DEV_ONE=40')),'Run the initial native C value',30000,live)
 const initialPid=Number(readFileSync(join(app,'app.pid'))),workerPid=Number(readFileSync(join(app,'engine.pid')))
 assert.ok(session(live).nativeIdentity.processes.some(process=>process.pid===initialPid),'Structured readiness must retain the actual app PID')
 const other=join(app,'apps/b')
 write(join(other,'package.json'),{name:'other',private:true,xplat:{targets:{web:{}}}})
 write(join(other,'vite.config.mjs'),'throw Error("Discovery must not execute this config")\n')
 try{
  assert.deepEqual(call(['session','list','--app','apps/b']).data.sessions,[])
  for(const args of [['session','status',live],['session','end',live],['diagnostics','--session',live]]){
   assert.equal(call([...args,'--app','apps/b'],2).error.code,'not_found')
  }
  assert.equal(alive(initialPid),true,'Another selected app must not end this session')
 }finally{rmSync(join(app,'apps'),{recursive:true,force:true})}
 assert.equal(call(['session','start','macos','--request-key','second'],3).error.code,'target_busy')
 assert.ok(call(['diagnostics','--platform','macos']).data.sessions.some(record=>record.sessionId===live))
 assert.equal(call(['diagnostics','--session',live,'--platform','web'],2).error.code,'invalid_selection')
 checked('actual headless macOS app launch with native C, session readiness, live ownership and scoped diagnostics')
 write(join(app,'src/main.macos.js'),'export const invalid = ;\n')
 await until(()=>logs(live).some(record=>record.line.includes('JS rebuild failed; preserving the running app')),'A failed JavaScript rebuild must preserve the app',30000,live)
 assert.equal(alive(initialPid),true)
 write(join(app,'src/main.macos.js'),source('TWO'))
 await until(()=>logs(live).some(record=>record.line.includes('NIM_DEV_TWO=40')),'JavaScript edit must restart the app',30000,live)
 const jsPid=Number(readFileSync(join(app,'app.pid')))
 await until(()=>session(live).nativeIdentity.processes.some(process=>process.pid===jsPid),'JavaScript restart identity must be retained',10000,live)
 assert.notEqual(jsPid,initialPid);await until(()=>!alive(initialPid),'Previous app must retire',10000)
 const cFile=join(app,'native-leaf/platforms/macos/src/XplatC.c')
 const previous=readFileSync(cFile,'utf8');assert.match(previous,/XPLAT_VALUE/)
 write(cFile,'int xplat_c_value(void) { return ; invalid source }\n')
 await until(()=>logs(live).some(record=>record.line.includes('rebuild failed; preserving the running app')&&record.line.includes('macos-native')),'A failed native rebuild must preserve the app',180000,live)
 assert.equal(alive(jsPid),true)
 write(cFile,previous.replace('return XPLAT_VALUE','return XPLAT_VALUE + 1'))
 await until(()=>logs(live).some(record=>record.line.includes('NIM_DEV_TWO=41')),'Native source edit must compile and restart the app',180000,live)
 const nativePid=Number(readFileSync(join(app,'app.pid')))
 await until(()=>session(live).nativeIdentity.processes.some(process=>process.pid===nativePid),'Native restart identity must be retained',10000,live)
 assert.notEqual(nativePid,jsPid);await until(()=>!alive(jsPid),'Previous native app must retire',10000)
 checked('JavaScript/native rebuild failures preserve the app; fixes recover and retire old processes after actual C recompilation')
 const historyRoot=join(cache,'history',createHash('sha256').update(realpathSync(app)).digest('hex'))
 const unrelated=join(historyRoot,'sess_'+'f'.repeat(36))
 mkdirSync(unrelated,{mode:0o700});writeFileSync(join(unrelated,'session.json'),'{}',{mode:0o600})
 try{await end(live)}finally{rmSync(unrelated,{recursive:true,force:true})}
 assert.equal(call(['targets','--platform','macos']).data.platforms[0].targets[0].busy,false)
 assert.equal(alive(workerPid),false);assert.equal(alive(nativePid),false)
 assert.ok(logs(live).some(record=>record.line.includes('NIM_DEV_TWO=41')))
 checked('ending a ready session releases the real engine, current app and private resource directory while logs remain readable')
 // A prior pruning warning must not prevent reading a complete crash original.
 mkdirSync(unrelated,{mode:0o700});writeFileSync(join(unrelated,'session.json'),'{}',{mode:0o600})
 let third
 try {third=start('unexpected')}finally{rmSync(unrelated,{recursive:true,force:true})}
 const lost=third.session.sessionId
 await until(()=>session(lost).state==='ready','A new session must launch',180000,lost)
 await until(()=>logs(lost).some(record=>record.line.includes('NIM_DEV_TWO=41')),'New app must actually run',30000,lost)
 const lostPid=Number(readFileSync(join(app,'app.pid'))),lostWorker=Number(readFileSync(join(app,'engine.pid')))
 assert.ok(session(lost).nativeIdentity.processes.some(process=>process.pid===lostPid))
 process.kill(lostPid,'SIGABRT')
 await until(()=>session(lost).state==='disconnected','Unexpected app exit must become historical',15000)
 await until(()=>!alive(lostWorker)&&!existsSync(resources(lost)),'Unexpected exit must release engine/resources',15000)
 assert.equal(call(['targets','--platform','macos']).data.platforms[0].targets[0].busy,true,'Historical ownership must be explicitly ended')
 assert.ok(logs(lost).length>0)
 const nativeReport=await until(()=>call(['diagnostics','--session',lost]).data.reports.find(report=>report.association==='confirmed'),'macOS must deliver an associated .ips report for the deliberately aborted fixture',90000)
 const originalReport=call(['diagnostics','--session',lost,'--report',nativeReport.id]).data.report
 assert.equal(call(['diagnostics','--session',lost]).data.coverage.retention.status,'unavailable')
 assert.equal(originalReport.id,nativeReport.id);assert.match(originalReport.summary,/SIGABRT/)
 assert.equal('report_'+createHash('sha256').update(originalReport.content).digest('hex'),nativeReport.id)
 assert.equal(run(binary,['diagnostics','--session',lost,'--report',nativeReport.id,'--project',app]),`${nativeReport.id} — ${nativeReport.kind} (${nativeReport.association})\n${originalReport.content}\n`)
 assert.ok(run(binary,['diagnostics','--session',lost,'--project',app]).includes(nativeReport.id))
 assert.equal(call(['diagnostics','--session',lost,'--report','../session.json'],2).error.code,'invalid_selection')
 assert.equal(call(['diagnostics','--session',lost,'--report','report_'+'0'.repeat(64)],2).error.code,'not_found','Missing originals must not silently fall back to log results')
 await end(lost)
 checked('actual app SIGABRT becomes historical, releases engine/resources, associates the OS .ips report and retains its complete original')
 write(join(app,'src/main.macos.js'),'export const invalid = ;\n')
 const broken=start('broken').session.sessionId
 const failure=await until(()=>{const current=session(broken);return current.state==='failed'?current:false},'Invalid initial source must retain a failed launch',30000)
 assert.equal(failure.launch.error.code,'execution_failure')
 assert.ok(logs(broken).some(record=>record.line.includes('JS rebuild failed')))
 await end(broken)
 write(join(app,'src/main.macos.js'),source('TWO'))
 checked('initial compiler failure preserves its session identity and logs and releases owned resources')
 const worker=join(app,'node_modules/@octane-xplat/macos-build'),hidden=worker+'-hidden'
 renameSync(worker,hidden)
 try {
  const failed=start('missing').session.sessionId
  const record=await until(()=>{const current=session(failed);return current.state==='failed'?current:false},'Missing worker must retain failed session',10000)
  assert.equal(record.launch.error.code,'prerequisite_missing')
  assert.ok(logs(failed).some(record=>record.line.includes('Install @octane-xplat/macos-build')))
  await end(failed)
 }finally{renameSync(hidden,worker)}
 checked('missing project worker retains a structured failed session identity and readable diagnostics')
 renameSync(worker,hidden)
 try {
  write(join(worker,'package.json'),{name:'@octane-xplat/macos-build',version:'0.0.0',type:'module',exports:{'./dev-worker':'./dev-worker.js'}})
  write(join(worker,'dev-worker.js'),`import{readFileSync,writeFileSync}from 'node:fs';const request=JSON.parse(readFileSync(process.argv[2]));writeFileSync(process.argv[3],JSON.stringify({protocol:'octane-dev-worker',version:1,id:request.id,ok:true,data:{}}),{mode:0o600});\n`)
  const incompatible=start('incompatible-worker').session.sessionId
  const record=await until(()=>{const current=session(incompatible);return current.state==='failed'?current:false},'Old worker protocol must retain a failed session',10000)
  assert.equal(record.launch.error.code,'prerequisite_missing')
  assert.ok(logs(incompatible).some(value=>value.line.includes('protocol 2')))
  await end(incompatible)
 } finally {rmSync(worker,{recursive:true,force:true});renameSync(hidden,worker)}
 checked('incompatible project-worker protocol fails with a matching-toolchain installation hint and releases its owned resources')
 const retained=logs(live)
 await stopHost(false)
 assert.deepEqual(call(['diagnostics','--session',lost,'--report',nativeReport.id]).data.report,originalReport,'Retained native reports must remain readable without their owner')
 assert.deepEqual(logs(live),retained)
 const historical=session(live)
 assert.equal(historical.state,'stopped');assert.equal(historical.historical,true);assert.equal(historical.cleanupConfirmed,true)
 run(binary,['clean'])
 assert.deepEqual(logs(live),retained,'Project cache cleanup must preserve native retained evidence')
 assert.equal(call(['session','end',live]).data.result.ended,true)
 assert.ok(call(['session','list']).data.sessions.some(record=>record.sessionId===live))
 assert.equal(existsSync(join(cache,'host.json')),false,'Retained reads/end must not start a host')
 checked('retained session identity, completed cleanup, exact logs and repeated end survive host shutdown and project cache cleanup without starting another owner')
 // Own this disposable daemon through a real ChildProcess handle. Production
 // never signals a PID read from history; fixture cleanup uses the armed engine
 // known to remain alive in its owned build gate until explicitly killed here.
 rmSync(join(app,'engine.pid'),{force:true});rmSync(join(app,'child.pid'),{force:true});write(join(app,'hold'),'')
 crashHost=spawn(binary,['--internal-agent-host',app],{cwd:app,env,stdio:'ignore'})
 await until(async()=>existsSync(join(cache,'host.json'))&&(await rpc('host.ping',{})).result.pid===crashHost.pid,'Directly owned daemon must publish',10000)
 const abandoned=start('owner-loss').session.sessionId
 await until(()=>existsSync(join(app,'child.pid')),'Arm the engine before owner loss',180000,abandoned)
 crashEngine=Number(readFileSync(join(app,'engine.pid')));crashDescendant=Number(readFileSync(join(app,'child.pid')))
 const died=once(crashHost,'exit');crashHost.kill('SIGKILL');await died
 const abandonedStatus=session(abandoned),abandonedLogs=logs(abandoned)
 assert.equal(abandonedStatus.state,'disconnected');assert.equal(abandonedStatus.historical,true);assert.equal(abandonedStatus.cleanupConfirmed,false)
 assert.ok(abandonedLogs.length>0)
 assert.equal(call(['session','end',abandoned]).data.result.ended,false)
 assert.match(run(binary,['session','end',abandoned,'--project',app]),/cleanup not confirmed/)
 assert.equal(alive(crashEngine),true);assert.equal(alive(crashDescendant),true,'Historical end must not signal stored identities')
 process.kill(-crashEngine,'SIGKILL')
 await until(()=>!alive(crashEngine)&&!alive(crashDescendant),'Explicit fixture cleanup must release orphaned engine/group',15000)
 crashEngine=null;crashDescendant=null;rmSync(join(app,'hold'))
 checked('abrupt owner loss preserves logs and marks cleanup unconfirmed; historical end signals no stored PID')
 const replacement=start('new-owner').session.sessionId
 await until(()=>session(replacement).state==='ready','A replacement owner must launch a fresh session',180000,replacement)
 assert.notEqual(replacement,abandoned)
 assert.notEqual(session(replacement).ownerId,abandonedStatus.ownerId)
 assert.equal(session(abandoned).state,'disconnected');assert.equal(session(abandoned).cleanupConfirmed,false)
 assert.equal(call(['targets','--platform','macos']).data.platforms[0].targets[0].session.sessionId,replacement)
 await end(replacement)
 checked('a replacement authenticated owner keeps prior sessions historical and gives fresh ownership to a new identity')
 // Synthetic engines exercise selection only; actual app behavior is below.
 const selectionFixture=join(app,'macos/dev-worker.js')
 write(selectionFixture,'process.stdout.write("ready");setInterval(()=>{},1000)\n')
 const selectors=[]
 try {
  for(let i=0;i<2;i++){
   const child=spawn(process.execPath,[selectionFixture],{cwd:app,env,stdio:['ignore','pipe','ignore']}),exit=once(child,'exit')
   selectors.push({child,exit});await once(child.stdout,'data')
  }
  const ambiguous=call(['session','attach','--platform','macos'],2)
  assert.equal(ambiguous.error.code,'ambiguous_selection')
  const candidates=ambiguous.error.context.candidates
  assert.equal(candidates.length,2)
  assert.deepEqual(candidates.flatMap(value=>value.pids).sort((a,b)=>a-b),selectors.map(value=>value.child.pid).sort((a,b)=>a-b))
  const selected=call(['session','attach','--platform','macos','--target',candidates[0].targetId]).data.session
  sessions.push(selected.sessionId);assert.equal(selected.targetId,candidates[0].targetId)
  await end(selected.sessionId)
  for(const {child} of selectors){assert.equal(alive(child.pid),true)}
 } finally {
  for(const {child,exit} of selectors){if(child.exitCode===null&&child.signalCode===null){child.kill('SIGTERM');await exit}}
  rmSync(join(app,'macos'),{recursive:true,force:true})
 }
 checked('independent observed engines require an explicit returned target id; ending the selected observer preserves both fixture processes')
 // Start the actual project-installed engine outside native ownership. The test
 // owns its ChildProcess handle; the native attachment must never signal it.
 const externalResources=join(scratch,'external-resources'),request=join(scratch,'external-request.json'),ready=join(scratch,'external-ready.json')
 mkdirSync(externalResources)
 write(request,{protocol:'octane-dev-worker',version:2,id:'external-engine',operation:'macos-dev',project:app,resourceRoot:externalResources})
 externalEngine=spawn(process.execPath,[join(app,'node_modules/@octane-xplat/macos-build/dist/macos/dev-worker.js'),request,ready],{cwd:app,env,detached:true,stdio:['ignore','pipe','pipe']})
 externalExit=once(externalEngine,'exit')
 let externalOutput=''
 for(const stream of [externalEngine.stdout,externalEngine.stderr]){stream.on('data',chunk=>{externalOutput=(externalOutput+chunk).slice(-65536)})}
 await until(()=>existsSync(ready),'External canonical engine must publish readiness',180000)
 assert.equal(JSON.parse(readFileSync(ready)).ok,true,externalOutput)
 await until(()=>externalOutput.includes('NIM_DEV_TWO=41'),'External app must execute native C',30000)
 const externalPid=Number(readFileSync(join(app,'app.pid')))
 assert.equal(alive(externalPid),true)
 assert.equal(call(['session','attach'],2).error.code,'invalid_selection')
 assert.equal(call(['session','attach','--platform','macos','--target','wrong'],2).error.code,'invalid_selection')
 function attach() {const value=call(['session','attach','--platform','macos']).data;sessions.push(value.session.sessionId);assert.equal(value.session.ownership,'attached');assert.equal(value.session.state,'ready');return value.session.sessionId}
 const attached=attach()
 const denied=await rpc('runtime.attach',{platform:'macos'},[])
 assert.equal(denied.ok,false);assert.equal(denied.error.code,'permission_denied')
 assert.equal(session(attached).processKind,'warm')
 assert.equal(call(['session','attach','--platform','macos'],3).error.code,'target_busy')
 assert.equal(call(['session','start','macos'],3).error.code,'target_busy')
 const attachedDiagnostics=call(['diagnostics','--session',attached]).data
 assert.equal(attachedDiagnostics.coverage.applicationOutput,'not-captured')
 assert.ok(attachedDiagnostics.session.attachment.processes.some(value=>value.pid===externalEngine.pid))
 await until(()=>session(attached).nativeIdentity?.processes.some(process=>process.pid===externalPid),'SDK observation must retain the externally running app identity',10000,attached)
 assert.ok(logs(attached).length>0);assert.ok(logs(attached).every(value=>!value.line.includes('NIM_DEV_')))
 const detached=call(['session','end',attached]).data.result
 assert.match(detached.preserved[0],/user-owned/);assert.match(detached.released[0],/observer/)
 assert.equal(alive(externalEngine.pid),true);assert.equal(alive(externalPid),true)
 assert.deepEqual(call(['session','end',attached]).data.result,detached)
 checked('native attach discovers an actual external macOS engine, captures lifecycle only, rejects conflicts and releases only its observer')
 const observed=attach()
 externalOutput='';write(join(app,'src/main.macos.js'),source('ATTACHED'))
 await until(()=>externalOutput.includes('NIM_DEV_ATTACHED=41'),'External engine must rebuild while attached',30000)
 const rebuiltPid=Number(readFileSync(join(app,'app.pid')))
 await until(()=>session(observed).nativeIdentity?.processes.some(process=>process.pid===rebuiltPid),'SDK observation must follow the external app restart',10000,observed)
 assert.notEqual(rebuiltPid,externalPid);assert.equal(session(observed).state,'ready')
 await stopHost(false)
 assert.equal(alive(externalEngine.pid),true);assert.equal(alive(rebuiltPid),true)
 assert.equal(session(observed).cleanupConfirmed,true)
 assert.match(session(observed).attachment.cleanupScope,/external processes remain user-owned/)
 assert.ok(logs(observed).every(value=>!value.line.includes('NIM_DEV_')))
 checked('external engine HMR preserves the attachment; native host shutdown leaves its engine and app running with retained lifecycle evidence')
 const departed=attach()
 await stopExternal()
 await until(()=>!alive(rebuiltPid),'Test-owned external engine must clean its app',15000)
 await until(()=>session(departed).state==='disconnected','External engine exit must disconnect the observer',10000)
 assert.ok(logs(departed).some(value=>value.line.includes('exited or changed identity')))
 await end(departed)
 assert.equal(call(['session','attach','--platform','macos'],2).error.code,'not_found')
 checked('a replacement owner can reattach; external engine exit becomes disconnected and retained without signalling observed process identities')
} finally {
 await stopExternal()
 if(crashHost&&crashHost.exitCode===null&&crashHost.signalCode===null){
  const stopped=once(crashHost,'exit'),timer=setTimeout(()=>crashHost.kill('SIGKILL'),20000)
  crashHost.kill('SIGTERM')
  try{await stopped}finally{clearTimeout(timer)}
 }
 if(crashEngine&&alive(crashEngine)){process.kill(-crashEngine,'SIGKILL');await until(()=>!alive(crashEngine)&&(!crashDescendant||!alive(crashDescendant)),'Release fixture-owned orphan processes',15000)}
 if(cache&&existsSync(binary)){for(const id of new Set(sessions)){try{call(['session','end',id])}catch(error){console.error('Session cleanup: '+error.message)}}}
 await stopHost()
 rmSync(scratch,{recursive:true,force:true})
}
