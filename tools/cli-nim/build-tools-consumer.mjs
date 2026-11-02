// Packed project-installed plugins, optionally alongside the native CLI.
// No browser/device: real Vite build/server, HTTP and compiler/type boundaries.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild, httpProbeInputs } from './native-inputs.mjs'

const repo = resolve(import.meta.dirname, '../..')
const withNative = process.argv.includes('--with-native-cli')
const runRoot = scratchRun(repo, 'build-tools-consumer')
const packs = join(runRoot, 'packs'), consumer = join(runRoot, 'consumer')
mkdirSync(packs); mkdirSync(consumer)
const environment = { ...process.env }
delete environment.NODE_PATH; delete environment.NODE_OPTIONS
function run(command, args, cwd = repo, options = {}) {
 const result = spawnSync(command, args, { cwd, env: environment, encoding: 'utf8', timeout: 120000,
  maxBuffer: 8*1024*1024, ...options })
 assert.equal(result.status, 0, `${command} failed (${result.status ?? result.signal}):\n${result.stdout}\n${result.stderr}`)
 return result
}
function pack(path) {
 const manifest = JSON.parse(readFileSync(join(repo, path, 'package.json')))
 run('bun', ['pm','pack','--ignore-scripts','--destination',packs], join(repo,path))
 const file = join(packs, `${manifest.name.replace('@','').replace('/','-')}-${manifest.version}.tgz`)
 assert.ok(existsSync(file), file)
 return file
}

try {
 const { discoverWorkspace } = await import('../../packages/cli/src/mcp/discovery.ts')
 assert.ok(!discoverWorkspace(repo).apps.some(app => app.id === 'packages/build'), 'Build tooling must not become an app selection candidate')
 const plugins = pack('packages/build'), lib = pack('packages/lib')
 const inventory = run('tar',['-tzf',plugins]).stdout.trim().split('\n')
 for (const file of ['dist/vite.js','dist/vite.d.ts','dist/macos/vite.js','dist/macos/vite.d.ts',
  'dist/linux-gtk/vite.js','dist/linux-gtk/vite.d.ts','dist/css-platform.types.d.ts','dist/build-worker.js',
  'dist/typecheck-globals/native.d.ts','dist/typecheck-globals/macos.d.ts','LICENSE'])
  assert.ok(inventory.includes(`package/${file}`), `Missing packed ${file}`)
 assert.ok(inventory.every(file => !/\/(node_modules|src|nim|bin|standalone)\//.test(file)), inventory.join('\n'))
 const root = JSON.parse(readFileSync(join(repo,'package.json')))
 const deps = { '@octane-xplat/build': `file:${plugins}`, '@octane-xplat/lib': `file:${lib}`,
  vite: root.workspaces.catalog.vite, typescript: root.workspaces.catalog.typescript, '@types/node': '24.10.1' }
 let nativeVersion
 if (withNative) {
  deps['@tsrx/typescript-plugin'] = root.workspaces.catalog['@tsrx/typescript-plugin']
  deps['@tsrx/core'] = JSON.parse(readFileSync(join(repo,'packages/build/package.json'))).dependencies['@tsrx/core']
  assertCurrentNativeBuild(repo, JSON.parse(readFileSync(join(repo,'research/nim-cli/native/build.json'))),
   readFileSync(join(repo,`research/nim-cli/native/xplat${process.platform === 'win32' ? '.exe' : ''}`)))
  if (process.platform === 'darwin') assertCurrentNativeBuild(repo,
   JSON.parse(readFileSync(join(repo,'research/nim-cli/native/http-build.json'))),
   readFileSync(join(repo,'research/nim-cli/native/http-probe')), httpProbeInputs)
  const nativeOutput = join(packs,'native')
  run(process.execPath,[join(repo,'tools/cli-nim/pack.mjs'),'--host-only','--destination',nativeOutput])
  nativeVersion = JSON.parse(readFileSync(join(nativeOutput,'stage.json'))).version
  deps['@octane-xplat/cli'] = `file:${join(nativeOutput,`octane-xplat-cli-${nativeVersion}.tgz`)}`
 }
 writeFileSync(join(consumer,'package.json'), JSON.stringify({ name: 'packed-build-tools-consumer', private: true,
  type: 'module', devDependencies: deps, overrides: { '@octane-xplat/lib': `file:${lib}` } }))
 run('bun',['install','--ignore-scripts','--linker','isolated'],consumer)
 const installed = JSON.parse(readFileSync(join(consumer,'node_modules/@octane-xplat/build/package.json')))
 assert.equal(installed.dependencies['@octane-xplat/cli'],undefined)
 assert.equal(installed.peerDependencies['@octane-xplat/cli'],undefined)
 assert.equal(installed.optionalDependencies?.['@octane-xplat/cli'],undefined)
 // Execute the packed worker outside the repository's dependency topology.
 // The source is inspected, never imported as an application module.
 const request = { protocol: 'octane-build-worker', version: 1, id: 'packed-analysis', project: consumer,
  operation: 'route-analyze', files: [{ file: 'src/page.tsrx', source: 'throw new Error("must not execute"); export const loader = () => 42; export default function Page() @{ return <label>Page</label> }' }] }
 writeFileSync(join(consumer, 'worker-request.json'), JSON.stringify(request))
 const worker = join(consumer, 'node_modules/@octane-xplat/build/dist/build-worker.js')
 run(process.execPath, [worker, 'worker-request.json', 'worker-result.json'], consumer)
 const analyzed = JSON.parse(readFileSync(join(consumer, 'worker-result.json')))
 assert.equal(analyzed.id, request.id)
 assert.equal(analyzed.ok, true)
 assert.deepEqual(analyzed.data[0].metadata, { loader: true })
 writeFileSync(join(consumer, 'worker-loader.ts'), 'export const loader = () => ({ packed: true })')
 writeFileSync(join(consumer, 'worker-request.json'), JSON.stringify({ ...request, operation: 'route-bake',
  loaders: [{ name: 'index', file: 'worker-loader.ts' }], markdown: [{ name: 'readme', file: 'readme.md', source: '# Packed worker' }] }))
 run(process.execPath, [worker, 'worker-request.json', 'worker-result.json'], consumer)
 const baked = JSON.parse(readFileSync(join(consumer, 'worker-result.json')))
 assert.equal(baked.ok, true)
 assert.deepEqual(baked.data.index, { packed: true })
 assert.equal(baked.data.readme.kind, 'octane-xplat/md')
 mkdirSync(join(consumer, 'worker-routes'))
 writeFileSync(join(consumer, 'worker-routes/index.tsx'), 'throw new Error("planning must not execute route modules"); export default function Page() { return null }')
 writeFileSync(join(consumer, 'worker-request.json'), JSON.stringify({ ...request, operation: 'route-plan', directory: 'worker-routes', output: 'worker-generated/routes', bake: false }))
 run(process.execPath, [worker, 'worker-request.json', 'worker-result.json'], consumer)
 const planned = JSON.parse(readFileSync(join(consumer, 'worker-result.json')))
 assert.equal(planned.ok, true, JSON.stringify(planned))
 assert.equal(planned.data.version, 1)
 assert.equal(planned.data.count, 1)
 assert.equal(planned.data.outputs.length, 18)
 assert.ok(planned.data.outputs.every(entry => typeof entry.source === 'string' && entry.file.startsWith(join(consumer, 'worker-generated/routes.'))))
 assert.equal(existsSync(join(consumer, 'worker-generated')), false, 'Planning must not publish or create output directories')
 if (withNative) {
  const path = join(consumer,'node_modules/@octane-xplat/cli')
  const cli = JSON.parse(readFileSync(join(path,'package.json')))
  assert.equal(cli.exports, undefined); assert.equal(cli.dependencies, undefined)
  for (const folder of ['src','dist','node_modules']) assert.equal(existsSync(join(path,folder)),false)
  run(process.execPath,[join(path,'install-native.mjs')],consumer)
  const catalog = JSON.parse(run(join(path,'bin/xplat.exe'),['catalog','--json'],consumer,
   { env: { ...environment, PATH: '' } }).stdout)
  assert.equal(catalog.data.cli.version,nativeVersion)
  writeFileSync(join(consumer,'tsconfig.envs.json'), JSON.stringify({ compilerOptions: { noEmit: true, strict: true,
   types: [], target: 'ESNext', module: 'ESNext', moduleResolution: 'Bundler' },
   environments: { native: { files: ['native-check.ts'] } } }))
  writeFileSync(join(consumer,'native-check.ts'), 'console.log(process.env.NODE_ENV); queueMicrotask(() => {});\n')
  const checked = run(join(path,'bin/xplat.exe'),['typecheck'],consumer)
  assert.match(checked.stdout,/Typecheck clean/)
  const generated = JSON.parse(readFileSync(join(consumer,'node_modules/.cache/xplat-typecheck/all.json')))
  assert.ok(generated.files[0].endsWith('/dist/typecheck-globals/native.d.ts'))
  writeFileSync(join(consumer,'native-check.ts'),'const value: number = "wrong";\n')
  const rejected = spawnSync(join(path,'bin/xplat.exe'),['typecheck'], { cwd: consumer, env: environment, encoding: 'utf8', timeout: 30000 })
  assert.equal(rejected.status,1,rejected.stderr)
  assert.match(rejected.stdout+rejected.stderr,/TS2322/)
  rmSync(join(consumer,'tsconfig.envs.json')); rmSync(join(consumer,'native-check.ts'))
  mkdirSync(join(consumer,'pages'))
  writeFileSync(join(consumer,'pages/index.tsx'),'throw new Error("screen source must not execute"); export const dataMode = "baked"; export default () => null')
  writeFileSync(join(consumer,'pages/index.loader.ts'),'export const loader = () => ({ packedNativeRoute: true })')
  const routed = run(join(path,'bin/xplat.exe'),['routes','--dir','pages'],consumer)
  assert.match(routed.stdout,/1 route/)
  assert.match(readFileSync(join(consumer,'routes.gen.data.ts'),'utf8'),/packedNativeRoute/)
  assert.equal(JSON.parse(readFileSync(join(consumer,'routes.gen.manifest.json'))).routes.length,1)
 }
 cpSync(join(repo,'packages/build/test/typecheck.ts'),join(consumer,'typecheck.ts'))
 writeFileSync(join(consumer,'tsconfig.json'),JSON.stringify({ compilerOptions: {
  strict: true, skipLibCheck: true, noEmit: true, target: 'ESNext', module: 'NodeNext', moduleResolution: 'NodeNext', types: ['node']
 }, include: ['typecheck.ts'] }))
 run(process.execPath,[join(consumer,'node_modules/typescript/bin/tsc'),'-p','tsconfig.json'],consumer)
 writeFileSync(join(consumer,'index.html'),'<!doctype html><html><body><div id="app"></div><script type="module" src="/src/main.js"></script></body></html>')
 mkdirSync(join(consumer,'src'))
 writeFileSync(join(consumer,'src/main.js'),"import './theme.css'; document.getElementById('app').textContent = 'packed plugins';\n")
 writeFileSync(join(consumer,'src/theme.css'),'.fallback-must-not-ship { color: red }')
 writeFileSync(join(consumer,'src/theme.web.css'),'@platform web { .packed-web { color: rgb(11, 22, 33); --packed-existing: unprocessed } } @platform mobile { .must-not-ship { color: red } }')
 writeFileSync(join(consumer,'postcss.config.mjs'),"export default { plugins: [{ postcssPlugin: 'packed-app-postcss', Declaration(decl) { if (decl.prop === '--packed-existing') decl.value = 'preserved' } }] }\n")
 writeFileSync(join(consumer,'vite.config.mjs'),"import { defineConfig } from 'vite'\nimport { xplatCss, xplatBoundary, xplatDevBridge, xplatNodeEnvDefine } from '@octane-xplat/build/vite'\nexport default defineConfig(({ mode }) => ({ define: xplatNodeEnvDefine(mode), plugins: [xplatCss('web'), xplatBoundary('web'), xplatDevBridge()], server: { host: '127.0.0.1', port: 0 } }))\n")
 cpSync(join(import.meta.dirname,'build-tools-live.mjs'),join(consumer,'verify.mjs'))
 const nativeProbe = withNative && process.platform === 'darwin' ? join(repo,'research/nim-cli/native/http-probe') : ''
 const result = run(process.execPath,['verify.mjs'],consumer,{ env: { ...environment, XPLAT_TEST_HTTP_PROBE: nativeProbe } })
 const live = JSON.parse(result.stdout.trim())
 const original = await import('../../packages/cli/src/vite.ts')
 assert.deepEqual(live.exports,Object.keys(original).sort())
 assert.deepEqual(live.nativeExtensions,original.nativeExtensions)
 assert.deepEqual(live.nodeEnv,['development','production','test'].map(mode => original.xplatNodeEnvDefine(mode)))
 assert.equal(live.productionCssFiltered,true)
 assert.equal(live.devCssFiltered,true)
 assert.equal(live.appPostcssPreserved,true)
 assert.equal(live.platformSiblingSelected,true)
 assert.equal(live.nativeRegexMatches.length,4)
 assert.equal(live.foreignModuleRejected,true)
 assert.equal(live.sessionRemoved,true)
 if (nativeProbe) assert.equal(live.nativeBridgeRoundtrip,true)
 const bytes = readFileSync(plugins)
 const evidence = { platform: process.platform, arch: process.arch, node: process.version, withNative,
  nativeVersion, package: { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), files: inventory }, live }
 const output = join(repo,`research/nim-cli/build-tools-packed${withNative ? '-native' : ''}.json`)
 writeFileSync(output,JSON.stringify(evidence,null,2))
 console.log(`Packed plugins: ${bytes.length} bytes; isolated Vite build/server/typecheck passed${withNative ? ' alongside native CLI' : ' without a CLI installation'}`)
 console.log(`Evidence: ${output}`)
} finally {
 rmSync(runRoot,{ recursive: true, force: true })
}
