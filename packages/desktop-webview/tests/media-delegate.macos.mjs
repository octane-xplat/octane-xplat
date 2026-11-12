// AppKit/JSC runtime check for the retained macOS media-capture boundary.
// Bundles the packed package's src/macos.macos.ts plus its Swift leaf and
// drives them inside the real prebuilt host binary: the WKUIDelegate must be
// installed, survive JS GC under the channel-state pin (WKWebView.UIDelegate
// is a weak property), deny untrusted and nil origins deterministically with
// no capture, and uninstall on dispose. An unpinned control delegate proves
// the weak-property hazard is real, not vacuous. Real getUserMedia delivery
// stays unqualified on this host (WebKit never consults the delegate — see
// .agents/docs/notes/macos-jsc-host.md), so this exercises the boundary, not
// end-to-end capture.
import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildMacOSNative, writeNativeBootstrap } from '../../cli/src/macos/native.ts'
import { hostBundle, macOSHostArch } from '../../cli/src/macos/jsc-host/runtime.ts'

if (process.platform !== 'darwin') {
  throw new Error('Media delegate checks require macOS')
}

const root = fileURLToPath(new URL('..', import.meta.url))
const directory = mkdtempSync(join(tmpdir(), 'xplat-media-delegate-'))

const run = (command, args, options = {}) =>
  execFileSync(command, args, { stdio: 'inherit', timeout: 120_000, ...options })

try {
  // Pack the package so the test exercises the published layout — including
  // the platforms/macos leaf the tarball must ship.
  const extracted = join(directory, 'extracted')

  mkdirSync(extracted)
  run('bun', ['pm', 'pack', '--destination', directory], { cwd: root })

  const tarball = readdirSync(directory).find((name) => name.endsWith('.tgz'))

  run('tar', ['-xzf', join(directory, tarball), '-C', extracted])

  const packed = join(extracted, 'package')

  // Bundle a consumer that imports the packed entry.
  const app = join(directory, 'app')

  mkdirSync(join(app, 'node_modules/@octane-xplat'), { recursive: true })
  cpSync(packed, join(app, 'node_modules/@octane-xplat/desktop-webview'), { recursive: true })
  symlinkSync(
    fileURLToPath(new URL('../../platform', import.meta.url)),
    join(app, 'node_modules/@octane-xplat/platform'),
  )

  // Native-leaf discovery resolves each dependency through node_modules.
  mkdirSync(join(app, 'node_modules/@nativescript'), { recursive: true })
  symlinkSync(
    dirname(fileURLToPath(import.meta.resolve('@nativescript/macos-node-api/package.json'))),
    join(app, 'node_modules/@nativescript/macos-node-api'),
  )

  writeFileSync(
    join(app, 'package.json'),
    JSON.stringify({
      name: 'media-delegate-fixture',
      type: 'module',
      dependencies: {
        '@octane-xplat/desktop-webview': '0.19.0',
        '@octane-xplat/platform': '0.0.0',
        '@nativescript/macos-node-api': '0.0.0',
      },
    }),
  )

  writeFileSync(
    join(app, 'fixture.mjs'),
    `import { createMacOSWebView } from '@octane-xplat/desktop-webview/macos'
let checks = 0
const expect = (value, label) => { if (!value) throw Error(label); checks++ }

const selector = 'webView:requestMediaCapturePermissionForOrigin:initiatedByFrame:type:decisionHandler:'
const parent = NSView.new()
const host = createMacOSWebView(parent)
const webView = parent.subviews.objectAtIndex(0)
expect(webView != null, 'webview installed in parent view')
expect(webView.UIDelegate != null, 'UIDelegate installed at creation')
expect(webView.UIDelegate.respondsToSelector(selector), 'delegate answers capture selector')

// Deterministic denial lanes — no usage descriptions in this fixture bundle,
// and an untrusted origin never reaches AVFoundation. WKPermissionDecision
// .deny is 2; each request must answer exactly once and must not capture.
// The leaf's probe entry runs the same trust gate and access check as the
// real delegate entry (WebKit never dispatches it on this host).
const probe = XplatWebViewNative.alloc().init()
const decisions = []
const ask = (native, origin, frame, type) => {
	decisions.length = 0
	native.decideMediaCapturePermissionFrameTypeDecisionHandler(
		origin, frame, type, (decision) => decisions.push(Number(decision)))
	return decisions.join(',')
}
expect(ask(probe, null, null, 0) === '2', 'denied once before any trusted origin')
expect(host.mediaPermissionStatus('camera') === 'undeclared', 'undeclared camera status')
expect(host.requestMediaPermission('camera') === 'undeclared', 'undeclared camera request')

probe.setMediaTrustedOrigin({ scheme: 'http', host: '127.0.0.1', port: 9 })
expect(ask(probe, null, null, 0) === '2', 'nil origin denied for camera')
expect(ask(probe, null, null, 1) === '2', 'nil origin denied for microphone')
expect(ask(probe, null, null, 2) === '2', 'nil origin denied for camera+microphone')
const foreign = { scheme: 'https', host: 'example.com', port: 443 }
const trusted = { scheme: 'http', host: '127.0.0.1', port: 9 }
expect(ask(probe, foreign, foreign, 0) === '2', 'untrusted origin denied')
expect(ask(probe, trusted, foreign, 0) === '2', 'untrusted frame denied')
expect(ask(probe, trusted, trusted, 0) === '2', 'trusted origin denied while media undeclared')
expect(ask(probe, trusted, trusted, 1) === '2', 'trusted microphone denied while undeclared')

// Retention under real GC: a WeakRef sentinel proves collections happen while
// the channel-pinned leaf delegate must stay installed and answering. An
// unretained JS-implemented delegate rides along as an observational control
// — on this host it is never collected even when unreferenced (the weak
// property alone does not expose delegates to GC), so its state is reported,
// not asserted.
const controlView = WKWebView.alloc().initWithFrameConfiguration(
	{ origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
	WKWebViewConfiguration.new(),
)
let control = NSObject.extend({}, { name: 'XplatControlUIDelegate', protocols: [WKUIDelegate] })
	.alloc().init()
controlView.UIDelegate = control
control = null
expect(controlView.UIDelegate != null, 'control delegate installed')

// GC finalization defers through PostFinalizer to the JS run loop, so the
// collection check runs on later turns with the same allocation-pressure
// recipe the pointer-cache test uses (macos-pointer-cache.test.mjs).
const pressure = () => {
	const sink = []
	for (let i = 0; i < 60; i++) sink.push(new ArrayBuffer(2 * 1024 * 1024))
	for (let i = 0; i < 150000; i++) sink.push({ a: i, b: [i, i + 1] })
	sink.length = 0
}

const weak = new WeakRef({})
let rounds = 0
let gcRan = false
const finalizeRound = () => {
	pressure()
	rounds++
	if (weak.deref() === undefined) {
		gcRan = true
	}
	if (gcRan || rounds >= 10) {
		afterCollected()
	} else {
		setTimeout(finalizeRound, 0)
	}
}

const afterCollected = () => {
	expect(gcRan, 'GC never ran under pressure — retention evidence vacuous')
	expect(webView.UIDelegate != null, 'pinned delegate survives GC')
	expect(webView.UIDelegate.respondsToSelector(selector), 'pinned delegate still answers selector')
	expect(ask(probe, trusted, trusted, 2) === '2', 'decision path still denies after GC')

	host.dispose()
	expect(webView.UIDelegate == null, 'dispose uninstalls the delegate')
	expect(webView.navigationDelegate == null, 'dispose uninstalls the navigation delegate')
	controlView.UIDelegate = null
	controlView.removeFromSuperview()

	console.log(
		'MEDIA_DELEGATE_OK: ' + checks + ' checks; deterministic denial, no capture' +
			'; control ' + (controlView.UIDelegate == null ? 'collected' : 'retained') +
			' after ' + rounds + ' GC round(s)')
	try { __xplatStopHost() } catch {}
	try { NSApplication.sharedApplication.terminate(null) } catch {}
}

setTimeout(finalizeRound, 0)
`,
  )

  run('bun', [
    'build',
    join(app, 'fixture.mjs'),
    '--outfile',
    join(app, 'dist/fixture.cjs'),
    '--format',
    'cjs',
    '--external',
    '@nativescript/macos-node-api',
    '--conditions',
    'macos,native',
  ])

  const artifact = await buildMacOSNative(app)
  const bootstrap = join(app, 'bootstrap.js')

  // The bootstrap must dlopen the leaf dylibs — raw shim.js alone leaves the
  // metadata-declared leaf classes without their native methods.
  await writeNativeBootstrap(artifact, bootstrap)

  const output = await new Promise((resolveOutput, reject) => {
    const child = spawn(
      join(hostBundle, 'host'),
      [
        join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
        join(app, 'dist/fixture.cjs'),
        artifact.metadata[macOSHostArch()],
        bootstrap,
      ],
      { cwd: app, env: { ...process.env, OCTANE_MACOS_EXTERNAL_RUNLOOP: '1' } },
    )

    let text = ''

    child.stdout.on('data', (chunk) => (text += chunk))
    child.stderr.on('data', (chunk) => (text += chunk))

    const timeout = setTimeout(() => child.kill('SIGKILL'), 120_000)

    child.once('error', reject)
    child.once('close', (code, signal) => {
      clearTimeout(timeout)
      if (code === 0) {
        resolveOutput(text)
      } else {
        reject(new Error(`host exited ${code} ${signal}: ${text.slice(-4000)}`))
      }
    })
  })

  assert.match(output, /MEDIA_DELEGATE_OK/, output)
  console.log(output.match(/MEDIA_DELEGATE_OK[^\n]*/)[0])
} finally {
  rmSync(directory, { recursive: true, force: true })
}
