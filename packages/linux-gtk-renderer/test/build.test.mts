import { runGtkEvalFixture } from './gjs-ui-fixture.mjs'
// Build-level smoke: the linuxGtk helper must produce one ESM bundle
// that keeps `gi://` imports external and never references DOM APIs. This
// proves bundling and compilation only. The proxy fixture additionally
// queries real native widget order when GJS is available, without a window.
import assert from 'node:assert/strict'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import test from 'node:test'
import { build } from 'vite'
// Source import — the published export is '@octane-xplat/cli/linux-gtk/vite'
// (built dist); the test must not depend on the cli package's build state.
import { linuxGtk } from '../../cli/src/linux-gtk/vite.ts'
import { gtkRuntimeReady, gtkRuntimeUnavailableReason } from './gjs-availability.mjs'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { statSync } from 'node:fs'

const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url))
const pkg = fileURLToPath(new URL('..', import.meta.url))
const outDir = join(fixture, 'dist')

test('linuxGtk compiles the fixture app into a single ESM bundle', async () => {
  rmSync(outDir, { recursive: true, force: true })

  await build({
    configFile: join(fixture, 'vite.config.mjs'),
    logLevel: 'error',
  })

  const bundle = join(outDir, 'app.js')

  assert.ok(existsSync(bundle), `expected bundle at ${bundle}`)

  const code = readFileSync(bundle, 'utf8')

  // GI imports stay external — the platform provides them at load time.
  assert.match(code, /from\s+['"]gi:\/\/Gtk\?version=4\.0['"]/)

  // The universal runtime drives the bundle — no DOM entry points.
  assert.doesNotMatch(code, /document\.createElement|window\.document|navigator\.userAgent/)
  assert.match(code, /universalPlan/)

  // The GTK host and driver made it in.
  assert.match(code, /createGtkRoot|gtk/)
}, 120000)

test('the gtk boundary rejects a .linux leaf reachable in the bundle', async () => {
  rmSync(outDir, { recursive: true, force: true })

  // .linux files serve the WebKitGTK runtime — DOM assumptions must never
  // ride into the native GTK graph.
  await assert.rejects(
    build({
      logLevel: 'silent',
      ...(await linuxGtk('production', {
        root: fixture,
        entry: 'src/leak-main.ts',
        outDir,
      })),
    }),
    /xplat boundary — a \.linux module is reachable in the gtk bundle/,
  )
}, 120000)

test('canonical routing selects GTK panes without NativeScript Frame or modal hosts', async () => {
  const guide = readFileSync(
    new URL('../../../docs/platform/linux-gtk.md', import.meta.url),
    'utf8',
  )

  const example = guide.split('## Add retained route panes')[1]?.match(/```tsx\n([\s\S]*?)```/)

  assert.ok(example, 'the public GTK pane example exists')
  assert.equal(
    example[1].trim(),
    readFileSync(join(fixture, 'src/routing.gtk.tsx'), 'utf8').trim(),
    'the maintained routing fixture executes the public example',
  )

  const modules = []

  await build({
    configFile: join(fixture, 'vite.routing.config.mjs'),
    logLevel: 'error',
    plugins: [
      {
        name: 'collect-routing-platform-modules',
        buildEnd() {
          modules.push(...this.getModuleIds())
        },
      },
    ],
  })

  const code = readFileSync(join(outDir, 'routing/app.js'), 'utf8')

  assert.match(code, /GTK_ROUTING_OK/)
  assert.match(code, /from\s+['"]gi:\/\/Gtk\?version=4\.0['"]/)
  assert.ok(modules.some((id) => id.includes('/default-router.gtk.ts')))
  assert.ok(modules.some((id) => id.includes('/RoutePane.gtk.tsrx')))
  assert.ok(
    modules.every(
      (id) =>
        !/\/ui\/src\/(?:native-router-host|native-modal-router-host|default-router|stacks|back-interceptors)\.ts$/.test(
          id,
        ),
    ),
    'GTK routing must not import the NativeScript client integration',
  )

  assert.doesNotMatch(code, /document\.createElement|window\.document/)
}, 120000)

test('the proxy ordering fixture builds and exercises real GTK when available', async (t) => {
  let result
  if (process.env.LINUX_RUNTIME_EVAL_ENGINE) {
    const evaluated = await runGtkEvalFixture(t, {
      stem: 'proxy-order',
      entry: 'src/proxy-order.ts',
      marker: 'GTK_PROXY_ORDER',
      minChecks: 0,
    })
    result = evaluated.fixture
  } else {
    const proxyOut = join(fixture, 'dist', 'proxy-order')

    await build({
      logLevel: 'error',
      ...(await linuxGtk('production', {
        root: fixture,
        entry: 'src/proxy-order.ts',
        outDir: proxyOut,
      })),
    })

    const bundle = join(proxyOut, 'app.js')

    assert.ok(existsSync(bundle), 'the real driver fixture was bundled')

    let gjsVersion

    try {
      gjsVersion = execFileSync('gjs', ['--version'], { encoding: 'utf8' }).trim()
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }

      t.diagnostic(
        'Build evidence only: gjs is unavailable; native proxy ordering was not exercised',
      )
      return
    }

    if (!gtkRuntimeReady()) {
      t.diagnostic(
        `Build evidence only: ${gtkRuntimeUnavailableReason()}; native proxy ordering was not exercised`,
      )
      return
    }

    const env = { ...process.env }

    if (process.platform === 'darwin') {
      const prefix = execFileSync('brew', ['--prefix'], { encoding: 'utf8' }).trim()

      env.DYLD_FALLBACK_LIBRARY_PATH = [join(prefix, 'lib'), env.DYLD_FALLBACK_LIBRARY_PATH]
        .filter(Boolean)
        .join(':')
    }

    const output = execFileSync('gjs', ['-m', bundle], {
      env,
      encoding: 'utf8',
      timeout: 15000,
    })

    const marker = output.split('\n').find((line) => line.startsWith('GTK_PROXY_ORDER '))

    assert.ok(marker, `native fixture result missing: ${output}`)

    result = JSON.parse(marker.slice('GTK_PROXY_ORDER '.length))

    t.diagnostic(`${process.platform}; ${gjsVersion}; GTK ${result.gtk}; no window or input`)
  }
  assert.deepEqual(result.initial, ['A', 'C'], 'setup mounted the surrounding native siblings')
  assert.deepEqual(result.proxyChild, ['B'], 'the logical proxy owns the inserted child')
  await t.test('inserting into a mounted proxy preserves surrounding native sibling order', () => {
    assert.deepEqual(result.actual, ['A', 'B', 'C'])
    assert.deepEqual(result.nestedBefore, ['A', 'E', 'D', 'B', 'C'])
    assert.deepEqual(result.removedChild, ['A', 'E', 'B', 'C'])
    assert.deepEqual(result.movedProxy, ['A', 'C', 'E', 'B'])
    assert.deepEqual(result.removedProxy, ['A', 'C'])
    assert.deepEqual(result.reinsertedProxy, ['A', 'E', 'B', 'C'])
  })
}, 120000)

test('the preset emits the prebuilt Mason binding for both architectures', async () => {
  rmSync(outDir, { recursive: true, force: true })

  await build({
    configFile: join(fixture, 'vite.config.mjs'),
    logLevel: 'error',
  })

  // Every bundle carries the binding — the renderer resolves
  // <bundle dir>/xplatmason/<uname -m>/ at startup.
  for (const arch of ['x86_64', 'aarch64']) {
    for (const name of ['libxplatmason-gtk.so', 'XplatMason-1.0.typelib']) {
      const file = join(outDir, 'xplatmason', arch, name)

      assert.ok(existsSync(file), `expected emitted asset ${file}`)

      // The emitted asset must be the shipped bytes — emitFile's `source`
      // is content, not a path.
      const shipped = join(pkg, 'platforms', 'linux', 'prebuilt', arch, name)

      assert.equal(
        createHash('sha256').update(readFileSync(file)).digest('hex'),
        createHash('sha256').update(readFileSync(shipped)).digest('hex'),
        `${arch}/${name} emitted content differs from platforms/linux/prebuilt`,
      )
    }

    const lib = join(outDir, 'xplatmason', arch, 'libxplatmason-gtk.so')

    assert.equal(statSync(lib).mode & 0o777, 0o755, `${arch} .so keeps executable mode`)
  }
}, 120000)

test('a bundle without the Mason binding fails at startup', async (t) => {
  if (process.env.LINUX_RUNTIME_EVAL_ENGINE) {
    return runGtkEvalFixture(t, {
      stem: 'missing-mason',
      entry: 'src/root-teardown-main.ts',
      marker: 'GTK_ROOT_TEARDOWN',
      minChecks: 2,
      missingMason: true,
    })
  }

  // Needs a working GTK runtime; the stripped env removes the bundled
  // binding, so readiness here means the baseline environment works.
  if (!gtkRuntimeReady()) {
    t.skip(gtkRuntimeUnavailableReason())
    return
  }

  const failDir = join(fixture, 'dist-mason-missing')

  rmSync(failDir, { recursive: true, force: true })

  await build({
    logLevel: 'error',
    ...(await linuxGtk('production', {
      root: fixture,
      entry: 'src/root-teardown-main.ts',
      outDir: failDir,
    })),
  })

  // Removing the emitted binding must not fall back to another layout —
  // createGtkRoot throws the required-Mason diagnostic.
  rmSync(join(failDir, 'xplatmason'), { recursive: true, force: true })

  const env = { ...process.env }

  delete env.XPLAT_MASON_TYPELIB
  delete env.GI_TYPELIB_PATH

  const result = spawnSync('gjs', ['-m', join(failDir, 'app.js')], {
    env,
    encoding: 'utf8',
    timeout: 30000,
  })

  assert.notEqual(
    result.status,
    0,
    `expected startup failure:
${result.stdout}`,
  )
  assert.match(
    result.stderr,
    /XplatMason layout engine is required/,
    `stderr should name the missing binding:
${result.stderr}`,
  )

  rmSync(failDir, { recursive: true, force: true })
}, 120000)

test.after(() => {
  rmSync(outDir, { recursive: true, force: true })
})
