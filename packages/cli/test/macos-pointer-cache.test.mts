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

function boot(fixture, argv = []) {
  const dir = mkdtempSync(join(tmpdir(), 'xplat-pointer-cache-'))
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
      ...argv,
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

// runtimes#109: Pointer::finalize posts its g_pointerCache erase to the JS
// run loop so GC finalization never mutates the map underneath a live
// iterator. That deferral opens a second window: the dead wrapper's erase can
// run after a same-key lookup already purged the stale entry and cached a
// replacement. The shipped framework must only erase an entry that is still
// dead — a live replacement wrapper's entry has to survive the drain, or
// pointer-wrapper identity (and its weak ref) is lost for that key.
//
// The fixture seeds 30 distinct keys with interop.handleof wrappers, drops
// every wrapper inside the main eval turn, then on a later turn runs
// allocation pressure so JSC finalizes them and queues their deferred map
// erases — while a replacement handleof wrapper for the same key is already
// cached and still alive. The erase that drains afterwards must keep each
// live entry. On the pre-hardening framework every deferred erase removes the
// replacement's entry (a subsequent lookup materializes a different wrapper);
// on the shipped framework none do.
const identityFixture = `
var K = 30
var sink = []
var objs = []
var keepAlive = []
function seed(o) {
	var w1 = interop.handleof(o)
	w1.__tag = 1
}
for (var i = 0; i < K; i++) {
	var o = NSObject.alloc().init()
	objs.push(o)
	seed(o)
}
function pressure() {
	for (var i = 0; i < 60; i++) sink.push(new ArrayBuffer(2 * 1024 * 1024))
	for (var i = 0; i < 150000; i++) sink.push({ a: i, b: [i, i + 1] })
	sink.length = 0
}
setTimeout(function () {
	pressure()
	var w2s = []
	var def = 0
	for (var i = 0; i < K; i++) {
		var w2 = interop.handleof(objs[i])
		w2s.push(w2)
		keepAlive.push(w2)
		if (w2.__tag !== 1) def++
	}
	setTimeout(function () {
		var broken = 0
		for (var i = 0; i < K; i++) {
			var w3 = interop.handleof(objs[i])
			if (w2s[i].__tag !== 1 && w3 !== w2s[i]) broken++
		}
		setTimeout(function () {
			for (var i = 0; i < K; i++) {
				var w4 = interop.handleof(objs[i])
				if (w2s[i].__tag !== 1 && w4 !== w2s[i]) broken++
			}
			console.log('PROBE_RESULT ' + JSON.stringify({ keys: K, definitive: def, broken: broken }))
			__xplatStopHost()
		}, 0)
	}, 0)
}, 0)
`

test(
  'AppKit host deferred pointer-cache finalize preserves live same-key entries',
  { skip: process.platform !== 'darwin' && 'requires the macOS AppKit host' },
  async (t) => {
    const run = boot(identityFixture)

    t.after(() => rmSync(run.dir, { recursive: true, force: true }))

    const status = await run.status
    const output = run.output()

    assert.equal(status, 0, `host exited ${status}\n${output}`)

    const marker = /PROBE_RESULT (.+)/.exec(output)?.[1]

    assert.ok(marker, `missing probe result marker:\n${output}`)

    const result = JSON.parse(marker)

    // At least one seed wrapper must have been collected and re-cached for
    // the assertion to have teeth; rounds where the lookup returned the
    // still-live original wrapper carry no signal.
    assert.ok(result.definitive >= 1, `no definitive finalize/replacement rounds: ${marker}`)
    assert.equal(result.broken, 0, `deferred erase removed ${result.broken} live same-key entries`)
  },
)

// GC/finalization churn smoke: pointer wrappers cycle through the cache while
// dead pools queue deferred erases across runloop drains and real bridge calls
// (objectAtIndex -> getObject -> Pointer::create) hit the same cache. On the
// pre-patch framework this re-entrant finalization class produced intermittent
// SIGSEGV during boot-scale eval; a clean exit plus a drained run loop is the
// maintained canary.
const churnFixture = `
var FAKE = 0x5f0000000000n
var HOTKEYS = 8
var POOL = 1024
var arr = NSMutableArray.array()
arr.addObject(NSObject.alloc().init())
var sink = []
function churn(n) {
	for (var j = 0; j < n; j++) sink.push({ x: j, y: [j, j + 1, j + 2] })
	if (sink.length > 60000) sink.length = 0
}
for (var k = 0; k < POOL; k++) {
	var dead = new interop.Pointer(FAKE + BigInt(0x100000 + k) * 0x1000n)
	dead = null
}
var N = 30000
var i = 0
for (; i < N; i++) {
	var p = new interop.Pointer(FAKE + BigInt(i % HOTKEYS) * 0x1000n)
	p = null
	var o = arr.objectAtIndex(0)
	o = null
	var dead2 = new interop.Pointer(FAKE + BigInt(0x100000 + (i % POOL)) * 0x1000n)
	dead2 = null
	churn(24)
}
console.log('STRESS_DONE iters=' + i)
setTimeout(function () {
	console.log('RUNLOOP_DRAIN_OK')
	__xplatStopHost()
}, 250)
`

test(
  'AppKit host survives pointer-cache churn under GC finalization',
  { skip: process.platform !== 'darwin' && 'requires the macOS AppKit host' },
  async (t) => {
    const run = boot(churnFixture)

    t.after(() => rmSync(run.dir, { recursive: true, force: true }))

    const status = await run.status
    const output = run.output()

    assert.equal(status, 0, `host exited ${status}\n${output}`)
    assert.match(output, /STRESS_DONE iters=30000/)
    assert.match(output, /RUNLOOP_DRAIN_OK/)
  },
)
