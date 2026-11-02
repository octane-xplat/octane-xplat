/** @jsxImportSource @octane-xplat/jsx */
import { knownFolders } from '@nativescript/core'
import { useState } from 'octane'
import { CameraView, createCameraSession } from '@octane-xplat/camera'
import type { CameraSession } from '@octane-xplat/camera'
import { AVURLAsset, NSURL } from '@octane-xplat/platform/ios'
import { SharedCameraSession } from '../src/session-core'
import { createSessionBackend } from '../src/session-backend.ios'
import type { ProbeContext } from '../../../scripts/probe/context'

// Native diagnostics use the same backend as the public factory. The final
// take also exercises createCameraSession directly. Run via test:ios-device.
const config = { camera: 'back' as const, audio: true }
let recordWriter = (_type: string, _payload: string) => {}
const backend = createSessionBackend(config, (type, payload) => recordWriter(type, payload))
const originalSwitch = backend.switchCamera!
let afterAcquired: (() => void) | undefined
backend.switchCamera = (camera) => {
	const operation = originalSwitch(camera)
	return { ...operation, completion: operation.completion.then((selected) => { afterAcquired?.(); return selected }) }
}
const session = new SharedCameraSession(backend, config)
let enable = () => {}
let showSession = (_session: CameraSession) => {}
let ready = false

declare const interop: any
declare function CMSampleBufferGetNumSamples(sample: any): number
declare function CMSampleBufferGetSampleTimingInfo(sample: any, index: number, timing: any): number
declare const AVAssetReader: any
declare const AVAssetReaderTrackOutput: any
declare function CMTimeGetSeconds(time: any): number
declare function CMSampleBufferGetPresentationTimeStamp(sample: any): any
declare function CMSampleBufferGetDuration(sample: any): any

export default function Preview(): unknown @{
	const [active, setActive] = useState(false)
	const [displayedSession, setDisplayedSession] = useState<CameraSession>(session)
	enable = () => setActive(true)
	showSession = setDisplayedSession

	<CameraView
		session={displayedSession}
		active={active}
		style={{ width: 320, height: 240 }}
		onReady={() => {
			ready = true
		}}
	/>
}

export async function run(ctx: ProbeContext) {
	const writerStatistics: any[] = []
	const committed: any[] = []
	const phase = knownFolders.documents().getFile('camera-probe-phase.txt')
	recordWriter = (type, payload) => {
		if (type === 'finished') { writerStatistics.push(JSON.parse(payload)); ctx.record('native-writers', writerStatistics) }
		if (type === 'cameraCommitted') { committed.push(JSON.parse(payload)); ctx.record('camera-connections', committed) }
	}
	ctx.onCleanup(() => session.dispose())
	ctx.assert('camera permission', await session.requestPermission('camera'), 'granted')
	ctx.assert('microphone permission', await session.requestPermission('microphone'), 'granted')
	enable()
	await ctx.waitFor(() => ready, { timeout: 15000 })
	const events: string[] = []
	session.subscribe((event) => events.push(event.type))
	const take = session.startRecording({ orientation: 'portrait', maximumDurationMs: 15000 })
	await ctx.waitFor(() => take.state === 'recording')
	for (const facing of ['front', 'back'] as const) {
		await new Promise((resolve) => setTimeout(resolve, 1000))
		const before = take.elapsedMs
		await session.switchCamera(facing)
		ctx.assert(`confirmed ${facing}`, session.snapshot().activeCamera?.facing, facing)
		ctx.assert(`elapsed continues through ${facing}`, take.elapsedMs >= before, true)
		const connection = committed.at(-1)!
		ctx.assert(`unmirrored recorded ${facing}`, connection.videoMirrored, false)
		ctx.assert(`preview mirroring ${facing}`, connection.previewMirrored, facing === 'front' && connection.previewMirrorSupported)
		ctx.assert(`portrait connection ${facing}`, connection.orientation, 1)
	}

	await new Promise((resolve) => setTimeout(resolve, 750))
	ctx.assert('original completion', take.stop() === take.completion, true)
	const outcome = await take.completion
	ctx.record('outcome', outcome)
	ctx.assert('one start', events.filter((event) => event === 'started').length, 1)
	ctx.assert('one finish', events.filter((event) => event === 'finished').length, 1)
	ctx.assert('usable clip', outcome.kind, 'clip')
	if (outcome.kind !== 'clip' || outcome.clip.output.kind !== 'nativeFile') {
		return
	}

	ctx.assert('audio present', outcome.clip.hasAudio, true)
	const mainStatistics = writerStatistics[0]!
	ctx.assert('incoming audio gaps below 1 ms', mainStatistics.maxAudioInputGapMs < 1, true)
	ctx.assert('incoming audio spans the take', Math.abs(mainStatistics.audioLastOffsetMs - mainStatistics.audioFirstOffsetMs - mainStatistics.audioInputDurationMs) < 5, true)
	const asset = AVURLAsset.assetWithURL(
		NSURL.fileURLWithPath(outcome.clip.output.fileUrl.slice('file://'.length)),
	)

	const timeline = []
	for (const type of ['vide', 'soun']) {
		const track = asset.tracksWithMediaType(type).objectAtIndex(0)
		const reader = AVAssetReader.alloc().initWithAssetError(asset, undefined)
		const output = AVAssetReaderTrackOutput.alloc().initWithTrackOutputSettings(track, null)
		reader.addOutput(output)
		if (!reader.startReading()) {
			throw new Error('Encoded sample reader did not start')
		}

		let first = Infinity,
			last = 0,
			previous = -Infinity,
			maxGap = 0,
			count = 0,
			monotonic = true

		for (;;) {
			const sample = output.copyNextSampleBuffer()
			if (!sample) {
				break
			}

			for (let index = 0; index < CMSampleBufferGetNumSamples(sample); index++) {
				const timing = new interop.Reference()
				if (CMSampleBufferGetSampleTimingInfo(sample, index, timing) !== 0) {
					throw new Error('Could not read encoded packet timing')
				}
				const time = CMTimeGetSeconds(timing.value.presentationTimeStamp)
				const duration = CMTimeGetSeconds(timing.value.duration)
				first = Math.min(first, time)
				last = Math.max(last, time + (Number.isFinite(duration) ? duration : 0))
				if (Number.isFinite(previous)) maxGap = Math.max(maxGap, time - previous)
				monotonic &&= time > previous
				previous = time
				count++
			}
		}

		if (reader.error) {
			throw new Error(reader.error.localizedDescription)
		}

		ctx.assert(`nonempty ${type}`, count > 0, true)
		ctx.assert(`monotonic ${type}`, monotonic, true)
		timeline.push({ type, first, last, maxGap, count })
		if (type === 'soun') {
			ctx.assert('audio gaps below 150 ms', maxGap < 0.15, true)
		}
	}

	ctx.record('encoded-timeline', timeline)
	ctx.assert('A/V start alignment', Math.abs(timeline[0]!.first - timeline[1]!.first) < 0.15, true)
	ctx.assert('A/V end alignment', Math.abs(timeline[0]!.last - timeline[1]!.last) < 0.15, true)
	await ctx.waitFor(() => session.snapshot().state === 'idle')
	const interrupted = session.startRecording()
	await ctx.waitFor(() => interrupted.state === 'recording')
	await new Promise((resolve) => setTimeout(resolve, 500))
	const switching = session.switchCamera('front').then(
		() => 'finished',
		(error) => error.kind,
	)

	await ctx.waitFor(
		async () => session.snapshot().switchingCamera && !(await session.capabilities()).available,
		{ timeout: 5000 },
	)

	ctx.assert('stop retains clip', (await interrupted.stop()).kind, 'clip')
	ctx.assert('stop cancels flip', await switching, 'invalidState')
	await ctx.waitFor(async () => (await session.capabilities()).available, { timeout: 15000 })
	const provisional = session.startRecording()
	await ctx.waitFor(() => provisional.state === 'recording')
	await new Promise((resolve) => setTimeout(resolve, 500))
	let reachedAcquisition = false
	afterAcquired = () => { reachedAcquisition = true; provisional.stop() }
	try {
		const issue = await session.switchCamera('front').then(() => 'completed', (error) => error.kind)
		ctx.assert('acquisition before cancellation', reachedAcquisition, true)
		ctx.assert('stop after acquisition cancels switch', issue, 'invalidState')
		ctx.assert('stop after acquisition preserves clip', (await provisional.completion).kind, 'clip')
	} finally { afterAcquired = undefined }
	await ctx.waitFor(async () => (await session.capabilities()).available, { timeout: 15000 })
	const limited = session.startRecording({ maximumDurationMs: 600 })
	await ctx.waitFor(() => limited.state === 'recording')
	await new Promise((resolve) => setTimeout(resolve, 500))
	const limitedSwitch = session.switchCamera('front').then(() => 'finished', (error) => error.kind)
	const limitedOutcome = await limited.completion
	ctx.assert('limit during flip keeps clip', limitedOutcome.kind, 'clip')
	ctx.assert('duration limit owns completion', limitedOutcome.endReason, 'maximumDuration')
	ctx.assert('limit cancels flip', await limitedSwitch, 'invalidState')
	await ctx.waitFor(async () => (await session.capabilities()).available, { timeout: 15000 })
	const next = session.startRecording()
	await ctx.waitFor(() => next.state === 'recording')
	ctx.assert('cancel restored back', session.snapshot().activeCamera?.facing, 'back')
	await new Promise((resolve) => setTimeout(resolve, 500))
	ctx.assert('subsequent take works', (await next.stop()).kind, 'clip')
	await ctx.waitFor(async () => (await session.capabilities()).available, { timeout: 15000 })
	const background = session.startRecording()
	await ctx.waitFor(() => background.state === 'recording')
	await new Promise((resolve) => setTimeout(resolve, 500))
	const tokenFile = knownFolders.documents().getFile('camera-probe-token.txt')
	await ctx.waitFor(() => tokenFile.readTextSync().trim().length > 0, { timeout: 15000 })
	phase.writeTextSync(JSON.stringify({ phase: 'background-recording', token: tokenFile.readTextSync().trim() }))
	const backgroundOutcome = await background.completion
	ctx.record('background-outcome', backgroundOutcome)
	ctx.assert('background retains clip', backgroundOutcome.kind, 'clip')
	ctx.assert('OS background owns completion', backgroundOutcome.endReason, 'backgrounded')
	await ctx.waitFor(async () => !session.snapshot().interrupted && (await session.capabilities()).available, { timeout: 15000 })
	const foreground = session.startRecording()
	await ctx.waitFor(() => foreground.state === 'recording')
	await new Promise((resolve) => setTimeout(resolve, 500))
	ctx.assert('foreground capture recovers', (await foreground.stop()).kind, 'clip')
	await session.dispose()
	ready = false
	const publicSession = createCameraSession({ camera: 'back', audio: false })
	ctx.onCleanup(() => publicSession.dispose())
	showSession(publicSession)
	await ctx.waitFor(() => ready, { timeout: 15000 })
	ctx.assert('public factory switching capability', (await publicSession.capabilities()).cameraSwitchDuringRecording, true)
	const publicTake = publicSession.startRecording({ audio: false, orientation: 'landscapeRight' })
	await ctx.waitFor(() => publicTake.state === 'recording')
	await publicSession.switchCamera('front')
	ctx.assert('public factory switched front', publicSession.snapshot().activeCamera?.facing, 'front')
	await new Promise((resolve) => setTimeout(resolve, 500))
	const publicOutcome = await publicTake.stop()
	ctx.assert('public factory returns clip', publicOutcome.kind, 'clip')
	if (publicOutcome.kind === 'clip') {
		ctx.assert('silent take has no audio', publicOutcome.clip.hasAudio, false)
		ctx.assert('landscape output dimensions', publicOutcome.clip.width > publicOutcome.clip.height, true)
	}
	ctx.record('public-factory-outcome', publicOutcome)
	phase.writeTextSync('complete')

}
