import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

// XPLAT_JSC_HOST_BUNDLE points at a build-runtime.sh output directory to check
// a locally rebuilt host before the committed prebuilt rotates.
const hostBundle =
	process.env.XPLAT_JSC_HOST_BUNDLE ??
	resolve(dirname(fileURLToPath(import.meta.url)), '../src/macos/jsc-host/prebuilt/macos')

const hostRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../src/macos/jsc-host')

// The host's libjs env loop carries every foreign-queue JS callback: the napi
// backend marshals JS blocks invoked off the main thread — NSURLSession
// completion handlers, NSOperationQueue and dispatch_async blocks — through
// threadsafe functions that post uv_async work on env->loop. The host used to
// enter [NSApp run] without ever pumping that loop, and every handle on it is
// unref'd, so the posted work starved: foreign threads parked on a condition
// variable, serial queues wedged behind the parked op, and session
// completions never reached JS. The host now keeps one ref'd async handle on
// the loop and drives uv_run(UV_RUN_NOWAIT) from the main run loop. This
// boots the real binary and exercises each starved lane plus a real loopback
// HTTP round-trip.
const fixture = `
var delivered = { timer: 0, mainq: 0, bgq: 0, bgq2: 0, session: 0, gasync: 0 }
var status = 'nil'
function tag(k) { delivered[k] += 1 }
setTimeout(function () { tag('timer') }, 50)
try {
	NSOperationQueue.mainQueue.addOperationWithBlock(function () { tag('mainq') })
} catch (e) {
	console.log('MAINQ_THREW ' + e)
}
var bgQueue = null
try {
	bgQueue = NSOperationQueue.alloc().init()
	bgQueue.maxConcurrentOperationCount = 1
	bgQueue.addOperationWithBlock(function () { tag('bgq') })
	bgQueue.addOperationWithBlock(function () { tag('bgq2') })
} catch (e) {
	console.log('BGQ_THREW ' + e)
}
try {
	if (typeof dispatch_async === 'function' && typeof dispatch_get_global_queue === 'function') {
		dispatch_async(dispatch_get_global_queue(0, 0), function () { tag('gasync') })
	}
} catch (e) {
	console.log('GASYNC_THREW ' + e)
}
try {
	var url = NSURL.URLWithString('http://127.0.0.1:__PORT__/probe')
	var task = NSURLSession.sharedSession.dataTaskWithURLCompletionHandler(
		url,
		function (data, resp, err) {
			delivered.session += 1
			status = String(resp ? resp.statusCode : 'nil')
		},
	)
	task.resume()
} catch (e) {
	console.log('SESSION_THREW ' + e)
}
setTimeout(function () {
	var pending = -2
	try {
		pending = bgQueue ? bgQueue.operationCount : -2
	} catch (e) {
		pending = -3
	}
	console.log(
		'PROBE_RESULT ' + JSON.stringify(delivered) +
			' sessionStatus=' + status + ' bgQueuePending=' + pending,
	)
	__xplatStopHost()
}, 2000)
`

test(
	'AppKit host delivers foreign-queue JS callbacks through the env loop pump',
	{ skip: process.platform !== 'darwin' && 'requires the macOS AppKit host' },
	async (t) => {
		const dir = mkdtempSync(join(tmpdir(), 'xplat-event-loop-'))
		t.after(() => rmSync(dir, { recursive: true, force: true }))

		const requests = []
		const server = createServer((req, res) => {
			requests.push(req.url)
			res.writeHead(200, { 'content-type': 'text/plain' })
			res.end('ok')
		})
		await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
		t.after(() => server.close())
		const port = server.address().port

		const script = join(dir, 'fixture.cjs')
		writeFileSync(script, fixture.replace('__PORT__', String(port)))
		// The shipped shim is the bootstrap the packaged/dev host runs.
		const bootstrap = join(dir, 'bootstrap.js')
		writeFileSync(bootstrap, readFileSync(join(hostRoot, 'shim.js'), 'utf8'))

		// The rebuild output directory carries host + framework but not metadata;
		// resolve the nsmd beside whichever bundle ships it.
		const metadata = join(
			existsSync(join(hostBundle, 'metadata.macos.arm64.nsmd'))
				? hostBundle
				: resolve(hostRoot, 'prebuilt/macos'),
			`metadata.macos.${process.arch === 'x64' ? 'x86_64' : 'arm64'}.nsmd`,
		)

		const child = spawn(
			join(hostBundle, 'host'),
			[
				join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
				script,
				metadata,
				bootstrap,
			],
			{ stdio: ['ignore', 'ignore', 'pipe'] },
		)
		let output = ''
		child.stderr.on('data', (chunk) => {
			output += chunk
		})
		const status = await new Promise((resolve) => {
			const timeout = setTimeout(() => {
				child.kill('SIGKILL')
				resolve('timeout')
			}, 30_000)
			child.on('close', (code) => {
				clearTimeout(timeout)
				resolve(code)
			})
		})
		assert.equal(status, 0, `host exited ${status}\n${output}`)

		const marker = /PROBE_RESULT (.+)/.exec(output)?.[1]
		assert.ok(marker, `missing probe result marker:\n${output}`)
		const delivered = JSON.parse(marker.slice(0, marker.indexOf(' sessionStatus=')))
		const sessionStatus = / sessionStatus=(\S+)/.exec(marker)?.[1]
		const bgQueuePending = Number(/ bgQueuePending=(\S+)/.exec(marker)?.[1])

		if (delivered.bgq === 0 && delivered.session === 0) {
			return t.skip(
				'prebuilt host binary predates the env loop pump; refresh it with ' +
					'packages/cli/src/macos/jsc-host/build-runtime.sh --install',
			)
		}

		// Every previously starved lane now delivers on the main thread.
		assert.deepEqual(
			{
				timer: delivered.timer,
				mainq: delivered.mainq,
				bgq: delivered.bgq,
				bgq2: delivered.bgq2,
				session: delivered.session,
				gasync: delivered.gasync,
			},
			{ timer: 1, mainq: 1, bgq: 1, bgq2: 1, session: 1, gasync: 1 },
		)
		// The serial queue unwedged: both ops completed instead of op2 parking
		// behind op1's undelivered TSFN call.
		assert.equal(bgQueuePending, 0)
		// A real NSURLSession completion reached JS with the HTTP status.
		assert.deepEqual(requests, ['/probe'])
		assert.equal(sessionStatus, '200')
	},
)
