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

// The napi backend used to invoke JS-backed ObjC method IMPs and C-function
// callbacks directly on whatever thread called them (upstream
// NativeScript/runtimes#108): NSObject.extend members Apple dispatches from a
// spawned thread or background queue crashed the process dereferencing the
// JS-thread env. The runtime now marshals the whole callback body — argument
// conversion, the JS call, and the return conversion — onto the JS run loop
// while the invoking frame parks until ret is filled. This boots the real
// binary and exercises the filed shape (NSThread-detached selector), a
// synchronous return through NSInvocationOperation, and a marshal posted
// while another delivery is in flight.
const fixture = `
var delivered = { pings: 0, respondRuns: 0, respondOnMain: 0, nestedPost: 0 }
var Delegate = NSObject.extend(
	{
		ping: function () {
			delivered.pings += 1
			return 42
		},
		respond: function () {
			delivered.respondRuns += 1
			delivered.respondOnMain += NSThread.isMainThread ? 1 : 0
			if (delivered.nestedPost === 0) {
				delivered.nestedPost = 1
				NSThread.detachNewThreadSelectorToTargetWithObject(
					NSSelectorFromString('ping'),
					this,
					null,
				)
			}
			return NSString.stringWithString('PONG_FROM_JS')
		},
	},
	{
		exposedMethods: {
			ping: { returns: interop.types.int32 },
			respond: { returns: interop.types.id },
		},
	},
)
var obj = Delegate.new()
console.log('PING_MAIN_RESULT=' + obj.ping())
for (var i = 0; i < 3; i++) {
	NSThread.detachNewThreadSelectorToTargetWithObject(NSSelectorFromString('ping'), obj, null)
}
console.log('DETACHED_X3')
try {
	var op = NSInvocationOperation.alloc().initWithTargetSelectorObject(
		obj,
		NSSelectorFromString('respond'),
		null,
	)
	NSOperationQueue.alloc().init().addOperation(op)
	globalThis.__op = op
} catch (e) {
	console.log('OP_THREW ' + e)
}
setTimeout(() => {
	var op = globalThis.__op
	var opFinished = op == null ? -2 : typeof op.isFinished === 'undefined' ? -3 : op.isFinished ? 1 : 0
	var opResult = opFinished === 1 ? String(op.result != null ? op.result : 'nil') : 'unread'
	console.log(
		'PROBE_RESULT ' + JSON.stringify(delivered) +
			' opFinished=' + opFinished + ' opResult=' + opResult,
	)
	__xplatStopHost()
}, 3000)
`

test(
  'AppKit host marshals foreign-thread JS method IMPs onto the JS thread',
  { skip: process.platform !== 'darwin' && 'requires the macOS AppKit host' },
  async (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'xplat-foreign-imp-'))

    t.after(() => rmSync(dir, { recursive: true, force: true }))

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

    // Before the patch this process segfaulted inside JSMethodCallback on the
    // spawned thread; a clean exit is itself the regression signal.
    assert.equal(status, 0, `host exited ${status}\n${output}`)
    assert.match(output, /PING_MAIN_RESULT=42/)
    assert.match(output, /DETACHED_X3/)

    const marker = /PROBE_RESULT (.+)/.exec(output)?.[1]

    assert.ok(marker, `missing probe result marker:\n${output}`)

    const delivered = JSON.parse(marker.slice(0, marker.indexOf(' opFinished=')))
    const opFinished = Number(/ opFinished=(\S+)/.exec(marker)?.[1])
    const opResult = / opResult=(\S+)/.exec(marker)?.[1]

    // Main-thread control + 3 detached NSThread IMPs + the nested post from
    // inside respond all delivered on the JS thread.
    assert.deepEqual(delivered, {
      pings: 5,
      respondRuns: 1,
      respondOnMain: 1,
      nestedPost: 1,
    })

    // The queue thread's caller frame parked until main filled ret, and the
    // NSString the JS callback returned made it back through the boundary.
    assert.equal(opFinished, 1)
    assert.equal(opResult, 'PONG_FROM_JS')
  },
)
