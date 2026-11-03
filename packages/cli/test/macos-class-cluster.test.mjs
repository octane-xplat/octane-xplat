import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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

function boot(fixture) {
	const dir = mkdtempSync(join(tmpdir(), 'xplat-class-cluster-'))
	const script = join(dir, 'fixture.cjs')
	writeFileSync(script, fixture)
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
	const status = new Promise((resolve) => {
		const timeout = setTimeout(() => {
			child.kill('SIGKILL')
			resolve('timeout')
		}, 60_000)
		child.on('close', (code) => {
			clearTimeout(timeout)
			resolve(code)
		})
	})
	return { status, output: () => output, dir }
}

// runtimes#110: the napi bridge resolved an object's JS wrapper by walking the
// real isa chain to the first registered class and *unconditionally* preferred
// that constructor over the API's declared return type. Class clusters whose
// private concrete class skips the public front — every NSURLSession task
// factory, e.g. __NSURLSessionWebSocketTask -> __NSCFLocalSessionTask ->
// NSURLSessionTask, which never reaches NSURLSessionWebSocketTask — lost the
// front's API surface and reported `instanceof` false (a second raw isa walk
// in classHasInstance). The framework must keep the declared type when the
// isa result resolves above it, and evaluate instanceof via isKindOfClass:.
const fixture = `
var checks = []
function t(name, v) { checks.push([name, v]) }

var session = NSURLSession.sharedSession
var task = session.webSocketTaskWithURL(NSURL.URLWithString('ws://127.0.0.1:9/'))
t('ws.proto', Object.getPrototypeOf(task) === NSURLSessionWebSocketTask.prototype)
t('ws.sendMessage', typeof task.sendMessageCompletionHandler === 'function')
t('ws.receiveMessage', typeof task.receiveMessageWithCompletionHandler === 'function')
t('ws.sendPing', typeof task.sendPingWithPongReceiveHandler === 'function')
t('ws.cancelClose', typeof task.cancelWithCloseCodeReason === 'function')
t('ws.closeCode', typeof task.closeCode === 'number')
t('ws.maxMessageSize', typeof task.maximumMessageSize === 'number')
t('ws.resume', typeof task.resume === 'function')
t('ws.instanceof.front', task instanceof NSURLSessionWebSocketTask)
t('ws.instanceof.base', task instanceof NSURLSessionTask)
t('ws.instanceof.nsobject', task instanceof NSObject)
t('ws.isKindOf.front', task.isKindOfClass(NSURLSessionWebSocketTask))

var dl = session.downloadTaskWithURL(NSURL.URLWithString('https://127.0.0.1:9/'))
t('dl.proto', Object.getPrototypeOf(dl) === NSURLSessionDownloadTask.prototype)
t('dl.cancelByProducing', typeof dl.cancelByProducingResumeData === 'function')
t('dl.instanceof', dl instanceof NSURLSessionDownloadTask)

var st = session.streamTaskWithHostNamePort(NSString.stringWithString('localhost'), 9)
t('st.proto', Object.getPrototypeOf(st) === NSURLSessionStreamTask.prototype)
t('st.closeRead', typeof st.closeRead === 'function')
t('st.readData', typeof st.readDataOfMinLengthMaxLengthTimeoutCompletionHandler === 'function')
t('st.instanceof', st instanceof NSURLSessionStreamTask)

var req = NSURLRequest.requestWithURL(NSURL.URLWithString('https://127.0.0.1:9/'))
var up = session.uploadTaskWithRequestFromData(req, null)
t('up.proto', Object.getPrototypeOf(up) === NSURLSessionUploadTask.prototype)
t('up.instanceof.front', up instanceof NSURLSessionUploadTask)
t('up.instanceof.data', up instanceof NSURLSessionDataTask)

// Clusters whose front sits inside the concrete isa chain are unaffected in
// both directions: members still resolve and instanceof still holds.
var arr = NSMutableArray.array()
t('arr.addObject', typeof arr.addObject === 'function')
t('arr.instanceof', arr instanceof NSMutableArray)
var ms = NSMutableString.stringWithString('x')
t('ms.append', typeof ms.appendString === 'function')
t('ms.instanceof', ms instanceof NSMutableString)

// A wrapper keeps its identity round-tripping through a native container.
arr.addObject(task)
t('task.same', arr.objectAtIndex(0) === task)

// A JS-extended (NativeClass) instance still wraps at its custom constructor
// through an id-typed API.
class XplatClusterMarker extends NSObject {
	mark() { return 42 }
}
for (const key of Object.getOwnPropertyNames(XplatClusterMarker.prototype)) {
	if (key !== 'constructor') {
		Object.defineProperty(XplatClusterMarker.prototype, key, {
			...Object.getOwnPropertyDescriptor(XplatClusterMarker.prototype, key),
			enumerable: true,
		})
	}
}
NativeClass(XplatClusterMarker)
var marker = XplatClusterMarker.new()
arr.addObject(marker)
var el2 = arr.objectAtIndex(1)
t('marker.same', el2 === marker)
t('marker.member', el2.mark() === 42)

console.log('CHECKS ' + JSON.stringify(checks))
setTimeout(function () { __xplatStopHost() }, 0)
`

test(
	'AppKit host wraps class-cluster returns at the declared front type',
	{ skip: process.platform !== 'darwin' && 'requires the macOS AppKit host' },
	async (t) => {
		const run = boot(fixture)
		t.after(() => rmSync(run.dir, { recursive: true, force: true }))
		const status = await run.status
		const output = run.output()

		assert.equal(status, 0, `host exited ${status}\n${output}`)
		const marker = /CHECKS (.+)/.exec(output)?.[1]
		assert.ok(marker, `missing checks marker:\n${output}`)
		const failed = JSON.parse(marker).filter(([, v]) => v !== true)
		assert.deepEqual(failed, [], `failed checks: ${JSON.stringify(failed)}`)
	},
)
