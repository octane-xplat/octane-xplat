import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

// XPLAT_JSC_HOST_BUNDLE points at a build-runtime.sh output directory to check
// a locally rebuilt host before the committed prebuilt rotates.
const hostBundle =
	process.env.XPLAT_JSC_HOST_BUNDLE ??
	resolve(dirname(fileURLToPath(import.meta.url)), '../src/macos/jsc-host/prebuilt/macos')

// The metadata declares selectors a concrete receiver does not implement —
// upstream metagen used to synthesize them itself by deriving a superclass's
// property records from a subclass's accessors (NSView.autoscroll borrowed
// NSMatrix's isAutoscroll/setAutoscroll:), and the maintained metagen patch
// now removes that reversed synthesis (NativeScript/runtimes#106), so the
// shipped metadata exposes autoscroll/candidates as their real declared
// methods. Header-declared selectors that a class never implements remain
// (NSObject.candidates: among them). Messaging such a receiver used to end
// in doesNotRecognizeSelector: -> objc_exception_throw, which cannot unwind
// through ffi_call frames — the host aborted even under a JS try/catch. The
// runtimes patch guards both native dispatch paths with respondsToSelector:
// and rethrows as a JS error. This boots the real host binary and exercises
// that dispatch boundary plus the neighbors that must keep working.
const fixture = `
const view = NSView.alloc().init()
const obj = NSObject.alloc().init()
const out = []
const rec = (k, v) => out.push(k + '=' + v)
rec('isFlipped', view.isFlipped())
view.addSubview(NSView.alloc().init())
rec('subviews', view.subviews.count)
// runtimes#106 fixed: autoscroll is NSView's real -autoscroll: method again.
rec('autoscrollGet', typeof view.autoscroll)
try {
	view.autoscroll = true
	rec('autoscrollSet', 'no-throw:' + typeof view.autoscroll)
} catch (error) {
	rec('autoscrollSet', 'caught:' + (error && error.message ? error.message : error))
}
// The declared -candidates: selector is unimplemented on bare NSObject; the
// dispatch guard must surface it as a catchable JS error, not an abort.
try {
	obj.candidates(null)
	rec('candidatesCall', 'no-throw')
} catch (error) {
	rec('candidatesCall', 'caught:' + (error && error.message ? error.message : error))
}
let swept = 0
let caught = 0
for (const name of Object.getOwnPropertyNames(Object.getPrototypeOf(view))) {
	try {
		void view[name]
		swept++
	} catch {
		caught++
	}
}
rec('getterSweep', swept + '+' + caught)
NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
	'xplatGuardProbe',
	null,
	null,
	(note) => {
		globalThis.__probeResult = 'notified:' + String(note.name)
	},
)
NSNotificationCenter.defaultCenter.postNotificationNameObject('xplatGuardProbe', null)
rec('callback', globalThis.__probeResult ?? 'missing')
out.join(' | ')
`

test(
	'AppKit bridge rethrows unsupported selectors as JS errors instead of aborting',
	{ skip: process.platform !== 'darwin' && 'requires the macOS AppKit host' },
	(t) => {
		const dir = mkdtempSync(join(tmpdir(), 'xplat-selector-guard-'))
		t.after(() => rmSync(dir, { recursive: true, force: true }))
		const script = join(dir, 'fixture.js')
		writeFileSync(script, fixture)

		// The rebuild output directory carries host + framework but not metadata;
		// resolve the nsmd beside whichever bundle ships it.
		const metadata = join(
			existsSync(join(hostBundle, `metadata.macos.arm64.nsmd`))
				? hostBundle
				: resolve(dirname(fileURLToPath(import.meta.url)), '../src/macos/jsc-host/prebuilt/macos'),
			`metadata.macos.${process.arch === 'x64' ? 'x86_64' : 'arm64'}.nsmd`,
		)

		const result = spawnSync(
			join(hostBundle, 'host'),
			[join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'), script, metadata],
			{ encoding: 'utf8', timeout: 30_000 },
		)

		if (result.signal === 'SIGABRT') {
			return t.skip(
				'prebuilt host binary predates the selector guard; refresh it with ' +
					'packages/cli/src/macos/jsc-host/build-runtime.sh --install',
			)
		}

		assert.equal(
			result.status,
			0,
			`host exited ${result.status} ${result.signal ?? ''}\n${result.stderr}`,
		)
		assert.doesNotMatch(result.stderr, /Terminating app due to uncaught exception/)

		const marker = /script result: (.*)/.exec(result.stderr)?.[1]
		assert.ok(marker, `missing script result marker:\n${result.stderr}`)
		const outcomes = Object.fromEntries(marker.split(' | ').map((entry) => entry.split(/=(.*)/)))

		// Supported selectors, property reads and container access still dispatch.
		assert.equal(outcomes.isFlipped, 'false')
		assert.equal(outcomes.subviews, '1')
		// The phantom accessor pair is gone: autoscroll is the real method
		// member again, and assigning to it shadows with an own property —
		// neither read nor write aborts or throws a selector error.
		assert.equal(outcomes.autoscrollGet, 'function')
		assert.match(outcomes.autoscrollSet, /^no-throw:/)
		// A declared selector the receiver never implements surfaces as a JS
		// error, not a process abort.
		assert.match(
			outcomes.candidatesCall,
			/^caught:-\[NSObject candidates:\]: unrecognized selector sent to instance$/,
		)
		// Enumerating every declared member — the inspector getProperties path
		// that surfaced this defect — completes instead of aborting.
		const [swept] = (outcomes.getterSweep ?? '0+0').split('+').map(Number)
		assert.ok(swept > 100, `getter sweep only read ${swept} members`)
		// Block-closure callback dispatch back into JS still works.
		assert.equal(outcomes.callback, 'notified:xplatGuardProbe')
	},
)
