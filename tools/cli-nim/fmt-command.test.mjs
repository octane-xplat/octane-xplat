import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { spawn, spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { once } from 'node:events'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild } from './native-inputs.mjs'

const root = resolve(import.meta.dirname, '../..')
const binary = join(root, `research/nim-cli/native/xplat${process.platform === 'win32' ? '.exe' : ''}`)
assertCurrentNativeBuild(root, JSON.parse(readFileSync(join(root, 'research/nim-cli/native/build.json'))), readFileSync(binary))
const reference = join(root, 'packages/cli/bin/xplat.mjs')
const scratch = scratchRun(root, 'native-fmt')
const macOnly = { skip: process.platform !== 'darwin' }
const environment = { ...process.env, NODE_OPTIONS: '', NODE_PATH: '', NO_COLOR: '1' }
const handles = new Set()
let sequence = 0, installed
const MESSY = 'if (a) b()\nconst x = 1\n'
const TIDY = 'if (a) {\n\tb()\n}\n\nconst x = 1\n'
function write(directory, path, value) {
 const file = join(directory, path)
 mkdirSync(dirname(file), { recursive: true })
 writeFileSync(file, typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value))
 return file
}
before(() => {
 if (process.platform !== 'darwin') {return}
 const consumer = join(scratch, 'formatter-consumer')
 write(consumer, 'package.json', { private: true, type: 'module', devDependencies: { '@octane-xplat/fmt': '0.1.1' } })
 const version = spawnSync('bun', ['--version'], { encoding: 'utf8' })
 assert.equal(version.stdout.trim(), '1.4.4')
 const result = spawnSync('bun', ['install', '--ignore-scripts', '--linker', 'isolated'], { cwd: consumer, env: environment, encoding: 'utf8', timeout: 120000 })
 assert.equal(result.status, 0, result.stdout+result.stderr)
 installed = join(consumer, 'node_modules/@octane-xplat/fmt')
 const manifest = JSON.parse(readFileSync(join(installed, 'package.json')))
 assert.equal(manifest.version, '0.1.1')
})
after(async () => {
 await Promise.all([...handles].map(async child => {
  const closed = once(child, 'close'); child.kill('SIGTERM'); await closed
 }))
 rmSync(scratch, { recursive: true, force: true })
})
function project(files = {}, formatter = true) {
 const directory = join(scratch, `project-${sequence++}`)
 write(directory, 'package.json', { private: true, type: 'module' })
 for (const [path, contents] of Object.entries(files)) {write(directory, path, contents)}
 if (formatter) {
  mkdirSync(join(directory, 'node_modules/@octane-xplat'), { recursive: true })
  symlinkSync(installed, join(directory, 'node_modules/@octane-xplat/fmt'), 'dir')
 }
 return directory
}
function run(directory, args = [], native = true, input, env = {}) {
 return spawnSync(native ? binary : process.execPath, native ? ['fmt', ...args] : [reference, 'fmt', ...args], {
  cwd: directory, env: { ...environment, ...env }, input, encoding: 'utf8', timeout: 15000, maxBuffer: 8*1024*1024,
 })
}
function snapshot(directory) {
 const result = {}
 function walk(path, prefix = '') {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
   if (entry.name === 'node_modules') {continue}
   const key = prefix+entry.name, file = join(path, entry.name)
   if (entry.isDirectory()) {walk(file, key+'/')}
   else if (entry.isFile()) {result[key] = { bytes: readFileSync(file).toString('base64'), mode: statSync(file).mode & 0o777 }}
  }
 }
 walk(directory)
 return result
}
function normalize(text, directory) {return text.replaceAll(directory, '<project>')}
function compare(files, args, status, setup = () => {}, input) {
 const native = project(files), node = project(files)
 setup(native); setup(node)
 const actual = run(native, args, true, input), expected = run(node, args, false, input)
 assert.equal(expected.status, status, expected.stderr)
 assert.equal(actual.status, expected.status, actual.stderr)
 assert.equal(normalize(actual.stdout, native), normalize(expected.stdout, node))
 assert.equal(normalize(actual.stderr, native), normalize(expected.stderr, node))
 assert.deepEqual(snapshot(native), snapshot(node))
 return native
}

test('native help and usage preserve argument ordering without Node or formatter', macOnly, () => {
 const directory = project({}, false)
 for (const args of [['--help'], ['-h'], ['--check','--help'], ['--wat'], ['--'], ['--stdin-filepath'], ['--wat','--help'], ['--help','--wat'], ['a.ts','--stdin-filepath=b.ts']]) {
  const actual = run(directory,args,true,undefined,{ PATH:'' }), expected = run(directory,args,false)
  assert.equal(actual.status, expected.status, actual.stderr)
  assert.equal(actual.stdout, expected.stdout)
  assert.equal(actual.stderr, expected.stderr)
 }
})

test('real formatter writes/checks/idempotence, byte streams, modes and declaration variants match Node', macOnly, () => {
 const directory = compare({ 'src/a.ts': MESSY }, ['--check'], 1)
 assert.equal(readFileSync(join(directory,'src/a.ts'),'utf8'), MESSY)
 const files = { 'src/a.ts': MESSY, 'script.mjs': 'export const x=1\n' }
 for (const extension of ['d.ts','d.mts','d.cts']) {files[`types/a.${extension}`]='export const contract:{value:string}\n'}
 const written = compare(files, [], 0, directory => chmodSync(join(directory,'script.mjs'),0o751))
 assert.equal(readFileSync(join(written,'src/a.ts'),'utf8'), TIDY)
 assert.equal(run(written,['--check']).status,0)
 assert.equal(statSync(join(written,'script.mjs')).mode & 0o777,0o751)
})

test('stdin is formatted without source writes; check stdout is empty', macOnly, () => {
 for (const args of [['--stdin-filepath','src/a.ts'], ['--stdin-filepath=src/a.ts','--check']]) {
  compare({ 'src/a.ts': MESSY },args,args.includes('--check')?1:0,undefined,MESSY)
 }
 compare({},['--stdin-filepath','a.ts'],2,undefined,'const = 3\n')
})

test('real TSRX templates, JSX, Unicode and CRLF use the same formatter plan', macOnly, () => {
 compare({
  'component.tsrx':'export function Greeting(props:{name:string}) @{ <p>{props.name}</p> }\n',
  'component.tsx':'export const title = <h1>héllo 😀</h1>\r\n',
  'source.cts':'exports.answer=42\r\n',
 },[],0)
})

test('discovery preserves nested ignores, directory exclusions, nested repositories and explicit selection', macOnly, () => {
 const files = { '.gitignore': 'skip.ts\nnested/ignored.ts\n', 'skip.ts':MESSY, 'keep.ts':MESSY,
  'nested/.gitignore':'other.ts\n', 'nested/ignored.ts':MESSY, 'nested/other.ts':MESSY, 'nested/keep.ts':MESSY,
  'dist/a.ts':MESSY, 'node_modules/a.ts':MESSY, 'repository/.git':'gitdir: ../elsewhere\n', 'repository/a.ts':MESSY }
 const directory=compare(files,[],0)
 for (const file of ['skip.ts','nested/ignored.ts','nested/other.ts','dist/a.ts','repository/a.ts']) {
  assert.equal(readFileSync(join(directory,file),'utf8'),MESSY)
 }
 compare({ 'a.ts':MESSY, 'b.ts':MESSY },['a.ts','a.ts'],0)
 compare({ 'a.ts':MESSY, 'sub/a.ts':MESSY },['sub'],0)
 compare({ 'a.ts':MESSY, 'note.md':'# note\n' },['note.md'],2)
 // Native missing-path diagnostics are independently checked below; these
 // stop before the Node reference's project-engine initialization.
 compare({ 'a.ts':MESSY },['gone.ts'],2)
})

test('symlinks are skipped or rejected; transform/config errors write no source bytes', macOnly, () => {
 compare({ 'a.ts':MESSY },[],0,directory=>{
  symlinkSync(join(directory,'a.ts'),join(directory,'linked.ts'))
  symlinkSync(directory,join(directory,'cycle'),'dir')
 })
 compare({ 'a.ts':MESSY },['linked.ts'],2,directory=>symlinkSync(join(directory,'a.ts'),join(directory,'linked.ts')))
 compare({ 'a.ts':MESSY, 'z.ts':'const = 3\n' },[],2)
 compare({ 'a.ts':MESSY, '.oxfmtrc.json':'{"trailingComma":' },[],2)
})

test('missing local formatter/Node never resolves through a global module path or preload', macOnly, () => {
 const directory=project({ 'a.ts':MESSY },false)
 const absent=run(directory,[],true,undefined,{ NODE_PATH:dirname(dirname(installed)), NODE_OPTIONS:'--invalid-preload' })
 assert.equal(absent.status,2,absent.stderr)
 assert.match(absent.stderr,/bun add --dev @octane-xplat\/fmt/)
 assert.equal(readFileSync(join(directory,'a.ts'),'utf8'),MESSY)
 const noNode=run(project({ 'a.ts':MESSY }),[],true,undefined,{ PATH:'' })
 assert.equal(noNode.status,2,noNode.stderr)
 assert.match(noNode.stderr,/Node >=22\.22\.2/)
})

function fake(body) {
 const directory=project({ 'a.ts':MESSY },false)
 write(directory,'node_modules/@octane-xplat/fmt/package.json',{ name:'@octane-xplat/fmt',type:'module',exports:'./index.mjs' })
 write(directory,'node_modules/@octane-xplat/fmt/index.mjs',body)
 return directory
}
test('an edited input is left untouched and no earlier artifact is published', macOnly, () => {
 const directory=fake(`import { writeFileSync } from 'node:fs'; export async function createFormatter(){return {shouldIgnore:()=>false,async formatText({path,source}){if(path==='z.ts')writeFileSync('z.ts','const userEdit = 2\\n');return {ok:true,code:source+'\\n',changed:true}}}}`)
 write(directory,'z.ts',MESSY)
 const result=run(directory)
 assert.equal(result.status,2,result.stderr)
 assert.match(result.stderr,/changed since it was read/)
 assert.equal(readFileSync(join(directory,'a.ts'),'utf8'),MESSY)
 assert.equal(readFileSync(join(directory,'z.ts'),'utf8'),'const userEdit = 2\n')
 assert.ok(!readdirSync(directory).some(name=>name.startsWith('.xplat-fmt-')))
})

test('stale raw bytes and permission changes are rejected even when decoded text is unchanged',macOnly,()=>{
 for(const mutation of ["writeFileSync('a.ts',Buffer.from([254]))", "chmodSync('a.ts',0o700)"]){
  const directory=fake(`import {writeFileSync,chmodSync} from 'node:fs';export async function createFormatter(){return {shouldIgnore:()=>false,async formatText({source}){${mutation};return {ok:true,code:source+'\\n',changed:true}}}}`)
  writeFileSync(join(directory,'a.ts'),Buffer.from([255]))
  const result=run(directory)
  assert.equal(result.status,2,result.stderr)
  assert.match(result.stderr,/changed since it was read/)
  assert.deepEqual(readFileSync(join(directory,'a.ts')),Buffer.from([mutation.includes('Buffer')?254:255]))
 }
})

test('worker cwd and ordinary environment are preserved; library stdout cannot corrupt stdin output', macOnly, () => {
 const directory=fake(`export async function createFormatter(){console.log('library diagnostic');if(process.env.NODE_OPTIONS||process.env.NODE_PATH||process.env.XPLAT_FMT_SENTINEL!=='ok')throw Error('bad environment');return {shouldIgnore:()=>false,async formatText({source}){return {ok:true,code:source,changed:false}}}}`)
 const result=run(directory,['--stdin-filepath','a.ts'],true,MESSY,{NODE_OPTIONS:'--invalid-preload',NODE_PATH:'GLOBAL',XPLAT_FMT_SENTINEL:'ok'})
 assert.equal(result.status,0,result.stderr)
 assert.equal(result.stdout,MESSY)
 assert.match(result.stderr,/library diagnostic/)
})

test('invalid artifact plans fail before any source publication',macOnly,()=>{
 for(const mutation of [
  'data.version=2', 'data.files.push({...data.files[0]})',
  'data.files[0].sourceSha256="0".repeat(64)', 'data.files[0].changed="true"', 'data.files[0].changed=false',
  'data.files.push({...data.files[0],file:new URL("../outside.ts",`file://${process.cwd()}/`).pathname})',
 ]){
  const directory=fake(`import {readFileSync,writeFileSync,statSync} from 'node:fs';import {createHash} from 'node:crypto';export async function createFormatter(){const request=JSON.parse(readFileSync(process.argv[2]));const source=readFileSync('a.ts');const data={version:1,kind:'files',diagnostics:[],files:[{file:process.cwd()+'/a.ts',sourceSha256:createHash('sha256').update(source).digest('hex'),mode:statSync('a.ts').mode,code:'const formatted = 1\\n',changed:true}]};${mutation};writeFileSync(process.argv[3],JSON.stringify({protocol:request.protocol,version:1,id:request.id,ok:true,data}));process.exit(0)}`)
  const result=run(directory)
  assert.equal(result.status,2,result.stderr)
  assert.equal(readFileSync(join(directory,'a.ts'),'utf8'),MESSY)
  assert.ok(!readdirSync(directory).some(name=>name.startsWith('.xplat-fmt-')))
 }
})

const delay = ms=>new Promise(resolve=>setTimeout(resolve,ms))
function alive(pid){try{process.kill(pid,0);return true}catch(error){if(error.code==='ESRCH'){return false;}throw error}}
async function until(check){for(let i=0;i<150;i++){if(check()){return;}await delay(20)}assert.fail('Owned formatter did not settle')}
test('cancellation reaps a resistant formatter worker and descendant before removing its private sidecars',macOnly,async()=>{
 const directory=fake(`import { spawn } from 'node:child_process'; import { writeFileSync } from 'node:fs';export async function createFormatter(){process.on('SIGTERM',()=>{});const child=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});process.stdout.write('ready');setInterval(()=>{},1000)"],{stdio:['ignore','pipe','ignore']});child.stdout.once('data',()=>writeFileSync('owned.json',JSON.stringify({pid:process.pid,descendant:child.pid,operation:process.argv[2]})));await new Promise(()=>{})}`)
 const child=spawn(binary,['fmt'],{cwd:directory,env:environment,stdio:['ignore','pipe','pipe']})
 handles.add(child);child.once('close',()=>handles.delete(child))
 let errors='';child.stderr.on('data',bytes=>{errors+=bytes})
 const closed=once(child,'close')
 await until(()=>existsSync(join(directory,'owned.json'))||child.exitCode!==null)
 assert.equal(child.exitCode,null,errors)
 const owned=JSON.parse(readFileSync(join(directory,'owned.json')))
 assert.ok(existsSync(owned.operation))
 child.kill('SIGTERM')
 const [code,signal]=await closed
 assert.equal(signal,null);assert.equal(code,143,errors)
 await until(()=>!alive(owned.pid)&&!alive(owned.descendant))
 assert.ok(!existsSync(dirname(owned.operation)))
 assert.equal(readFileSync(join(directory,'a.ts'),'utf8'),MESSY)
})
