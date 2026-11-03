// Real AppKit capture dispatch for src/backend.macos.ts inside the node-api
// ObjC runtime — runs under Bun because the package ships extensionless TS.
// Loads the shipped module, mounts an NSView offscreen and asserts real
// PNG/JPEG bytes, owned temp-file lifecycle and validation refusals.
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { join } from 'node:path'
const root = fileURLToPath(new URL('..', import.meta.url))
const repo = fileURLToPath(new URL('../../..', import.meta.url))
const require = createRequire(join(repo, 'packages/platform/package.json'))
const runtime = require.resolve('@nativescript/macos-node-api')
const arch = process.arch === 'arm64' ? 'arm64' : 'x86_64'
process.env.METADATA_PATH = join(
  repo,
  'packages/cli/src/macos/jsc-host/prebuilt/macos',
  `metadata.macos.${arch}.nsmd`,
)

await import(pathToFileURL(runtime).href)
const { backend } = await import(pathToFileURL(join(root, 'src/backend.macos.ts')).href)
const { normalizeOptions } = await import(pathToFileURL(join(root, 'src/options.ts')).href)

assert.equal(typeof NSApplication, 'function', 'AppKit bridge unavailable')
assert.deepEqual(backend.capabilities(), {
  view: true,
  screen: false,
  formats: ['png', 'jpg'],
  scrollContent: false,
})

const app = NSApplication.sharedApplication
app.setActivationPolicy(NSApplicationActivationPolicy.Accessory)
const win = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
  NSMakeRect(0, 0, 400, 300),
  NSWindowStyleMask.Titled,
  NSBackingStoreType.Buffered,
  false,
)

const view = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 120, 80))
view.wantsLayer = true
const text = NSTextField.alloc().initWithFrame(NSMakeRect(5, 30, 110, 40))
text.stringValue = 'CAPTURE'
text.font = NSFont.boldSystemFontOfSize(28)
text.bezeled = false
text.drawsBackground = false
text.editable = false
view.addSubview(text)
win.contentView.addSubview(view)
win.orderBack(null)

const uri = await backend.capture(view, normalizeOptions({ format: 'png', result: 'tmpfile' }))
assert.match(uri, /^file:\/\/.*\.png$/)
const path = new URL(uri).pathname
assert.equal(existsSync(path), true, 'tmpfile write')
backend.release(uri)
assert.equal(existsSync(path), false, 'owned release deletes')
backend.release('file:///foreign-nothing-owned.png')

const png = Buffer.from(
  await backend.capture(
    view,
    normalizeOptions({ format: 'png', result: 'base64', width: 60, height: 40 }),
  ),
  'base64',
)

assert.equal(png.subarray(0, 4).toString('hex'), '89504e47', 'png signature')
const dataURI = await backend.capture(
  view,
  normalizeOptions({ format: 'jpg', result: 'data-uri', quality: 0.9 }),
)

assert.ok(dataURI.startsWith('data:image/jpeg;base64,'), 'jpeg data uri')
assert.equal(
  Buffer.from(dataURI.slice('data:image/jpeg;base64,'.length), 'base64')
    .subarray(0, 2)
    .toString('hex'),
  'ffd8',
  'jpeg signature',
)

// Nonblank content: decode the capture and count distinct pixel colors.
const full = Buffer.from(
  await backend.capture(view, normalizeOptions({ format: 'png', result: 'base64' })),
  'base64',
)

const decoded = NSBitmapImageRep.imageRepWithData(
  NSData.dataWithBytesLength(new Uint8Array(full).buffer, full.length),
)

const pixels = new Uint8Array(
  objc.getArrayBuffer(
    decoded.bitmapData,
    decoded.pixelsWide * decoded.pixelsHigh * decoded.samplesPerPixel,
  ),
)

const colors = new Set()
for (let i = 0; i < pixels.length; i += 4) {
  colors.add((pixels[i] << 16) | (pixels[i + 1] << 8) | pixels[i + 2])
}

assert.ok(colors.size > 50, `nonblank capture (${colors.size} colors)`)

const detached = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 50, 50))
await assert.rejects(backend.capture(detached, normalizeOptions()), /^Error: View is detached$/)
await assert.rejects(backend.capture(view, normalizeOptions({ format: 'webp' })), /unavailable/i)
await assert.rejects(
  backend.capture(
    view,
    normalizeOptions({ format: 'png', result: 'base64', useRenderInContext: true }),
  ),
  /unavailable/i,
)

await assert.rejects(backend.captureScreen(normalizeOptions()), /unavailable/i)
win.close()
console.log(
  `macOS runtime capture: tmpfile/release/png/jpeg/validation assertions passed (${colors.size} colors, backing scale ${win.backingScaleFactor}).`,
)
