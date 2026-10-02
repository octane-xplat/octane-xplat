// Isolated, non-visual AppKit fixture. Never requests permission or posts a real notification.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildMacOSNative, writeNativeBootstrap } from '../../cli/src/macos/native.mjs'
import { hostBundle } from '../../cli/src/macos/jsc-host/runtime.mjs'

const leaf = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repo = resolve(leaf, '../..')
await mkdir(join(repo, 'research'), { recursive: true })
const app = await mkdtemp(join(repo, 'research/macos-notifications-'))
await mkdir(join(app, 'node_modules/@octane-xplat'), { recursive: true })
await symlink(leaf, join(app, 'node_modules/@octane-xplat/notifications'))
await writeFile(
	join(app, 'package.json'),
	JSON.stringify({
		name: 'notifications-fixture',
		dependencies: { '@octane-xplat/notifications': '0.9.0' },
	}),
)

const executable = join(app, 'native-center')
const compiled = spawnSync(
	'xcrun',
	[
		'clang',
		'-fobjc-arc',
		'-fblocks',
		'-framework',
		'Foundation',
		'-framework',
		'UserNotifications',
		'-I',
		join(leaf, 'platforms/macos/include'),
		join(leaf, 'platforms/macos/src/XplatLocalNotifications.m'),
		join(leaf, 'tests/native-center.m'),
		'-o',
		executable,
	],
	{ encoding: 'utf8', timeout: 30_000 },
)

assert.equal(compiled.status, 0, compiled.stdout + compiled.stderr)
const dispatched = spawnSync(executable, [], { encoding: 'utf8', timeout: 10_000 })
assert.equal(dispatched.status, 0, dispatched.stdout + dispatched.stderr)
assert.match(dispatched.stdout, /NATIVE_NOTIFICATION_DISPATCH_OK/)
console.log(dispatched.stdout.trim())
const packaged = join(app, 'NotificationsFixture.app/Contents')
await mkdir(join(packaged, 'MacOS'), { recursive: true })
await cp(executable, join(packaged, 'MacOS/NotificationsFixture'))
await writeFile(
	join(packaged, 'Info.plist'),
	`<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict>
<key>CFBundleExecutable</key><string>NotificationsFixture</string>
<key>CFBundleIdentifier</key><string>org.octane.xplat.notifications-fixture</string>
<key>CFBundlePackageType</key><string>APPL</string>
</dict></plist>`,
)

const bundled = spawnSync(join(packaged, 'MacOS/NotificationsFixture'), [], {
	encoding: 'utf8',
	timeout: 10_000,
})

assert.equal(bundled.status, 0, bundled.stdout + bundled.stderr)
assert.match(bundled.stdout, /BUNDLE_NOTIFICATION_SUPPORT_OK/)
console.log('Packaged native fixture: bundle identity support check passes (intercepted center).')

const artifact = await buildMacOSNative(app)
assert.equal(artifact.leaves.length, 1)
const bootstrap = join(app, 'bootstrap.js')
await writeNativeBootstrap(artifact, bootstrap)
const script = join(app, 'fixture.cjs')
await writeFile(
	script,
	`
if (typeof XplatLocalNotifications === 'undefined') throw Error('Leaf metadata missing');
if (XplatLocalNotifications.isAvailable()) throw Error('Unbundled fixture must be unavailable');
if (typeof XplatLocalNotifications.ensure !== 'function' || typeof XplatLocalNotifications.notifyBody !== 'function') throw Error('Leaf selectors missing');
if (typeof UNUserNotificationCenter === 'undefined' || typeof UNMutableNotificationContent === 'undefined') throw Error('System notification metadata missing');
const content = UNMutableNotificationContent.new();
content.title = 'Fixture title'; content.body = 'Fixture body';
const request = UNNotificationRequest.requestWithIdentifierContentTrigger('fixture', content, null);
if (request.identifier !== 'fixture' || request.content.title !== 'Fixture title' || request.content.body !== 'Fixture body' || request.trigger !== null) throw Error('Immediate request differs');
console.log('MACOS_LOCAL_NOTIFICATION_REQUEST_OK');
`,
)

const result = spawnSync(
	join(hostBundle, 'host'),
	[
		join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
		script,
		artifact.metadata,
		bootstrap,
	],
	{ encoding: 'utf8', timeout: 10_000 },
)

assert.equal(result.status, 0, result.stdout + result.stderr)
assert.match(result.stdout + result.stderr, /MACOS_LOCAL_NOTIFICATION_REQUEST_OK/)
console.log(
	'AppKit: native leaf compiled/loaded; selectors and real immediate request construction pass. No OS permission/delivery evidence.',
)
