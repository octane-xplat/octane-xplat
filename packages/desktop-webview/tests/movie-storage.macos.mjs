// AppKit/JSC runtime check for the TypeScript macOS webview host. Bundles the
// packed package's src/macos.macos.ts and drives it inside the real prebuilt
// host binary — the same contract the removed Swift fixture covered: staged
// chunk commits, no-overwrite, reads, cancellation/disposal cleanup, and
// multi-owner isolation. Nonvisual: storage/bytes only, no capture.
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
  throw new Error('Movie storage checks require macOS')
}

const root = fileURLToPath(new URL('..', import.meta.url))
const directory = mkdtempSync(join(tmpdir(), 'xplat-movie-storage-'))

const run = (command, args, options = {}) =>
  execFileSync(command, args, { stdio: 'inherit', timeout: 120_000, ...options })

try {
  // Pack the package so the test exercises the published layout.
  const extracted = join(directory, 'extracted')

  mkdirSync(extracted)
  run('bun', ['pm', 'pack', '--destination', directory], { cwd: root })

  const tarball = readdirSync(directory).find((name) => name.endsWith('.tgz'))

  run('tar', ['-xzf', join(directory, tarball), '-C', extracted])

  const packed = join(extracted, 'package')

  // A playable generated movie fixture qualifies bytes/storage, not capture.
  const fixture = join(directory, 'fixture.mp4')

  run('ffmpeg', [
    '-v',
    'error',
    '-f',
    'lavfi',
    '-i',
    'color=black:s=64x48:r=10',
    '-t',
    '0.3',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    fixture,
  ])

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
      name: 'movie-storage-fixture',
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
const check = (condition, message) => { if (!condition) throw Error(message) }
const fixturePath = ${JSON.stringify(fixture)}
const fixture = NSData.dataWithContentsOfURL(NSURL.fileURLWithPath(fixturePath))
check(fixture != null && fixture.length > 0, 'fixture readable')
const base64 = fixture.base64EncodedStringWithOptions(0)
const half = Math.floor(base64.length / 2)
const parent = NSView.new()
const host = createMacOSWebView(parent)
const prefix = NSUUID.UUID().UUIDString
const directoryUrl = NSURL.URLWithString(host.movieDirectory())
const rootDir = directoryUrl.URLByAppendingPathComponentIsDirectory(prefix, true)
NSFileManager.defaultManager.createDirectoryAtURLWithIntermediateDirectoriesAttributesError(rootDir, true, null)
const target = (name) => rootDir.URLByAppendingPathComponent(name + '.mp4')
const entries = () => {
	const list = NSFileManager.defaultManager.contentsOfDirectoryAtPathError(String(rootDir.path))
	const out = []
	for (let i = 0; i < (list ? list.count : 0); i++) out.push(String(list.objectAtIndex(i)))
	return out.sort()
}
const write = (url, text, final, owner) =>
	(owner ?? host).writeMovieFileChunk({ fileUrl: String(url.absoluteString), base64: text, final: final === true })
const chunk = (s) => {
	const data = NSString.stringWithString(s).dataUsingEncoding(4)
	return data.base64EncodedStringWithOptions(0)
}
let checks = 0
const expect = (value, label) => { if (!value) throw Error(label); checks++ }

const movie = target('movie')
const movieData = chunk('xplat-movie-storage-payload')
const raw = NSString.stringWithString('xplat-movie-storage-payload').dataUsingEncoding(4)
const split = Math.floor(raw.length / 2)
const firstHalf = raw.subdataWithRange({ location: 0, length: split }).base64EncodedStringWithOptions(0)
const secondHalf = raw.subdataWithRange({ location: split, length: raw.length - split }).base64EncodedStringWithOptions(0)
expect(write(movie, firstHalf)?.ok === true, 'first chunk acknowledged')
expect(!NSFileManager.defaultManager.fileExistsAtPath(String(movie.path)), 'staged bytes stay unpublished')
const committed = write(movie, secondHalf, true)
expect(committed != null && committed.uri === String(movie.absoluteString), 'final publishes destination')
const roundTrip = String(NSData.dataWithContentsOfURL(movie).base64EncodedStringWithOptions(0))
expect(roundTrip === movieData, 'exact movie bytes survive commit')
expect(write(movie, chunk('x'), true) == null, 'existing output is never overwritten')

const read = host.readMovieFileChunk({ fileUrl: String(movie.absoluteString), offset: 0, length: movieData.length })
expect(read === movieData, 'reopen bytes match')
for (const length of [-1, 0, 4 * 1024 * 1024 + 1]) {
	expect(host.readMovieFileChunk({ fileUrl: String(movie.absoluteString), offset: 0, length }) == null, 'invalid read length rejected ' + length)
}
expect(host.readMovieFileChunk({ fileUrl: String(movie.absoluteString), offset: -1, length: 1 }) == null, 'negative read offset rejected')
expect(host.readMovieFile(String(movie.absoluteString)) === movieData, 'whole read matches')

const cancelled = target('cancelled')
expect(write(cancelled, chunk('y')) != null, 'stage before cancellation')
expect(host.deleteMovieFile(String(cancelled.absoluteString)), 'cancel removes owned stage')
expect(entries().join(',') === 'movie.mp4', 'no cancellation residue: ' + entries())
const failed = target('failed')
expect(write(failed, chunk('z')) != null, 'stage before failure')
expect(host.writeMovieFileChunk({ fileUrl: String(failed.absoluteString), base64: '!' }) == null, 'invalid chunk fails')
expect(entries().join(',') === 'movie.mp4', 'failed stage removed')

// Two owners never append to each other's unfinished output.
const other = createMacOSWebView(parent)
const shared = target('shared')
expect(write(shared, chunk('a')) != null, 'first owner stages')
expect(write(shared, movieData, true, other) != null, 'second owner commits its own bytes')
expect(String(NSData.dataWithContentsOfURL(shared).base64EncodedStringWithOptions(0)) === movieData, 'foreign staging bytes never enter movie')
expect(write(shared, chunk('b'), true) == null, 'late first owner cannot overwrite')
expect(entries().join(',') === 'movie.mp4,shared.mp4', 'conflict cleans only own stage: ' + entries())

const abandoned = target('abandoned')
expect(write(abandoned, chunk('c')) != null, 'stage before disposal')
host.dispose()
expect(entries().join(',') === 'movie.mp4,shared.mp4', 'dispose removes unfinished stages')
expect(write(target('late'), chunk('d')) == null, 'disposed host rejects chunks')
const reopened = createMacOSWebView(parent)
const info = reopened.movieFileInfo(String(movie.absoluteString))
expect(info != null && info.exists === true, 'new host reopens durable output after disposal')
expect(reopened.readMovieFile(String(movie.absoluteString)) === movieData, 'release preserves stored clip')
expect(reopened.writeMovieFile({ fileUrl: String(target('whole').absoluteString), base64: movieData })?.uri === String(target('whole').absoluteString), 'whole-file write commits')
expect(reopened.mediaPermissionStatus('camera') === 'undeclared' || typeof reopened.mediaPermissionStatus('camera') === 'string', 'media status answers')
other.dispose()
reopened.dispose()
NSFileManager.defaultManager.removeItemAtURLError(rootDir)
console.log('MOVIE_STORAGE_OK: ' + checks + ' checks; fixture media, no capture')
try { __xplatStopHost() } catch {}
try { NSApplication.sharedApplication.terminate(null) } catch {}
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
      code === 0
        ? resolveOutput(text)
        : reject(new Error(`host exited ${code} ${signal}: ${text.slice(-4000)}`))
    })
  })

  assert.match(output, /MOVIE_STORAGE_OK/, output)
  console.log(output.match(/MOVIE_STORAGE_OK[^\n]*/)[0])
} finally {
  rmSync(directory, { recursive: true, force: true })
}
