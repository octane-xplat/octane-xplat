import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createConnection } from 'node:net'
import { createHash } from 'node:crypto'
import { homedir } from 'node:os'
import { mkdirSync, writeFileSync, readFileSync, existsSync, symlinkSync, realpathSync, readdirSync, rmSync } from 'node:fs'
import { join, dirname, resolve, relative } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild } from './native-inputs.mjs'
export const root = resolve(import.meta.dirname,'../..')
export const binary = join(root,`research/nim-cli/native/xplat${process.platform==='win32'?'.exe':''}`)
assertCurrentNativeBuild(root,JSON.parse(readFileSync(join(root,'research/nim-cli/native/build.json'))),readFileSync(binary))
export const scratch = scratchRun(root,'runtime-build')
const workspaces = []
export function write(dir,path,value) {
 const file = join(dir,path)
 mkdirSync(dirname(file),{ recursive:true })
 writeFileSync(file,typeof value==='string'?value:JSON.stringify(value))
}
export function fixture({ installed = true, apps = ['a'] } = {}) {
 const dir = join(scratch,String(workspaces.length+1))
 mkdirSync(dir)
 workspaces.push(dir)
 write(dir,'package.json',{ private:true,packageManager:'bun@1.4.4',workspaces:['apps/*'] })
 for (const name of apps) {
  const app = join(dir,'apps',name)
  write(app,'package.json',{ name:`build-${name}`,private:true,type:'module',xplat:{ targets:{ web:{} } } })
  write(app,'index.html','<!doctype html><html><body><script type="module" src="/main.js"></script></body></html>')
  write(app,'main.js',"import './theme.css'; document.body.textContent = 'native project build';\n")
  write(app,'theme.css','.fallback-must-not-ship { color: red }')
  write(app,'theme.web.css','@platform web { .built-web { color: rgb(11, 22, 33) } } @platform mobile { .must-not-ship { color: red } }')
  write(app,'vite.config.mjs',`import { xplatCss } from '@octane-xplat/cli/vite';
export default { plugins: [xplatCss('web'),{ name:'native-build-diagnostics',buildStart(){ process.stdout.write('out π😀\\n'); process.stderr.write('err β\\n') } }] };\n`)
 }
 if (installed) {
  mkdirSync(join(dir,'node_modules/.bin'),{ recursive:true })
  mkdirSync(join(dir,'node_modules/@octane-xplat'),{ recursive:true })
  const vite = realpathSync(join(root,'packages/cli/node_modules/vite'))
  symlinkSync(vite,join(dir,'node_modules/vite'),'dir')
  symlinkSync(join(vite,'bin/vite.js'),join(dir,'node_modules/.bin/vite'))
  symlinkSync(join(root,'packages/cli'),join(dir,'node_modules/@octane-xplat/cli'),'dir')
 }
 return dir
}
export function cli(dir,args,extraEnv={}) {
 const child = spawnSync(binary,[...args,'--project',dir,'--json'],{ encoding:'utf8',cwd:root,env:{ ...process.env,XPLAT_AGENT_HOST_IDLE_MS:'30000',...extraEnv },timeout:15000,killSignal:'SIGKILL' })
 assert.notEqual(child.status,null,child.stderr||child.error?.message)
 return { code:child.status,value:JSON.parse(child.stdout),stderr:child.stderr }
}
export async function until(predicate,message,timeout=20000) {
 const end = Date.now()+timeout
 while (Date.now()<end) {
  const value = await predicate()
  if (value) {return value}
  await delay(25)
 }
 assert.fail(message)
}
export async function waitJob(dir,id) {
 return await until(() => {
  const reply = cli(dir,['job','status',id])
  assert.equal(reply.code,0,JSON.stringify(reply.value.error))
  return ['succeeded','failed','cancelled'].includes(reply.value.data.job.state)?reply.value.data.job:false
 },'Build job must settle')
}
export function artifacts(dir) {
 const files = {}
 function visit(path) {
  for (const entry of readdirSync(path,{ withFileTypes:true })) {
   const file = join(path,entry.name)
   if (entry.isDirectory()) {visit(file)}
   else { assert.match(file,/\.(html|js|css)$/); files[relative(dir,file)]=readFileSync(file,'base64') }
  }
 }
 visit(join(dir,'dist'))
 return files
}
const alive = pid => { try { process.kill(pid,0); return true } catch (error) { if(error.code==='ESRCH'){return false;} throw error } }
export async function cleanup() {
 for (const dir of workspaces) {
  const key = createHash('sha256').update(realpathSync(dir)).digest('hex').slice(0,32)
  const cache = join(homedir(),'.cache/octane-xplat/nim-hosts',key), file = join(cache,'host.json')
  if (existsSync(file)) {
   const descriptor = JSON.parse(readFileSync(file))
   await new Promise(resolve => {
    const socket = createConnection(descriptor.socketPath)
    const timer = setTimeout(() => { socket.destroy(); resolve() },3000)
    socket.once('connect',()=>socket.write(JSON.stringify({ token:descriptor.token,method:'host.shutdown',params:{} })+'\n'))
    socket.on('data',()=>socket.destroy())
    socket.once('error',()=>{})
    socket.once('close',()=>{ clearTimeout(timer); resolve() })
   })
   await until(()=>!alive(descriptor.pid),'Owned runtime host must terminate',40000)
  }
  rmSync(cache,{ recursive:true,force:true })
 }
 rmSync(scratch,{ recursive:true,force:true })
}
