// macOS report parsing/retention against the actual TypeScript implementation.
import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { randomUUID, createHash } from 'node:crypto'
import { homedir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync, chmodSync } from 'node:fs'
import { discoverNativeReports, readNativeReport } from '../../packages/cli/src/native-reports.ts'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild, envProbeInputs } from './native-inputs.mjs'
const root=resolve(import.meta.dirname,'../..'),scratch=scratchRun(root,'native-reports')
const binary=join(root,'research/nim-cli/native/env-probe')
assertCurrentNativeBuild(root,JSON.parse(readFileSync(join(root,'research/nim-cli/native/env-build.json'))),readFileSync(binary),envProbeInputs)
const hostCaches=new Set()
after(()=>{for(const cache of hostCaches){rmSync(cache,{recursive:true,force:true})}rmSync(scratch,{recursive:true,force:true})})
let next=0
function query(operation,extra={}) {
 const result=spawnSync(binary,[],{input:JSON.stringify({operation,dir:scratch,...extra})+'\n',encoding:'utf8',timeout:15000,maxBuffer:32*1024*1024})
 assert.equal(result.status,0,result.stderr+(result.error?.message??''));assert.equal(result.stderr,'')
 return JSON.parse(result.stdout)
}
function value(operation,extra={}) {const reply=query(operation,extra);assert.equal(reply.ok,true,reply.message);return reply.value}
function fixture() {
 const app=join(scratch,String(++next)),home=join(app,'home'),directory=join(home,'Library/Logs/DiagnosticReports'),cache=join(app,'native-cache')
 mkdirSync(directory,{recursive:true});writeFileSync(join(app,'package.json'),'{}')
 const now=new Date().toISOString(),run={sessionId:'sess_'+randomUUID(),platform:'macos',targetId:'macos',startedAt:now,endedAt:now,nativeIdentity:{appId:'org.example.test',processes:[{pid:321,observedAt:now}]}}
 const ips=(name,body={},header={},padding=0)=>{
  const content=JSON.stringify({bug_type:'309',bundleID:'org.example.test',platform:1,timestamp:now,...header})+'\n'+JSON.stringify({pid:321,platform:1,procLaunch:now,captureTime:now,exception:{type:'EXC_CRASH',signal:'SIGABRT'},...body,...(padding?{padding:'x'.repeat(padding)}:{})})
  writeFileSync(join(directory,name+'.ips'),content);return content
 }
 return {app,home,directory,cache,run,ips,scan:()=>value('reports',{dir:cache,run,home})}
}
async function parity(f) {
 const actual=f.scan(),reference=await discoverNativeReports(f.app,f.run,{host:'darwin',home:f.home})
 assert.deepEqual(actual.reports.toSorted((a,b)=>a.id.localeCompare(b.id)),reference.reports.toSorted((a,b)=>a.id.localeCompare(b.id)))
 assert.equal(actual.coverage.status,reference.coverage.status)
 return actual
}

test('ISO/Apple timestamps normalize offsets and fractions like Date.parse',()=>{
 for(const input of ['1969-12-31T23:59:59.999Z','2026-11-02T17:23:41.123Z','2026-11-02 12:23:41.123456 -0500','2026-11-02T12:23:41-05:00','2026-11-02 22:53:41.1 +0530','garbage','2026-11-02T17:23:41.123+99:99']){
  const date=Date.parse(input),expected=Number.isFinite(date)?new Date(date).toISOString():null
  assert.equal(value('report-time',{value:input}),expected,input)
 }
})

test('complete originals and confirmed/candidate associations match Node and survive source deletion', {skip:process.platform!=='darwin'},async()=>{
 const f=fixture(),original=f.ips('confirmed')
 f.ips('candidate',{pid:999});f.ips('wrong-bundle',{}, {bundleID:'org.other.app'})
 f.ips('wrong-platform',{platform:7});f.ips('stale',{captureTime:'2000-01-01T00:00:00Z'})
 f.ips('missing-bundle',{}, {bundleID:undefined})
 const result=await parity(f);assert.equal(result.reports.length,3)
 assert.ok(result.reports.some(row=>row.association==='candidate'))
 const id='report_'+createHash('sha256').update(original).digest('hex')
 assert.equal(result.reports.find(row=>row.id===id).association,'confirmed')
 assert.equal(value('report-read',{dir:f.cache,id}).content,original)
 assert.deepEqual(value('report-read',{dir:f.cache,id}),readNativeReport(f.app,f.run,id))
 rmSync(f.directory,{recursive:true});mkdirSync(f.directory)
 assert.deepEqual((await parity(f)).reports,result.reports)
 assert.equal(value('report-read',{dir:f.cache,id}).content,original)
 const other=fixture();assert.equal(query('report-read',{dir:other.cache,id}).ok,false)
 assert.equal(query('report-read',{dir:f.cache,id:'../session.json'}).ok,false)
 writeFileSync(join(f.cache,id+'.txt'),'tampered',{mode:0o600})
 assert.equal(query('report-read',{dir:f.cache,id}).ok,false)
})

test('unavailable, empty, malformed and unsafe sources stay distinct without following links or FIFOs', {skip:process.platform!=='darwin'},async()=>{
 const f=fixture();await parity(f);assert.equal(f.scan().coverage.status,'none-found')
 const source=f.ips('okay',{pid:888})
 writeFileSync(join(f.directory,'malformed.ips'),'not json')
 symlinkSync(join(f.directory,'okay.ips'),join(f.directory,'link.ips'))
 // mkfifo is an OS fixture operation; no shell interpolation of paths.
 const actual=await parity(f);assert.equal(actual.coverage.status,'partial');assert.equal(actual.reports.length,1)
 const fifo=spawnSync('/usr/bin/mkfifo',[join(f.directory,'pipe.ips')]);assert.equal(fifo.status,0)
 assert.deepEqual(f.scan().reports,actual.reports,'Native discovery must reject FIFOs without blocking')
 rmSync(join(f.directory,'pipe.ips'))
 assert.equal(value('report-read',{dir:f.cache,id:actual.reports[0].id}).content,source)
 const missing=value('reports',{dir:join(f.app,'missing-cache'),run:f.run,home:join(f.home,'missing')})
 assert.equal(missing.coverage.status,'unavailable')
 const noIdentity=value('reports',{dir:join(f.app,'no-identity'),run:{...f.run,nativeIdentity:undefined},home:f.home})
 assert.equal(noIdentity.coverage.status,'unavailable')
 const unsupported=value('reports',{dir:join(f.app,'web-cache'),run:{...f.run,platform:'web'},home:f.home})
 assert.equal(unsupported.coverage.status,'unsupported')
})

test('report count and byte budgets omit complete excess originals and deduplicate refreshes', {skip:process.platform!=='darwin'},async()=>{
 const count=fixture()
 for(let i=0;i<12;i++){count.ips('crash-'+i,{pid:i+100})}
 const result=await parity(count);assert.equal(result.reports.length,10);assert.equal(result.coverage.status,'partial')
 assert.equal(count.scan().reports.length,10)
 const bytes=fixture()
 for(let i=0;i<6;i++){bytes.ips('large-'+i,{pid:i+100},{},3*1024*1024)}
 bytes.ips('oversized',{}, {},4*1024*1024)
 const limited=await parity(bytes);assert.equal(limited.reports.length,5);assert.equal(limited.coverage.status,'partial')
 assert.ok(limited.reports.reduce((sum,row)=>sum+row.bytes,0)<=16*1024*1024)
 for(const report of limited.reports){assert.equal(Buffer.byteLength(value('report-read',{dir:bytes.cache,id:report.id}).content),report.bytes)}
})

test('private retained metadata and originals reject unsafe paths and corruption', {skip:process.platform!=='darwin'},()=>{
 const f=fixture();f.ips('owned');const report=f.scan().reports[0]
 chmodSync(join(f.cache,report.id+'.json'),0o644)
 assert.equal(query('reports',{dir:f.cache,run:f.run,home:f.home}).ok,false)
 chmodSync(join(f.cache,report.id+'.json'),0o600)
 rmSync(join(f.cache,report.id+'.txt'));symlinkSync(join(f.directory,'owned.ips'),join(f.cache,report.id+'.txt'))
 assert.equal(query('report-read',{dir:f.cache,id:report.id}).ok,false)
})

test('worker process history validates app identity, bounds, executable scope and launch timestamps',()=>{
 const f=fixture(),resource=join(f.app,'resources'),executable=join(resource,'bundle/App.app/Contents/MacOS/Host')
 mkdirSync(join(resource,'bundle/App.app/Contents/MacOS'),{recursive:true});writeFileSync(executable,'fixture')
 const observation={pid:321,executable,observedAt:f.run.startedAt}
 const data={appId:'org.example.test',pid:321,executable,processes:[observation],droppedProcesses:0}
 const request={appId:'org.example.test',resource,data}
 const actual=value('worker-app-identity',request)
 assert.equal(actual.processes[0].source,'project-worker-launch');assert.equal(actual.processes[0].pid,321)
 for(const changed of [{appId:'org.other.app'},{processes:[]},{processes:Array(65).fill(observation)},{droppedProcesses:-1},{pid:999},{processes:[{...observation,observedAt:'invalid'}]},{processes:[{...observation,executable:join(f.app,'package.json')}]}]){
  assert.equal(query('worker-app-identity',{...request,data:{...data,...changed}}).ok,false,JSON.stringify(changed))
 }
 rmSync(executable)
 assert.deepEqual(value('worker-app-identity',request),actual,'Launch evidence must remain valid after owned temporary executable cleanup')
})

test('public report reads use retained native history without an owner or Node/Bun on PATH', {skip:process.platform!=='darwin'},()=>{
 const f=fixture();writeFileSync(join(f.app,'package.json'),JSON.stringify({name:'native-report-reader',private:true,xplat:{targets:{macos:{runtime:'appkit-node-api'}}}}))
 const cache=join(homedir(),'.cache/octane-xplat/nim-hosts',createHash('sha256').update(f.app).digest('hex').slice(0,32));hostCaches.add(cache)
 const session={...f.run,appId:'.',ownership:'owned',state:'stopped',createdAt:f.run.startedAt}
 value('history',{dir:f.app,app:{id:'.',root:f.app},owner:'fixture-owner',steps:[{op:'create',id:f.run.sessionId,session},{op:'finish',id:f.run.sessionId,session:{state:'stopped'}}]})
 const reports=join(cache,'history',createHash('sha256').update(f.app).digest('hex'),f.run.sessionId,'reports')
 const original=f.ips('owned'),id=value('reports',{dir:reports,run:f.run,home:f.home}).reports[0].id
 const result=spawnSync(join(root,'research/nim-cli/native/xplat'),['diagnostics','--session',f.run.sessionId,'--report',id,'--project',f.app,'--json'],{cwd:f.app,env:{...process.env,PATH:''},encoding:'utf8',timeout:10000})
 assert.equal(result.status,0,result.stdout+result.stderr);assert.equal(JSON.parse(result.stdout).data.report.content,original)
 assert.equal(readFileSync(join(reports,id+'.txt'),'utf8'),original)
})
