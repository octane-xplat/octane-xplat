import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const app = resolve(import.meta.dirname, '../..')
const repo = resolve(app, '../..')
const work = mkdtempSync(join(tmpdir(), 'xplat-windows-core-'))
const packs = join(work, 'packs')
const consumer = join(work, 'consumer')
const native = process.argv.includes('--native')
const isWindows = process.platform === 'win32'
assert.ok(!native || isWindows, 'Native qualification requires a signed-in Windows desktop')
console.log('Windows Core consumer:', consumer)

function run(command: string, args: string[], cwd = consumer) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    timeout: 300_000,
  })
  assert.ifError(result.error)
  assert.equal(result.status, 0, `${command} ${args.join(' ')} failed`)
}

mkdirSync(packs)
mkdirSync(join(consumer, 'src'), { recursive: true })
const packed: Record<string, string> = {}
for (const name of ['build', 'lib', 'jsx', 'nativescript-octane', 'vite-octane']) {
  const dir = join(repo, 'packages', name)
  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  run('bun', ['pm', 'pack', '--ignore-scripts', '--destination', packs], dir)
  const archive = `${manifest.name.slice(1).replace('/', '-')}-${manifest.version}.tgz`
  packed[manifest.name] = 'file:../packs/' + archive
}

const manifest = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'))
const workspace = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8'))
const pins = {
  ...Object.fromEntries(
    ['@nativescript/core', '@nativescript/font-manager', '@octane-xplat/nativescript-masonkit'].map(
      (name) => [name, manifest.dependencies[name]],
    ),
  ),
  ...Object.fromEntries(
    ['@nativescript/vite', '@nativescript/windows', 'nativescript'].map((name) => [
      name,
      manifest.devDependencies[name],
    ]),
  ),
  ...Object.fromEntries(
    [
      'octane',
      '@octanejs/vite-plugin',
      '@tsrx/oxc',
      'typescript',
      'typescript-classic',
      'vite',
    ].map((name) => [name, workspace.workspaces.catalog[name]]),
  ),
}
const patchedDependencies: Record<string, string> = {}
for (const [specifier, path] of Object.entries<string>(workspace.patchedDependencies)) {
  const separator = specifier.indexOf('@', 1)
  const name = specifier.slice(0, separator)
  const version = specifier.slice(separator + 1)
  if (version !== pins[name] && !(version === '*' && name in pins)) {
    continue
  }
  const filename = path.split('/').at(-1)!
  mkdirSync(join(consumer, 'patches'), { recursive: true })
  cpSync(join(repo, path), join(consumer, 'patches', filename))
  patchedDependencies[specifier] = 'patches/' + filename
}
const id = 'org.octanexplat.core' + Date.now()
const dependencies = Object.fromEntries(
  [
    '@nativescript/core',
    '@nativescript/font-manager',
    '@octane-xplat/nativescript-masonkit',
    '@octane-xplat/nativescript-octane',
    'octane',
  ].map((name) => [name, { ...pins, ...packed }[name]]),
)
const devDependencies = Object.fromEntries(
  Object.entries({ ...pins, ...packed }).filter(([name]) => !(name in dependencies)),
)
writeFileSync(
  join(consumer, 'package.json'),
  JSON.stringify({
    name: 'windows-core-consumer',
    private: true,
    main: 'src/index.ts',
    dependencies,
    devDependencies,
    overrides: packed,
    patchedDependencies,
    trustedDependencies: ['nativescript'],
  }),
)
writeFileSync(join(consumer, 'bunfig.toml'), '[install]\nlinker = "isolated"\n')
writeFileSync(
  join(consumer, 'nativescript.config.ts'),
  `export default {
    id: ${JSON.stringify(id)},
    appPath: 'src',
    appResourcesPath: 'App_Resources',
    bundler: 'vite',
    bundlerConfigPath: 'vite.config.mts',
    cli: { packageManager: 'bun' },
  }\n`,
)
for (const file of ['index.ts', 'Control.tsrx', 'Control.windows.tsrx']) {
  cpSync(join(import.meta.dirname, file), join(consumer, 'src', file))
}
cpSync(join(import.meta.dirname, 'vite.config.mts'), join(consumer, 'vite.config.mts'))
if (native) {
  cpSync(join(app, 'App_Resources'), join(consumer, 'App_Resources'), { recursive: true })
}
run('bun', ['install'])

const require = createRequire(join(consumer, 'package.json'))
if (native) {
  const ns = require.resolve('nativescript/bin/ns')
  try {
    run(process.execPath, [ns, 'build', 'windows'])
    const failures: unknown[] = []
    for (const hot of [false, true]) {
      try {
        await exercise(ns, hot)
      } catch (error) {
        failures.push(error)
      }
    }
    if (failures.length > 0) {
      throw new AggregateError(failures, 'Installed Windows Core launch checks failed')
    }
  } finally {
    run('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `Get-AppxPackage -Name '${id}' | Remove-AppxPackage -ErrorAction Stop`,
    ])
  }
} else {
  const vite = join(require.resolve('vite/package.json'), '../bin/vite.js')
  run(process.execPath, [
    vite,
    'build',
    '--mode=production',
    '--',
    '--env.windows',
    '--env.appPath=src',
  ])
  const dist = join(consumer, '.ns-vite-build')
  const js = readdirSync(dist, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.mjs') || file.endsWith('.js'))
    .map((file) => readFileSync(join(dist, file), 'utf8'))
    .join('\n')
  assert.ok(js.includes('WINDOWS_CORE_PASS') && js.includes('Microsoft.UI.Xaml'))
  assert.ok(js.includes('initial:'), 'Windows component did not replace the unsuffixed import')
  await verifyDevServer(vite)
}
rmSync(work, { recursive: true, force: true, maxRetries: 3 })

async function verifyDevServer(vite: string) {
  const listener = createServer()
  await new Promise<void>((resolve, reject) => {
    listener.once('error', reject)
    listener.listen(0, '127.0.0.1', resolve)
  })
  const address = listener.address()
  assert.ok(address && typeof address !== 'string')
  await new Promise<void>((resolve) => listener.close(() => resolve()))

  const server = spawn(
    process.execPath,
    [vite, 'serve', '--mode=development', '--', '--env.windows', '--env.appPath=src', '--env.hmr'],
    {
      cwd: consumer,
      env: { ...process.env, NS_HMR_PORT: String(address.port) },
      stdio: 'inherit',
    },
  )
  const stopped = new Promise((done) => server.once('close', done))
  const origin = `http://127.0.0.1:${address.port}`
  const deadline = Date.now() + 90_000
  async function fetchModule(path: string) {
    while (server.exitCode === null && Date.now() < deadline) {
      const result = await fetch(origin + path, { signal: AbortSignal.timeout(3000) }).catch(
        () => null,
      )
      if (result?.ok) {
        return result.text()
      }
      await delay(250)
    }
    throw new Error(`Windows Vite did not serve ${path}`)
  }
  try {
    const entry = await fetchModule('/ns/m/src/index.ts')
    assert.ok(entry.includes('/ns/m/src/Control.windows.tsrx'))
    assert.ok(entry.includes(origin + '/ns/core/ui/button'))
    const component = await fetchModule('/ns/m/src/Control.windows.tsrx')
    assert.ok(component.includes('hmrUniversalComponent') && component.includes('.accept('))
    const sharedComponent = realpathSync(join(consumer, 'src/Control.tsrx')).replaceAll('\\', '/')
    const fsPrefix = sharedComponent.startsWith('/') ? '/@fs' : '/@fs/'
    const shared = await fetchModule('/ns/m' + fsPrefix + sharedComponent + '?import')
    assert.match(shared, /export const initialInput = ['"]Editable['"]/)
    const button = await fetchModule('/ns/core/ui/button')
    assert.ok(button.includes('export const Button'))
    const strategy = await fetchModule(
      '/ns/m/node_modules/@octane-xplat/vite-octane/dist/client/strategy.js',
    )
    assert.ok(
      strategy.includes(origin + '/ns/m/node_modules/@nativescript/vite/hmr/client/framework.js'),
    )
    const octaneRuntime = await fetchModule('/ns/m/node_modules/octane/dist/runtime.js')
    assert.ok(
      octaneRuntime.includes(
        '/ns/m/node_modules/octane/dist/signals/action-capability-elsewhere.js',
      ),
    )
    assert.ok(!octaneRuntime.includes('#octane/dist/signal-actions/renderer'))

    const source = join(consumer, 'src/Control.windows.tsrx')
    writeFileSync(source, readFileSync(source, 'utf8').replace('initial:', 'updated:'))
    let updated = false
    const editDeadline = Date.now() + 10_000
    while (!updated && Date.now() < editDeadline) {
      updated = (await fetchModule('/ns/m/src/Control.windows.tsrx')).includes('updated:')
      if (!updated) {
        await delay(100)
      }
    }
    assert.ok(updated, 'Windows Vite kept serving the pre-edit Octane module')
  } finally {
    server.kill()
    await stopped
  }
}

async function exercise(ns: string, hot: boolean) {
  const flags = hot ? [] : ['--no-hmr', '--no-watch']
  const child = spawn(process.execPath, [ns, 'run', 'windows', ...flags], {
    cwd: consumer,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stdout.on('data', (data) => {
    output += data.toString()
    process.stdout.write(data)
  })
  child.stderr.pipe(process.stderr)
  const stopped = new Promise((done) => child.once('close', done))
  const deadline = Date.now() + 5 * 60_000
  async function waitFor(marker: string) {
    while (!output.includes(marker) && child.exitCode === null && Date.now() < deadline) {
      assert.ok(
        !output.includes('WINDOWS_CORE_FAIL') &&
          !output.includes('Uncaught error evaluating module') &&
          !output.includes('deterministic dev session bootstrap failed'),
        output,
      )
      await delay(200)
    }
    assert.ok(output.includes(marker), `Missing ${marker}`)
  }
  try {
    await waitFor('WINDOWS_CORE_READY')
    if (hot) {
      const component = join(consumer, 'src/Control.windows.tsrx')
      const code = readFileSync(component, 'utf8')
      writeFileSync(component, code.replace('initial:', 'updated:'))
      await waitFor('WINDOWS_CORE_HOT')
    }
    await waitFor('WINDOWS_CORE_PASS')
  } finally {
    if (child.pid && child.exitCode === null) {
      spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
    }
    await stopped
  }
}
