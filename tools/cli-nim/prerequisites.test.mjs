import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { mkdirSync, writeFileSync, readFileSync, chmodSync, rmSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild, envProbeInputs } from './native-inputs.mjs'
const root = resolve(import.meta.dirname,'../..')
const binary = join(root,`research/nim-cli/native/env-probe${process.platform === 'win32' ? '.exe' : ''}`)
assertCurrentNativeBuild(root,JSON.parse(readFileSync(join(root,'research/nim-cli/native/env-build.json'))),readFileSync(binary),envProbeInputs)
const scratch = scratchRun(root,'prerequisites')
after(() => rmSync(scratch,{recursive:true,force:true}))
const macOnly = {skip:process.platform !== 'darwin'}
let sequence = 0
function fixture(tools = {}) {
 const dir = join(scratch,String(++sequence)), bin = join(dir,'bin')
 mkdirSync(bin,{recursive:true})
 writeFileSync(join(dir,'package.json'),'{"type":"module","private":true}')
 writeFileSync(join(dir,'tools.json'),JSON.stringify(tools))
 for (const command of Object.keys(tools)) {
  const file = join(bin,command)
  writeFileSync(file,`#!${process.execPath}\nimport fs from 'node:fs'; import { basename } from 'node:path';
const command = basename(process.argv[1]);
fs.appendFileSync('calls.jsonl',JSON.stringify({command,args:process.argv.slice(2),cwd:process.cwd(),sentinel:process.env.XPLAT_PROBE_SENTINEL})+'\\n');
const tool=JSON.parse(fs.readFileSync('tools.json','utf8'))[command];
if(tool.stderr) process.stderr.write(tool.stderr);
if(tool.output) process.stdout.write(Buffer.from(tool.output,'base64'));
process.exitCode=tool.code??0;\n`)
  chmodSync(file,0o755)
 }
 return {dir,env:{PATH:bin,XPLAT_PROBE_SENTINEL:'owned-project'}}
}
const tool = (output,code=0,stderr) => ({output:Buffer.from(output).toString('base64'),code,stderr})
function query(request,native=true) {
 const run = spawnSync(native ? binary : process.execPath,native ? [] : [join(import.meta.dirname,'prerequisites-reference.mjs')],
  {cwd:request.dir,input:JSON.stringify(request)+'\n',encoding:'utf8',env:{...process.env,...request.env},timeout:20000,maxBuffer:4*1024*1024})
 assert.equal(run.status,0,run.stderr)
 assert.equal(run.stderr,'')
 return JSON.parse(run.stdout)
}
function calls(dir) { return existsSync(join(dir,'calls.jsonl')) ? readFileSync(join(dir,'calls.jsonl'),'utf8').trim().split('\n').map(JSON.parse) : [] }

test('tool selection, version text and missing remedies match real Node discovery checks',macOnly,() => {
 const outputs = {node:tool(process.version+'\n'),bun:tool('\ufeff1.4.4\u00a0\n'),git:tool('git version fixture\r\n'),
  xcodebuild:tool('Xcode fixture\r\nBuild version fixture\n'),adb:tool('Android Debug Bridge fixture\r\nnext line\n')}
 for (const platforms of [[],['web'],['ios'],['android'],['macos'],['linux','gtk','windows'],['ios','macos','android','web','web']]) {
  for (const tools of [outputs,{node:outputs.node,bun:tool('',1),git:tool(''),xcodebuild:tool(''),adb:tool('error',2)}]) {
   const original = fixture(tools), native = fixture(tools)
   const wanted = query({operation:'prerequisites',platforms,...original},false)
   const actual = query({operation:'prerequisites',platforms,...native})
   assert.deepEqual(actual,wanted)
   for (const record of calls(native.dir)) {
    assert.equal(record.cwd,native.dir)
    assert.equal(record.sentinel,'owned-project')
    assert.deepEqual(record.args,record.command === 'xcodebuild' ? ['-version'] : ['--version'])
   }
   assert.equal(new Set(calls(native.dir).map(row => row.command)).size,calls(native.dir).length,'Native observations probe each tool once')
   assert.ok(!calls(native.dir).some(row => row.command === 'chromium'))
  }
 }
})

test('standalone Node absence and selected pnpm are reported honestly',macOnly,() => {
 const absent = query({operation:'prerequisites',platforms:['web'],...fixture()})
 assert.equal(absent.value.find(row => row.id === 'node').status,'missing')
 assert.match(absent.value.find(row => row.id === 'node').remedy,/Node >=22\.22\.2/)
 assert.equal(absent.value.find(row => row.id === 'chromium').status,'unknown')
 const selected = fixture({node:tool(process.version),pnpm:tool('12.14.0\n'),git:tool('git fixture')})
 const pnpm = query({operation:'prerequisites',platforms:[],manager:'pnpm',...selected})
 assert.deepEqual(pnpm.value.map(row => row.id),['node','pnpm','git'])
 assert.equal(pnpm.value[1].detail,'12.14.0')
 assert.ok(!calls(selected.dir).some(row => row.command === 'bun'))
 const alternate = fixture({node:tool('v24.99.0\n')})
 const version = query({operation:'prerequisites',platforms:[],...alternate}).value.find(row => row.id === 'node')
 assert.equal(version.detail,'v24.99.0','Report the selected executable, not the oracle process version')
})

test('native capture matches Node byte decoding, exit failures and exact stdout caps',macOnly,() => {
 const project = fixture()
 const requests = [
  {cmd:'not-present',args:[]},
  {cmd:process.execPath,args:['-e','process.stdout.write(Buffer.from([0xef,0xbb,0xbf,0xf0,0x9f,0x9a,0x80,0xff,0x00]))']},
  {cmd:process.execPath,args:['-e','process.stderr.write("x".repeat(2*1024*1024)); process.stdout.write("ok")']},
  {cmd:process.execPath,args:['-e','process.stdout.write("ignored");process.exitCode=9']},
  ...[3,4].map(limit => ({cmd:process.execPath,args:['-e','process.stdout.write("🚀")'],limit})),
 ]
 for (const item of requests) {
  const request = {operation:'command-probe',...project,...item}
  assert.deepEqual(query(request),query(request,false))
 }
})

test('timeouts, output overflow and cancellation release uncooperative owned groups',macOnly,() => {
 for (const kind of ['timeout','overflow','cancel']) {
  const project = fixture()
  const marker = join(project.dir,'pids.json')
  const source = `const {spawn}=require('node:child_process'); const fs=require('node:fs');
const child=spawn(process.execPath,['-e','process.on("SIGTERM",()=>{});setInterval(()=>{},1000)'],{stdio:'ignore'});
process.on('SIGTERM',()=>{}); fs.writeFileSync(${JSON.stringify(marker)},JSON.stringify([process.pid,child.pid]));
${kind === 'overflow' ? 'process.stdout.write("x".repeat(20000));' : ''} setInterval(()=>{},1000);`
  const result = query({operation:'command-probe',...project,cmd:process.execPath,args:['-e',source],
   timeoutMs:kind === 'timeout' ? 1500 : 8000,limit:1000,...(kind === 'cancel' ? {cancelFile:marker} : {})})
  assert.ok(existsSync(marker),'The process must actually start to qualify cleanup')
  if (kind === 'cancel') { assert.equal(result.ok,false); assert.match(result.message,/cancelled/) }
  else assert.deepEqual(result,{ok:true,value:null})
  for (const pid of JSON.parse(readFileSync(marker))) assert.throws(() => process.kill(pid,0),{code:'ESRCH'})
 }
 const pre = query({operation:'command-probe',...fixture(),cmd:process.execPath,args:[],preabort:true})
 assert.equal(pre.ok,false); assert.match(pre.message,/cancelled/)
})

test('actual host tool checks retain observed versions and unknown browser readiness',macOnly,() => {
 const dir = fixture().dir
 const actual = query({operation:'prerequisites',dir,platforms:['web'],env:{PATH:process.env.PATH}}).value
 const wanted = query({operation:'prerequisites',dir,platforms:['web'],env:{PATH:process.env.PATH}},false).value
 const nodeVersion = spawnSync('node',['--version'],{cwd:dir,encoding:'utf8'})
 wanted[0] = nodeVersion.status === 0 && nodeVersion.stdout.length
  ? {id:'node',name:'Node.js',status:'satisfied',detail:nodeVersion.stdout.trim()}
  : {id:'node',name:'Node.js',status:'missing',remedy:"Install Node >=22.22.2 for the project's JavaScript build tools."}
 assert.deepEqual(actual,wanted)
 assert.equal(actual.find(row => row.id === 'chromium').status,'unknown')
})
