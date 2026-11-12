import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const hostRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../src/macos/jsc-host')
const hostBundle = process.env.XPLAT_JSC_HOST_BUNDLE ?? join(hostRoot, 'prebuilt/macos')

// A removed monitor's JS wrapper owns the last retain on AppKit's block
// container. GC releases that container and its JS-backed block. NativeScript
// must not delete the block's weak JS reference inline in JSC's sweep: that
// property lookup may allocate. No renderer import or physical input is needed.
const fixture = `
var rounds = 0
var callbacks = []
function churn() {
  for (var i = 0; i < 300; i++) {
    var handler = function (event) { return event }
    callbacks.push(new WeakRef(handler))
    var token = NSEvent.addLocalMonitorForEventsMatchingMaskHandler(1024, handler)
    if (!token) throw new Error('monitor acquisition failed')
    NSEvent.removeMonitor(token)
  }
  for (var i = 0; i < 50000; i++) {
    var object = { a: i, b: [i, i + 1], c: new Array(20).fill(i) }
  }
  console.log('MONITOR_ROUND ' + (++rounds))
  if (rounds < 12) setTimeout(churn, 0)
  else {
    var collected = callbacks.filter(function (reference) { return reference.deref() === undefined }).length
    console.log('MONITOR_COLLECTED ' + collected)
    if (!collected) throw new Error('no retired callback was collected')
    console.log('MONITOR_DONE')
    __xplatStopHost()
  }
}
setTimeout(churn, 0)
`

test(
  'AppKit removed JS-backed monitor blocks survive GC and host shutdown',
  {
    skip: process.platform !== 'darwin' && 'requires the macOS AppKit host',
  },
  (t) => {
    const directory = mkdtempSync(join(tmpdir(), 'xplat-block-finalization-'))

    t.after(() => rmSync(directory, { recursive: true, force: true }))

    const script = join(directory, 'fixture.cjs')
    const bootstrap = join(directory, 'bootstrap.js')

    writeFileSync(script, fixture)
    writeFileSync(bootstrap, readFileSync(join(hostRoot, 'shim.js')))

    const metadataName = `metadata.macos.${process.arch === 'x64' ? 'x86_64' : 'arm64'}.nsmd`
    const metadata = join(
      existsSync(join(hostBundle, metadataName)) ? hostBundle : join(hostRoot, 'prebuilt/macos'),
      metadataName,
    )

    for (let attempt = 0; attempt < 3; attempt++) {
      const result = spawnSync(
        join(hostBundle, 'host'),
        [
          join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
          script,
          metadata,
          bootstrap,
        ],
        { encoding: 'utf8', timeout: 60_000 },
      )

      const output = (result.stdout ?? '') + (result.stderr ?? '')

      assert.equal(result.error, undefined, String(result.error))
      assert.equal(result.signal, null, output)
      assert.equal(result.status, 0, output)
      assert.equal((output.match(/MONITOR_ROUND /g) ?? []).length, 12, output)
      assert.match(output, /MONITOR_COLLECTED [1-9][0-9]*/)
      t.diagnostic(output.match(/MONITOR_COLLECTED [0-9]+/)?.[0])
      assert.match(output, /MONITOR_DONE/)
      assert.match(output, /host run loop returned/)
    }
  },
)
