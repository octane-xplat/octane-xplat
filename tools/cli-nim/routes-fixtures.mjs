import assert from 'node:assert/strict'
import { after } from 'node:test'
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, symlinkSync, rmSync, existsSync } from 'node:fs'
import { dirname, join, resolve, relative } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild } from './native-inputs.mjs'

export const root = resolve(import.meta.dirname, '../..')
export const binary = join(root, `research/nim-cli/native/xplat${process.platform === 'win32' ? '.exe' : ''}`)
assertCurrentNativeBuild(root, JSON.parse(readFileSync(join(root, 'research/nim-cli/native/build.json'))), readFileSync(binary))
export const scratch = scratchRun(root, 'public-routes')
after(() => rmSync(scratch, { recursive: true, force: true }))
export const macOnly = { skip: process.platform !== 'darwin' }
export const screen = 'export default function Page() { return null }\n'
let sequence = 0
export function write(dir, file, value) {
 mkdirSync(dirname(join(dir, file)), { recursive: true })
 writeFileSync(join(dir, file), typeof value === 'string' ? value : JSON.stringify(value))
}
export function project(files = {}) {
 const dir = join(scratch, String(++sequence))
 mkdirSync(join(dir, 'node_modules/@octane-xplat'), { recursive: true })
 write(dir, 'package.json', { private: true, type: 'module' })
 symlinkSync(join(root, 'packages/cli'), join(dir, 'node_modules/@octane-xplat/cli'), 'dir')
 symlinkSync(join(root, 'packages/cli/node_modules/vite'), join(dir, 'node_modules/vite'), 'dir')
 for (const [file, content] of Object.entries(files)) write(dir, file, content)
 return dir
}
export function snapshot(dir) {
 const result = {}
 function visit(path) {
  for (const name of readdirSync(path).sort()) {
   if (name === 'node_modules') continue
   const file = join(path,name)
   if (statSync(file).isDirectory()) visit(file)
   else result[relative(dir,file)] = readFileSync(file).toString('base64')
  }
 }
 visit(dir)
 return result
}
export function generated(dir) {
 return Object.fromEntries(Object.entries(snapshot(dir)).filter(([file]) => /(?:^|\/)routes\.gen\./.test(file)))
}
export function run(dir, args = [], native = true) {
 return spawnSync(native ? binary : process.execPath,
  native ? ['routes', ...args] : [join(root,'packages/cli/src/cli.ts'), 'routes', ...args],
  { cwd: dir, encoding: 'utf8', env: process.env, timeout: 20000, maxBuffer: 8*1024*1024 })
}
export const read = (dir, file) => existsSync(join(dir,file)) ? readFileSync(join(dir,file),'utf8') : ''
export async function until(predicate, diagnostic = () => '', timeout = 15000) {
 const deadline = Date.now() + timeout
 while (!(await predicate())) {
  assert.ok(Date.now() < deadline, `Route operation did not settle: ${diagnostic()}`)
  await delay(20)
 }
}
export function launch(dir, args = ['--watch'], native = true) {
 const child = spawn(native ? binary : process.execPath,
  native ? ['routes', ...args] : [join(root,'packages/cli/src/cli.ts'),'routes',...args],
  { cwd: dir, env: process.env, detached: true, stdio: ['ignore','pipe','pipe'] })
 let stdout = '', stderr = '', status
 child.stdout.on('data', bytes => { stdout += bytes })
 child.stderr.on('data', bytes => { stderr += bytes })
 const exited = new Promise(resolve => child.once('close',(code,signal) => { status = { code,signal }; resolve(status) }))
 return {
  child, exited, stdout: () => stdout, stderr: () => stderr, output: () => stdout + stderr,
  assertAlive() { assert.equal(status, undefined, stdout+stderr) },
  async stop(signal = 'SIGTERM') {
   if (!status) child.kill(signal)
   const timer = setTimeout(() => { try { process.kill(-child.pid,'SIGKILL') } catch {} },7000)
   try { return await exited } finally { clearTimeout(timer) }
  },
 }
}
