import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { assertProducerInputs } from './check-producer-inputs.mjs'

const repo = resolve(import.meta.dirname, '../../..')
const parent = join(homedir(), 'agent-scratch/octane-xplat/native-prerender-producer-package')

mkdirSync(parent, { recursive: true })

const work = mkdtempSync(join(parent, 'run-'))
const consumer = join(work, 'consumer')

mkdirSync(consumer)
writeFileSync(
  join(work, 'README.md'),
  'Everything in this folder is disposable.\nPacked native startup producer qualification.\nSource: ' +
    repo +
    '\nRetained evidence: ~/dev/reports/octane-xplat/\n',
)

const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')
function json(file, value) {
  writeFileSync(file, JSON.stringify(value, null, 2) + '\n')
}

function run(program, args, cwd, log, timeout = 120000) {
  const result = spawnSync(program, args, {
    cwd,
    encoding: 'utf8',
    timeout,
    maxBuffer: 8 * 1024 * 1024,
  })

  writeFileSync(
    join(work, log),
    (result.stdout ?? '') + (result.stderr ?? '') + String(result.error ?? ''),
  )

  assert.equal(result.status, 0, 'Command failed; see ' + join(work, log))
  return result.stdout
}

const packages = [
  'native-prerender-build',
  'native-prerender',
  'css-engine',
  'ui',
  'lib',
  'icons',
  'build',
]

const packed = {}

for (const name of packages) {
  const directory = join(repo, 'packages', name)
  const manifest = JSON.parse(readFileSync(join(directory, 'package.json')))

  // Turbo prepared dists/declarations. This is a source-artifact integration
  // gate, not a release prepack/publish qualification of the unchanged peers.
  run(
    'bun',
    ['pm', 'pack', '--ignore-scripts', '--filename', join(work, name + '.tgz')],
    directory,
    'pack-' + name + '.log',
  )

  packed[manifest.name] = {
    path: join(work, name + '.tgz'),
    sha256: hash(join(work, name + '.tgz')),
  }
}

mkdirSync(join(consumer, 'patches'))

const patch = join(repo, 'packages/cli/patches/octane@0.17.0.patch')

cpSync(patch, join(consumer, 'patches/octane.patch'))
json(join(consumer, 'package.json'), {
  name: 'native-startup-packed-consumer',
  private: true,
  type: 'module',
  dependencies: {
    ...Object.fromEntries(
      Object.entries(packed).map(([name, value]) => [name, 'file:' + value.path]),
    ),
    octane: '0.17.0',
    vite: '8.3.6',
    '@tsrx/oxc': '0.20.0',
  },
  overrides: {
    ...Object.fromEntries(
      Object.entries(packed).map(([name, value]) => [name, 'file:' + value.path]),
    ),
    regenerate: '1.5.0',
  },
  patchedDependencies: { 'octane@0.17.0': 'patches/octane.patch' },
})

writeFileSync(join(consumer, 'bunfig.toml'), '[install]\nlinker = "isolated"\n')
run('bun', ['install', '--ignore-scripts'], consumer, 'install.log')

const source = join(import.meta.dirname, 'producer/fixtures')

cpSync(source, join(consumer, 'fixtures'), { recursive: true })
cpSync(join(import.meta.dirname, 'Home.tsrx'), join(consumer, 'Home.tsrx'))
cpSync(join(import.meta.dirname, 'home.css'), join(consumer, 'home.css'))
json(join(consumer, 'home.json'), {
  version: 1,
  entry: './Home.tsrx',
  exportName: 'Home',
  seed: { name: 'Avery', initialCompleted: 3 },
  environment: { width: 402, height: 874, reducedMotion: false },
})

// A conflicting framework checkout is not on this consumer's package ancestry.
const driver = `
import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {join,resolve} from 'node:path'
import {produceNativeStartup} from '@octane-xplat/native-prerender-build'
import {decodeStartupArtifact} from '@octane-xplat/native-prerender/codec'
const root=process.cwd(), results=[]
for(const [name,configurationFile,platform] of [
 ['home-android','home.json','android'], ['home-ios','home.json','ios'],
 ['keyed-android','fixtures/keyed-startup.json','android'], ['keyed-ios','fixtures/keyed-startup.json','ios'],
 ['label-android','fixtures/root-label-startup.json','android'],
 ['platform-android','fixtures/platform-startup.json','android'], ['platform-ios','fixtures/platform-startup.json','ios']]) {
 const result=await produceNativeStartup({projectDir:root,configurationFile,platform,outputDir:join(root,'output',name)})
 assert.ok(Object.keys(result.manifest.inputs).every(file=>file.startsWith(root+'/')), 'Producer read outside installed consumer')
 const decoded=decodeStartupArtifact(readFileSync(join(result.directory,'startup.bin')), {platform,build:result.manifest.buildHash})
 assert.deepEqual(decoded,result.artifact)
 const visual=decoded.nodes.filter(node=>node.kind!=='#text')
 assert.equal(visual.length,name.startsWith('home')?19:name.startsWith('keyed')?4:1)
 if(name.startsWith('keyed')) assert.equal(decoded.nodes[2].props.value, (platform==='android'?'Android: ':'iOS: ')+'Configured initial screen')
 if(name.startsWith('platform')) {
  const expected=platform==='android'?'#135790':'#2468ac'
  assert.equal(decoded.variants.light[0].style.color,expected)
  assert.equal(decoded.variants.dark[0].style.color,expected)
  assert.equal(decoded.variants.light[0].style.fontSize,20)
  const sheets=JSON.parse(readFileSync(join(result.directory,'sheets.json')))
  assert.ok(sheets.some(sheet=>sheet.id.endsWith('platform-startup.'+platform+'.css')))
  assert.ok(sheets.every(sheet=>!sheet.css.includes('@platform')))
 }
 results.push({name,directory:result.directory,visualNodes:visual.length,logicalNodes:decoded.nodes.length,buildHash:decoded.build})
}
await assert.rejects(produceNativeStartup({projectDir:root,configurationFile:'fixtures/configured-startup.json',platform:'android',outputDir:join(root,'output','ineligible')}), /not aligned with live CSS/)
const exclusive={projectDir:root,configurationFile:'home.json',platform:'android',outputDir:join(root,'output','exclusive')}
const collision=await Promise.allSettled([produceNativeStartup(exclusive),produceNativeStartup(exclusive)])
assert.deepEqual(collision.map(result=>result.status),['fulfilled','rejected'])
assert.match(String(collision[1].reason),/new or empty/)
mkdirSync('resolution')
writeFileSync('resolution/RootLabelStartup.tsrx',readFileSync('fixtures/RootLabelStartup.tsrx'))
writeFileSync('resolution.json',JSON.stringify({...JSON.parse(readFileSync('fixtures/root-label-startup.json')),entry:'./resolution/RootLabelStartup.tsrx'}))
const stale=await produceNativeStartup({projectDir:root,configurationFile:'resolution.json',platform:'android',outputDir:join(root,'output','stale-resolution')})
const candidate=join(root,'resolution','RootLabelStartup.android.tsrx')
assert.ok(stale.manifest.missingInputs.includes(candidate))
writeFileSync(candidate,readFileSync(join(root,'fixtures','RootLabelStartup.tsrx')))
writeFileSync('unsupported.css','@import "./other.css";')
writeFileSync('other.css','.unused { color: red }')
for(const [name,path,reason] of [['import','./unsupported.css',/CSS @import is unsupported/],['query','./other.css?inline',/CSS query imports are unsupported/],['package-css','startup-styles/theme.css',/CSS package imports are unsupported/]]) {
 writeFileSync(name+'.tsrx','import '+JSON.stringify(path)+';'+readFileSync('fixtures/RootLabelStartup.tsrx','utf8'))
 writeFileSync(name+'.json',JSON.stringify({...JSON.parse(readFileSync('fixtures/root-label-startup.json')),entry:'./'+name+'.tsrx'}))
 await assert.rejects(produceNativeStartup({projectDir:root,configurationFile:name+'.json',platform:'android',outputDir:join(root,'output','unsupported-'+name)}),reason)
}
writeFileSync('result.json',JSON.stringify({passed:true,results,dimensionQueriesRejected:true,exclusiveOutput:true,unsupportedCssRejected:true,staleResolutionDirectory:stale.directory},null,2))
`

writeFileSync(join(consumer, 'verify.mjs'), driver)
run(process.execPath, ['verify.mjs'], consumer, 'verify.log')

const result = JSON.parse(readFileSync(join(consumer, 'result.json')))

for (const row of result.results) {
  assertProducerInputs(JSON.parse(readFileSync(join(row.directory, 'build.json'))))
}

assert.throws(
  () =>
    assertProducerInputs(
      JSON.parse(readFileSync(join(result.staleResolutionDirectory, 'build.json'))),
    ),
  /resolution input appeared/,
)

json(join(work, 'result.json'), {
  ...result,
  packed,
  patchSha256: hash(patch),
  driverSha256: hash(import.meta.filename),
  consumerDriverSha256: hash(join(consumer, 'verify.mjs')),
  sourceGuardSha256: hash(join(import.meta.dirname, 'check-producer-inputs.mjs')),
  scope:
    'Packed Node/Vite producer outside checkout ancestry; no native host install, runtime hydration, presentation or performance qualification',
})

console.log(JSON.stringify({ work, passed: true, cases: result.results.length }))
