import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { hostBundle } from '../../cli/src/macos/jsc-host/runtime.ts'

/** Packed leaf compilation and real AppKit/JSC host dispatch ([NSApp run]).
 *  The camera path needs a real capture device and granted TCC state for the
 *  capture lanes; every lane still verifies the permission contract. */
export async function checkMacOSNative(packedRoot) {
	assert.equal(process.platform, 'darwin', 'macOS check requires macOS')
	assert.equal(process.arch, 'arm64', 'macOS check requires Apple Silicon')
	const app = await mkdtemp(join(tmpdir(), 'xplat-camera-native-'))
	try {
		await mkdir(join(app, 'node_modules/@octane-xplat'), { recursive: true })
		await cp(packedRoot, join(app, 'node_modules/@octane-xplat/camera'), { recursive: true })
		await symlink(
			fileURLToPath(new URL('../../platform', import.meta.url)),
			join(app, 'node_modules/@octane-xplat/platform'),
		)

		await writeFile(
			join(app, 'package.json'),
			JSON.stringify({
				name: 'camera-native-consumer',
				type: 'module',
				private: true,
				dependencies: { '@octane-xplat/camera': '0.0.0' },
			}),
		)

		const source = join(app, 'consumer.ts')
		await writeFile(
			source,
			`
import { createCameraHost } from 'camera-host-impl'
import { XplatPhotoCaptureSheet } from '@octane-xplat/camera/photo-sheet.macos'
const check = (value, message) => { if (!value) throw Error(message) }
const results = []
const mark = (name, value) => { results.push(name + '=' + value) }
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function run() {
const host = createCameraHost()
check(host != null, 'host factory binds inside the AppKit/JSC host')
mark('devices', JSON.parse(host.devices()).length > 0)
mark('audio-devices', host.audioDeviceAvailable() === true)
const status = host.permissionStatus('camera')
mark('permission', status)
const micStatus = host.permissionStatus('microphone')
mark('mic-permission', micStatus)

// Settled permissions reply synchronously; undetermined must not prompt.
{
	let replied = 0
	host.requestPermissionReply('camera', () => { replied += 1 })
	if (status !== 'undetermined' && status !== 'unknown') {
		check(replied === 1, 'settled camera permission must reply synchronously: ' + replied)
	}
}

if (status === 'undeclared') {
	// Declaration gating is reported by permissionStatus; configure itself
	// checks the TCC authorization, which is independent of the usage string.
	check(host.capturePhoto(() => {}) === 'unavailable', 'capture without session refuses')
	check(host.startRecording('/tmp/xplat-x.mov', 0) === 'unavailable', 'record without session refuses')
} else if (status === 'granted') {
	// Declared + authorized: real session configure, preview attach, capture.
	check(host.configure({ audio: false }) === null, 'configure video session')
	check(JSON.parse(host.previewSize()).width > 0, 'previewSize reports format')
	check(host.audioInputAttached() === false, 'audio stays off when not requested')
	const devices = JSON.parse(host.devices())
	check(devices.length > 0 && typeof devices[0].id === 'string', 'device list shape')
	mark('device-name', devices[0].name)
	mark('supports-rotation', host.supportsRotationAngles())

	const view = NSView.alloc().initWithFrame({ x: 0, y: 0, width: 320, height: 240 })
	view.wantsLayer = true
	check(host.attachPreview(view) === null, 'attach preview layer')

	let events = []
	host.installObserver((message) => { events.push(JSON.parse(message).type) })
	for (let i = 0; i < 100 && !events.includes('previewReady'); i++) await wait(100)
	check(events.includes('previewReady'), 'session starts through the detached dispatch')
	check(host.startRecording('/tmp/xplat-camera-native.mov', 5000) === null, 'startRecording')

	// Wait for running + recording-started, then stop and finalize.
	for (let i = 0; i < 100 && !events.includes('recordingStarted'); i++) await wait(100)
	check(events.includes('recordingStarted'), 'recordingStarted synthesized from isRecording')
	mark('recording', host.recording() === true)
	mark('recordedMs', host.recordedMs() > 0)
	host.stopRecording()
	for (let i = 0; i < 100 && !events.includes('recordingFinished'); i++) await wait(100)
	check(events.includes('recordingFinished'), 'recordingFinished fires on the main thread')
	mark('events', events.join('|'))

	// Photo output on the same live session (the sheet's actual flow):
	// configure(photo) adds a still output, then capture through the delegate.
	check(host.configure({ photo: true, audio: false }) === null, 'configure photo session')
	let photoBytes = 0
	const photoResult = host.capturePhoto((data) => { photoBytes = data ? data.length : -1 })
	check(photoResult === null, 'capturePhoto schedules through the bridge delegate')
	for (let i = 0; i < 100 && photoBytes === 0; i++) await wait(100)
	check(photoBytes > 1000, 'real JPEG bytes through the TS host: ' + photoBytes)
	mark('photo-bytes', photoBytes)

	host.detachPreview()
	host.dispose()
} else {
	mark('capture', 'skipped:' + status)
}

// Photo sheet: registered ObjC class, lifecycle fence, disposal, no-gallery.
{
	const sheet = XplatPhotoCaptureSheet.alloc().init()
	check(sheet != null, 'sheet ObjC class resolves')
	mark('sheet-permission', sheet.permissionStatus())
	// Without a key window the presentation replies null and stays settled.
	let replied = 'pending'
	sheet.presentReply({}, (result) => { replied = result ?? 'null' })
	check(replied === 'null', 'headless present:reply: settles null')
	sheet.dispose()
	sheet.dispose() // idempotent
	// discard: only octane-capture-* inside the temp directory is removed.
	sheet.discard('/tmp/not-a-capture.jpg')
	sheet.discard('octane-capture-relative.jpg')
	mark('sheet-fences', true)
}

// Real window drive: presentOnWindow → Capture → JPEG → discard → present →
// Cancel → teardown. Programmatic only — performClick dispatches the real
// NSButton target/action, proving the sheet's ObjC selector registration.
// The bare host cannot activate (activationPolicy Prohibited→Regular without
// a bundle), so no window can become key/main here: the keyWindow/mainWindow
// routing line itself is covered by the headless-settle check above, not by
// this lane.
{
	objc.import('AppKit')
	const app = NSApplication.sharedApplication
	const parent = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
		{ origin: { x: 0, y: 0 }, size: { width: 800, height: 600 } },
		15, // titled|closable|miniaturizable|resizable
		2, // buffered
		false,
	)
	parent.makeKeyAndOrderFront(null)
	mark('key-window-available', app.keyWindow != null || parent.isKeyWindow() === true)

	const subview = (root, title) => {
		const views = root?.subviews
		for (let i = 0; i < (views?.count ?? 0); i++) {
			const view = views.objectAtIndex(i)
			if (view.respondsToSelector?.('title') && String(view.title) === title) {
				return view
			}
		}
		return undefined
	}
	const statusField = (root) => {
		const views = root?.subviews
		for (let i = 0; i < (views?.count ?? 0); i++) {
			const view = views.objectAtIndex(i)
			if (!view.respondsToSelector?.('title') && view.respondsToSelector?.('stringValue')) {
				return view
			}
		}
		return undefined
	}

	{
		// The earlier lane's session stop dispatches on a detached thread; let
		// the hardware release settle before the sheet configures its own.
		await wait(2000)
		const sheet = XplatPhotoCaptureSheet.alloc().init()
		let reply = 'pending'
		sheet.presentOnWindow(parent, {}, (result) => { reply = result ?? 'null' })
		const sheetWindow = parent.attachedSheet
		check(sheetWindow != null, 'sheet presents on the host window')
		const capture = subview(sheetWindow.contentView, 'Capture')
		const cancel = subview(sheetWindow.contentView, 'Cancel')
		const label = statusField(sheetWindow.contentView)
		check(capture != null && cancel != null && label != null, 'sheet chrome resolves')
		check(String(label.stringValue).indexOf('Choose Capture') === 0, 'initial status text')

		capture.performClick(null)
		if (status === 'granted') {
			for (
				let i = 0;
				i < 150 && String(label.stringValue).indexOf('Frame your photo') !== 0 && reply === 'pending';
				i++
			) {
				await wait(100)
			}
			check(reply === 'pending', 'capture did not settle early: ' + reply)
			check(
				String(label.stringValue).indexOf('Frame your photo') === 0,
				'preview readies for capture: ' + label.stringValue,
			)
			capture.performClick(null)
			for (let i = 0; i < 150 && reply === 'pending'; i++) {
				await wait(100)
			}
			check(reply !== 'pending' && reply !== 'null', 'capture replies with a result')
			const shot = JSON.parse(reply)
			const tempDir = String(NSFileManager.defaultManager.temporaryDirectory.path)
			check(String(shot.name).indexOf('octane-capture-') === 0, 'shot name')
			check(String(shot.uri).indexOf(tempDir) === 0, 'shot uri inside the temp directory')
			check(String(shot.dataUrl).indexOf('data:image/jpeg;base64,') === 0, 'shot data URL is JPEG')
			check(NSFileManager.defaultManager.fileExistsAtPath(shot.uri) === true, 'shot persisted')
			const bytes = new Uint8Array(
				interop.bufferFromData(NSData.dataWithContentsOfFile(shot.uri)),
			)
			check(bytes[0] === 0xff && bytes[1] === 0xd8, 'JPEG signature')
			mark('sheet-shot-bytes', bytes.length)
			sheet.discard(shot.uri)
			check(!NSFileManager.defaultManager.fileExistsAtPath(shot.uri), 'discard removes the shot')
			check(parent.attachedSheet == null, 'sheet tears down after capture')
		} else {
			for (let i = 0; i < 50 && reply === 'pending'; i++) {
				await wait(100)
			}
			check(reply === 'null', 'ungranted capture settles null: ' + status)
			check(parent.attachedSheet == null, 'ungranted sheet tears down')
			mark('sheet-capture', 'skipped:' + status)
		}
	}

	// Cancel lane: a fresh sheet presents, Cancel settles null, teardown.
	{
		const sheet = XplatPhotoCaptureSheet.alloc().init()
		let reply = 'pending'
		sheet.presentOnWindow(parent, {}, (result) => { reply = result ?? 'null' })
		const sheetWindow = parent.attachedSheet
		check(sheetWindow != null, 'second sheet presents')
		subview(sheetWindow.contentView, 'Cancel').performClick(null)
		for (let i = 0; i < 50 && reply === 'pending'; i++) {
			await wait(100)
		}
		check(reply === 'null', 'cancel settles null')
		check(parent.attachedSheet == null, 'cancel tears the sheet down')
	}
	parent.orderOut(null)
}

console.log('MACOS_CAMERA_HOST_OK ' + results.join(','))
setTimeout(() => globalThis.__xplatStopHost(), 0)
}
run().catch((error) => { console.error(String(error)); throw error })
`,
		)

		await build({
			configFile: false,
			root: app,
			resolve: {
				conditions: ['macos'],
				alias: {
					'camera-host-impl': join(
						app,
						'node_modules/@octane-xplat/camera/src/camera-host.macos.ts',
					),
				},
			},
			build: {
				outDir: join(app, 'dist'),
				minify: false,
				lib: { entry: source, formats: ['cjs'], fileName: () => 'consumer.cjs' },
				rollupOptions: { external: ['@nativescript/macos-node-api'] },
			},
		})

		// Bundle.main reads a sibling Info.plist for flat binaries: one host
		// copy declares camera+microphone usage strings, the other does not.
		const nsMetadata = join(hostBundle, `metadata.macos.${process.arch}.nsmd`)
		const shim = fileURLToPath(new URL('../../cli/src/macos/jsc-host/shim.js', import.meta.url))
		const framework = join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript')
		const variants = [
			{ name: 'undeclared', plist: null },
			{
				name: 'declared',
				plist:
					'<?xml version="1.0" encoding="UTF-8"?>\n' +
					'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n' +
					'<plist version="1.0"><dict>' +
					'<key>NSCameraUsageDescription</key><string>Camera host checks.</string>' +
					'<key>NSMicrophoneUsageDescription</key><string>Camera host checks.</string>' +
					'</dict></plist>\n',
			},
		]

		for (const variant of variants) {
			const dir = join(app, `host-${variant.name}`)
			await mkdir(dir, { recursive: true })
			await cp(join(hostBundle, 'host'), join(dir, 'host'))
			if (variant.plist) {
				await writeFile(join(dir, 'Info.plist'), variant.plist)
			}

			const result = spawnSync(
				join(dir, 'host'),
				[framework, join(app, 'dist/consumer.cjs'), nsMetadata, shim],
				{ encoding: 'utf8', timeout: 60_000 },
			)

			const output = `${result.stdout}\n${result.stderr}`
			assert.equal(result.status, 0, `${variant.name}\n${output}`)
			assert.match(output, /MACOS_CAMERA_HOST_OK/, `${variant.name}\n${output}`)
		}
		console.log('macOS packed camera: TypeScript host dispatch passed')
	} finally {
		await rm(app, { recursive: true, force: true })
	}
}
