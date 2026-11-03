// Actual native asset bytes and inference, with a responsive owned-process boundary.
import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { createReadStream, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { resolve, join } from 'node:path'
import { createHash } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { scratchRun } from './scratch.mjs'
import { computeProbeInputs, assertCurrentNativeBuild } from './native-inputs.mjs'
import { modelFixtureDir } from './model-fixtures.mjs'
import { runtimeWork, runtimeTarget } from './ort-fixtures.mjs'
if(process.platform!=='darwin'||process.arch!=='arm64'){throw Error('Native inference execution requires macOS arm64')}
const root=resolve(import.meta.dirname,'../..'),scratch=scratchRun(root,'docs-compute')
const binary=join(root,'research/nim-cli/native/docs-compute-probe')
assertCurrentNativeBuild(root,JSON.parse(readFileSync(join(root,'research/nim-cli/native/docs-compute-build.json'))),readFileSync(binary),computeProbeInputs)
const model=JSON.parse(readFileSync(join(root,'tools/cli-nim/model-assets.json')))
const runtime=JSON.parse(readFileSync(join(root,'tools/cli-nim/ort-runtime.json')))
const cache=join(scratch,'verified assets 雪'),index=join(scratch,'index')
let requests=0,behavior='valid',next=0
const server=createServer((request,response)=>{
 requests++
 if(behavior==='hang'){response.writeHead(200);response.write('x');return}
 if(behavior==='wrong'){response.writeHead(200);response.end('wrong');return}
 const key=decodeURIComponent(request.url.slice(1))
 const path=key==='runtime/archive'?join(runtimeWork,runtimeTarget.directory+'.tgz'):key.startsWith('model/')?join(modelFixtureDir,key.slice(6)):null
 if(!path){response.writeHead(404).end();return}
 response.writeHead(200)
 createReadStream(path).pipe(response)
})
server.listen(0,'127.0.0.1');await once(server,'listening')
const url='http://127.0.0.1:'+server.address().port
const sockets=new Set();server.on('connection',socket=>{sockets.add(socket);socket.once('close',()=>sockets.delete(socket))})
after(async()=>{for(const socket of sockets){socket.destroy()}await new Promise(resolve=>server.close(resolve));rmSync(scratch,{recursive:true,force:true})})
async function invoke(request,{allowNetwork=false}={}) {
 const child=allowNetwork?spawn(binary,[],{env:{...process.env,PATH:''},stdio:['pipe','pipe','pipe']}):
  spawn('/usr/bin/sandbox-exec',['-p','(version 1)(allow default)(deny network*)',binary],{env:{...process.env,PATH:''},stdio:['pipe','pipe','pipe']})
 let stdout='',stderr=''
 const timeout=setTimeout(()=>child.kill('SIGKILL'),120000)
 child.stdout.on('data',bytes=>{stdout+=bytes});child.stderr.on('data',bytes=>{stderr+=bytes})
 child.stdin.end(JSON.stringify(request)+'\n')
 try {
  const [code]=await once(child,'exit');assert.equal(code,0,stderr)
  assert.equal(stderr,'');return JSON.parse(stdout)
 } finally {clearTimeout(timeout)}
}
function request(operation,documents,extra={}) {return {operation,documents,binding:'native-compute-test',cacheDir:index,assetRoot:cache,...extra}}
function alive(pid) {try{process.kill(pid,0);return true}catch(error){if(error.code==='ESRCH'){return false}throw error}}
const documents=[
 {path:'docs/navigation.md',corpus:'guide',content:'# Navigation\n\n## Guard unsaved edits\n\nAsk for confirmation before leaving a dirty form with unsaved input. Cancel navigation to keep editing.'},
 {path:'docs/storage.md',corpus:'guide',content:'# Storage\n\n## Durable records\n\nSQLite saves records to disk so data remains after closing and reopening the database.'},
 {path:'docs/audio.md',corpus:'guide',content:'# Audio\n\n## Record a voice memo\n\nCapture microphone sound in a recording session. Stop recording to save an audio file.'},
]

test('search fallback performs no download and never loads an absent native model',async()=>{
 const before=requests
 const result=await invoke({request:request('search',documents,{query:'SQLite saves',limit:3})})
 assert.equal(result.ok,true,JSON.stringify(result.error));assert.equal(result.value.retrieval.used,'lexical')
 assert.equal(result.value.retrieval.reason,'index-not-ready');assert.equal(result.value.results[0].path,'docs/storage.md')
 assert.equal(requests,before);assert.equal(alive(result.pid),false)
 assert.deepEqual(readdirSync(join(cache,'operations')),[])
})

test('empty index preparation does not download or require model assets',async()=>{
 const before=requests,empty=join(scratch,'empty-assets')
 const result=await invoke({request:request('index',[],{assetRoot:empty,cacheDir:join(scratch,'empty-index')})})
 assert.equal(result.ok,true,JSON.stringify(result.error));assert.equal(result.value.chunks,0);assert.equal(result.value.embedded,0)
 assert.equal(requests,before);assert.deepEqual(readdirSync(join(empty,'operations')),[])
})

test('asset preparation is explicit, streaming, bounded and verifies actual pinned files',async()=>{
 const before=requests
 const missing=await invoke({request:{assetRoot:cache},assetUrl:url,download:false},{allowNetwork:true})
 assert.equal(missing.ok,false);assert.equal(missing.error.code,'prerequisite_missing');assert.equal(requests,before)
 const prepared=await invoke({request:{assetRoot:cache},assetUrl:url,download:true},{allowNetwork:true})
 assert.equal(prepared.ok,true,JSON.stringify(prepared.error));assert.equal(requests-before,5)
 for(const [name,pin] of Object.entries(model.files)){
  const bytes=readFileSync(join(prepared.value.modelDirectory,name));assert.equal(bytes.length,pin.bytes)
  assert.equal(createHash('sha256').update(bytes).digest('hex'),pin.sha256)
 }
 for(const [name,pin] of Object.entries(runtime.targets['darwin-arm64'].files)){
  const bytes=readFileSync(join(cache,'runtime/1.31.1-darwin-arm64',name));assert.equal(bytes.length,pin.bytes)
  assert.equal(createHash('sha256').update(bytes).digest('hex'),pin.sha256)
 }
 const again=await invoke({request:{assetRoot:cache},assetUrl:url,download:false})
 assert.equal(again.ok,true,JSON.stringify(again.error));assert.equal(requests-before,5)
 assert.deepEqual(readdirSync(join(cache,'operations')),[])
})

test('wrong bytes and cancellation never publish partial assets, and a retry remains possible',async()=>{
 behavior='wrong'
 const broken=join(scratch,'broken-'+(++next))
 const bad=await invoke({request:{assetRoot:broken},assetUrl:url,download:true},{allowNetwork:true})
 assert.equal(bad.ok,false);assert.deepEqual(readdirSync(join(broken,'operations')),[])
 behavior='hang'
 const cancelled=await invoke({request:{assetRoot:broken},assetUrl:url,download:true,cancelAfterMs:100},{allowNetwork:true})
 assert.equal(cancelled.ok,false);assert.equal(cancelled.error.code,'cancelled')
 assert.deepEqual(readdirSync(join(broken,'operations')),[])
 behavior='wrong'
 const retry=await invoke({request:{assetRoot:broken},assetUrl:url,download:true},{allowNetwork:true})
 assert.equal(retry.ok,false);assert.doesNotMatch(retry.error.message,/Another native inference preparation/)
 behavior='valid'
})

test('real inference keeps useful retrieval and reusable native engine caches without network access',async()=>{
 const prepared=await invoke({request:request('index',documents)})
 assert.equal(prepared.ok,true,JSON.stringify(prepared.error));assert.equal(prepared.value.status,'ready')
 assert.equal(prepared.value.embedded,6);assert.ok(prepared.ticks>2,'The owner must continue dispatching while its native child works')
 assert.equal(alive(prepared.pid),false)
 for(const [query,wanted] of [['warn before discarding changes to a form','docs/navigation.md'],['store data after restarting the app','docs/storage.md'],['capture microphone speech to an audio file','docs/audio.md']]){
  const found=await invoke({request:request('search',documents,{query,limit:3})})
  assert.equal(found.ok,true,JSON.stringify(found.error));assert.equal(found.value.retrieval.used,'hybrid')
  assert.equal(found.value.results[0].path,wanted);assert.ok(found.value.results[0].content)
 }
 const again=await invoke({request:request('index',documents)})
 assert.equal(again.ok,true,JSON.stringify(again.error));assert.equal(again.value.embedded,0)
 assert.deepEqual(readdirSync(join(cache,'operations')),[])
})

test('cancellation and deadlines await native child cleanup and leave SQLite readable',async()=>{
 const many=Array.from({length:512},(_,at)=>({path:`docs/item-${at}.md`,corpus:'guide',content:`# Document ${at}\n\n${'Keep data safely and query local records. '.repeat(100)}`}))
 for(const extra of [{cancelAfterMs:300},{timeoutMs:300}]){
  const result=await invoke({request:request('index',many),...extra})
  assert.equal(result.ok,false);assert.equal(result.error.code,extra.cancelAfterMs?'cancelled':'timeout')
  assert.ok(result.ticks>10);assert.equal(alive(result.pid),false)
  assert.deepEqual(readdirSync(join(cache,'operations')),[])
 }
 const db=new DatabaseSync(join(index,'search-v1.sqlite'))
 try {assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok')}finally{db.close()}
 const later=await invoke({request:request('search',documents,{query:'SQLite saves',mode:'lexical'})})
 assert.equal(later.ok,true,JSON.stringify(later.error))
})

test('malformed inventories and unsafe cache roots fail with structured errors',async()=>{
 for(const changed of [{documents:{}},{cacheDir:'relative'},{cacheDir:index+'\0suffix'},{assetRoot:cache+'\0suffix'},{assetRoot:'relative'},{operation:'unknown'},{query:'',operation:'search'}]){
  const result=await invoke({request:request('search',documents,{query:'navigation',...changed})})
  assert.equal(result.ok,false);assert.equal(result.error.code,'invalid_selection')
  assert.deepEqual(readdirSync(join(cache,'operations')),[])
 }
})


test('the production executable executes native inference with no JS runtime or network',async()=>{
 const main=join(root,'research/nim-cli/native/xplat')
 assertCurrentNativeBuild(root,JSON.parse(readFileSync(join(root,'research/nim-cli/native/build.json'))),readFileSync(main))
 const id='docs_production',directory=join(cache,'operations',id)
 mkdirSync(directory,{mode:0o700})
 writeFileSync(join(directory,'request.json'),JSON.stringify({...request('search',documents,{query:'capture microphone speech to an audio file',limit:3}),protocol:'octane-native-docs',version:1,id}),{mode:0o600})
 const child=spawn('/usr/bin/sandbox-exec',['-p','(version 1)(allow default)(deny network*)',main,'--internal-docs-compute',directory],{env:{...process.env,PATH:''},stdio:'ignore'})
 const exited=once(child,'exit'),timer=setTimeout(()=>child.kill('SIGKILL'),15000)
 try{
  const [code]=await exited;assert.equal(code,0)
  const reply=JSON.parse(readFileSync(join(directory,'response.json')))
  assert.equal(reply.ok,true,JSON.stringify(reply.error));assert.equal(reply.value.retrieval.used,'hybrid')
  assert.equal(reply.value.results[0].path,'docs/audio.md')
 }finally{
  clearTimeout(timer)
  if(child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await exited}
  rmSync(directory,{recursive:true,force:true})
 }
})
