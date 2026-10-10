/** @jsxImportSource @nativescript-community/octane */
import { Application, ApplicationSettings, File, knownFolders } from '@nativescript/core'
import { CameraView, createCameraSession } from '@octane-xplat/camera'
import type { CameraSession, CameraSessionEvent } from '@octane-xplat/camera'
import type { ProbeContext } from '../../../scripts/probe/context'

// Maintained native conformance case. Run through the probe host with this leaf
// in --deps. Grant CAMERA to this isolated test app; leave RECORD_AUDIO denied.
let session = createCameraSession()
let ready = false
let previewError = ''
export default function MovieCapture(props: { active?: boolean } = {}) {
	return <CameraView active={props.active} session={session} style={{ width: 320, height: 240 }} onReady={() => { ready = true }} onError={(error) => { previewError = error.message }} />
}

export async function run(ctx: ProbeContext) {
	const packageId = Application.android.context.getPackageName()
	console.log('CAMERA_PROBE_PACKAGE', packageId)
	ctx.onCleanup(() => session.dispose())
	const saved = ApplicationSettings.getString('camera-conformance-output', '')
	if (saved) {
		const previous = JSON.parse(saved)
		const access = await session.openOutput(previous)
		ctx.assert('reopened after process restart', access.url, previous.fileUrl)
		ctx.record('restartReopen', true)
		access.release()
	} else ctx.record('restartReopen', false)

	await ctx.waitFor(async () => (await session.permissions()).camera === 'granted', { timeout: 90_000 })
	await session.requestPermission('camera')
	await ctx.waitFor(() => ready, { timeout: 20_000 })
	const events: CameraSessionEvent[] = []
	session.subscribe((event) => events.push(event))
	await ctx.waitFor(async () => (await session.capabilities()).profiles.length > 0, { timeout: 10_000 })
	const capabilities = await session.capabilities()
	ctx.record('capabilities', capabilities)
	ctx.assert('positive source frame rate', capabilities.profiles[0]?.frameRate > 0, true)

	const first = session.startRecording({ maximumDurationMs: 1500 })
	ctx.assert('initial take state', first.state, 'starting')
	const outcome = await first.completion
	ctx.record('nativeLimitOutcome', outcome)
	ctx.assert('movie finalized', outcome.kind, 'clip')
	if (outcome.kind !== 'clip') throw new Error(outcome.error.message)
	ctx.assert('duration limit', outcome.endReason, 'maximumDuration')
	ApplicationSettings.setString('camera-conformance-output', JSON.stringify(outcome.clip.output))
	ctx.assert('silent by default', outcome.clip.hasAudio, false)
	ctx.assert('presentation dimensions', outcome.clip.width > 0 && outcome.clip.height > 0, true)
	ctx.assert('started before finished', events.findIndex(e => e.type === 'started') < events.findIndex(e => e.type === 'finished'), true)

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

	await session.configure({ audio: true })
	const denied = await session.startRecording().completion
	ctx.assert('requested denied audio fails', denied.kind, 'failed')
	if (denied.kind === 'failed') ctx.assert('audio permission category', denied.error.kind, 'permissionDenied')
	console.log('CAMERA_PROBE_ALLOW_MIC', packageId)
	await ctx.waitFor(async () => (await session.permissions()).microphone === 'granted', { timeout: 30_000 })
	const audio = session.startRecording({ maximumDurationMs: 1000 })
	const audioResult = await audio.completion
	ctx.record('audioOutcome', audioResult)
	ctx.assert('audio movie finalized', audioResult.kind, 'clip')
	if (audioResult.kind === 'clip') ctx.assert('actual audio track', audioResult.clip.hasAudio, true)
	await session.configure({ audio: false })

	const existing = File.fromPath(`${knownFolders.documents().path}/camera-existing.mp4`)
	await existing.writeText('preserve-me')
	const existsResult = await session.startRecording({ destinationFileUrl: `file://${existing.path}` }).completion
	ctx.assert('existing destination fails', existsResult.kind, 'failed')
	ctx.assert('existing destination preserved', await existing.readText(), 'preserve-me')
	await existing.remove()
	const unavailablePath = await session.startRecording({ destinationFileUrl: `file://${knownFolders.documents().path}/camera-missing-directory/movie.mp4` }).completion
	ctx.assert('unwritable destination fails', unavailablePath.kind, 'failed')
	if (unavailablePath.kind === 'failed') ctx.assert('destination failure category', unavailablePath.error.kind, 'destinationUnavailable')
	const cacheResult = await session.startRecording({ destinationFileUrl: `file://${knownFolders.temp().path}/camera-cache.mp4` }).completion
	ctx.assert('cache destination refused', cacheResult.kind, 'failed')
	if (cacheResult.kind === 'failed') ctx.assert('cache retention failure', cacheResult.error.kind, 'destinationUnavailable')

	const inactive = session.startRecording()
	await ctx.waitFor(() => inactive.state === 'recording')
	await ctx.waitFor(() => inactive.elapsedMs >= 500)
	const provider = (globalThis as any).androidx.camera.lifecycle.ProcessCameraProvider.getInstance(Application.android.context).get()
	provider.unbindAll()
	const inactiveResult = await inactive.completion
	ctx.record('sourceInactiveOutcome', inactiveResult)
	ctx.assert('source inactivity settles', inactive.state, 'settled')
	ctx.assert('source inactivity is external', inactiveResult.endReason === 'interrupted' || inactiveResult.endReason === 'cameraUnavailable', true)
	Application.notify({ eventName: Application.resumeEvent, object: Application })
	await ctx.waitFor(async () => (await session.capabilities()).available, { timeout: 20_000 })

	const background = session.startRecording()
	await ctx.waitFor(() => background.state === 'recording')
	await ctx.waitFor(() => background.elapsedMs >= 500)
	Application.notify({ eventName: Application.suspendEvent, object: Application })
	const backgroundResult = await background.completion
	ctx.record('backgroundOutcome', backgroundResult)
	ctx.assert('background completion', backgroundResult.kind, 'clip')
	ctx.assert('background end reason', backgroundResult.endReason, 'backgrounded')
	Application.notify({ eventName: Application.resumeEvent, object: Application })
	await ctx.waitFor(async () => (await session.capabilities()).available, { timeout: 20_000 })

	const released = session.startRecording()
	await ctx.waitFor(() => released.state === 'recording')
	await ctx.waitFor(() => released.elapsedMs >= 500)
	await ctx.mount(MovieCapture, { active: false })
	const releasedResult = await released.completion
	ctx.assert('preview release finalizes', releasedResult.kind, 'clip')
	ctx.assert('preview release reason', releasedResult.endReason, 'previewReleased')
	await ctx.mount(MovieCapture, { active: true })
	await ctx.waitFor(async () => (await session.capabilities()).available, { timeout: 20_000 })

	const disposed = session.startRecording()
	await ctx.waitFor(() => disposed.state === 'recording')
	await ctx.waitFor(() => disposed.elapsedMs >= 500)
	await session.dispose()
	ctx.assert('dispose end reason', (await disposed.completion).endReason, 'disposed')
	const reopened = await session.openOutput(outcome.clip.output)
	ctx.assert('reopened after dispose', reopened.url, outcome.clip.output.kind === 'nativeFile' ? outcome.clip.output.fileUrl : '')
	// A fresh owner can reopen independently of the camera lease.
	const fresh: CameraSession = createCameraSession()
	ctx.assert('reopened by fresh owner', (await fresh.openOutput(outcome.clip.output)).url, reopened.url)
	await fresh.dispose()
	ctx.record('appId', packageId)
	ctx.record('previewError', previewError)
	ctx.record('lifecycleMechanism', 'Application suspend/resume notification dispatch; not OS background input')
}
