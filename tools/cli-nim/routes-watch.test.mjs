import assert from 'node:assert/strict'
import { test } from 'node:test'
import { existsSync, readFileSync, renameSync, rmSync, mkdirSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { project, write, generated, read, screen, macOnly, launch, until } from './routes-fixtures.mjs'

async function watching(runner) {
 await until(() => { runner.assertAlive(); return runner.output().includes('Watching route sources') },runner.output)
}

test('native and Node watchers follow nested add/rename/removal and ignore generated publications', macOnly, async () => {
 for (const native of [false,true]) {
  const dir = project({ 'app/first.tsx': screen, 'xplat.routes.json': { out:'app/generated/routes.gen' } })
  const runner = launch(dir,['--watch'],native)
  try {
   await watching(runner)
   write(dir,'app/nested/second.tsx',screen)
   await until(() => read(dir,'app/generated/routes.gen.contracts.ts').includes('"/nested/second"'),runner.output)
   renameSync(join(dir,'app/nested/second.tsx'),join(dir,'app/nested/renamed.tsx'))
   await until(() => { const source = read(dir,'app/generated/routes.gen.contracts.ts'); return source.includes('"/nested/renamed"') && !source.includes('"/nested/second"') },runner.output)
   rmSync(join(dir,'app/nested/renamed.tsx'))
   await until(() => !read(dir,'app/generated/routes.gen.contracts.ts').includes('"/nested/renamed"'),runner.output)
   await delay(250)
   const count = runner.output().split('Generated route contracts').length
   const source = read(dir,'app/generated/routes.gen.contracts.ts')
   write(dir,'app/generated/routes.gen.contracts.ts',source+'// manual generated-file edit\n')
   await delay(1300)
   assert.equal(runner.output().split('Generated route contracts').length,count,runner.output())
   assert.ok(read(dir,'app/generated/routes.gen.contracts.ts').endsWith('// manual generated-file edit\n'))
  } finally {
   assert.deepEqual(await runner.stop(),{code:143,signal:null},runner.output())
  }
 }
})

test('native and Node watches recover broken initial config and missing configured modules', macOnly, async () => {
 for (const native of [false,true]) {
  const dir = project({ 'app/first.tsx': screen, 'xplat.routes.json': '{' })
  const runner = launch(dir,['-w'],native)
  try {
   await until(() => runner.output().includes('JSON') || runner.output().includes('expected') || runner.output().includes('Unexpected'),runner.output)
   write(dir,'xplat.routes.json',{ context:{module:'./state/context',export:'context'} })
   await until(() => runner.output().includes('existing source module'),runner.output)
   write(dir,'state/context.ts','throw new Error("configuration must not execute"); export const context = {}')
   await watching(runner)
   assert.match(read(dir,'routes.gen.contracts.ts'),/state\/context/)
   write(dir,'app/invalid.tsx','export * from "./hidden"')
   await until(() => runner.output().includes('route/source-exports'),runner.output)
   const before = read(dir,'routes.gen.contracts.ts')
   assert.doesNotMatch(before,/"\/invalid"/)
   write(dir,'app/invalid.tsx',screen)
   await until(() => read(dir,'routes.gen.contracts.ts').includes('"/invalid"'),runner.output)
  } finally { assert.deepEqual(await runner.stop(),{code:143,signal:null},runner.output()) }
 }
})

test('native and Node watches retain conventional ownership across removed trees', macOnly, async () => {
 for (const native of [false,true]) {
  const dir = project({ 'app/first.tsx': screen })
  const runner = launch(dir,['--watch'],native)
  try {
   await watching(runner)
   rmSync(join(dir,'app'),{recursive:true})
   await until(() => !read(dir,'routes.gen.contracts.ts').includes('"/first"'),runner.output)
   write(dir,'app/restored.tsx',screen)
   await until(() => read(dir,'routes.gen.contracts.ts').includes('"/restored"'),runner.output)
   write(dir,'xplat.routes.json',{out:'new/routes.gen'})
   await until(() => runner.output().includes('route/watch-output-changed'),runner.output)
   assert.equal(existsSync(join(dir,'new/routes.gen.contracts.ts')),false)
   write(dir,'xplat.routes.json',{base:'/repaired'})
   await until(() => read(dir,'routes.gen.macos.ts').includes('/repaired'),runner.output)
  } finally { assert.deepEqual(await runner.stop(),{code:143,signal:null},runner.output()) }
 }
})

test('programmatic-only native watch discovers its first conventional source tree', macOnly, async () => {
 const dir = project({ 'xplat.routes.json':{manifests:[{module:'./extra',export:'extra'}]},
  'extra.ts':'throw new Error("do not execute"); export const extra = {}' })
 const runner = launch(dir)
 try {
  await watching(runner)
  assert.equal(JSON.parse(read(dir,'src/routes.gen.manifest.json')).routes.length,0)
  write(dir,'src/app/first.tsx',screen)
  await until(() => read(dir,'src/routes.gen.contracts.ts').includes('"/first"'),runner.output)
 } finally { assert.deepEqual(await runner.stop(),{code:143,signal:null},runner.output()) }
})

test('an atomic config replacement moves watched input ownership without moving outputs', macOnly, async () => {
 for (const native of [false,true]) {
  const dir = project({ 'app/old.tsx':screen, 'other/new.tsx':screen })
  const runner = launch(dir,['--watch'],native)
  try {
   await watching(runner)
   write(dir,'xplat.routes.json.tmp',{directory:'other',out:'routes.gen'})
   renameSync(join(dir,'xplat.routes.json.tmp'),join(dir,'xplat.routes.json'))
   await until(() => read(dir,'routes.gen.contracts.ts').includes('"/new"') && !read(dir,'routes.gen.contracts.ts').includes('"/old"'),runner.output)
   await delay(200)
   const count = runner.output().split('Generated route contracts').length
   write(dir,'app/ignored.tsx',screen)
   await delay(1200)
   assert.equal(runner.output().split('Generated route contracts').length,count,runner.output())
   write(dir,'other/latest.tsx',screen)
   await until(() => read(dir,'routes.gen.contracts.ts').includes('"/latest"'),runner.output)
  } finally { assert.deepEqual(await runner.stop(),{code:143,signal:null},runner.output()) }
 }
})

test('native watch replaces file-event roots for a configured tree outside the project', macOnly, async () => {
 const dir = project({ 'app/first.tsx':screen })
 const external = join(dirname(dir),`external-${basename(dir)}`)
 write(external,'outside.tsx',screen)
 const runner = launch(dir)
 try {
  await watching(runner)
  write(dir,'xplat.routes.json',{directory:`../${basename(external)}`,out:'routes.gen'})
  await until(() => read(dir,'routes.gen.contracts.ts').includes('"/outside"'),runner.output)
  write(external,'later.tsx',screen)
  await until(() => read(dir,'routes.gen.contracts.ts').includes('"/later"'),runner.output)
  assert.doesNotMatch(read(dir,'routes.gen.contracts.ts'),/"\/first"/)
 } finally { assert.deepEqual(await runner.stop(),{code:143,signal:null},runner.output()) }
})

test('obsolete native baking is killed and cannot publish over a newer successful generation', macOnly, async () => {
 const dir = project({ 'app/first.tsx':screen })
 const runner = launch(dir)
 try {
  await watching(runner)
  const before = generated(dir)
  write(dir,'app/baked.tsx','export const dataMode = "baked"; '+screen)
  write(dir,'app/baked.loader.mjs',`import { writeFileSync, existsSync } from 'node:fs';
import { setTimeout } from 'node:timers/promises';
export async function loader() { writeFileSync('old-worker.pid', String(process.pid)); process.on('SIGTERM',()=>{}); while (!existsSync('release-old')) await setTimeout(10); return { obsolete: true } }`)
  await until(() => existsSync(join(dir,'old-worker.pid')),runner.output)
  assert.deepEqual(generated(dir),before)
  const oldPid = Number(readFileSync(join(dir,'old-worker.pid'),'utf8'))
  write(dir,'app/baked.loader.mjs','export const loader = () => ({ current: true })')
  write(dir,'app/latest.tsx',screen)
  await until(() => read(dir,'routes.gen.data.ts').includes('current') && read(dir,'routes.gen.contracts.ts').includes('"/latest"'),runner.output)
  assert.doesNotMatch(read(dir,'routes.gen.data.ts'),/obsolete/)
  assert.throws(() => process.kill(oldPid,0),{code:'ESRCH'})
  write(dir,'release-old','continue')
  await delay(350)
  assert.doesNotMatch(read(dir,'routes.gen.data.ts'),/obsolete/)
 } finally { assert.deepEqual(await runner.stop(),{code:143,signal:null},runner.output()) }
})

test('closing native watch during baking preserves last-good output and reaps the worker', macOnly, async () => {
 const dir = project({ 'app/first.tsx':screen })
 const runner = launch(dir)
 try {
  await watching(runner)
  const before = generated(dir)
  write(dir,'app/hang.tsx','export const dataMode = "baked"; '+screen)
  write(dir,'app/hang.loader.mjs',`import { writeFileSync } from 'node:fs'; export async function loader() { writeFileSync('hang.pid',String(process.pid)); process.on('SIGTERM',()=>{}); await new Promise(()=>{}); return {} }`)
  await until(() => existsSync(join(dir,'hang.pid')),runner.output)
  const pid = Number(readFileSync(join(dir,'hang.pid'),'utf8'))
  assert.deepEqual(await runner.stop('SIGINT'),{code:130,signal:null},runner.output())
  assert.throws(() => process.kill(pid,0),{code:'ESRCH'})
  assert.deepEqual(generated(dir),before)
 } finally { await runner.stop() }
})
