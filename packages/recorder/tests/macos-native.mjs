import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript-classic'
import { build } from 'vite'
import { hostBundle } from '../../cli/src/macos/jsc-host/runtime.ts'

/** Packed leaf compilation and real AppKit/JSC host dispatch without a
 * guaranteed interactive session. Caller reserves native_builds:1.
 * Foreground-app recording qualification stays a separate hardware gate. */
export async function checkMacOSNative(packedRoot) {
  assert.equal(process.platform, 'darwin', 'macOS check requires macOS')
  assert.equal(process.arch, 'arm64', 'macOS check requires Apple Silicon')
  const app = await mkdtemp(join(tmpdir(), 'xplat-recorder-native-'))
  try {
    await mkdir(join(app, 'node_modules/@octane-xplat'), { recursive: true })
    await cp(packedRoot, join(app, 'node_modules/@octane-xplat/recorder'), { recursive: true })
    await symlink(
      fileURLToPath(new URL('../../platform', import.meta.url)),
      join(app, 'node_modules/@octane-xplat/platform'),
    )

    await writeFile(
      join(app, 'package.json'),
      JSON.stringify({
        name: 'recorder-native-consumer',
        type: 'module',
        private: true,
        dependencies: { '@octane-xplat/recorder': '0.0.0' },
      }),
    )

    const fixture = join(app, 'wav-fixture')
    const compiled = spawnSync(
      'xcrun',
      [
        'swiftc',
        fileURLToPath(new URL('./wav-fixture.macos.swift', import.meta.url)),
        '-o',
        fixture,
      ],
      { encoding: 'utf8', timeout: 60_000 },
    )

    assert.equal(compiled.status, 0, `${compiled.stdout}\n${compiled.stderr}`)
    const wavePath = join(app, 'fixture.wav')
    const written = spawnSync(fixture, [wavePath], { encoding: 'utf8', timeout: 10_000 })
    assert.equal(written.status, 0, `${written.stdout}\n${written.stderr}`)
    const sandbox = { exports: {}, Uint8Array }
    vm.runInNewContext(
      ts.transpile(readFileSync(new URL('../src/wav.ts', import.meta.url), 'utf8'), {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      }),
      sandbox,
    )

    const bytes = new Uint8Array(readFileSync(wavePath))
    const metadata = sandbox.exports.inspectPcmWav(bytes)
    assert.equal(metadata.sampleRate, 16000)
    assert.equal(metadata.channels, 2)
    assert.equal(metadata.durationSeconds, 0.01)
    const dataAt = Buffer.from(bytes).indexOf('data') + 8
    const samples = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    assert.equal(samples.getInt16(dataAt, true), 8192)
    assert.equal(samples.getInt16(dataAt + 2, true), -8192)
    console.log(
      'macOS AVFoundation finalized WAV: 16000 Hz stereo int16 samples and metadata passed',
    )

    // The TypeScript host replaces the Swift leaf: bundle the packed package
    // and drive it through the real AppKit/JSC host binary ([NSApp run]).
    const source = join(app, 'consumer.ts')
    await writeFile(
      source,
      `
import { createAudioRecorder } from '@octane-xplat/recorder'
import { createNativeRecorderHost } from 'recorder-host-impl'
const check = (value, message) => { if (!value) throw Error(message) }
const results = []
const mark = (name, value) => { results.push(name + '=' + value) }

async function run() {
const host = createNativeRecorderHost()
check(host, 'bridge must be bound inside the AppKit/JSC host')
mark('supported', createAudioRecorder().capabilities().supported)
const status = host.permissionStatus()
mark('permission', status)
mark('status-shape', JSON.parse(host.status()).durationSeconds)

if (status === 'undeclared') {
	let replied = false
	host.requestPermission((status) => { check(status === 'undeclared', 'permission reply'); replied = true })
	check(replied, 'requestPermission must reply synchronously when not undetermined')
	check(host.startTake('{}').length > 0, 'undeclared startTake must refuse')
	const recorder = createAudioRecorder()
	check(await recorder.requestPermission() === 'unsupported', 'undeclared maps to unsupported')
	try { await recorder.start(); throw Error('Unexpected start') }
	catch (error) { check(String(error).includes('undeclared'), 'undeclared start reason') }
	check(recorder.snapshot().state === 'error', 'start rejection state')
	await recorder.cancel()
	recorder.dispose()
} else if (status === 'granted') {
	// Declared + authorized fixture: full guard chain is environment evidence.
	let replied = false
	host.requestPermission((status) => { check(status === 'granted', 'permission reply'); replied = true })
	check(replied, 'requestPermission must reply synchronously when authorized')
	// The foreground guard precedes option validation, so both payloads stop
	// here in a headless fixture; option-string checks run in the unit suite.
	check(host.startTake('{"id":1}') === 'Microphone capture requires an active app', 'foreground guard order')
	check(host.startTake('{"id":1,"sampleRate":44100,"channels":1}') ===
		'Microphone capture requires an active app', 'foreground guard')
	check(host.resume() === 'Microphone interruption has not cleared', 'resume guard')
	host.pause()
	host.stop()
	host.cancel()
	const recorder = createAudioRecorder()
	try { await recorder.start(); throw Error('Unexpected start') }
	catch (error) { check(String(error).includes('active app'), 'public start guard') }
	await recorder.cancel()
	recorder.dispose()
} else if (status !== 'undetermined') {
	// denied/restricted/unavailable — settled statuses reply synchronously.
	let replied = false
	host.requestPermission((next) => { check(next === status, 'permission reply'); replied = true })
	check(replied, 'requestPermission must reply synchronously when settled')
	check(host.startTake('{"id":1,"sampleRate":44100,"channels":1}').length > 0, 'refuses without grant')
} else {
	// 'undetermined' would post a TCC prompt; do not exercise it headless.
	check(host.startTake('{"id":1,"sampleRate":44100,"channels":1}').length > 0, 'refuses without grant')
}

// Real capture through the same bridge calls the host makes — gated on the
// declared+granted lane: record() without a usage declaration can abort on
// the privacy check, and undetermined must not post a prompt here.
if (status === 'granted' && AVCaptureDevice.defaultDeviceWithMediaType(AVMediaTypeAudio) != null) {
	let finished = 'pending'
	let encodeErr = 'none'
	const Delegate = NSObject.extend(
		{
			audioRecorderDidFinishRecordingSuccessfully(_r, flag) { finished = flag },
			audioRecorderEncodeErrorDidOccurError(_r, e) { encodeErr = String((e && e.localizedDescription) || e) },
		},
		{
			protocols: [AVAudioRecorderDelegate],
			exposedMethods: {
				'audioRecorderDidFinishRecording:successfully:': {
					params: [interop.types.id, interop.types.bool], returns: interop.types.void },
				'audioRecorderEncodeErrorDidOccur:error:': {
					params: [interop.types.id, interop.types.id], returns: interop.types.void },
			},
		},
	)
	const delegate = Delegate.new()
	const manager = NSFileManager.defaultManager
	const dir = manager.temporaryDirectory.URLByAppendingPathComponentIsDirectory(
		'octane-recorder-' + NSUUID.UUID().UUIDString, true)
	check(manager.createDirectoryAtURLWithIntermediateDirectoriesAttributesError(dir, false, null, null), 'mkdir')
	const url = dir.URLByAppendingPathComponent('take.wav')
	const settings = NSMutableDictionary.dictionary()
	settings.setObjectForKey(1819304813, AVFormatIDKey)
	settings.setObjectForKey(16000, AVSampleRateKey)
	settings.setObjectForKey(1, AVNumberOfChannelsKey)
	settings.setObjectForKey(16, AVLinearPCMBitDepthKey)
	settings.setObjectForKey(false, AVLinearPCMIsBigEndianKey)
	settings.setObjectForKey(false, AVLinearPCMIsFloatKey)
	settings.setObjectForKey(false, AVLinearPCMIsNonInterleaved)
	const recorder = AVAudioRecorder.alloc().initWithURLSettingsError(url, settings, null)
	check(recorder, 'AVAudioRecorder init')
	recorder.delegate = delegate
	recorder.meteringEnabled = true
	check(recorder.prepareToRecord(), 'prepareToRecord')
	check(recorder.record(), 'record')
	await new Promise((resolve) => setTimeout(resolve, 800))
	recorder.pause()
	check(recorder.record(), 'resume')
	await new Promise((resolve) => setTimeout(resolve, 800))
	recorder.updateMeters()
	mark('averagePower', recorder.averagePowerForChannel(0))
	check(recorder.isRecording(), 'isRecording')
	recorder.stop()
	await new Promise((resolve) => setTimeout(resolve, 3000))
	check(finished === true, 'audioRecorderDidFinishRecordingSuccessfully must fire')
	check(encodeErr === 'none', 'no encode error: ' + encodeErr)
	const data = NSData.dataWithContentsOfFile(String(url.path))
	check(data && data.length > 1000, 'finalized WAV bytes')
	const base64 = data.base64EncodedStringWithOptions(0)
	check(base64.length > 0, 'base64 read-back')
	check(String(NSString.alloc().initWithDataEncoding(data.subdataWithRange(NSMakeRange(0, 4)), 4)) === 'RIFF', 'RIFF signature')
	manager.removeItemAtURLError(dir, null)
} else {
	mark('capture', 'skipped:' + status)
}

// Observer teardown must not fire after dispose.
const other = createNativeRecorderHost()
other.installObserver(() => { throw Error('event after dispose') })
other.dispose()

console.log('MACOS_RECORDER_HOST_OK ' + results.join(','))
setTimeout(() => globalThis.__xplatStopHost(), 0)
}
run().catch((error) => { console.error(String(error)); throw error })
`,
    )

    await build({
      configFile: false,
      root: app,
      resolve: {
        conditions: ['macos'],
        alias: {
          'recorder-host-impl': join(
            app,
            'node_modules/@octane-xplat/recorder/src/recorder-host.macos.ts',
          ),
        },
      },
      build: {
        outDir: join(app, 'dist'),
        minify: false,
        lib: { entry: source, formats: ['cjs'], fileName: () => 'consumer.cjs' },
      },
    })

    // Bundle.main reads a sibling Info.plist for flat binaries: one host
    // copy declares the microphone usage string, the other does not. Keep
    // them in separate directories so the declaration cannot leak.
    const nsMetadata = join(hostBundle, `metadata.macos.${process.arch}.nsmd`)
    const shim = fileURLToPath(new URL('../../cli/src/macos/jsc-host/shim.js', import.meta.url))
    const framework = join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript')
    const variants = [
      { name: 'undeclared', plist: null },
      {
        name: 'declared',
        plist:
          '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n' +
          '<plist version="1.0"><dict>' +
          '<key>NSMicrophoneUsageDescription</key><string>Recorder host checks.</string>' +
          '</dict></plist>\n',
      },
    ]

    for (const variant of variants) {
      const dir = join(app, `host-${variant.name}`)
      await mkdir(dir, { recursive: true })
      await cp(join(hostBundle, 'host'), join(dir, 'host'))
      if (variant.plist) {
        await writeFile(join(dir, 'Info.plist'), variant.plist)
      }

      const result = spawnSync(
        join(dir, 'host'),
        [framework, join(app, 'dist/consumer.cjs'), nsMetadata, shim],
        { encoding: 'utf8', timeout: 45_000 },
      )

      const output = `${result.stdout}\n${result.stderr}`
      assert.equal(result.status, 0, `${variant.name}\n${output}`)
      assert.match(output, /MACOS_RECORDER_HOST_OK/, `${variant.name}\n${output}`)
    }

    console.log('macOS packed recorder: TypeScript host dispatch passed')
  } finally {
    await rm(app, { recursive: true, force: true })
  }
}
