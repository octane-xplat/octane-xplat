import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { spawnSync, spawn } from 'node:child_process'
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  realpathSync,
  symlinkSync,
  existsSync,
  chmodSync,
  readdirSync,
} from 'node:fs'

import { join, resolve, dirname } from 'node:path'
import { homedir } from 'node:os'
import { createHash } from 'node:crypto'
import { once } from 'node:events'
import { projectToolFixture } from './project-fixtures.mjs'
const root = resolve(import.meta.dirname, '../..'),
  work = join(root, 'research/go-cli')

const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(work, `xplat-go-${host}-cli${process.platform === 'win32' ? '.exe' : ''}`)
const sha = (b) => createHash('sha256').update(b).digest('hex'),
  build = JSON.parse(readFileSync(binary + '.json'))

assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs)) {
  assert.equal(sha(readFileSync(join(root, file))), hash, `Stale build source ${file}`)
}

const base = join(homedir(), 'agent-scratch/octane-xplat/go-cli-stoic-forge')
mkdirSync(base, { recursive: true })
const scratch = realpathSync(mkdtempSync(join(base, 'build-')))
after(() => rmSync(scratch, { recursive: true, force: true }))
const tools = projectToolFixture(root, work, scratch)
let sequence = 0
function put(dir, file, value) {
  const path = join(dir, file)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value))
  return path
}

function project(files = {}, manifest = {}) {
  const dir = join(scratch, `app ${sequence++} π`)
  put(dir, 'package.json', { name: 'go-build-fixture', private: true, type: 'module', ...manifest })
  for (const [file, value] of Object.entries(files)) {
    put(dir, file, value)
  }
  symlinkSync(
    tools.nodeModules,
    join(dir, 'node_modules'),
    process.platform === 'win32' ? 'junction' : 'dir',
  )
  return dir
}

function run(dir, args = [], env = {}) {
  return spawnSync(binary, ['build', ...args], {
    cwd: dir,
    encoding: 'utf8',
    timeout: 20000,
    env: { ...process.env, NODE_PATH: '', NODE_OPTIONS: '', ...env },
  })
}

function status(r, code) {
  assert.equal(r.status, code, r.stdout + r.stderr)
}

function fakePackage(dir, name, manifest, body) {
  const path = join(dir, 'node_modules', name)
  put(dir, 'node_modules/' + name + '/package.json', { name, ...manifest })
  put(dir, 'node_modules/' + name + '/run.mjs', body)
  return path
}

function isolated(files = {}, manifest = {}) {
  const dir = project(files, manifest)
  rmSync(join(dir, 'node_modules'))
  mkdirSync(join(dir, 'node_modules'))
  return dir
}

test('build descriptor/help and unavailable selections need no Node or route writes', () => {
  const dir = project({ 'src/app/index.tsrx': 'export default ()=>null\n' })
  for (const flag of ['--help', '--schema']) {
    const r = run(dir, [flag], { PATH: '' })
    status(r, 0)
    assert.match(r.stdout, /targets/)
  }
  for (const args of [[], ['--targets', 'web'], ['--targets='], ['--targets']]) {
    const r = run(dir, args, { PATH: '' })
    status(r, 1)
    assert.equal(existsSync(join(dir, 'src/routes.gen.web.ts')), false)
  }
})

test('actual project Vite build loads project config/plugins, baked routes and local engine', () => {
  const dir = project({
    'vite.config.mjs': `import{writeFileSync}from'node:fs';export default{plugins:[{name:'probe',buildStart(){writeFileSync('config-observed.json',JSON.stringify({options:process.env.NODE_OPTIONS,path:process.env.NODE_PATH}))}}]}`,
    'index.html': '<script type="module" src="/main.js"></script>',
    'main.js': 'console.log("go-build-actual")',
    'app/index.tsrx': 'export const dataMode="baked";export default ()=>null\n',
    'app/index.loader.ts': 'export const loader=()=>({value:42})\n',
  })
  const r = run(dir, ['--targets', ' web,web ', '--release'], {
    NODE_OPTIONS: '--no-warnings',
    NODE_PATH: '/not-project',
  })
  status(r, 0)
  assert.match(r.stdout, /Build complete/)
  assert.equal(existsSync(join(dir, 'dist/index.html')), true)
  assert.match(readFileSync(join(dir, 'routes.gen.data.ts'), 'utf8'), /42/)
  assert.deepEqual(JSON.parse(readFileSync(join(dir, 'config-observed.json'))), {
    options: '',
    path: '',
  })
  assert.equal(
    readdirSync(join(dir, 'dist/assets')).some((name) => name.endsWith('.js')),
    true,
  )
})

test('preflight rejects every missing engine before route baking or earlier target output', () => {
  const dir = project(
    {
      'vite.config.mjs': 'export default {}',
      'index.html': 'hello',
      'app/index.tsrx': 'export default ()=>null\n',
    },
    { devDependencies: { '@nativescript/android': '9.0.0' } },
  )
  put(dir, 'nativescript.config.ts', 'export default {}')
  const r = run(dir, ['--targets', 'web,android'])
  status(r, 1)
  assert.match(r.stderr, /nativescript/)
  assert.equal(existsSync(join(dir, 'dist')), false)
  assert.equal(existsSync(join(dir, 'routes.gen.web.ts')), false)
})

test('NativeScript engine receives selected platform/release argv and failure stops later builds', () => {
  const dir = isolated(
    { 'nativescript.config.ts': 'export default {}' },
    { devDependencies: { '@nativescript/android': '9.0.0' } },
  )
  fakePackage(
    dir,
    'nativescript',
    { bin: { ns: './run.mjs' } },
    `console.log(JSON.stringify({argv:process.argv.slice(2),cwd:process.cwd()}));console.error('ns stderr π');process.exitCode=7`,
  )
  const r = run(dir, ['--targets', 'android', '--release'])
  status(r, 1)
  const line = r.stdout.split('\n').find((s) => s.startsWith('{'))
  assert.deepEqual(JSON.parse(line), { argv: ['build', 'android', '--release'], cwd: dir })
  assert.match(r.stderr, /ns stderr π/)
  assert.match(r.stderr, /android build exited 7/)
  assert.doesNotMatch(r.stdout, /Build complete/)
})

test('Android store options forward validated argv; passwords arrive only from environment references', () => {
  const dir = isolated(
    { 'nativescript.config.ts': 'export default {}' },
    { devDependencies: { '@nativescript/android': '9.0.0' } },
  )
  fakePackage(
    dir,
    'nativescript',
    { bin: { ns: './run.mjs' } },
    `import{writeFileSync,mkdirSync}from'node:fs';import{dirname}from'node:path';const a=process.argv.slice(2);const i=a.indexOf('--key-store-password'),j=a.indexOf('--key-store-alias-password');const dest=a[a.indexOf('--copy-to')+1];mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,'aab-bytes');console.log(JSON.stringify({argv:a.map((v,k)=>k===i+1||k===j+1?'***':v),storePw:a[i+1]===process.env.FIXTURE_STORE_PW,keyPw:a[j+1]===process.env.FIXTURE_KEY_PW}));`,
  )
  const r = run(
    dir,
    [
      '--targets',
      'android',
      '--release',
      '--aab',
      '--key-store-path',
      'keys/upload.jks',
      '--key-store-alias',
      'upload',
      '--key-store-password-env',
      'FIXTURE_STORE_PW',
      '--key-store-alias-password-env',
      'FIXTURE_KEY_PW',
      '--copy-to',
      'dist/app-release.aab',
    ],
    { FIXTURE_STORE_PW: 'store-secret-π', FIXTURE_KEY_PW: 'key-secret-π' },
  )
  status(r, 0)
  const line = r.stdout.split('\n').find((s) => s.startsWith('{'))
  const seen = JSON.parse(line)
  assert.deepEqual(seen.argv, [
    'build',
    'android',
    '--release',
    '--aab',
    '--key-store-path',
    'keys/upload.jks',
    '--key-store-password',
    '***',
    '--key-store-alias',
    'upload',
    '--key-store-alias-password',
    '***',
    '--copy-to',
    'dist/app-release.aab',
  ])
  assert.equal(seen.storePw, true)
  assert.equal(seen.keyPw, true)
  assert.doesNotMatch(r.stdout + r.stderr, /store-secret-π|key-secret-π/)
  assert.match(
    r.stdout,
    /ns build android --release --aab .*--key-store-password \[redacted\].*\[redacted\]/,
  )
  assert.match(r.stdout, /Artifact: .*dist.app-release\.aab \(Android App Bundle\)/)
})

test('xplat.targets.android.signing config supplies the keystore and env references', () => {
  const dir = isolated(
    { 'nativescript.config.ts': 'export default {}' },
    {
      devDependencies: { '@nativescript/android': '9.0.0' },
      xplat: {
        targets: {
          android: {
            signing: {
              keyStorePath: 'keys/config.jks',
              keyStoreAlias: 'config-alias',
              keyStorePasswordEnv: 'FIXTURE_STORE_PW',
              keyStoreAliasPasswordEnv: 'FIXTURE_KEY_PW',
            },
          },
        },
      },
    },
  )
  fakePackage(
    dir,
    'nativescript',
    { bin: { ns: './run.mjs' } },
    `const a=process.argv.slice(2);const i=a.indexOf('--key-store-password'),j=a.indexOf('--key-store-alias-password');console.log(JSON.stringify({argv:a.map((v,k)=>k===i+1||k===j+1?'***':v),storePw:a[i+1]===process.env.FIXTURE_STORE_PW,keyPw:a[j+1]===process.env.FIXTURE_KEY_PW}));`,
  )
  const r = run(dir, ['--targets', 'android', '--release', '--aab'], {
    FIXTURE_STORE_PW: 'config-store-π',
    FIXTURE_KEY_PW: 'config-key-π',
  })
  status(r, 0)
  const seen = JSON.parse(r.stdout.split('\n').find((s) => s.startsWith('{')))
  assert.deepEqual(seen.argv, [
    'build',
    'android',
    '--release',
    '--aab',
    '--key-store-path',
    'keys/config.jks',
    '--key-store-password',
    '***',
    '--key-store-alias',
    'config-alias',
    '--key-store-alias-password',
    '***',
  ])
  assert.equal(seen.storePw, true)
  assert.equal(seen.keyPw, true)
  assert.doesNotMatch(r.stdout + r.stderr, /config-store-π|config-key-π/)
})

test('artifact option validation rejects bad combinations before route generation', () => {
  const dir = isolated(
    { 'vite.config.mjs': 'export default {}', 'nativescript.config.ts': 'export default {}' },
    { devDependencies: { '@nativescript/android': '9.0.0' } },
  )
  for (const [args, want] of [
    [['--targets', 'web', '--aab'], /android build target/],
    [['--targets', 'android', '--for-device'], /ios build target/],
    [['--targets', 'android', '--provision', 'P'], /ios build target/],
    [['--targets', 'android,web', '--copy-to', 'dist/a'], /single/],
    [['--targets', 'web', '--copy-to', 'dist/a'], /single/],
    [['--targets', 'android', '--release', '--key-store-path', 'k'], /missing --key-store-alias/],
    [
      [
        '--targets',
        'android',
        '--key-store-path',
        'k',
        '--key-store-alias',
        'a',
        '--key-store-password-env',
        'E1',
        '--key-store-alias-password-env',
        'E2',
      ],
      /--release/,
    ],
    [
      [
        '--targets',
        'android',
        '--release',
        '--key-store-path',
        'k',
        '--key-store-alias',
        'a',
        '--key-store-password-env',
        'FIXTURE_UNSET_X9',
        '--key-store-alias-password-env',
        'E2',
      ],
      /FIXTURE_UNSET_X9/,
    ],
  ]) {
    const r = run(dir, args)
    status(r, 1)
    assert.match(r.stderr, want, `${args.join(' ')}: ${r.stderr}`)
  }
  assert.equal(readdirSync(dir).filter((name) => name.startsWith('routes.gen')).length, 0)
})

test('persisted signing secrets in xplat.targets.android.signing are refused', () => {
  const dir = isolated(
    { 'nativescript.config.ts': 'export default {}' },
    {
      devDependencies: { '@nativescript/android': '9.0.0' },
      xplat: { targets: { android: { signing: { keyStorePassword: 'hunter2' } } } },
    },
  )
  const r = run(dir, ['--targets', 'android', '--release'])
  status(r, 1)
  assert.match(r.stderr, /keyStorePasswordEnv|environment variable/)
})

test(
  'iOS distribution options forward and the produced .ipa is reported',
  { skip: process.platform !== 'darwin' },
  () => {
    const dir = isolated(
      { 'nativescript.config.ts': 'export default {}' },
      { devDependencies: { '@nativescript/ios': '9.0.0' } },
    )
    fakePackage(
      dir,
      'nativescript',
      { bin: { ns: './run.mjs' } },
      `import{writeFileSync,mkdirSync}from'node:fs';mkdirSync('platforms/ios/build/Release-iphoneos',{recursive:true});writeFileSync('platforms/ios/build/Release-iphoneos/Fixture.ipa','ipa-bytes');console.log(JSON.stringify({argv:process.argv.slice(2)}));`,
    )
    const r = run(dir, [
      '--targets',
      'ios',
      '--release',
      '--for-device',
      '--provision',
      'Fixture App Store',
      '--team-id',
      'TEAM123456',
    ])
    status(r, 0)
    const seen = JSON.parse(r.stdout.split('\n').find((s) => s.startsWith('{')))
    assert.deepEqual(seen.argv, [
      'build',
      'ios',
      '--release',
      '--for-device',
      '--provision',
      'Fixture App Store',
      '--team-id',
      'TEAM123456',
    ])
    assert.match(r.stdout, /ns build ios --release --for-device/)
    assert.match(r.stdout, /Artifact: .*Release-iphoneos.Fixture\.ipa \(iOS device package\)/)
  },
)

test(
  'iOS --copy-to reports the copied artifact destination',
  { skip: process.platform !== 'darwin' },
  () => {
    const dir = isolated(
      { 'nativescript.config.ts': 'export default {}' },
      { devDependencies: { '@nativescript/ios': '9.0.0' } },
    )
    fakePackage(
      dir,
      'nativescript',
      { bin: { ns: './run.mjs' } },
      `import{writeFileSync,mkdirSync}from'node:fs';import{dirname}from'node:path';const a=process.argv.slice(2);const dest=a[a.indexOf('--copy-to')+1];mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,'ipa-bytes');console.log(JSON.stringify({argv:a}));`,
    )
    const r = run(dir, [
      '--targets',
      'ios',
      '--release',
      '--for-device',
      '--copy-to',
      'dist/packing.ipa',
    ])
    status(r, 0)
    const seen = JSON.parse(r.stdout.split('\n').find((s) => s.startsWith('{')))
    assert.deepEqual(seen.argv, [
      'build',
      'ios',
      '--release',
      '--for-device',
      '--copy-to',
      'dist/packing.ipa',
    ])
    assert.match(r.stdout, /Artifact: .*dist.packing\.ipa \(iOS device package\)/)
  },
)

test(
  'macOS worker stages a validated pair; malformed response preserves previous artifacts',
  { skip: process.platform !== 'darwin' },
  () => {
    const dir = isolated({}, { xplat: { targets: { macos: { runtime: 'appkit-node-api' } } } })
    fakePackage(dir, 'vite', { bin: { vite: './run.mjs' } }, '')
    const body = `import{readFileSync,writeFileSync,mkdirSync}from'node:fs';import{join}from'node:path';const[input,output]=process.argv.slice(2);const r=JSON.parse(readFileSync(input));const app=join(r.stagingRoot,'Fixture.app');mkdirSync(join(app,'Contents/MacOS'),{recursive:true});writeFileSync(join(app,'Contents/MacOS/Fixture'),'executable');writeFileSync(join(app,'Contents/Info.plist'),'plist');const dmg=join(r.stagingRoot,'Fixture-macos-universal.dmg');writeFileSync(dmg,'new dmg');writeFileSync(output,JSON.stringify({protocol:r.protocol,version:1,id:r.id,ok:true,data:{version:1,executableName:'Fixture',appPath:app,dmgPath:dmg}}));`
    fakePackage(dir, '@octane-xplat/macos-build', { exports: { './worker': './run.mjs' } }, body)
    const release = 'artifacts/macos-universal'
    put(dir, release + '/Fixture.app/Contents/MacOS/Fixture', 'old exe')
    put(dir, release + '/Fixture-macos-universal.dmg', 'old dmg')
    const ok = run(dir, ['--targets', 'macos'])
    status(ok, 0)
    assert.equal(readFileSync(join(dir, release, 'Fixture-macos-universal.dmg'), 'utf8'), 'new dmg')
    put(
      dir,
      'node_modules/@octane-xplat/macos-build/run.mjs',
      body.replace('dmgPath:dmg', 'dmgPath:join(process.cwd(),"elsewhere.dmg")'),
    )
    const bad = run(dir, ['--targets', 'macos'])
    status(bad, 1)
    assert.equal(readFileSync(join(dir, release, 'Fixture-macos-universal.dmg'), 'utf8'), 'new dmg')
    assert.equal(
      readdirSync(join(dir, release)).some((name) => name.startsWith('.xplat-macos-')),
      false,
    )
  },
)

test(
  'SIGTERM cancels an active engine after live diagnostics',
  { skip: process.platform === 'win32' },
  async () => {
    const dir = isolated({ 'vite.config.mjs': 'export default {}' })
    fakePackage(
      dir,
      'vite',
      { bin: { vite: './run.mjs' } },
      `console.log('build engine ready');console.error('live build diagnostic');setInterval(()=>{},1000)`,
    )
    const child = spawn(binary, ['build', '--targets', 'web'], {
      cwd: dir,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = '',
      errors = ''
    child.stdout.on('data', (b) => (output += b))
    child.stderr.on('data', (b) => (errors += b))
    const exited = once(child, 'close')
    const timer = setTimeout(() => child.kill('SIGTERM'), 5000)
    try {
      for (let i = 0; i < 100 && !output.includes('build engine ready'); i++) {
        await new Promise((r) => setTimeout(r, 20))
      }

      assert.match(output, /build engine ready/)
      child.kill('SIGTERM')
      assert.deepEqual(await exited, [143, null])
      assert.match(errors, /live build diagnostic/)
    } finally {
      clearTimeout(timer)
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGTERM')
      }

      await exited
    }
  },
)

test(
  'interactive terminal accepts the default selection without prompting on pipes',
  { skip: process.platform === 'win32' },
  () => {
    const dir = isolated({ 'vite.config.mjs': 'export default {}' })
    fakePackage(dir, 'vite', { bin: { vite: './run.mjs' } }, "console.log('terminal engine ran')")
    const script = `import os,subprocess,select,time,sys
master,slave=os.openpty()
p=subprocess.Popen([sys.argv[1],'build'],cwd=sys.argv[2],stdin=slave,stdout=slave,stderr=slave)
os.close(slave)
os.write(master,b'\\n')
output=b'';deadline=time.monotonic()+5
while time.monotonic()<deadline:
 if select.select([master],[],[],0.1)[0]:
  try: output+=os.read(master,65536)
  except OSError: break
 if p.poll() is not None: break
if p.poll() is None: p.kill()
code=p.wait();os.close(master)
sys.stdout.write(output.decode('utf-8','replace'))
sys.exit(code)
`
    const result = spawnSync('python3', ['-c', script, binary, dir], {
      encoding: 'utf8',
      timeout: 10000,
    })
    status(result, 0)
    assert.match(result.stdout, /Build targets/)
    assert.match(result.stdout, /terminal engine ran/)
    const pipe = run(dir)
    status(pipe, 0)
    assert.doesNotMatch(pipe.stdout, /Build targets/)
  },
)

test(
  'SIGTERM during Apple tool discovery preserves cancellation instead of losing the target',
  { skip: process.platform === 'win32' },
  async () => {
    const dir = isolated(
      { 'nativescript.config.ts': 'export default {}' },
      { devDependencies: { '@nativescript/ios': '9.0.0' } },
    )
    const probe = put(
      dir,
      'probe-bin/xcrun',
      '#!/bin/sh\nprintf ready > apple-probe-ready\nsleep 20\n',
    )
    chmodSync(probe, 0o755)
    const child = spawn(binary, ['build', '--targets', 'ios'], {
      cwd: dir,
      env: { ...process.env, PATH: dirname(probe) + ':' + process.env.PATH },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let errors = ''
    child.stderr.on('data', (bytes) => (errors += bytes))
    child.stdout.resume()
    const exited = once(child, 'close')
    const timer = setTimeout(() => child.kill('SIGTERM'), 5000)
    try {
      for (let i = 0; i < 100 && !existsSync(join(dir, 'apple-probe-ready')); i++) {
        await new Promise((resolve) => setTimeout(resolve, 20))
      }

      assert.ok(existsSync(join(dir, 'apple-probe-ready')))
      child.kill('SIGTERM')
      assert.deepEqual(await exited, [143, null], errors)
      assert.doesNotMatch(errors, /Unavailable build target/)
    } finally {
      clearTimeout(timer)
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGTERM')
      }

      await exited
    }
  },
)

test(
  'a failed worker may clean its stage without a phantom recovery claim',
  { skip: process.platform !== 'darwin' },
  () => {
    const dir = isolated({}, { xplat: { targets: { macos: { runtime: 'appkit-node-api' } } } })
    fakePackage(dir, 'vite', { bin: { vite: './run.mjs' } }, '')
    fakePackage(
      dir,
      '@octane-xplat/macos-build',
      { exports: { './worker': './run.mjs' } },
      `import{readFileSync,writeFileSync,rmSync}from'node:fs';const[i,o]=process.argv.slice(2);const r=JSON.parse(readFileSync(i));rmSync(r.stagingRoot,{recursive:true});writeFileSync(o,JSON.stringify({protocol:r.protocol,version:1,id:r.id,ok:false,error:{message:'fixture-package-failed'}}));process.exitCode=1`,
    )
    const result = run(dir, ['--targets', 'macos'])
    status(result, 1)
    assert.match(result.stderr, /fixture-package-failed/)
    assert.doesNotMatch(result.stderr, /cleanup not confirmed|staging identity changed/)
  },
)

test(
  'a worker-replaced stage is retained rather than deleting the replacement',
  { skip: process.platform !== 'darwin' },
  () => {
    const dir = isolated({}, { xplat: { targets: { macos: { runtime: 'appkit-node-api' } } } })
    fakePackage(dir, 'vite', { bin: { vite: './run.mjs' } }, '')
    fakePackage(
      dir,
      '@octane-xplat/macos-build',
      { exports: { './worker': './run.mjs' } },
      `import{readFileSync,writeFileSync,renameSync,mkdirSync}from'node:fs';import{join}from'node:path';const[i,o]=process.argv.slice(2);const r=JSON.parse(readFileSync(i));renameSync(r.stagingRoot,r.stagingRoot+'-moved');mkdirSync(r.stagingRoot);writeFileSync(join(r.stagingRoot,'replacement'),'preserve');writeFileSync(o,JSON.stringify({protocol:r.protocol,version:1,id:r.id,ok:true,data:{version:1}}))`,
    )
    const result = run(dir, ['--targets', 'macos'])
    status(result, 1)
    assert.match(result.stderr, /staging/)
    const release = join(dir, 'artifacts/macos-universal'),
      stage = readdirSync(release).find(
        (name) => name.startsWith('.xplat-macos-') && !name.endsWith('-moved'),
      )
    assert.equal(readFileSync(join(release, stage, 'replacement'), 'utf8'), 'preserve')
  },
)

test(
  'the macOS output lock excludes another builder and cancellation releases staging',
  { skip: process.platform !== 'darwin' },
  async () => {
    const dir = isolated({}, { xplat: { targets: { macos: { runtime: 'appkit-node-api' } } } })
    fakePackage(dir, 'vite', { bin: { vite: './run.mjs' } }, '')
    fakePackage(
      dir,
      '@octane-xplat/macos-build',
      { exports: { './worker': './run.mjs' } },
      `import{writeFileSync}from'node:fs';writeFileSync('macos-worker-ready','ready');setInterval(()=>{},1000)`,
    )
    const child = spawn(binary, ['build', '--targets', 'macos'], {
      cwd: dir,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    child.stdout.resume()
    child.stderr.resume()
    const exited = once(child, 'close')
    const timer = setTimeout(() => child.kill('SIGTERM'), 5000)
    try {
      for (let i = 0; i < 100 && !existsSync(join(dir, 'macos-worker-ready')); i++) {
        await new Promise((resolve) => setTimeout(resolve, 20))
      }

      assert.ok(existsSync(join(dir, 'macos-worker-ready')))
      const second = run(dir, ['--targets', 'macos'])
      status(second, 1)
      assert.match(second.stderr, /another Go project operation owns/)
      child.kill('SIGTERM')
      assert.deepEqual(await exited, [143, null])
      assert.equal(
        readdirSync(join(dir, 'artifacts/macos-universal')).some((name) =>
          name.startsWith('.xplat-macos-'),
        ),
        false,
      )
    } finally {
      clearTimeout(timer)
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGTERM')
      }

      await exited
    }
  },
)
