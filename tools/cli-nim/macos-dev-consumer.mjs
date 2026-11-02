// Real packed development engine, headless app and native ownership. No images.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
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
function resources(id) {return join(cache,'sessions',id)}
async function end(id) {assert.equal(call(['session','end',id]).ok,true);await until(()=>!existsSync(resources(id)),'Owned session resources must be released',15000)}
async function rpc(method,params) {
 const descriptor=JSON.parse(readFileSync(join(cache,'host.json')))
 return await new Promise((resolve,reject)=>{
  const socket=createConnection(descriptor.socketPath),timer=setTimeout(()=>socket.destroy(Error('RPC deadline')),10000)
  let bytes=''
  socket.once('connect',()=>socket.write(JSON.stringify({token:descriptor.token,method,params,appId:'.'})+'\n'))
  socket.on('data',chunk=>{bytes+=chunk.toString();if(bytes.includes('\n')){socket.destroy();try{resolve(JSON.parse(bytes.split('\n')[0]))}catch(error){reject(error)}}})
  socket.once('error',reject);socket.once('close',()=>clearTimeout(timer))
 })
}
async function stopHost() {
 if(!cache||!existsSync(join(cache,'host.json'))){return}
 const descriptor=JSON.parse(readFileSync(join(cache,'host.json')))
 await new Promise(resolve=>{
  const socket=createConnection(descriptor.socketPath),timer=setTimeout(()=>{socket.destroy();resolve()},10000)
  socket.once('connect',()=>socket.write(JSON.stringify({token:descriptor.token,method:'host.shutdown',params:{}})+'\n'))
  socket.on('data',()=>socket.destroy());socket.once('error',()=>{});socket.once('close',()=>{clearTimeout(timer);resolve()})
 })
 await until(()=>!alive(descriptor.pid),'Owned workspace host must end',20000)
 rmSync(cache,{recursive:true,force:true})
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
 try{assert.equal(call(['session','start'],2).error.code,'ambiguous_selection')}
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
 assert.notEqual(jsPid,initialPid);await until(()=>!alive(initialPid),'Previous app must retire',10000)
 const cFile=join(app,'native-leaf/platforms/macos/src/XplatC.c')
 const previous=readFileSync(cFile,'utf8');assert.match(previous,/XPLAT_VALUE/)
 write(cFile,'int xplat_c_value(void) { return ; invalid source }\n')
 await until(()=>logs(live).some(record=>record.line.includes('rebuild failed; preserving the running app')&&record.line.includes('macos-native')),'A failed native rebuild must preserve the app',180000,live)
 assert.equal(alive(jsPid),true)
 write(cFile,previous.replace('return XPLAT_VALUE','return XPLAT_VALUE + 1'))
 await until(()=>logs(live).some(record=>record.line.includes('NIM_DEV_TWO=41')),'Native source edit must compile and restart the app',180000,live)
 const nativePid=Number(readFileSync(join(app,'app.pid')))
 assert.notEqual(nativePid,jsPid);await until(()=>!alive(jsPid),'Previous native app must retire',10000)
 checked('JavaScript/native rebuild failures preserve the app; fixes recover and retire old processes after actual C recompilation')
 await end(live)
 assert.equal(call(['targets','--platform','macos']).data.platforms[0].targets[0].busy,false)
 assert.equal(alive(workerPid),false);assert.equal(alive(nativePid),false)
 assert.ok(logs(live).some(record=>record.line.includes('NIM_DEV_TWO=41')))
 checked('ending a ready session releases the real engine, current app and private resource directory while logs remain readable')
 const third=start('unexpected'),lost=third.session.sessionId
 await until(()=>session(lost).state==='ready','A new session must launch',180000,lost)
 await until(()=>logs(lost).some(record=>record.line.includes('NIM_DEV_TWO=41')),'New app must actually run',30000,lost)
 const lostPid=Number(readFileSync(join(app,'app.pid'))),lostWorker=Number(readFileSync(join(app,'engine.pid')))
 process.kill(lostPid,'SIGTERM')
 await until(()=>session(lost).state==='disconnected','Unexpected app exit must become historical',15000)
 await until(()=>!alive(lostWorker)&&!existsSync(resources(lost)),'Unexpected exit must release engine/resources',15000)
 assert.equal(call(['targets','--platform','macos']).data.platforms[0].targets[0].busy,true,'Historical ownership must be explicitly ended')
 assert.ok(logs(lost).length>0)
 await end(lost)
 checked('unexpected app exit becomes historical, releases engine/resources and keeps diagnostics until explicit session end')
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
} finally {
 if(cache&&existsSync(binary)){for(const id of new Set(sessions)){try{call(['session','end',id])}catch(error){console.error('Session cleanup: '+error.message)}}}
 await stopHost()
 rmSync(scratch,{recursive:true,force:true})
}
