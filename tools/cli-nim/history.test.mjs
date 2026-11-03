import assert from 'node:assert/strict'
import { test,after } from 'node:test'
import { spawn,spawnSync } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { createHash } from 'node:crypto'
import { homedir } from 'node:os'
import { join,resolve } from 'node:path'
import { mkdirSync,writeFileSync,readFileSync,existsSync,rmSync,cpSync,appendFileSync,chmodSync,symlinkSync,readdirSync } from 'node:fs'
import { readDevLogs } from '../../packages/cli/src/dev-logs.ts'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild,envProbeInputs } from './native-inputs.mjs'
const root=resolve(import.meta.dirname,'../..'),binary=join(root,'research/nim-cli/native/env-probe')
assertCurrentNativeBuild(root,JSON.parse(readFileSync(join(root,'research/nim-cli/native/env-build.json'))),readFileSync(binary),envProbeInputs)
const scratch=scratchRun(root,'history'),caches=new Set(),macOnly={skip:process.platform!=='darwin'}
let next=0
function fixture() {
 const workspace=join(scratch,String(++next)),app={id:'.',root:workspace}
 mkdirSync(workspace)
 const cache=join(homedir(),'.cache/octane-xplat/nim-hosts',createHash('sha256').update(workspace).digest('hex').slice(0,32))
 caches.add(cache)
 return {workspace,app,cache,history:join(cache,'history',createHash('sha256').update(workspace).digest('hex'))}
}
const id=n=>'sess_'+String(n).padStart(36,'0')
function session(n,extra={}) {return {sessionId:id(n),appId:'.',platform:'macos',targetId:'macos',ownership:'owned',state:'starting',createdAt:'2026-11-01T00:00:00.000Z',processKind:null,...extra}}
function record(seq,line='line '+seq,stream='stdout') {return {seq,ts:'2026-11-01T00:00:00.000Z',stream,source:'macos-dev',line}}
function query(f,steps,extra={}) {
 const run=spawnSync(binary,[],{input:JSON.stringify({operation:'history',dir:f.workspace,app:f.app,owner:'owner-one',steps,...extra})+'\n',encoding:'utf8',timeout:10000})
 assert.equal(run.status,0,run.stderr||run.error?.message);const reply=JSON.parse(run.stdout)
 assert.equal(reply.ok,true,JSON.stringify(reply));return reply.value
}
function create(n,extra={}) {return {op:'create',id:id(n),session:session(n,extra)}}
function reference(f,n,options={}) {
 const source=join(f.history,id(n)),target=join(f.workspace,'node_modules/.cache/xplat/sessions',id(n))
 mkdirSync(target,{recursive:true});cpSync(source,target,{recursive:true})
 const meta=JSON.parse(readFileSync(join(target,'session.json')));meta.pid=process.pid;writeFileSync(join(target,'session.json'),JSON.stringify(meta))
 const {session:_,coverage:__,...logs}=readDevLogs(f.workspace,id(n),options);return logs
}
function compared(f,n,params={}) {
 const reply=query(f,[{op:'read',id:id(n),params}])[0]
 assert.equal(reply.ok,true,JSON.stringify(reply));const {coverage:_,...logs}=reply.value.logs
 assert.deepEqual(logs,reference(f,n,params));return reply.value
}
after(()=>{for(const cache of caches){rmSync(cache,{recursive:true,force:true})}rmSync(scratch,{recursive:true,force:true})})

test('retained reads do not create a cache; app selection and IDs bound evidence',macOnly,()=>{
 const f=fixture();assert.deepEqual(query(f,[{op:'list'}])[0].value,[]);assert.equal(existsSync(f.cache),false)
 for(const bad of ['../escape','sess_bad','',id(1)+'extra']){
  assert.equal(query(f,[{op:'session',id:bad}])[0].error.code,'invalid_selection')
 }
 assert.equal(query(f,[{op:'session',id:id(1)}])[0].error.code,'not_found')
 assert.equal(query(f,[create(1)])[0].ok,true)
 const pending=join(f.history,id(9));mkdirSync(pending,{mode:0o700})
 assert.equal(query(f,[{op:'list'}])[0].value.length,1,'A concurrently created or interrupted directory without metadata is not a corrupt completed record')
 assert.equal(existsSync(join(pending,'session.json')),false,'Listing must not repair or create metadata')
 const other=fixture();assert.deepEqual(query(other,[{op:'list'}])[0].value,[])
 assert.equal(query(other,[{op:'session',id:id(1)}])[0].error.code,'not_found')
})

test('record bytes, tail/filter pagination and cursor progress match the TypeScript reader',macOnly,()=>{
 const f=fixture();const steps=[create(1)]
 for(let seq=1;seq<=12;seq++){steps.push({op:'append',id:id(1),record:record(seq,'π😀 '+seq,seq%2?'stdout':'stderr')})}
 assert.ok(query(f,steps).every(reply=>reply.ok))
 assert.equal(readFileSync(join(f.history,id(1),'current.jsonl'),'utf8'),
  Array.from({length:12},(_,index)=>JSON.stringify(record(index+1,'π😀 '+(index+1),(index+1)%2?'stdout':'stderr'))+'\n').join(''))
 for(const params of [{},{limit:3},{limit:3,stream:'stdout'},{cursor:0,limit:3},{cursor:5,limit:3,stream:'stderr'},{cursor:12,limit:3}]){compared(f,1,params)}
 const bad=query(f,[{op:'read',id:id(1),params:{cursor:13}}])[0];assert.equal(bad.error.code,'invalid_selection')
 const floats=query(f,[{op:'read',id:id(1),params:{cursor:1.5}}])[0];assert.equal(floats.error.code,'invalid_selection')
 assert.equal(query(f,[{op:'read',id:id(1),params:{limit:null}}])[0].error.code,'invalid_selection')
})

test('rotation bounds retained bytes and exposes lost records and incomplete appends',macOnly,()=>{
 const f=fixture(),steps=[create(1)]
 for(let seq=1;seq<=30;seq++){steps.push({op:'append',id:id(1),record:record(seq,'x'.repeat(180))})}
 assert.ok(query(f,steps,{segmentLimit:1024}).every(reply=>reply.ok))
 const dir=join(f.history,id(1)),files=readdirSync(dir).filter(name=>name.endsWith('.jsonl'))
 assert.ok(files.reduce((sum,name)=>sum+readFileSync(join(dir,name)).length,0)<=2048)
 const value=compared(f,1,{cursor:0});assert.equal(value.logs.truncated,true);assert.ok(value.logs.dropped>0)
 appendFileSync(join(dir,'current.jsonl'),' {"seq":999')
 assert.equal(compared(f,1).logs.incompleteTail,true)
})

test('metadata survives the writer, owner generations disclose loss, and completed runs confirm cleanup',macOnly,()=>{
 const f=fixture();query(f,[create(1),{op:'append',id:id(1),record:record(1)}])
 const live=query(f,[{op:'session',id:id(1)}])[0].value
 assert.equal(live.historical,false);assert.equal(live.cleanupConfirmed,false)
 for(const owner of ['','new-owner']){
  const lost=query(f,[{op:'session',id:id(1)},{op:'read',id:id(1)}],{owner})
  assert.equal(lost[0].value.state,'disconnected');assert.equal(lost[0].value.historical,true);assert.equal(lost[0].value.cleanupConfirmed,false)
  assert.equal(lost[1].value.logs.records[0].line,'line 1')
 }
 const g=fixture();query(g,[create(2),{op:'update',id:id(2),session:{state:'ready'}},{op:'finish',id:id(2),session:{state:'stopped'}}])
 const ended=query(g,[{op:'session',id:id(2)}],{owner:''})[0].value
 assert.equal(ended.state,'stopped');assert.equal(ended.historical,true);assert.equal(ended.cleanupConfirmed,true)
})

test('retention prunes only recognized historical runs and preserves active captures',macOnly,()=>{
 const f=fixture(),steps=[create(1)]
 for(let n=2;n<8;n++){steps.push(create(n),{op:'finish',id:id(n),session:{state:'stopped'}})}
 const values=query(f,steps,{runLimit:2});assert.ok(values.every(reply=>reply.ok))
 const list=query(f,[{op:'list'}])[0].value
 assert.equal(list.length,3);assert.ok(list.some(run=>run.sessionId===id(1)&&!run.historical))
 mkdirSync(join(f.history,'unrecognized'));writeFileSync(join(f.history,'unrecognized/keep'),'authored')
 query(f,[create(8),{op:'finish',id:id(8),session:{state:'stopped'}}],{runLimit:2})
 assert.equal(readFileSync(join(f.history,'unrecognized/keep'),'utf8'),'authored')
})

test('malformed metadata, unsafe paths, FIFO files and full invalid log records fail explicitly',macOnly,()=>{
 const f=fixture();query(f,[create(1),{op:'append',id:id(1),record:record(1)}])
 const dir=join(f.history,id(1)),meta=join(dir,'session.json'),saved=readFileSync(meta)
 writeFileSync(meta,'{}');assert.equal(query(f,[{op:'read',id:id(1)}])[0].error.code,'execution_failure');writeFileSync(meta,saved)
 chmodSync(meta,0o644);assert.equal(query(f,[{op:'read',id:id(1)}])[0].ok,false);chmodSync(meta,0o600)
 const outside=join(f.workspace,'outside');writeFileSync(outside,saved,{mode:0o600});rmSync(meta);symlinkSync(outside,meta)
 assert.equal(query(f,[{op:'read',id:id(1)}])[0].ok,false);assert.deepEqual(readFileSync(outside),saved);rmSync(meta)
 assert.equal(spawnSync('mkfifo',[meta]).status,0);assert.equal(query(f,[{op:'read',id:id(1)}])[0].ok,false);rmSync(meta);writeFileSync(meta,saved,{mode:0o600})
 appendFileSync(join(dir,'current.jsonl'),'invalid json\n');assert.equal(query(f,[{op:'read',id:id(1)}])[0].ok,false)
})

test('a failed append preserves the valid prefix, stops appending to a partial tail and discloses retention failure',macOnly,()=>{
 const f=fixture()
 const steps=[create(1),{op:'append',id:id(1),record:record(1,'preserved')},
  {op:'append',id:id(1),record:record(2,'x'.repeat(2000))},
  {op:'append',id:id(1),record:record(3,'must not append after failure')},
  {op:'finish',id:id(1),session:{state:'stopped'}},{op:'error',id:id(1)}]
 const results=query(f,steps,{segmentLimit:1024});assert.match(results.at(-1).value,/segment bound/)
 const retained=query(f,[{op:'read',id:id(1)}],{owner:''})[0].value
 assert.deepEqual(retained.logs.records.map(record=>record.line),['preserved'])
 assert.equal(retained.coverage.retention.status,'unavailable')
 assert.equal(retained.logs.historical,true)
})

test('native report cache failure preserves readable logs with explicit unavailability',macOnly,()=>{
 const f=fixture()
 query(f,[create(1),{op:'append',id:id(1),record:record(1,'captured before report lookup')},{op:'finish',id:id(1),session:{state:'stopped'}}])
 const reports=join(f.history,id(1),'reports');mkdirSync(reports,{mode:0o700})
 writeFileSync(join(reports,'report_'+'a'.repeat(64)+'.json'),'{}',{mode:0o600})
 const read=query(f,[{op:'read',id:id(1)}])[0]
 assert.equal(read.ok,true)
 assert.deepEqual(read.value.logs.records.map(row=>row.line),['captured before report lookup'])
 assert.equal(read.value.coverage.nativeReports.status,'unavailable')
 assert.deepEqual(read.value.reports,[])
})

test('independent processes read bounded, contiguous snapshots during append and rotation',macOnly,async()=>{
 const f=fixture(),steps=[create(1)]
 for(let seq=1;seq<=500;seq++){
  steps.push({op:'append',id:id(1),record:record(seq,'x'.repeat(280))},{op:'pause',ms:1})
  if(seq%10===0){steps.push({op:'update',id:id(1),session:{state:'ready',detail:'update '+seq}})}
 }
 steps.push({op:'finish',id:id(1),session:{state:'stopped'}})
 const writer=spawn(binary,[],{stdio:['pipe','pipe','pipe']}),exited=once(writer,'exit')
 let stderr='';writer.stdout.resume();writer.stderr.on('data',chunk=>{stderr+=chunk})
 writer.stdin.end(JSON.stringify({operation:'history',dir:f.workspace,app:f.app,owner:'owner-one',steps,segmentLimit:4096})+'\n')
 let reads=0,newest=0
 try {
  while(writer.exitCode===null&&writer.signalCode===null){
   if(existsSync(join(f.history,id(1),'session.json'))){
    const reply=query(f,[{op:'read',id:id(1)}])[0]
    if(reply.ok){const logs=reply.value.logs;assert.ok(logs.newestSeq>=newest);newest=logs.newestSeq;reads++}
    else{assert.equal(reply.error.retryable,true,JSON.stringify(reply))}
   }
   await delay(1)
  }
  const [code]=await exited;assert.equal(code,0,stderr);assert.ok(reads>1,'Exercise concurrent readers while the writer is active')
  assert.equal(compared(f,1).logs.newestSeq,500)
 }finally{if(writer.exitCode===null&&writer.signalCode===null){writer.kill('SIGKILL');await exited}}
})

test('a real metadata rename failure preserves the previous complete checkpoint and cleans its temporary file',macOnly,()=>{
 const f=fixture();query(f,[create(1)])
 const dir=join(f.history,id(1)),file=join(dir,'session.json'),saved=readFileSync(file)
 assert.equal(spawnSync('chflags',['uchg',file]).status,0)
 try{
  assert.equal(query(f,[{op:'publish',id:id(1),value:{mustNotReplace:true}}])[0].ok,false)
  assert.deepEqual(readFileSync(file),saved)
  assert.deepEqual(readdirSync(dir).filter(name=>name.startsWith('session.json.')),[])
 }finally{assert.equal(spawnSync('chflags',['nouchg',file]).status,0)}
 const updated={...JSON.parse(saved),detail:'recovered metadata'}
 assert.equal(query(f,[{op:'publish',id:id(1),value:updated}])[0].ok,true)
 assert.equal(query(f,[{op:'session',id:id(1)}])[0].value.detail,'recovered metadata')
})
