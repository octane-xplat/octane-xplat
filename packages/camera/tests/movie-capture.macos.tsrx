/** @jsxImportSource @octane-xplat/macos-renderer */
import { CameraCaptureError, CameraView, createCameraSession } from '@octane-xplat/camera'
import type { CameraSession, CameraSessionEvent } from '@octane-xplat/camera'
import type { ProbeContext } from '../../../scripts/probe/context'

declare const NSFileManager: any

// Maintained native conformance case for the AppKit host. The probe runner
// wraps the JSC host in a signed dev bundle carrying camera/microphone usage
// descriptions, so system privacy status is real. A camera-less host (CI or
// a bare Mac mini) exercises the honest unavailable path; a host with a
// camera runs the full recording assertions.
let session = createCameraSession()
let ready = false
let previewError = ''
export default function MovieCapture(props: { active?: boolean } = {}) {
	return (
		<CameraView
			active={props.active}
			session={session}
			style={{ width: 320, height: 240 }}
			onReady={() => {
				ready = true
			}}
			onError={(error) => {
				previewError = error.message
			}}
		/>
	)
}

const bridge = (): Record<string, any> => (globalThis as any).__xplatAppKit ?? {}

const fileExists = (path: string) =>
	Boolean(NSFileManager.defaultManager.fileExistsAtPath(path))

export async function run(ctx: ProbeContext) {
	ctx.onCleanup(() => session.dispose())
	const saved = bridge().storageGet?.('camera-conformance-output')
	if (saved) {
		const previous = JSON.parse(saved)
		const access = await session.openOutput(previous)
		ctx.assert('reopened after process restart', access.url, previous.fileUrl)
		ctx.record('restartReopen', true)
		access.release()
	} else {
		ctx.record('restartReopen', false)
	}

	const permissions = await session.permissions()
	ctx.record('permissionBefore', permissions)
	const requested = await session.requestPermission('camera')
	ctx.record('permissionRequested', requested)
	if (requested !== 'granted' && requested !== 'denied' && requested !== 'restricted') {
		await ctx.waitFor(async () => (await session.permissions()).camera === 'granted', { timeout: 90_000 })
	}

	const events: CameraSessionEvent[] = []
	session.subscribe((event) => events.push(event))

	const capabilities = await session.capabilities()
	ctx.record('capabilities', capabilities)
	ctx.assert('honest supported flag', capabilities.supported, capabilities.cameras.length > 0)
	ctx.assert('output storage kind', capabilities.output.storage, 'appPrivateFile')
	ctx.assert('destination support', capabilities.output.destinationFileUrl, true)
	ctx.assert('reported container', capabilities.output.container, 'mov')
	ctx.assert('reported mime', capabilities.output.mimeType, 'video/quicktime')

	if (!capabilities.cameras.length) {
		// No camera hardware: the adapter must fail admission honestly.
		ctx.record('hardware', false)
		await ctx.waitFor(() => previewError !== '' || ready, { timeout: 15_000 })
		ctx.record('previewError', previewError)
		ctx.assert('preview fails without a device', ready, false)
		let admission: string | undefined
		try {
			session.startRecording()
		} catch (error) {
			admission = error instanceof CameraCaptureError ? error.kind : String(error)
		}

		ctx.assert('recording admission fails without a device', admission, 'unavailable')
		ctx.record('captureEvidence', 'none — this host has no camera device; real capture requires camera hardware')
		return
	}

	ctx.record('hardware', true)
	await ctx.waitFor(() => ready, { timeout: 20_000 })
	await ctx.waitFor(async () => (await session.capabilities()).profiles.length > 0, { timeout: 10_000 })

	const first = session.startRecording({ maximumDurationMs: 1500 })
	ctx.assert('initial take state', first.state, 'starting')
	const outcome = await first.completion
	ctx.record('limitOutcome', outcome)
	ctx.assert('movie finalized', outcome.kind, 'clip')
	if (outcome.kind !== 'clip') throw new Error(outcome.error.message)
	ctx.assert('duration limit', outcome.endReason, 'maximumDuration')
	bridge().storageSet?.('camera-conformance-output', JSON.stringify(outcome.clip.output))
	ctx.assert('silent by default', outcome.clip.hasAudio, false)
	ctx.assert('presentation dimensions', outcome.clip.width > 0 && outcome.clip.height > 0, true)
	ctx.assert('started before finished', events.findIndex((e) => e.type === 'started') < events.findIndex((e) => e.type === 'finished'), true)
	ctx.assert('durable file exists', fileExists(outcome.clip.output.fileUrl.slice(7)), true)

	const normal = session.startRecording()
	await ctx.waitFor(() => normal.state === 'recording')
	await first.stop()
	ctx.assert('old Stop does not stop current take', normal.state, 'recording')
	await ctx.waitFor(() => normal.elapsedMs >= 500)
	const stopA = normal.stop()
	ctx.assert('repeated Stop joins completion', normal.stop(), stopA)
	ctx.assert('normal finalized', (await stopA).kind, 'clip')

	const early = session.startRecording()
	const earlyResult = await early.stop()
	ctx.assert('early Stop settles', early.state, 'settled')
	ctx.record('earlyStopOutcome', earlyResult)

	const mic = await session.requestPermission('microphone')
	ctx.record('microphonePermission', mic)
	await session.configure({ audio: true })
	if (mic === 'granted') {
		const audio = session.startRecording({ maximumDurationMs: 1000 })
		const audioResult = await audio.completion
		ctx.record('audioOutcome', audioResult)
		ctx.assert('audio movie finalized', audioResult.kind, 'clip')
		if (audioResult.kind === 'clip') ctx.assert('actual audio track', audioResult.clip.hasAudio, true)
	} else {
		const denied = await session.startRecording().completion
		ctx.assert('requested denied audio fails', denied.kind, 'failed')
		if (denied.kind === 'failed') ctx.assert('audio permission category', denied.error.kind, 'permissionDenied')
	}

	await session.configure({ audio: false })

	const outputPath = outcome.clip.output.fileUrl.slice('file://'.length)
	const directory = outputPath.slice(0, outputPath.lastIndexOf('/'))
	const existingPath = `${directory}/camera-existing.mov`
	NSFileManager.defaultManager.createFileAtPathContentsAttributes(existingPath, null, null)
	const existsResult = await session.startRecording({ destinationFileUrl: `file://${existingPath}` }).completion
	ctx.assert('existing destination fails', existsResult.kind, 'failed')
	ctx.assert('existing destination preserved', fileExists(existingPath), true)
	try {
		NSFileManager.defaultManager.removeItemAtPathError(existingPath, undefined)
	} catch {
		// Cleanup best effort — the reservation root is app-private.
	}

	const missingDir = `${directory}/camera-missing-directory`
	const unavailablePath = await session.startRecording({ destinationFileUrl: `file://${missingDir}/movie.mov` }).completion
	ctx.assert('missing-directory destination fails', unavailablePath.kind, 'failed')
	if (unavailablePath.kind === 'failed') ctx.assert('destination failure category', unavailablePath.error.kind, 'destinationUnavailable')

	const outsideResult = await session.startRecording({ destinationFileUrl: 'file:///tmp/octane-camera-outside.mov' }).completion
	ctx.assert('outside-private destination fails', outsideResult.kind, 'failed')

	const released = session.startRecording()
	await ctx.waitFor(() => released.state === 'recording')
	await ctx.waitFor(() => released.elapsedMs >= 300)
	await ctx.mount(MovieCapture, { active: false })
	const releasedResult = await released.completion
	ctx.assert('preview release finalizes', releasedResult.kind, 'clip')
	ctx.assert('preview release reason', releasedResult.endReason, 'previewReleased')
	await ctx.mount(MovieCapture, { active: true })
	await ctx.waitFor(async () => (await session.capabilities()).available, { timeout: 20_000 })

	const disposed = session.startRecording()
	await ctx.waitFor(() => disposed.state === 'recording')
	await ctx.waitFor(() => disposed.elapsedMs >= 300)
	await session.dispose()
	ctx.assert('dispose end reason', (await disposed.completion).endReason, 'disposed')
	const reopened = await session.openOutput(outcome.clip.output)
	ctx.assert('reopened after dispose', reopened.url, outcome.clip.output.fileUrl)
	// A fresh owner can reopen independently of the camera lease.
	const fresh: CameraSession = createCameraSession()
	ctx.assert('reopened by fresh owner', (await fresh.openOutput(outcome.clip.output)).url, reopened.url)
	await fresh.dispose()
	ctx.record('previewError', previewError)
}
