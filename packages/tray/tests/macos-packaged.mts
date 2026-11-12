// Real packaged-app check: pack @octane-xplat/tray, install the tarball into a
// fresh consumer app, package it with the real macOS packager (package-worker
// protocol used by tools/cli-go/macos-build-consumer.mts), launch the .app and
// verify created/updated/removed markers plus out-of-process System Events.
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs'

import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const scratch = mkdtempSync(join(tmpdir(), 'xplat-tray-packaged-'))
const appDir = join(scratch, 'app')
const packs = join(scratch, 'packs')

mkdirSync(appDir, { recursive: true })
mkdirSync(packs, { recursive: true })

const run = (command, args, cwd = appDir, extra = {}) => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    timeout: 900_000,
    maxBuffer: 16 * 1024 * 1024,
    env: {
      ...process.env,
      MACOS_SIGNING_IDENTITY: '',
      MACOS_NOTARY_PROFILE: '',
      XPLAT_MACOS_SKIP_SIGNING: '0',
      ...extra,
    },
  })

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed (${result.status}):\n${result.stdout}${result.stderr}`,
    )
  }

  return result.stdout + result.stderr
}

const pack = (pkgDir) => {
  const manifest = JSON.parse(readFileSync(join(root, pkgDir, 'package.json')))

  run('bun', ['pm', 'pack', '--ignore-scripts', '--destination', packs], join(root, pkgDir))
  return join(packs, `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`)
}

let appProcess = null

try {
  const trayPack = pack('packages/tray')
  // The packager worker must come from a tarball too (it is not published).
  const workerPack = pack('packages/macos-build')

  writeFileSync(
    join(appDir, 'package.json'),
    JSON.stringify(
      {
        name: 'tray-packaged-consumer',
        private: true,
        type: 'module',
        packageManager: 'bun@1.4.4',
        // tray's packed workspace:* dep becomes @octane-xplat/platform@0.20.0;
        // only 0.19.x is on npm, so the override pins the published release —
        // the same resolution a consumer gets before 0.20.0 ships.
        overrides: { '@octane-xplat/platform': '0.19.0' },
        dependencies: {
          '@octane-xplat/tray': `file:${trayPack}`,
          '@octane-xplat/platform': '0.19.0',
          '@nativescript/macos-node-api': '0.4.4-next.2026-08-09-31292056208',
          octane: '0.16.3',
        },
        devDependencies: {
          vite: '8.3.0',
          '@octane-xplat/macos-build': `file:${workerPack}`,
        },
        xplat: {
          targets: {
            macos: {
              runtime: 'appkit-node-api',
              package: {
                productName: 'TrayPackaged',
                bundleIdentifier: 'org.octane.xplat.tray-packaged',
                executableName: 'TrayPackaged',
                version: '0.1.0',
                minimumSystemVersion: '13.5',
                viteConfig: 'vite.config.mjs',
                bundleFile: 'dist/main.cjs',
              },
            },
          },
        },
      },
      null,
      2,
    ),
  )

  const iconPng =
    'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAHklEQVQI12P8z8AARQwMDAxMDEAMMIqhgYGBgQEACz8BAeM8u8oAAAAASUVORK5CYII='

  writeFileSync(join(appDir, 'icon.png'), Buffer.from(iconPng, 'base64'))

  mkdirSync(join(appDir, 'src'), { recursive: true })
  writeFileSync(
    join(appDir, 'src/main.macos.js'),
    `import '@nativescript/macos-node-api'
import { createTray, getTrayAvailability } from '@octane-xplat/tray'

const app = NSApplication.sharedApplication
app.setActivationPolicy(2)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function main() {
	const availability = await getTrayAvailability()
	console.log('TRAY_PACKAGED_AVAIL ' + JSON.stringify(availability))
	const tray = await createTray({
		id: 'xplat-tray-packaged',
		icon: { type: 'file', path: ${JSON.stringify(join(appDir, 'icon.png'))}, isTemplate: true },
		title: 'PKG',
		tooltip: 'packaged tip',
		menu: [{ type: 'action', key: 'a', label: 'Act', onSelect: () => {} }],
		onActivate: () => {},
	})
	const item = tray.item, button = tray.button
	console.log('TRAY_PACKAGED_CREATED autosave=' + item.autosaveName + ' title=' + button.title + ' target=' + (button.target != null) + ' image=' + (button.image != null))
	await sleep(3000)
	tray.update({ title: 'PKG2', tooltip: 'tip2', menu: [{ type: 'checkbox', key: 'c', label: 'C', value: true, onValueChange: () => {} }] })
	console.log('TRAY_PACKAGED_UPDATED title=' + button.title + ' items=' + tray.nsMenu.numberOfItems)
	tray.destroy()
	console.log('TRAY_PACKAGED_REMOVED target=' + (button.target != null) + ' menu=' + (item.menu != null) + ' visible=' + item.isVisible())
	await sleep(2000)
	app.terminate(null)
}
setTimeout(() => main().catch((e) => { console.log('TRAY_PACKAGED_FAIL ' + (e && e.message ? e.message : e)); app.terminate(null) }), 0)
`,
  )

  writeFileSync(
    join(appDir, 'vite.config.mjs'),
    `export default {
	resolve: { conditions: ['macos'] },
	build: {
		outDir: 'dist',
		lib: { entry: 'src/main.macos.js', formats: ['cjs'], fileName: 'main' },
		rollupOptions: { external: ['@nativescript/macos-node-api', /^node:/] },
	},
}
`,
  )

  run('bun', ['install', '--ignore-scripts', '--linker', 'isolated'])
  assert.ok(existsSync(join(appDir, 'node_modules/@octane-xplat/tray/dist/index.macos.js')))

  const stage = join(appDir, 'artifacts/macos-universal/.xplat-macos-raw')

  mkdirSync(stage, { recursive: true })

  const input = join(scratch, 'request.json')
  const output = join(scratch, 'result.json')

  writeFileSync(
    input,
    JSON.stringify({
      protocol: 'octane-build-worker',
      version: 1,
      id: 'tray-packaged',
      operation: 'macos-package',
      project: appDir,
      stagingRoot: stage,
    }),
  )

  run(
    process.execPath,
    [
      join(appDir, 'node_modules/@octane-xplat/macos-build/dist/macos/package-worker.js'),
      input,
      output,
    ],
    appDir,
    {
      // The MacOSX27 SDK ships a Tk.framework whose private headers cannot be
      // parsed standalone (tkUnixPort.h missing); the CLT's 26 SDK is clean.
      XPLAT_MACOS_SDK: '/Library/Developer/CommandLineTools/SDKs/MacOSX26.5.sdk',
    },
  )

  const result = JSON.parse(readFileSync(output))

  assert.equal(result.ok, true, JSON.stringify(result))

  const stagedApp = result.data.appPath

  const osascript = () => {
    const probe = spawnSync(
      'osascript',
      [
        '-e',
        'tell application "System Events" to get {name, description} of every menu bar item of menu bar 2 of process "TrayPackaged"',
      ],
      { encoding: 'utf8', timeout: 20_000 },
    )

    return (probe.stdout || probe.stderr || String(probe.error)).trim()
  }

  // Launch the packaged .app's executable and drive markers via stdout.
  appProcess = spawn(join(stagedApp, 'Contents/MacOS/TrayPackaged'), [], {
    env: { ...process.env },
  })

  let appOutput = ''
  let created = null
  let removed = null
  const markers = new Promise((resolve) => {
    appProcess.stdout.setEncoding('utf8').on('data', (chunk) => {
      appOutput += chunk
      if (appOutput.includes('TRAY_PACKAGED_CREATED') && created === null) {
        created = osascript()
      }

      if (appOutput.includes('TRAY_PACKAGED_REMOVED') && removed === null) {
        removed = osascript()
      }

      if (appOutput.includes('TRAY_PACKAGED_REMOVED')) {
        resolve()
      }
    })

    appProcess.stderr.setEncoding('utf8').on('data', (chunk) => (appOutput += chunk))
  })

  const exit = new Promise((resolve) => appProcess.on('close', resolve))
  const outcome = await Promise.race([
    Promise.all([markers, exit]).then(() => 'done'),
    exit.then(() => 'exit'),
    new Promise((r) => setTimeout(() => r('timeout'), 120_000)),
  ])

  console.log('packaged app outcome: ' + outcome)

  console.log(appOutput.trim())
  console.log('SYSTEM_EVENTS_WITH_ITEM: ' + created)
  console.log('SYSTEM_EVENTS_AFTER_REMOVAL: ' + removed)

  assert.match(appOutput, /TRAY_PACKAGED_AVAIL .*"available":true/)
  assert.match(
    appOutput,
    /TRAY_PACKAGED_CREATED autosave=xplat-tray-packaged title=PKG target=true image=true/,
  )

  assert.match(appOutput, /TRAY_PACKAGED_UPDATED title=PKG2/)
  assert.match(appOutput, /TRAY_PACKAGED_REMOVED target=false menu=false/)
  assert.doesNotMatch(appOutput, /TRAY_PACKAGED_FAIL/)
  console.log('TRAY_PACKAGED_OK')
} finally {
  if (appProcess && !appProcess.killed) {
    appProcess.kill('SIGKILL')
  }

  rmSync(scratch, { recursive: true, force: true })
}
