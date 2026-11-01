/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { CameraView } from '@octane-xplat/camera'
import { AVURLAsset, NSURL } from '@octane-xplat/platform/ios'
import { SharedCameraSession } from '../src/session-core'
import { createSessionBackend } from '../src/session-backend.ios'
import type { ProbeContext } from '../../../scripts/probe/context'

// Internal qualification entry only. The public factory keeps this path disabled.
// Run on an exclusively reserved physical iPhone; never infer a pass from a build.
const config = { camera: 'back' as const, audio: true }
const session = new SharedCameraSession(createSessionBackend(config, true), config)
let enable = () => {}
let ready = false

declare const AVAssetReader: any
declare const AVAssetReaderTrackOutput: any
declare function CMTimeGetSeconds(time: any): number
declare function CMSampleBufferGetPresentationTimeStamp(sample: any): any
declare function CMSampleBufferGetDuration(sample: any): any

export default function Preview(): unknown @{
	const [active, setActive] = useState(false)
	enable = () => setActive(true)

	<CameraView
		session={session}
		active={active}
		style={{ width: 320, height: 240 }}
		onReady={() => {
			ready = true
		}}
	/>
}

export async function run(ctx: ProbeContext) {
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

			const time = CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(sample))
			const duration = CMTimeGetSeconds(CMSampleBufferGetDuration(sample))
			first = Math.min(first, time)
			last = Math.max(last, time + (Number.isFinite(duration) ? duration : 0))
			if (Number.isFinite(previous)) {
				maxGap = Math.max(maxGap, time - previous)
			}

			monotonic &&= time >= previous
			previous = time
			count++
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
	const next = session.startRecording()
	await ctx.waitFor(() => next.state === 'recording')
	ctx.assert('cancel restored back', session.snapshot().activeCamera?.facing, 'back')
	await new Promise((resolve) => setTimeout(resolve, 500))
	ctx.assert('subsequent take works', (await next.stop()).kind, 'clip')
}
