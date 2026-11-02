import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cpSync, readFileSync, readdirSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve, relative, sep } from 'node:path'
import { spawnSync } from 'node:child_process'
import { generateRoutes } from '../../packages/cli/src/commands/routes.ts'
import { root, scratch, project, write, run, generated, snapshot, screen, macOnly, launch, until } from './routes-fixtures.mjs'

test('public route help, aliases, output selection and invalid arguments are explicit', macOnly, () => {
 const empty = project()
 assert.equal(run(empty,['--help']).stdout,run(empty,['--help'],false).stdout)
 assert.equal(run(empty).status,1)
 assert.match(run(empty).stderr,/No route dir found/)
 for (const args of [['--dir','pages','--out','nested/client.ts'],['-d','pages','-o','nested/client.ts'],['--dir=pages','--out=nested/client.ts']]) {
  const files = { 'pages/index.tsx': screen }
  const node = project(files), nim = project(files)
  const reference = run(node,args,false)
  assert.equal(reference.status,0,`${JSON.stringify(args)}: ${reference.stdout}${reference.stderr}`)
  const result = run(nim,args)
  assert.equal(result.status,0,result.stderr)
  assert.deepEqual(snapshot(nim),snapshot(node))
 }
 for (const args of [['--unknown'],['unexpected'],['-dpages']]) {
  const dir = project({ 'app/index.tsx': screen })
  const before = snapshot(dir)
  const actual = run(dir,args)
  const reference = run(project({ 'app/index.tsx':screen }),args,false)
  assert.equal(actual.status,reference.status,`${JSON.stringify(args)}: Node ${reference.stdout}${reference.stderr}; Nim ${actual.stdout}${actual.stderr}`)
  assert.deepEqual(snapshot(dir),before)
 }
 const missing = project({ 'app/index.tsx':screen })
 const before = snapshot(missing)
 const rejected = run(missing,['--dir'])
 assert.equal(rejected.status,1)
 assert.match(rejected.stderr,/expects a value/)
 assert.deepEqual(snapshot(missing),before)
 // The reference's optional-string parser treats a valueless --dir as absent.
 // Native usage errors stay explicit instead of silently generating elsewhere.
 const referenceMissing = run(project({ 'app/index.tsx':screen }),['--dir'],false)
 assert.equal(referenceMissing.status,0,referenceMissing.stdout+referenceMissing.stderr)
})

test('native baking emits exact Node artifacts for loaders, Markdown and reserved keys', macOnly, async () => {
 const files = {
  'app/index.tsx': screen,
  'app/data.tsx': 'export const dataMode = "baked"; ' + screen,
  'app/data.loader.ts': 'export default async function loader(params: unknown) { return { params, value: [1e-7, 1e21, 0], nested: JSON.parse(\'{"__proto__":{"safe":true}}\') } }',
  'app/guide.md': '# Guide\n\n**Hello**, [read more](https://example.com).\n',
  'app/__proto__.md': '# Reserved route\n',
  'app/constructor.md': '# Constructor\n',
 }
 const node = project(files), nim = project(files)
 assert.equal(await generateRoutes(node),5)
 const result = run(nim)
 assert.equal(result.status,0,result.stdout+result.stderr)
 assert.deepEqual(snapshot(nim),snapshot(node))
 const data = readFileSync(join(nim,'routes.gen.data.ts'),'utf8')
 assert.match(data,/__proto__/)
 assert.match(data,/octane-xplat\/md/)
 assert.match(result.stdout,/5 routes/)
})

test('failed baking leaves the complete previous publication untouched and later succeeds', macOnly, async () => {
 const dir = project({ 'app/index.tsx': screen })
 assert.equal(run(dir).status,0)
 const before = generated(dir)
 write(dir,'app/baked.tsx','export const dataMode = "baked"; '+screen)
 for (const body of ['throw new Error("intentional bake failure")', 'return { unsupported: 1n }', 'return { negativeZero: -0 }']) {
  write(dir,'app/baked.loader.ts',`export function loader() { ${body} }`)
  assert.equal(run(dir).status,1)
  assert.deepEqual(generated(dir),before)
 }
 write(dir,'app/baked.loader.ts','export const loader = () => ({ fixed: true })')
 const fixed = run(dir)
 assert.equal(fixed.status,0,fixed.stderr)
 assert.match(readFileSync(join(dir,'routes.gen.data.ts'),'utf8'),/fixed/)
})

test('SIGTERM cancels an active bake without publishing late artifacts or leaking workers', macOnly, async () => {
 const dir = project({ 'app/index.tsx': screen })
 assert.equal(run(dir).status,0)
 const before = generated(dir)
 write(dir,'app/baked.tsx','export const dataMode = "baked"; '+screen)
 write(dir,'app/baked.loader.mjs',`import { writeFileSync } from 'node:fs';
export async function loader() { writeFileSync('worker.pid', String(process.pid)); process.on('SIGTERM', () => {}); await new Promise(() => {}); return { stale: true } }`)
 const runner = launch(dir,[])
 try {
  await until(() => existsSync(join(dir,'worker.pid')),runner.output)
  const pid = Number(readFileSync(join(dir,'worker.pid'),'utf8'))
  assert.deepEqual(await runner.stop(),{ code:143,signal:null })
  assert.throws(() => process.kill(pid,0),{ code:'ESRCH' })
  assert.deepEqual(generated(dir),before)
 } finally { await runner.stop() }
})

test('a closed diagnostic pipe does not leave an active bake worker behind', macOnly, async () => {
 const dir = project({ 'app/baked.tsx':'export const dataMode = "baked"; '+screen,
  'app/baked.loader.mjs':`import { writeFileSync } from 'node:fs';
export async function loader() { writeFileSync('worker.pid',String(process.pid)); setInterval(()=>console.error('bake diagnostic'),20); await new Promise(()=>{}); return {} }` })
 const runner = launch(dir,[])
 let pid
 try {
  await until(() => existsSync(join(dir,'worker.pid')),runner.output)
  pid = Number(readFileSync(join(dir,'worker.pid'),'utf8'))
  runner.child.stderr.destroy()
  await until(() => runner.child.exitCode !== null || runner.child.signalCode !== null,runner.output,5000)
  await runner.exited
  assert.throws(() => process.kill(pid,0),{code:'ESRCH'})
 } finally {
  await runner.stop()
  if (pid) { try { process.kill(pid,'SIGKILL') } catch {} }
 }
})

test('copied real application trees bake the same data and generated modules as Node', macOnly, async () => {
 const tracked = spawnSync('git',['ls-files','-z','**/xplat.routes.json'],{ cwd:root,encoding:'utf8' })
 assert.equal(tracked.status,0,tracked.stderr)
 let checked = 0
 for (const file of tracked.stdout.split('\0').filter(Boolean)) {
  const original = dirname(join(root,file)), config = JSON.parse(readFileSync(join(root,file),'utf8'))
  const fixture = project()
  const input = join(fixture,dirname(file))
  for (let at = original;; at = dirname(at)) {
   if (existsSync(join(at,'package.json'))) write(fixture,join(relative(root,at),'package.json'),readFileSync(join(at,'package.json'),'utf8'))
   if (at === root) break
   assert.ok(at.startsWith(root+sep))
  }
  write(fixture,file,config)
  const routes = config.directory ?? ['app','src/app'].find(path => existsSync(join(original,path)))
  if (routes && existsSync(join(original,routes))) cpSync(join(original,routes),join(input,routes),{ recursive:true })
  for (const ref of [...(config.manifests ?? []),config.context,config.transitions].filter(Boolean)) {
   const source = ['', '.ts','.tsx','.tsrx','.mts','.js','.mjs'].map(ext => ({ old:resolve(original,ref.module+ext),copy:resolve(input,ref.module+ext) })).find(path => existsSync(path.old))
   assert.ok(source && source.old.startsWith(root+sep) && source.copy.startsWith(fixture+sep))
   mkdirSync(dirname(source.copy),{ recursive:true }); cpSync(source.old,source.copy,{ recursive:true })
  }
  const node = join(scratch,`real-node-${checked}`), nim = join(scratch,`real-nim-${checked}`)
  cpSync(fixture,node,{ recursive:true }); cpSync(fixture,nim,{ recursive:true })
  const nodeDir = join(node,dirname(file)), nimDir = join(nim,dirname(file))
  await generateRoutes(nodeDir)
  const result = run(nimDir)
  assert.equal(result.status,0,`${file}: ${result.stderr}`)
  assert.deepEqual(snapshot(nim),snapshot(node),file)
  checked++
 }
 assert.equal(checked,7)
 console.info(`${checked} copied real application trees baked byte-identical route artifacts`)
})

// A project worker may be old, corrupt or return stale data. Publication stays native.
test('artifact plans reject unexpected, duplicate and missing destinations before publication', macOnly, async () => {
 const { planRoutes } = await import('../../packages/cli/src/route-generator.ts')
 for (const mode of ['outside', 'duplicate', 'incomplete', 'changed']) {
  const dir = project({ 'app/index.tsx': screen })
  assert.equal(run(dir).status, 0)
  const before = generated(dir)
  const plan = await planRoutes(dir, undefined, undefined, { bake: false })
  const outputs = [...plan.outputs].map(([file, source]) => ({ file, source }))
  if (mode === 'outside') outputs[0].file = join(dir, 'user-owned.txt')
  if (mode === 'duplicate') outputs.push(outputs[0])
  if (mode === 'incomplete') outputs.pop()
  const packageRoot = join(dir, 'node_modules/@octane-xplat/build')
  rmSync(packageRoot) // Remove only this fixture's symlink, never its target.
  write(dir, 'node_modules/@octane-xplat/build/package.json', { name: '@octane-xplat/build', type: 'module', exports: { './worker': './worker.js' } })
  write(dir, 'node_modules/@octane-xplat/build/worker.js', `import fs from 'node:fs';
const request = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
${mode === 'changed' ? "fs.appendFileSync('app/index.tsx', '\\n// changed during planning');" : ''}
fs.writeFileSync(process.argv[3], JSON.stringify({ protocol: request.protocol, version: request.version, id: request.id, ok: true, data: ${JSON.stringify({ version: 1, count: plan.count, outputs })} }));`)
  const result = run(dir)
  assert.equal(result.status, 1, result.stderr)
  assert.match(result.stderr, mode === 'changed' ? /source changed/ : /destination|Incomplete/)
  assert.deepEqual(generated(dir), before)
  assert.equal(existsSync(join(dir, 'user-owned.txt')), false)
 }
})
