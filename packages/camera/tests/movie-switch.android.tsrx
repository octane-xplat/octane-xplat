/** @jsxImportSource @octane-xplat/jsx */
import { Application } from '@nativescript/core'
import { CameraView, createCameraSession } from '@octane-xplat/camera'
import type { ProbeContext } from '../../../scripts/probe/context'
// Maintained physical-device case: permissions prompt on this isolated app.
// Metadata and encoded packet timing only; no screenshots or frame analysis.
const session = createCameraSession({ camera: 'back', audio: true })
let ready = false
export default function Preview(): unknown @{
	<CameraView
		session={session}
		style={{ width: 320, height: 240 }}
		onReady={() => {
			ready = true
		}}
	/>
}

export async function run(ctx: ProbeContext) {
	ctx.record('package', Application.android.context.getPackageName())
	ctx.onCleanup(() => session.dispose())
	await session.requestPermission('camera')
	await session.requestPermission('microphone')
	await ctx.waitFor(() => ready, { timeout: 15000 })
	ctx.record('capabilities', await session.capabilities())
	const events: string[] = []
	session.subscribe((e) => events.push(e.type))
	const take = session.startRecording({ maximumDurationMs: 15000 })
	await ctx.waitFor(() => take.state === 'recording')
	const switches = []
	for (const camera of ['front', 'back'] as const) {
		await new Promise((resolve) => setTimeout(resolve, 1000))
		const before = take.elapsedMs
		await session.switchCamera(camera)
		switches.push({
			camera,
			before,
			after: take.elapsedMs,
			active: session.snapshot().activeCamera,
		})
	}

	await new Promise((resolve) => setTimeout(resolve, 1000))
	const completion = take.stop()
	ctx.assert('same completion', completion === take.completion, true)
	const result = await completion
	ctx.record('switches', switches)
	ctx.record('outcome', result)
	ctx.assert('one start', events.filter((e) => e === 'started').length, 1)
	ctx.assert('one finish', events.filter((e) => e === 'finished').length, 1)
	ctx.assert('usable output', result.kind, 'clip')
	if (result.kind !== 'clip' || result.clip.output.kind !== 'nativeFile') {
		return
	}

	ctx.assert('audio retained', result.clip.hasAudio, true)
	await ctx.waitFor(async () => (await session.capabilities()).available, { timeout: 15000 })
	const stopping = session.startRecording()
	await ctx.waitFor(() => stopping.state === 'recording')
	await new Promise((resolve) => setTimeout(resolve, 700))
	const interruptedSwitch = session.switchCamera('front').then(
		() => 'completed',
		(issue) => issue.kind,
	)

	await new Promise((resolve) => setTimeout(resolve, 50))
	const stoppedDuringSwitch = await stopping.stop()
	ctx.assert('switch cancelled by stop', await interruptedSwitch, 'invalidState')
	ctx.assert('stop during flip keeps clip', stoppedDuringSwitch.kind, 'clip')
	ctx.assert('stop during flip reason', stoppedDuringSwitch.endReason, 'stopped')
	ctx.record('stopDuringSwitch', stoppedDuringSwitch)
	await ctx.waitFor(async () => (await session.capabilities()).available, { timeout: 15000 })
	const resumed = session.startRecording()
	await ctx.waitFor(() => resumed.state === 'recording')
	ctx.assert('cancel restores previous lens', session.snapshot().activeCamera?.facing, 'back')
	await new Promise((resolve) => setTimeout(resolve, 500))
	ctx.assert('next take survives', (await resumed.stop()).kind, 'clip')
	const extractor = new android.media.MediaExtractor()
	extractor.setDataSource(result.clip.output.fileUrl.slice('file://'.length))
	try {
		const timeline = []
		for (let index = 0; index < extractor.getTrackCount(); index++) {
			const format = extractor.getTrackFormat(index)
			extractor.selectTrack(index)
			extractor.seekTo(0, 0)
			let first = -1,
				last = -1,
				maxGap = 0,
				count = 0

			let monotonic = true
			while (extractor.getSampleTime() >= 0) {
				const time = Number(extractor.getSampleTime()) / 1000
				if (first < 0) {
					first = time
				}

				if (last >= 0) {
					monotonic &&= time >= last
					maxGap = Math.max(maxGap, time - last)
				}

				last = time
				count++
				if (!extractor.advance()) {
					break
				}
			}

			extractor.unselectTrack(index)
			const mime = format.getString('mime')
			timeline.push({ mime, first, last, maxGap, count })
			if (mime.startsWith('audio/')) {
				ctx.assert('continuous audio packets', maxGap < 150, true)
				ctx.assert('monotonic audio timestamps', monotonic, true)
			}
		}

		ctx.record('encoded-timeline', timeline)
	} finally {
		extractor.release()
	}
}
