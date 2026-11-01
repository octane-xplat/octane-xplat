// AppKit/JSC runtime check for the packed TypeScript video engine.
// Spawns the prebuilt host against a byte-range HTTP fixture and drives the
// shipped createVideoView: window attach/detach, local and remote playback,
// seek ordering, end/failure events, loop reseek and mid-flight teardown.
// Nonvisual: playback state is asserted through snapshot()/item status only —
// no frame, audio, or visual output is established here.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { cp, mkdir, readFile, symlink, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { buildMacOSNative, writeNativeBootstrap } from '../../cli/src/macos/native.ts'
import { hostBundle, macOSHostArch } from '../../cli/src/macos/jsc-host/runtime.ts'

const here = dirname(fileURLToPath(import.meta.url))

async function consumer(packed, app, source) {
	const installed = join(app, 'node_modules/@octane-xplat/video')
	await mkdir(installed, { recursive: true })
	await cp(packed, installed, { recursive: true })
	await writeFile(
		join(app, 'package.json'),
		JSON.stringify({
			name: 'video-fixture',
			type: 'module',
			dependencies: { '@octane-xplat/video': '0.19.0' },
		}),
	)
	await writeFile(join(app, 'fixture.mjs'), source)
	await build({
		configFile: false,
		root: app,
		logLevel: 'error',
		resolve: { conditions: ['macos', 'native'] },
		build: {
			minify: false,
			lib: { entry: join(app, 'fixture.mjs'), formats: ['cjs'], fileName: () => 'fixture.cjs' },
		},
	})
	return join(app, 'dist/fixture.cjs')
}

function sendRange(request, response, bytes, drip) {
	const range = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range ?? '')
	const start = range ? Number(range[1]) : 0
	const end = range?.[2] ? Math.min(Number(range[2]), bytes.length - 1) : bytes.length - 1
	if (start > end || start >= bytes.length) {
		response.writeHead(416, { 'Content-Range': `bytes */${bytes.length}` })
		response.end()
		return
	}
	response.writeHead(range ? 206 : 200, {
		'Content-Type': 'video/mp4',
		'Accept-Ranges': 'bytes',
		'Content-Length': end - start + 1,
		...(range ? { 'Content-Range': `bytes ${start}-${end}/${bytes.length}` } : {}),
	})
	if (!drip) {
		response.end(bytes.subarray(start, end + 1))
		return
	}
	// Keep the transfer in flight across the fixture's measurement window:
	// the whole clip trickles at roughly one kilobyte a second.
	let offset = start
	const tick = () => {
		const next = Math.min(offset + 256, end + 1)
		response.write(bytes.subarray(offset, next))
		offset = next
		if (offset <= end) {
			setTimeout(tick, 250)
		} else {
			response.end()
		}
	}
	tick()
}

export async function verifyMacOS(packed, temporary) {
	assert.equal(process.platform, 'darwin', 'macOS target check requires macOS')
	const app = join(temporary, 'target')
	await mkdir(app, { recursive: true })
	const local = join(here, 'fixtures/clip.mp4')
	const clip = await readFile(local)
	const server = createServer((request, response) => {
		if (request.url === '/clip.mp4') {
			sendRange(request, response, clip, false)
		} else if (request.url === '/slow.mp4') {
			sendRange(request, response, clip, true)
		} else if (request.url === '/garbage.mp4') {
			response.writeHead(200, { 'Content-Type': 'video/mp4', 'Content-Length': 2048 })
			response.end(Buffer.alloc(2048, 7))
		} else {
			response.writeHead(404)
			response.end('missing')
		}
	})
	await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen))
	const remote = `http://127.0.0.1:${server.address().port}`
	try {
		// buildMacOSNative walks the package's declared dependencies, and the
		// engine's macOS import resolves the workspace platform bindings —
		// link them all before bundling so vite and the leaf scanner see them.
		const link = async (name, root) => {
			await mkdir(dirname(join(app, 'node_modules', name)), { recursive: true })
			await symlink(root, join(app, 'node_modules', name))
		}
		await link('@octane-xplat/platform', fileURLToPath(new URL('../../platform', import.meta.url)))
		await link('@octane-xplat/jsx', fileURLToPath(new URL('../../jsx', import.meta.url)))
		await link(
			'@nstudio/nativescript-exoplayer',
			resolve(here, '../node_modules/@nstudio/nativescript-exoplayer'),
		)
		const script = await consumer(
			packed,
			app,
			`
import { createVideoView } from './node_modules/@octane-xplat/video/src/video-view.macos.ts'
const application = NSApplication.sharedApplication
const check = (condition, message) => { if (!condition) throw Error(message) }
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
async function until(predicate, timeout = 12000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (predicate()) return true
    await delay(50)
  }
  return false
}
const snapshot = (view) => JSON.parse(view.snapshot())
async function main() {
  const view = createVideoView()
  // Window attach/detach and layout/input behavior of the real subclass.
  const win = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
    { origin: { x: 100, y: 100 }, size: { width: 320, height: 240 } }, 15, 2, false)
  const content = NSView.alloc().initWithFrame({ origin: { x: 0, y: 0 }, size: { width: 320, height: 240 } })
  win.contentView = content
  content.addSubview(view)
  check(view.window === win, 'window attach')
  view.frame = { origin: { x: 0, y: 0 }, size: { width: 96, height: 64 } }
  view.needsLayout = true
  content.layoutSubtreeIfNeeded()
  check(view.hitTest({ x: 1, y: 1 }) == null, 'hitTest stays nil')
  // Source grammar failures match the Swift wrapper's messages.
  view.setSource('https://')
  check(snapshot(view).status === 'failed', 'rejects empty-host URL')
  view.setSource('/definitely/missing.mp4')
  check(snapshot(view).status === 'failed' && snapshot(view).message === 'Video file is not readable', 'unreadable file fails')
  // Local file playback.
  view.setSource(${JSON.stringify(local)})
  await until(() => snapshot(view).status === 'ready')
  const snap = snapshot(view)
  check(snap.status === 'ready' && snap.duration > 1000, 'local file ready: ' + view.snapshot())
  view.play()
  check(await until(() => snapshot(view).playing), 'local play')
  view.pause()
  view.seekToMS(400)
  check(await until(() => !snapshot(view).seeking), 'local seek completes')
  // Remote playback to the end notification.
  view.setSource(${JSON.stringify(remote + '/clip.mp4')})
  check(await until(() => snapshot(view).status === 'ready'), 'remote ready')
  view.play()
  check(await until(() => snapshot(view).status === 'ended', 15000), 'remote ends')
  // Explicit play after end reseeks and resumes.
  view.play()
  check(await until(() => snapshot(view).playing), 'replay after end')
  view.pause()
  // In-flight transfer: timers and a seek completion must keep delivering.
  view.clear()
  view.setLooping(true)
  view.setSource(${JSON.stringify(remote + '/slow.mp4')})
  check(await until(() => snapshot(view).status === 'ready', 20000), 'drip-fed remote ready')
  view.play()
  let ticks = 0
  let ticking = true
  const tick = () => { if (ticking) { ticks++; setTimeout(tick, 50) } }
  setTimeout(tick, 50)
  await delay(2500)
  ticking = false
  check(ticks >= 25, 'timers deliver during in-flight transfer: ' + ticks)
  view.seekToMS(100)
  check(await until(() => !snapshot(view).seeking, 8000), 'seek completes mid-transfer')
  // Failure surface on unplayable remote bytes.
  view.setSource(${JSON.stringify(remote + '/garbage.mp4')})
  check(await until(() => snapshot(view).status === 'failed', 15000), 'remote failure status')
  view.dispose()
  check(snapshot(view).status === 'idle', 'dispose clears')
  view.removeFromSuperview()
  win.orderOut(null)
  console.log('MACOS_VIDEO_TARGET_OK (silent fixture; no frame/audio evidence)')
}
main().then(() => __xplatStopHost(), error => { console.error(error); __xplatStopHost() })
`,
		)
		const artifact = await buildMacOSNative(app)
		const bootstrap = join(app, 'bootstrap.js')
		await writeNativeBootstrap(artifact, bootstrap)
		const output = await new Promise((resolveOutput, reject) => {
			const child = spawn(
				join(hostBundle, 'host'),
				[
					join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
					script,
					artifact.metadata[macOSHostArch()],
					bootstrap,
				],
				{ cwd: app, env: { ...process.env, OCTANE_MACOS_EXTERNAL_RUNLOOP: '1' } },
			)
			let text = ''
			child.stdout.on('data', (chunk) => (text += chunk))
			child.stderr.on('data', (chunk) => (text += chunk))
			const timeout = setTimeout(() => child.kill('SIGKILL'), 90_000)
			child.once('error', (error) => {
				clearTimeout(timeout)
				reject(error)
			})
			child.once('close', (code, signal) => {
				clearTimeout(timeout)
				if (code === 0) {
					resolveOutput(text)
				} else {
					reject(new Error(`host exited ${code} ${signal}: ${text}`))
				}
			})
		})
		assert.match(output, /MACOS_VIDEO_TARGET_OK/, output)
		console.log(output.trim().split('\n').filter((line) => line.includes('MACOS_VIDEO')).join('\n'))
	} finally {
		server.closeAllConnections()
		await new Promise((resolveClose) => server.close(resolveClose))
	}
}
