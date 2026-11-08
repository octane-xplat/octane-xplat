// Real AppKit/JSC host runtime check for @octane-xplat/tray's macOS leaf:
// status item lifecycle, NSMenu structure, handler dispatch, window/residency.
// No OS input or visual inspection; handler dispatch only. Modeled on
// packages/gif/tests/appkit-runtime.mjs.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { buildMacOSNative, writeNativeBootstrap } from '../../cli/src/macos/native.ts'

const repo = fileURLToPath(new URL('../../..', import.meta.url))
const directory = await mkdtemp(join(tmpdir(), 'octane-tray-runtime-'))

// 4x4 red PNG fixture for file-icon checks.
const PNG =
	'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAHklEQVQI12P8z8AARQwMDAxMDEAMMIqhgYGBgQEACz8BAeM8u8oAAAAASUVORK5CYII='

try {
	const modules = join(directory, 'node_modules/@octane-xplat')
	await mkdir(modules, { recursive: true })
	for (const name of ['platform', 'tray']) {
		await symlink(join(repo, 'packages', name), join(modules, name), 'dir')
	}
	await writeFile(join(directory, 'package.json'), JSON.stringify({ name: 'tray-runtime', private: true, type: 'module' }))

	const iconPath = join(directory, 'icon.png')
	await writeFile(iconPath, Buffer.from(PNG, 'base64'))

	const caseFile = join(directory, 'case.ts')
	await writeFile(
		caseFile,
		`
import { NSApp, NSWindow, NSMenuItem } from '@octane-xplat/platform/macos'
import { createTray, getTrayAvailability, showAppWindows, hideAppWindows, toggleAppWindows, areAppWindowsVisible, keepAppResident, TrayError } from ${JSON.stringify(join(repo, 'packages/tray/src/index.macos.ts'))}

const settled = (ms) => new Promise((r) => setTimeout(r, ms))
let assertions = 0
const check = (value, name) => { assertions++; if (!value) throw new Error('ASSERT ' + name) }
const events = []
setTimeout(async () => {
	try {
		const availability = await getTrayAvailability()
		check(availability.available === true && availability.platform === 'macos', 'availability macos')

		const tray = await createTray({
			id: 'xplat-tray-test',
			icon: { type: 'file', path: ${JSON.stringify(iconPath)}, isTemplate: true },
			title: 'TT',
			tooltip: 'tip',
			menu: [
				{ type: 'action', key: 'a', label: 'Act', onSelect: () => events.push('a') },
				{ type: 'checkbox', key: 'c', label: 'Check', value: true, onValueChange: (v) => events.push('c:' + v) },
				{ type: 'radio-group', key: 'r', label: 'Mode', value: 'one', items: [
					{ key: 'o1', label: 'One', value: 'one' },
					{ key: 'o2', label: 'Two', value: 'two' },
				], onValueChange: (v) => events.push('r:' + v) },
				{ type: 'submenu', key: 's', label: 'Sub', items: [{ type: 'action', key: 'sa', label: 'SubAct', onSelect: () => events.push('sa') }] },
				{ type: 'section', key: 'sec', label: 'Sec', items: [{ type: 'separator', key: 'x' }] },
				{ type: 'separator', key: 'x2' },
			],
			onActivate: () => events.push('activate'),
		})
		check(tray.id === 'xplat-tray-test' && !tray.isDestroyed, 'created')
		// private is type-only — the live NSStatusItem/NSMenu are reachable.
		const item = tray.item, button = tray.button, menu = tray.nsMenu
		check(Boolean(item) && Boolean(button), 'status item + button exist')
		check(button.title === 'TT', 'button title')
		check(item.toolTip === 'tip' || button.toolTip === 'tip', 'tooltip set')
		check(Boolean(button.image), 'image set')
		check(button.image && button.image.template === true, 'template image')
		check(Math.abs(button.image.size.height - 18) < 1, 'image scaled to 18pt')
		check(item.autosaveName === 'xplat-tray-test', 'autosaveName = id')
		check(item.menu == null, 'onActivate mode keeps item.menu nil')
		check(button.target != null && String(button.action) === 'trayButtonClicked:', 'button action wired')
		check(Boolean(menu) && menu.numberOfItems > 6, 'NSMenu built')
		check(menu.itemAtIndex(0).title === 'Act' && menu.itemAtIndex(0).isEnabled(), 'action row')
		check(menu.itemAtIndex(1).state === 1, 'checkbox on-state')
		check(menu.itemAtIndex(3).title === 'Mode' && menu.itemAtIndex(3).isEnabled() === false, 'radio header disabled')
		check(menu.itemAtIndex(4).title === 'One' && menu.itemAtIndex(4).state === 1, 'radio selected state')
		check(menu.itemAtIndex(5).state === 0, 'radio off state')
		check(menu.itemAtIndex(6).hasSubmenu === true, 'submenu row')
		check(menu.itemAtIndex(8).isEnabled() === false, 'section header disabled')

		// Handler dispatch only — performActionForItemAtIndex fires registered handlers.
		menu.performActionForItemAtIndex(0)
		menu.performActionForItemAtIndex(1)
		menu.performActionForItemAtIndex(4)
		menu.performActionForItemAtIndex(5)
		menu.itemAtIndex(6).submenu.performActionForItemAtIndex(0)
		await settled(25)
		check(events.join(',') === 'a,c:false,r:two,sa', 'menu handlers: ' + events.join(','))

		// Primary click → onActivate through the button action.
		button.performClick(null)
		await settled(25)
		check(events.includes('activate'), 'performClick → onActivate')

		// Invalid icon rejects.
		let rejected = null
		try { await createTray({ id: 'bad', icon: { type: 'file', path: '/nonexistent.png' } }) } catch (e) { rejected = e }
		check(rejected && rejected.code === 'invalid-icon', 'invalid icon rejects')

		// Named SF Symbol icon works.
		const named = await createTray({ id: 'xplat-tray-named', icon: { type: 'named', name: 'star' }, tooltip: 'n' })
		check(Boolean(named.button && named.button.image), 'named SF Symbol image')
		named.destroy()

		// update() reaches the live item; destroy clears it.
		tray.update({ title: 'TT2', tooltip: 'tip2' })
		check(button.title === 'TT2', 'update title')
		check(String(item.toolTip) === 'tip2' || String(button.toolTip) === 'tip2', 'update tooltip')
		tray.update({ onActivate: null })
		check(item.menu != null && item.menu.numberOfItems > 0, 'menu attaches when onActivate cleared')
		tray.update({ menu: null })
		check(item.menu == null || item.menu.numberOfItems === 0, 'menu cleared')
		tray.update({ menu: [{ type: 'action', key: 'b', label: 'B', onSelect: () => events.push('b') }] })
		// Observe what removeStatusItem changes before asserting on it.
		const probe = () => 'bar=' + (item.statusBar != null) + ' win=' + (button.window != null) + ' ivis=' + item.isVisible() + ' sup=' + (button.superview != null) + ' tgt=' + (button.target != null)
		const before = probe()
		tray.destroy()
		await settled(100)
		const after = probe()
		console.log('REMOVED observable before: ' + before + ' after: ' + after)
		check(tray.isDestroyed, 'destroyed')
		check(button.target == null, 'destroy clears button target')
		check(item.menu == null, 'destroy clears menu')

		// A tray destroyed while still in onActivate mode: target/action clear.
		const removal = await createTray({ id: 'xplat-tray-removal', icon: { type: 'named', name: 'square' }, onActivate: () => {} })
		const rbutton = removal.button
		check(rbutton.target != null && String(rbutton.action) === 'trayButtonClicked:', 'removal wired')
		removal.destroy()
		check(rbutton.target == null, 'removal clears target')
		check(String(rbutton.action) === '<null selector>', 'removal clears action to null selector')

		// Two trays at once: distinct items, independent removal.
		const t1 = await createTray({ id: 'xplat-tray-a', icon: { type: 'named', name: 'star' } })
		const t2 = await createTray({ id: 'xplat-tray-b', icon: { type: 'named', name: 'circle' } })
		check(t1.button !== t2.button && t1.item !== t2.item, 'two trays distinct')
		check(t1.button != null && t2.button != null, 'both buttons exist')
		t1.destroy()
		check(t2.isDestroyed === false && t2.button != null, 'other tray survives')
		t2.destroy()
		let destroyed = null
		try { tray.update({ title: 'x' }) } catch (e) { destroyed = e }
		check(destroyed && destroyed.code === 'destroyed', 'update after destroy')

		// Windows + residency.
		const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer({ origin: { x: 0, y: 0 }, size: { width: 200, height: 100 } }, 15, 2, false)
		window.makeKeyAndOrderFront(null)
		check(areAppWindowsVisible() === true, 'windows visible')
		hideAppWindows()
		check(areAppWindowsVisible() === false, 'windows hidden')
		check(showAppWindows() === true, 'show windows')
		check(areAppWindowsVisible() === true, 'visible after show')
		// Documented toggle: visible+active -> hide (false); anything else -> show (true).
		const active = NSApp.isActive()
		console.log('NSApp.isActive=' + active)
		check(toggleAppWindows() === (active ? false : true), 'toggle follows visibility+active')
		check(toggleAppWindows() === true, 'toggle back shows')
		const residency = keepAppResident({ hideWindowsOnClose: true })
		check(window.releasedWhenClosed === false, 'releasedWhenClosed false')
		residency.release()
		residency.release()
		window.close()

		console.log('TRAY_RUNTIME_OK ' + assertions + ' assertions, events=' + events.join(','))
	} catch (error) {
		console.error('TRAY_RUNTIME_FAIL ' + (error && error.message ? error.message + ' | ' + error.stack : error))
	} finally {
		globalThis.__xplatStopHost()
	}
}, 0)
`,
	)

	const artifact = await buildMacOSNative(directory)
	assert.deepEqual(artifact.leaves, [])
	const bootstrap = join(directory, 'bootstrap.js')
	await writeNativeBootstrap(artifact, bootstrap)

	await build({
		root: directory,
		configFile: false,
		logLevel: 'error',
		resolve: { conditions: ['macos'], extensions: ['.macos.ts', '.ts', '.js'] },
		build: {
			outDir: join(directory, 'dist'),
			target: 'es2022',
			lib: { entry: caseFile, formats: ['cjs'], fileName: () => 'case.cjs' },
			minify: false,
		},
	})

	const host = join(repo, 'packages/cli/src/macos/jsc-host/prebuilt/macos')
	const result = await new Promise((resolve) => {
		const child = spawn(
			join(host, 'host'),
			[
				join(host, 'NativeScript.framework/Versions/A/NativeScript'),
				join(directory, 'dist/case.cjs'),
				artifact.metadata[process.arch === 'x64' ? 'x86_64' : 'arm64'],
				bootstrap,
			],
			{ timeout: 60_000 },
		)
		let output = ''
		child.stdout.setEncoding('utf8').on('data', (chunk) => (output += chunk))
		child.stderr.setEncoding('utf8').on('data', (chunk) => (output += chunk))
		child.on('close', (status) => resolve({ status, output }))
		child.on('error', (error) => resolve({ status: 1, output: String(error) }))
	})

	const output = result.output
	assert.equal(result.status, 0, output)
	assert.doesNotMatch(output, /TRAY_RUNTIME_FAIL/)
	assert.match(output, /TRAY_RUNTIME_OK/)
	console.log(output.trim())
} finally {
	if (process.env.TRAY_TEST_KEEP_TMP) {
		console.log('kept ' + directory)
	} else {
		await rm(directory, { recursive: true, force: true })
	}
}
