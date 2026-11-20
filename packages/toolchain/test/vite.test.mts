import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { build, createServer } from 'vite'
import { defineConfig } from '../vite.js'

test('app config installs the web pipeline, preserves app options and transforms source', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'xplat-app-config-'))
  const originalNodeEnv = process.env.NODE_ENV
  t.after(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = originalNodeEnv
    }
  })
  t.after(() => rmSync(root, { recursive: true, force: true }))
  // Use the installed workspace runtime while keeping the fixture's source in root.
  mkdirSync(join(root, 'node_modules'))
  symlinkSync(
    realpathSync(new URL('../node_modules/octane', import.meta.url)),
    join(root, 'node_modules/octane'),
    'junction',
  )
  symlinkSync(new URL('..', import.meta.url), join(root, 'node_modules/octane-xplat'), 'junction')
  writeFileSync(
    join(root, 'package.json'),
    '{"type":"module","dependencies":{"octane":"*","octane-xplat":"*"}}',
  )
  writeFileSync(
    join(root, 'index.html'),
    '<div id="root"></div><script type="module" src="/main.web.tsrx"></script>',
  )
  writeFileSync(
    join(root, 'main.web.tsrx'),
    `import { createRoot } from 'octane'
import { useTweak } from 'octane-xplat/tweaks'
import './style.css'
function App() @{
  const label = useTweak('Framework defaults ready')
  return <h1>{label}</h1>
}
createRoot(document.getElementById('root')!).render(<App />)
`,
  )
  writeFileSync(join(root, 'style.css'), 'h1 { color: red }')
  writeFileSync(
    join(root, 'style.web.css'),
    '@platform web { h1 { color: green } } @platform ios { h1 { color: blue } }',
  )
  let resolved
  const app = defineConfig(async (env) => ({
    root,
    configFile: false,
    logLevel: 'silent',
    server: { port: 0, middlewareMode: true },
    resolve: { alias: { 'app-alias': '/app-owned' } },
    define: { __APP_MODE__: JSON.stringify(env.mode) },
    css: {
      postcss: {
        plugins: [
          {
            postcssPlugin: 'app-postcss',
            Declaration(decl) {
              if (decl.value === 'green') {
                decl.value = 'purple'
              }
            },
          },
        ],
      },
    },
    plugins: [
      {
        name: 'app-observer',
        configResolved(config) {
          resolved = config
        },
      },
    ],
  }))

  const server = await createServer(await app({ command: 'serve', mode: 'development' }))
  try {
    assert.equal(resolved.server.port, 0)
    assert.equal(
      resolved.resolve.alias.find((entry) => entry.find === 'app-alias').replacement,
      '/app-owned',
    )
    assert.equal(resolved.define.__APP_MODE__, '"development"')
    const names = resolved.plugins.map((plugin) => plugin.name)
    for (const name of ['xplat-platform-css', 'xplat-platform-boundary', 'xplat-dev-bridge']) {
      assert.equal(names.filter((entry) => entry === name).length, 1, name)
    }
    const source = await server.transformRequest('/main.web.tsrx')
    assert.match(source.code, /Framework defaults ready['"]\s*,\s*['"][^'"]*#[^'"]+['"]/)
    const style = await server.transformRequest('/style.css')
    assert.match(style.code, /purple/)
    assert.doesNotMatch(style.code, /blue|red|@platform/)
  } finally {
    await server.close()
  }

  // Vite's dev server sets NODE_ENV in this process; production builds normally
  // run in a separate CLI process. Restore that production environment here.
  process.env.NODE_ENV = 'production'
  const output = await build({
    ...(await app({ command: 'build', mode: 'production' })),
    build: { write: false, minify: false },
  })
  const files = [output].flat().flatMap((bundle) => bundle.output)
  const code = files
    .filter((file) => file.type === 'chunk')
    .map((file) => file.code)
    .join('\n')
  assert.match(code, /Framework defaults ready/)
  assert.ok(
    !/useTweak|openDevChannel|__XPLAT_DEV_BRIDGE__/.test(code),
    'production output must strip tweaks and the development bridge',
  )
  assert.match(files.find((file) => file.fileName.endsWith('.css')).source, /purple/)

  writeFileSync(join(root, 'foreign.ios.ts'), 'export const foreign = 1')
  writeFileSync(
    join(root, 'main.web.tsrx'),
    'import { foreign } from "./foreign.ios.ts"; console.log(foreign)',
  )
  await assert.rejects(
    build({
      ...(await app({ command: 'build', mode: 'production' })),
      build: { write: false },
    }),
    /foreign tag|\.ios module|foreign\.ios/,
  )
})

test('config accepts a promise and fails clearly for host-specific desktop targets', async (t) => {
  const original = process.env.XPLAT_TARGET
  t.after(() => {
    if (original === undefined) {
      delete process.env.XPLAT_TARGET
    } else {
      process.env.XPLAT_TARGET = original
    }
  })
  delete process.env.XPLAT_TARGET
  const config = await defineConfig(Promise.resolve({ base: '/app/' }))({
    command: 'build',
    mode: 'production',
  })
  assert.equal(config.base, '/app/')
  process.env.XPLAT_TARGET = 'macos'
  await assert.rejects(
    defineConfig({})({ command: 'build', mode: 'production' }),
    /host-specific Vite preset/,
  )
})

test('the web preset pins the transform tsconfig while env program references dangle', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'xplat-tsconfig-pin-'))
  const original = process.env.XPLAT_TARGET
  t.after(() => {
    if (original === undefined) {
      delete process.env.XPLAT_TARGET
    } else {
      process.env.XPLAT_TARGET = original
    }
    rmSync(root, { recursive: true, force: true })
  })
  delete process.env.XPLAT_TARGET

  const manifest = join(root, 'tsconfig.envs.json')
  const generated = join(root, 'xplat-typecheck/web.json')

  writeFileSync(
    join(root, 'tsconfig.json'),
    JSON.stringify({ references: [{ path: './xplat-typecheck/web.json' }] }),
  )
  writeFileSync(
    manifest,
    '{"extends":"./tsconfig.json","environments":{"web":{"include":["src/**/*.ts"]}}}',
  )

  const app = defineConfig({ root })
  const env = { command: 'build', mode: 'production' }

  // Ungenerated checkout: pin the committed env manifest so plain-source
  // transforms never follow the dangling reference.
  assert.equal((await app(env)).tsconfig, manifest)

  // An explicit app tsconfig always wins over the pin.
  assert.equal((await defineConfig({ root, tsconfig: 'app.json' })(env)).tsconfig, 'app.json')

  // Generated programs restore ordinary references discovery.
  mkdirSync(dirname(generated), { recursive: true })
  writeFileSync(generated, '{}')
  assert.equal((await app(env)).tsconfig, undefined)

  // No env manifest — nothing safe to pin.
  rmSync(generated)
  rmSync(manifest)
  assert.equal((await app(env)).tsconfig, undefined)
})

test('the same app config selects matching native compiler, CSS and resolution defaults', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'xplat-native-app-config-'))
  const previous = {
    cwd: process.cwd(),
    target: process.env.XPLAT_TARGET,
    bundler: process.env.NATIVESCRIPT_BUNDLER_ENV,
    vendor: process.env.NS_VENDOR_EXCLUDE,
  }
  t.after(() => {
    process.chdir(previous.cwd)
    for (const [key, value] of Object.entries({
      XPLAT_TARGET: previous.target,
      NATIVESCRIPT_BUNDLER_ENV: previous.bundler,
      NS_VENDOR_EXCLUDE: previous.vendor,
    })) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
    rmSync(root, { recursive: true, force: true })
  })
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({
      type: 'module',
      dependencies: { '@octane-xplat/nativescript-mason-core': '*' },
    }),
  )
  function pkg(name, manifest, source) {
    const dir = join(root, 'node_modules', name)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, type: 'module', ...manifest }))
    writeFileSync(join(dir, 'index.js'), source)
  }
  // Stub only the compiler/renderer boundary; run the real shared native preset.
  pkg(
    '@octane-xplat/vite-octane',
    { main: 'index.js' },
    'export const octaneConfig = () => ({ plugins: [{ name: "fixture-native-compiler" }] })',
  )
  pkg(
    '@octane-xplat/nativescript-octane',
    { exports: { './config': './index.js' } },
    'export const nativeScriptRenderer = {}',
  )
  pkg('@octane-xplat/nativescript-mason-core', { main: 'index.js' }, 'export {}')
  const require = createRequire(import.meta.url)
  symlinkSync(
    dirname(require.resolve('vite/package.json')),
    join(root, 'node_modules/vite'),
    'junction',
  )
  process.chdir(root)
  delete process.env.NATIVESCRIPT_BUNDLER_ENV
  const app = defineConfig({ define: { __APP__: 'true' }, plugins: [{ name: 'app-plugin' }] })
  for (const platform of ['ios', 'android']) {
    process.env.XPLAT_TARGET = platform
    const config = await app({ command: 'build', mode: 'production' })
    const plugins = config.plugins.flat(Infinity).filter(Boolean)
    assert.equal(
      plugins.find((plugin) => plugin.name === 'xplat-platform-css').api.platform,
      platform,
    )
    assert.equal(plugins.filter((plugin) => plugin.name === 'xplat-platform-boundary').length, 1)
    assert.ok(plugins.some((plugin) => plugin.name === 'fixture-native-compiler'))
    assert.ok(plugins.some((plugin) => plugin.name === 'app-plugin'))
    assert.equal(config.define.__APP__, 'true')
    assert.equal(config.resolve.extensions[0], `.${platform}.tsrx`)
    assert.deepEqual(config.resolve.conditions, ['native'])
    assert.equal(
      config.resolve.alias.find((entry) => entry.find.test('octane')).replacement,
      'octane/universal/native',
    )
  }
})
