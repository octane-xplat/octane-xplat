import { audioOrigin } from './fixture-origin'
import { createAudioPlayer } from '@octane-xplat/audio'
import type { ProbeContext } from '../../../scripts/probe/context'

// Foreground silent-WAV budgets, fixed before collecting remote results.
// These measure observable player state, not app startup or audible output.
const limits = {
	firstProgressMs: 10000,
	queueCommandMs: 250,
	positionLossSeconds: 0.15,
	seekPositionMs: 1500,
	boundaryDelayMs: 1500,
	appendResumeMs: 2000,
}

export async function run(ctx: ProbeContext) {
	ctx.record('foreground budgets', limits)
	const player = createAudioPlayer()
	ctx.onCleanup(() => player.dispose())
	const origin = audioOrigin(ctx.target)
	const first = { id: 'budget-one', source: `${origin}/one.wav` }
	const second = { id: 'budget-two', source: `${origin}/two.wav` }
	const third = { id: 'budget-three', source: `${origin}/three.wav` }
	await player.setMuted(true)
	const started = Date.now()
	await player.setQueue([first, second], 0, { complete: false })
	await player.play()
	await ctx.waitFor(
		() => {
			const value = player.snapshot()
			return value.state === 'playing' && value.currentTime >= 0.1
		},
		{ timeout: limits.firstProgressMs, interval: 20 },
	)
	const firstProgressMs = Date.now() - started
	ctx.record('first progress ms', firstProgressMs)
	ctx.assert('first progress budget', firstProgressMs <= limits.firstProgressMs, true)

	const before = player.snapshot().currentTime
	const updateStarted = Date.now()
	await player.updateQueue([{ ...first, title: 'Updated' }, second])
	const queueCommandMs = Date.now() - updateStarted
	const positionLossSeconds = Math.max(0, before - player.snapshot().currentTime)
	ctx.record('queue command ms', queueCommandMs)
	ctx.record('preserving update position loss seconds', positionLossSeconds)
	ctx.assert('queue command budget', queueCommandMs <= limits.queueCommandMs, true)
	ctx.assert(
		'preserving update position budget',
		positionLossSeconds <= limits.positionLossSeconds,
		true,
	)

	const seekStarted = Date.now()
	await player.seek(2)
	await ctx.waitFor(
		() => {
			const value = player.snapshot()
			return value.state === 'playing' && Math.abs(value.currentTime - 2) < 0.3
		},
		{ timeout: limits.seekPositionMs, interval: 20 },
	)
	const seekPositionMs = Date.now() - seekStarted
	ctx.record('observable seek position ms', seekPositionMs)
	ctx.assert('observable seek position budget', seekPositionMs <= limits.seekPositionMs, true)

	const boundaryStart = player.snapshot()
	if (!Number.isFinite(boundaryStart.duration) || boundaryStart.duration <= 0) {
		throw new Error('Fixture media duration is unavailable')
	}
	const boundaryStarted = Date.now()
	await ctx.waitFor(
		() => {
			const value = player.snapshot()
			return value.track?.id === second.id && value.state === 'playing' && value.currentTime >= 0.1
		},
		{ timeout: 10000, interval: 20 },
	)
	const afterBoundary = player.snapshot()
	// Estimate extra delay from media positions. Polling/decoder clocks add error;
	// this is not a physical gap or a gapless-playback measurement.
	const mediaMs =
		(boundaryStart.duration - boundaryStart.currentTime + afterBoundary.currentTime) * 1000
	const boundaryDelayMs = Math.max(0, Date.now() - boundaryStarted - mediaMs)
	ctx.record('estimated boundary delay ms', boundaryDelayMs)
	ctx.assert('estimated boundary budget', boundaryDelayMs <= limits.boundaryDelayMs, true)

	await ctx.waitFor(() => player.snapshot().state === 'waiting', { timeout: 10000, interval: 20 })
	const appendStarted = Date.now()
	await player.updateQueue([first, second, third], { complete: true })
	await ctx.waitFor(
		() => {
			const value = player.snapshot()
			return value.track?.id === third.id && value.state === 'playing' && value.currentTime >= 0.1
		},
		{ timeout: limits.appendResumeMs, interval: 20 },
	)
	const appendResumeMs = Date.now() - appendStarted
	ctx.record('append resume ms', appendResumeMs)
	ctx.assert('append resume budget', appendResumeMs <= limits.appendResumeMs, true)
	await player.pause()
	ctx.record(
		'scope',
		'Silent foreground player state only; no physical output, app startup, durable progress-loss or background guarantee.',
	)
}
