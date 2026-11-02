// Isolated packed macOS toolchain; no old CLI runtime or visual inspection.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createConnection } from 'node:net'
import { homedir } from 'node:os'
import { join, dirname, resolve, relative } from 'node:path'
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, lstatSync, readlinkSync, realpathSync, renameSync, symlinkSync, rmSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'
import { packageMacOS } from '../../packages/cli/src/macos/package.ts'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild } from './native-inputs.mjs'

if (process.platform !== 'darwin') { console.log('macOS execution required; no qualification on this host'); process.exit(0) }
const root=resolve(import.meta.dirname,'../..'), withNative=process.argv.includes('--with-native-cli')
const scratch=scratchRun(root,'macos-build'), app=join(scratch,'app'), packs=join(scratch,'packs')
mkdirSync(app);mkdirSync(packs)
const evidence={ platform:process.platform,arch:process.arch,withNative,checks:[] }
function checked(message) {
 evidence.checks.push(message)
 write(join(root,'research/nim-cli/macos-build-consumer.json'),evidence)
 console.log('Qualified: '+message)
}
function run(command,args,cwd=app,extra={}) {
 const result=spawnSync(command,args,{ cwd,encoding:'utf8',timeout:240000,maxBuffer:16*1024*1024,
  env:{...process.env,MACOS_SIGNING_IDENTITY:'',MACOS_NOTARY_PROFILE:'',XPLAT_MACOS_SKIP_SIGNING:'0',NODE_PATH:'',NODE_OPTIONS:'',...extra} })
 assert.equal(result.status,0,result.stdout+result.stderr+(result.error?.message??''))
 return result.stdout+result.stderr
}
function write(path,value) { mkdirSync(dirname(path),{recursive:true});writeFileSync(path,typeof value==='string'?value:JSON.stringify(value)) }
function pack(path) {
 const manifest=JSON.parse(readFileSync(join(root,path,'package.json')))
 run('bun',['pm','pack','--ignore-scripts','--destination',packs],join(root,path))
 return join(packs,`${manifest.name.replace('@','').replace('/','-')}-${manifest.version}.tgz`)
}
function snapshot(path) {
 const files={}
 function visit(dir) {
  for(const name of readdirSync(dir).sort()) {
   const file=join(dir,name), key=relative(path,file), stat=lstatSync(file)
   if(stat.isSymbolicLink()){files[key]='link:'+readlinkSync(file)}
   else if(stat.isDirectory()){visit(file)}
   else{files[key]=createHash('sha256').update(readFileSync(file)).digest('hex')}
  }
 }
 visit(path);return files
}
async function until(read,message,timeout=240000) {
 const deadline=Date.now()+timeout
 while(Date.now()<deadline) { const value=await read();if(value){return value}await delay(30) }
 assert.fail(message)
}
const binary=join(app,'node_modules/@octane-xplat/cli/bin/xplat.exe')
function cli(args) { return JSON.parse(run(binary,[...args,'--project',app,'--json'])) }
async function settled(id) {
 return await until(()=>{const job=cli(['job','status',id]).data.job;return ['succeeded','failed','cancelled'].includes(job.state)?job:false},'macOS build job must settle')
}
async function stopHost() {
 const key=createHash('sha256').update(realpathSync(app)).digest('hex').slice(0,32)
 const cache=join(homedir(),'.cache/octane-xplat/nim-hosts',key), file=join(cache,'host.json')
 if(!existsSync(file)){return}
 const descriptor=JSON.parse(readFileSync(file))
 await new Promise(resolve=>{
  const socket=createConnection(descriptor.socketPath), timer=setTimeout(()=>{socket.destroy();resolve()},3000)
  socket.once('connect',()=>socket.write(JSON.stringify({token:descriptor.token,method:'host.shutdown',params:{}})+'\n'))
  socket.on('data',()=>socket.destroy());socket.once('error',()=>{});socket.once('close',()=>{clearTimeout(timer);resolve()})
 })
 await until(()=>{try{process.kill(descriptor.pid,0);return false}catch(error){if(error.code==='ESRCH'){return true}throw error}},'Owned native host must end',20000)
 rmSync(cache,{recursive:true,force:true})
}
try {
 const workerPack=pack('packages/macos-build'), cPack=pack('packages/cli/test/fixtures/macos-native-leaves/c')
 evidence.workerTarballBytes=lstatSync(workerPack).size
 const nativeOutput=join(scratch,'native')
 if(withNative) {
  assertCurrentNativeBuild(root,JSON.parse(readFileSync(join(root,'research/nim-cli/native/build.json'))),readFileSync(join(root,'research/nim-cli/native/xplat')))
  run(process.execPath,[join(root,'tools/cli-nim/pack.mjs'),'--host-only','--destination',nativeOutput],root)
 }
 const version=withNative?JSON.parse(readFileSync(join(nativeOutput,'stage.json'))).version:null
 if(withNative){evidence.cliTarballBytes=lstatSync(join(nativeOutput,`octane-xplat-cli-${version}.tgz`)).size}
 const manifest={name:'nim-macos-consumer',private:true,type:'module',packageManager:'bun@1.4.4',
  dependencies:{octane:'0.16.3','@nativescript/macos-node-api':'0.4.4-next.2026-08-09-31292056208','xplat-native-c-fixture':`file:${cPack}`},
  devDependencies:{vite:'8.3.0','@octane-xplat/macos-build':`file:${workerPack}`,...(withNative?{'@octane-xplat/cli':`file:${join(nativeOutput,`octane-xplat-cli-${version}.tgz`)}`}:{})},
  xplat:{targets:{macos:{runtime:'appkit-node-api',package:{productName:'Nim CLI fixture',bundleIdentifier:'org.octane.xplat.nim-worker',executableName:'NimWorker',version:'0.1.0',minimumSystemVersion:'13.5',viteConfig:'vite.config.mjs',bundleFile:'dist/main.cjs'}}}}}
 write(join(app,'package.json'),manifest)
 write(join(app,'src/main.macos.js'),`import '@nativescript/macos-node-api';\nconst app=NSApplication.sharedApplication;app.setActivationPolicy(2);const value=xplat_c_value();if(value!==40){throw Error('Native compiler value differs')}console.log('NIM_MACOS_VALUE='+value);setTimeout(()=>app.terminate(null),30);\n`)
 const config=`export default {build:{outDir:'dist',lib:{entry:'src/main.macos.js',formats:['cjs'],fileName:'main'},rollupOptions:{external:['@nativescript/macos-node-api',/^node:/]}}};\n`
 write(join(app,'vite.config.mjs'),config)
 run('bun',['install','--ignore-scripts','--linker','isolated'])
 if(withNative){run(process.execPath,[join(app,'node_modules/@octane-xplat/cli/install-native.mjs')])}
 const installed=JSON.parse(readFileSync(join(app,'node_modules/@octane-xplat/macos-build/package.json')))
 assert.equal(installed.dependencies,undefined)
 assert.equal(existsSync(join(app,'node_modules/@octane-xplat/cli/dist')),false)
 if(!withNative){assert.equal(existsSync(join(app,'node_modules/@octane-xplat/cli')),false)}
 const release=join(app,'artifacts/macos-universal'), stage=join(release,'.xplat-macos-raw')
 mkdirSync(stage,{recursive:true})
 const input=join(scratch,'request.json'), output=join(scratch,'result.json')
 write(input,{protocol:'octane-build-worker',version:1,id:'packed-macos',operation:'macos-package',project:app,stagingRoot:stage})
 run(process.execPath,[join(app,'node_modules/@octane-xplat/macos-build/dist/macos/package-worker.js'),input,output])
 const result=JSON.parse(readFileSync(output));assert.equal(result.ok,true,JSON.stringify(result))
 const staged=result.data.appPath, stagedDmg=result.data.dmgPath
 assert.equal(staged,join(stage,'NimWorker.app'))
 assert.equal(existsSync(join(release,'NimWorker.app')),false,'Worker construction must not publish')
 run('codesign',['--verify','--deep','--strict',staged]);run('hdiutil',['verify',stagedDmg])
 assert.match(run(join(staged,'Contents/MacOS/NimWorker'),[]),/NIM_MACOS_VALUE=40/)
 const expected=snapshot(staged)
 evidence.appPayloadHashes=expected
 evidence.builtArchitectures=run('lipo',['-archs',join(staged,'Contents/MacOS/NimWorker')]).trim().split(/\s+/).sort()
 assert.deepEqual(evidence.builtArchitectures,['arm64','x86_64'])
 checked('isolated worker, native C compilation, staged signed app, verified DMG and headless host-architecture execution')
 const octaneLink=join(app,'node_modules/octane'), hiddenOctane=octaneLink+'-hidden'
 const globalModules=join(scratch,'global-modules'), missingStage=join(release,'.xplat-macos-global')
 mkdirSync(globalModules);mkdirSync(missingStage)
 symlinkSync(realpathSync(octaneLink),join(globalModules,'octane'),'dir')
 renameSync(octaneLink,hiddenOctane)
 try {
  write(input,{protocol:'octane-build-worker',version:1,id:'global-fallback',operation:'macos-package',project:app,stagingRoot:missingStage})
  const missing=spawnSync(process.execPath,[join(app,'node_modules/@octane-xplat/macos-build/dist/macos/package-worker.js'),input,output],{
   cwd:app,encoding:'utf8',timeout:10000,env:{...process.env,NODE_PATH:globalModules,NODE_OPTIONS:'',MACOS_SIGNING_IDENTITY:'',MACOS_NOTARY_PROFILE:''}})
  assert.equal(missing.status,1,missing.stdout+missing.stderr)
  const rejected=JSON.parse(readFileSync(output));assert.equal(rejected.error.code,'prerequisite_missing');assert.match(rejected.error.message,/Install octane in the selected project/)
 } finally {renameSync(hiddenOctane,octaneLink);rmSync(missingStage,{recursive:true,force:true})}
 checked('global Node module paths cannot supply a missing selected-project dependency')
 // Test-only oracle uses the canonical TypeScript operation, never a runtime CLI fallback.
 const saved={MACOS_SIGNING_IDENTITY:process.env.MACOS_SIGNING_IDENTITY,MACOS_NOTARY_PROFILE:process.env.MACOS_NOTARY_PROFILE,XPLAT_MACOS_SKIP_SIGNING:process.env.XPLAT_MACOS_SKIP_SIGNING}
 process.env.MACOS_SIGNING_IDENTITY='';process.env.MACOS_NOTARY_PROFILE='';process.env.XPLAT_MACOS_SKIP_SIGNING='0'
 try {await packageMacOS(app)} finally {for(const [key,value]of Object.entries(saved)){if(value===undefined){delete process.env[key]}else{process.env[key]=value}}}
 const final=join(release,'NimWorker.app'), dmg=join(release,'NimWorker-macos-universal.dmg')
 assert.deepEqual(snapshot(final),expected,'Canonical reference and packed worker must preserve the complete app payload')
 checked('byte-identical app payload against canonical TypeScript packager')
 if(withNative) {
  const start=cli(['runtime','build','--platform','macos']);assert.equal(start.ok,true,JSON.stringify(start))
  const job=await settled(start.data.job.jobId);assert.equal(job.state,'succeeded',JSON.stringify(job.error))
  assert.deepEqual(job.result.artifacts,{appPath:final,dmgPath:dmg})
  assert.deepEqual(snapshot(final),expected)
  assert.match(run(join(final,'Contents/MacOS/NimWorker'),[]),/NIM_MACOS_VALUE=40/)
  run('codesign',['--verify','--deep','--strict',final]);run('hdiutil',['verify',dmg])
  const logs=cli(['diagnostics','--job',job.jobId]).data.logs
  assert.ok(logs.records.some(record=>record.source==='macos-build'&&record.line.includes('leaf libraries')))
  assert.match(run(binary,['build','--targets','macos']),/Build complete/)
  checked('native runtime job, artifact publication, diagnostics and foreground build')
  const workerLink=join(app,'node_modules/@octane-xplat/macos-build'), hiddenWorker=workerLink+'-hidden'
  renameSync(workerLink,hiddenWorker)
  try {
   const missing=await settled(cli(['runtime','build','--platform','macos']).data.job.jobId)
   assert.equal(missing.state,'failed');assert.equal(missing.error.code,'prerequisite_missing');assert.match(missing.error.message,/Install @octane-xplat\/macos-build/)
  } finally {renameSync(hiddenWorker,workerLink)}
  checked('missing project worker produces structured prerequisite failure')
  const before=snapshot(final), oldDmg=readFileSync(dmg)
  const childProgram='process.on("SIGTERM",()=>{});setTimeout(()=>process.exit(0),20000)'
  write(join(app,'vite.config.mjs'),`import {spawn}from 'node:child_process';import{writeFileSync}from 'node:fs';
${config.replace('export default {','const base={')}
base.plugins=[{name:'cancel',async buildStart(){
 const child=spawn(process.execPath,['-e',${JSON.stringify(childProgram)}],{stdio:'ignore'});
 process.on('SIGTERM',()=>{});writeFileSync('armed.json',JSON.stringify([process.pid,child.pid]));
 await new Promise(resolve=>setTimeout(resolve,20000));
}}];export default base;`)
  const pending=cli(['runtime','build','--platform','macos']).data.job.jobId
  const pids=await until(()=>{
   let pids
   try{pids=JSON.parse(readFileSync(join(app,'armed.json')))}catch(error){if(error.code!=='ENOENT'&&!(error instanceof SyntaxError)){throw error}}
   if(pids){return pids}
   const job=cli(['job','status',pending]).data.job
   assert.ok(!['succeeded','failed','cancelled'].includes(job.state),'Engine did not arm: '+JSON.stringify(job))
   return false
  },'Observe actual compiler processes')
  const busy=spawnSync(binary,['build','--targets','macos'],{cwd:app,encoding:'utf8',timeout:10000,
   env:{...process.env,MACOS_SIGNING_IDENTITY:'',MACOS_NOTARY_PROFILE:'',XPLAT_MACOS_SKIP_SIGNING:'0'}})
  assert.equal(busy.status,1,busy.stdout+busy.stderr);assert.match(busy.stderr,/Another native macOS build/)
  assert.equal(cli(['job','cancel',pending]).ok,true)
  assert.equal((await settled(pending)).state,'cancelled')
  for(const pid of pids){assert.throws(()=>process.kill(pid,0),{code:'ESRCH'})}
  assert.deepEqual(snapshot(final),before);assert.deepEqual(readFileSync(dmg),oldDmg)
  assert.deepEqual(readdirSync(release).filter(name=>name.startsWith('.xplat-macos-')&&name!=='.xplat-macos-raw'),[])
  checked('cancel real engine/descendant before publication; reject overlapping native build; preserve previous app and DMG; remove owned staging')
 }
 write(join(root,'research/nim-cli/macos-build-consumer.json'),evidence)
 console.log(JSON.stringify({...evidence,appPayloadHashes:undefined}))
} finally {
 if(withNative){await stopHost()}
 rmSync(scratch,{recursive:true,force:true})
}
