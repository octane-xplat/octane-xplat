import assert from 'node:assert/strict'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'

import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'
import { inspectLinuxPackageConfig } from '../dist/linux/config.js'
import { packageLinux } from '../dist/linux/package.js'
import { hasLinux, linuxRuntime } from '../dist/targets.js'
import { writeFakeGtkRuntime } from './linux-gtk-runtime-fixture.mjs'

function project(t) {
  const root = mkdtempSync(join(tmpdir(), 'xplat-linux-'))

  t.after(() => rmSync(root, { recursive: true, force: true }))

  const manifest = {
    version: '1.2.3',
    xplat: {
      targets: {
        linux: {
          runtime: 'gtk',
          host: { scheme: 'sample' },
          package: {
            applicationId: 'org.example.Sample',
            productName: 'Sample App',
            executableName: 'sample-app',
          },
        },
      },
    },
  }

  writeFileSync(join(root, 'package.json'), JSON.stringify(manifest))
  writeFileSync(join(root, 'vite.gtk.config.ts'), '')
  mkdirSync(join(root, 'node_modules/vite'), { recursive: true })
  writeFileSync(
    join(root, 'node_modules/vite/package.json'),
    JSON.stringify({ name: 'vite', bin: { vite: 'build.cjs' } }),
  )

  writeFileSync(
    join(root, 'node_modules/vite/build.cjs'),
    `const fs = require('fs'); const path = require('path'); const out = process.argv[process.argv.indexOf('--outDir') + 1]; fs.mkdirSync(out, {recursive:true}); fs.writeFileSync(path.join(out, 'app.js'), 'export const value = 42');`,
  )

  return { root, manifest }
}

function gtkProject(t) {
  const { root, manifest } = project(t)

  manifest.xplat.targets.linux.runtime = 'gtk'
  delete manifest.xplat.targets.linux.host
  writeFileSync(join(root, 'package.json'), JSON.stringify(manifest))
  writeFileSync(join(root, 'vite.gtk.config.ts'), '')
  writeFileSync(
    join(root, 'node_modules/vite/build.cjs'),
    `const fs = require('fs'); const path = require('path'); const out = process.argv[process.argv.indexOf('--outDir') + 1]; fs.mkdirSync(out, {recursive:true}); fs.writeFileSync(path.join(out, 'app.js'), 'export const app = 1'); fs.writeFileSync(path.join(out, '.xplat-gtk-runtime'), '1\\n');`,
  )

  return { root, manifest }
}

test('GTK archive ships desktop entry and install/uninstall; install→reinstall→uninstall keeps settings', async (t) => {
  const { root } = gtkProject(t)
  const { appDir } = await packageLinux(root)

  const relocated = join(root, 'relocated app')

  cpSync(appDir, relocated, { recursive: true })

  const dataHome = join(root, 'data home')
  const configHome = join(root, 'config home')
  const env = {
    ...process.env,
    XDG_DATA_HOME: dataHome,
    XDG_CONFIG_HOME: configHome,
  }

  const installed = join(dataHome, 'org.example.Sample')

  execFileSync('sh', [join(relocated, 'install.sh')], { env })
  assert.ok(existsSync(join(installed, 'app.js')))
  assert.ok(existsSync(join(dataHome, 'applications/org.example.Sample.desktop')))

  const desktop = readFileSync(join(dataHome, 'applications/org.example.Sample.desktop'), 'utf8')

  assert.match(desktop, /Exec="[^"]+data home\/org\.example\.Sample\/sample-app"/)

  // Settings a run wrote survive every later step.
  mkdirSync(join(configHome, 'org.example.Sample'), { recursive: true })
  writeFileSync(join(configHome, 'org.example.Sample/settings.ini'), '[settings]\nname=sAda\n')

  // Reinstall cleans the install dir but not the config dir.
  writeFileSync(join(installed, 'stale.txt'), 'removed between versions')
  execFileSync('sh', [join(relocated, 'install.sh')], { env })
  assert.ok(!existsSync(join(installed, 'stale.txt')))
  assert.ok(existsSync(join(installed, 'app.js')))
  assert.equal(
    readFileSync(join(configHome, 'org.example.Sample/settings.ini'), 'utf8'),
    '[settings]\nname=sAda\n',
  )

  execFileSync('sh', [join(relocated, 'uninstall.sh')], { env })
  assert.ok(!existsSync(installed))
  assert.ok(!existsSync(join(dataHome, 'applications/org.example.Sample.desktop')))
  assert.equal(
    readFileSync(join(configHome, 'org.example.Sample/settings.ini'), 'utf8'),
    '[settings]\nname=sAda\n',
  )
})

test('Linux packaging rejects invalid identities, injection and config traversal before building', () => {
  const t = { after: () => {} }
  const { root, manifest } = project(t)

  try {
    manifest.xplat.targets.linux.package = {
      applicationId: 'bad',
      productName: 'Name\nExec=bad',
      executableName: '../bad',
      viteConfig: '../outside.ts',
    }

    manifest.xplat.targets.linux.host.scheme = 'https'
    writeFileSync(join(root, 'package.json'), JSON.stringify(manifest))

    const config = inspectLinuxPackageConfig(root)

    assert.equal(config.issues.length, 5)
    assert.ok(!existsSync(join(root, 'dist')))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('failed frontend build preserves previously packaged app', async (t) => {
  const { root } = project(t)
  const result = await packageLinux(root)

  writeFileSync(join(result.appDir, 'keep.txt'), 'previous app')
  writeFileSync(join(root, 'node_modules/vite/build.cjs'), 'process.exit(1)')
  await assert.rejects(packageLinux(root))
  assert.equal(readFileSync(join(result.appDir, 'keep.txt'), 'utf8'), 'previous app')
})

test('linux target detection accepts gtk and rejects retired or unknown runtimes', (t) => {
  const { root, manifest } = gtkProject(t)

  assert.equal(linuxRuntime(root), 'gtk')
  assert.ok(hasLinux(root))

  manifest.xplat.targets.linux.runtime = 'webkitgtk'
  writeFileSync(join(root, 'package.json'), JSON.stringify(manifest))
  assert.equal(linuxRuntime(root), null)
  assert.ok(!hasLinux(root))
  assert.match(
    inspectLinuxPackageConfig(root).issues.join('; '),
    /desktop WebView hosting has been removed/,
  )

  manifest.xplat.targets.linux.runtime = 'qt'
  writeFileSync(join(root, 'package.json'), JSON.stringify(manifest))
  assert.equal(linuxRuntime(root), null)
  assert.ok(!hasLinux(root))
})

test('GTK config needs no URI scheme and defaults to vite.gtk.config.ts', async (t) => {
  const { root } = gtkProject(t)
  const config = inspectLinuxPackageConfig(root)

  assert.deepEqual(config.issues, [])
  assert.equal(config.runtime, 'gtk')
  assert.equal(config.viteConfig, join(root, 'vite.gtk.config.ts'))
})

test('GTK config still validates a declared URI scheme', async (t) => {
  const { root, manifest } = gtkProject(t)

  manifest.xplat.targets.linux.host = { scheme: 'HTTPS' }
  writeFileSync(join(root, 'package.json'), JSON.stringify(manifest))

  const config = inspectLinuxPackageConfig(root)

  assert.equal(config.issues.length, 1)
  assert.match(config.issues[0], /linux\.host\.scheme/)
})

test('GTK packaging uses the installed NativeScript payload pair', async (t) => {
  const { root } = gtkProject(t)
  const rendererPackage = join(root, 'node_modules/@octane-xplat/linux-gtk')
  const payloads = join(rendererPackage, 'platforms/linux/runtime')
  for (const architecture of ['x86_64', 'aarch64']) {
    writeFakeGtkRuntime(join(payloads, architecture), architecture)
  }
  writeFileSync(
    join(rendererPackage, 'package.json'),
    JSON.stringify({
      name: '@octane-xplat/linux-gtk',
      exports: { './package.json': './package.json' },
    }),
  )
  const { appDir, archive } = await packageLinux(root)

  assert.ok(existsSync(archive))
  assert.ok(existsSync(join(appDir, 'app.js')))
  assert.deepEqual(JSON.parse(readFileSync(join(appDir, 'app.json'), 'utf8')), {
    applicationId: 'org.example.Sample',
    productName: 'Sample App',
    version: '1.2.3',
  })

  const launcher = readFileSync(join(appDir, 'sample-app'), 'utf8')

  assert.match(launcher, /exec "\$RUNTIME\/ns-linux"/)
  execFileSync('sh', ['-n', join(appDir, 'sample-app')])

  const listing = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' })

  assert.ok(listing.includes('sample-app/app.js'))
  assert.ok(listing.includes('sample-app/sample-app'))
  assert.ok(listing.includes('sample-app/org.example.Sample.desktop'))
  assert.ok(listing.includes('sample-app/install.sh'))
  assert.ok(listing.includes('sample-app/uninstall.sh'))
  assert.ok(listing.includes('sample-app/runtime/x86_64/ns-linux'))
  assert.ok(listing.includes('sample-app/runtime/aarch64/ns-linux'))
  assert.ok(!existsSync(join(appDir, 'bundle')))
  assert.ok(!existsSync(join(appDir, 'host')))

  const desktop = readFileSync(join(appDir, 'org.example.Sample.desktop'), 'utf8')

  assert.ok(desktop.includes(`Exec=sample-app\n`))
  assert.ok(desktop.includes('StartupWMClass=org.example.Sample'))
  assert.ok(!desktop.includes('MimeType'))
})

test('GTK packaging requires the installed runtime payloads', async (t) => {
  const { root } = gtkProject(t)
  await assert.rejects(packageLinux(root), /requires the NativeScript runtime payloads/)
})

test('GTK packaging rejects a build that emits no single ESM bundle', async (t) => {
  const { root } = gtkProject(t)

  writeFileSync(
    join(root, 'node_modules/vite/build.cjs'),
    `const fs = require('fs'); const path = require('path'); const out = process.argv[process.argv.indexOf('--outDir') + 1]; fs.mkdirSync(out, {recursive:true}); fs.writeFileSync(path.join(out, 'a.js'), ''); fs.writeFileSync(path.join(out, 'b.js'), '');`,
  )

  const runtime = writeFakeGtkRuntime(join(root, 'payload'))
  await assert.rejects(packageLinux(root, { gtkRuntimeRoot: runtime }), /exactly one ESM bundle/)
})
