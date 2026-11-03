import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
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
const probeSource = resolve(
  dirname(fileURLToPath(import.meta.url)),
  'fixtures/macos-block-lifetime/block-probe.m',
)

// ObjC completion/decision blocks passed into JS-implemented delegate methods
// used to arrive as FunctionPointer wrappers over the raw NSBlock* with zero
// bridge ownership (upstream NativeScript/runtimes#111): the caller's heap
// block could be freed and a stack block always died with the callee frame,
// so an async JS invoke dereferenced a dead block (SIGBUS/SIGSEGV). The
// runtime now _Block_copy's incoming blocks at wrap time and releases the
// owned copy in the FunctionPointer finalizer. This compiles a no-ARC
// provider that hands both shapes into JS through both marshalling paths —
// untyped `id` params (wrapWithEncoding) and a protocol-metadata `@?` param
// (BlockTypeConv -> wrap) — then calls the stored handlers after the
// delegate calls have returned.
const fixture = `
var kept = { untyped: [], declared: [] }
var Untyped = NSObject.extend(
	{
		xplatTake: function (handler) {
			kept.untyped.push(handler)
		},
	},
	{
		exposedMethods: {
			'xplatTake:': { params: [interop.types.id], returns: interop.types.void },
		},
	},
)
var Declared = NSObject.extend(
	{
		webViewDecidePolicyForNavigationActionDecisionHandler: function (wv, act, handler) {
			kept.declared.push(handler)
		},
	},
	{ protocols: [WKNavigationDelegate] },
)
var dlh = dlopen('__DYLIB__', 2)
console.log('XPLAT_DLOPEN=' + (dlh != null))
var provider = NSThread.mainThread.threadDictionary.objectForKey('xplatBlockLifetime')
console.log('XPLAT_PROVIDER=' + (provider != null))
var untyped = Untyped.new()
var declared = Declared.new()
provider.performSelectorWithObject(NSSelectorFromString('runThenFree:'), untyped)
provider.performSelectorWithObject(NSSelectorFromString('runStack:'), untyped)
provider.performSelectorWithObject(NSSelectorFromString('clobber'), null)
provider.performSelectorWithObject(NSSelectorFromString('runDeclaredFree:'), declared)
provider.performSelectorWithObject(NSSelectorFromString('runDeclaredStack:'), declared)
provider.performSelectorWithObject(NSSelectorFromString('clobber'), null)
console.log('XPLAT_STORED untyped=' + kept.untyped.length + ' declared=' + kept.declared.length)
setTimeout(function () {
	var calls = []
	for (var i = 0; i < kept.untyped.length; i++) {
		try {
			kept.untyped[i]()
			calls.push('untyped' + i + '=ok')
		} catch (e) {
			calls.push('untyped' + i + '=threw:' + e)
		}
	}
	for (var j = 0; j < kept.declared.length; j++) {
		try {
			kept.declared[j](1)
			calls.push('declared' + j + '=ok')
		} catch (e) {
			calls.push('declared' + j + '=threw:' + e)
		}
	}
	console.log('PROBE_RESULT ' + calls.join(' '))
	__xplatStopHost()
}, 800)
`

test(
  'AppKit host owns incoming ObjC blocks across async delegate calls',
  { skip: process.platform !== 'darwin' && 'requires the macOS AppKit host' },
  async (t) => {
    const clang = spawnSync('xcrun', ['--sdk', 'macosx', '--find', 'clang'], {
      encoding: 'utf8',
    })
    const sdk = spawnSync('xcrun', ['--sdk', 'macosx', '--show-sdk-path'], {
      encoding: 'utf8',
    })
    if (clang.status !== 0 || sdk.status !== 0) {
      t.skip('no Xcode clang to build the block-lifetime provider dylib')
      return
    }

    const dir = mkdtempSync(join(tmpdir(), 'xplat-block-lifetime-'))
    t.after(() => rmSync(dir, { recursive: true, force: true }))

    // No ARC: stack literals stay __NSStackBlock__ and the explicit release
    // models the caller freeing its last reference after the delegate call.
    const dylib = join(dir, 'block-probe.dylib')
    const compile = spawnSync(
      clang.stdout.trim(),
      [
        '-dynamiclib',
        '-fno-objc-arc',
        '-isysroot',
        sdk.stdout.trim(),
        '-framework',
        'Foundation',
        '-o',
        dylib,
        probeSource,
      ],
      { encoding: 'utf8' },
    )
    assert.equal(compile.status, 0, `provider compile failed: ${compile.stderr ?? ''}`)

    const script = join(dir, 'fixture.cjs')
    writeFileSync(script, fixture.replace('__DYLIB__', dylib))
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
      {
        stdio: ['ignore', 'ignore', 'pipe'],
        env: { ...process.env, MallocScribble: '1' },
      },
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

    // Before the patch the host died inside callFunctionPointerAsBlockDirect
    // dereferencing the dead block->invoke (SIGBUS on the freed heap block,
    // SIGSEGV on the clobbered stack block); a clean exit is itself the
    // regression signal.
    assert.equal(status, 0, `host exited ${status}\n${output}`)
    assert.match(output, /XPLAT_DLOPEN=true/)
    assert.match(output, /XPLAT_STORED untyped=2 declared=2/)
    assert.match(output, /XPLAT_BLOCK_FIRE heap marker=300/)
    assert.match(output, /XPLAT_BLOCK_FIRE stack marker=400/)
    assert.match(output, /XPLAT_BLOCK_FIRE declared-heap marker=500 policy=1/)
    assert.match(output, /XPLAT_BLOCK_FIRE declared-stack marker=600 policy=1/)
    assert.match(output, /PROBE_RESULT untyped0=ok untyped1=ok declared0=ok declared1=ok/)
  },
)
