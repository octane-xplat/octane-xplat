import { audioOrigin } from './fixture-origin'
import { createAudioPlayer } from '@octane-xplat/audio'
import type { ProbeContext } from '../../../scripts/probe/context'

export async function run(ctx: ProbeContext) {
	const origin = audioOrigin(ctx.target)
	const player = createAudioPlayer()
	ctx.onCleanup(() => player.dispose())
	await player.setPlaybackRate(1.5)
	await player.setVolume(0.25)
	await player.setMuted(true) // Silent fixture: this never establishes physical output.
	const first = { id: 'one', source: `${origin}/one.wav` }
	const second = { id: 'two', source: `${origin}/two.wav` }
	const third = { id: 'three', source: `${origin}/three.wav` }
	await player.setQueue([first], 0, { complete: false })
	await player.play()
	await ctx.waitFor(
		() => player.snapshot().state === 'playing' && player.snapshot().currentTime > 0.2,
		{ timeout: 15000, interval: 50 },
	)
	const before = player.snapshot().currentTime
	await player.updateQueue([{ ...first, title: 'Updated' }, second])
	ctx.assert('current item retained', player.snapshot().track?.id, 'one')
	ctx.assert('position retained', player.snapshot().currentTime >= before - 0.15, true)
	ctx.assert('speed retained', player.snapshot().playbackRate, 1.5)
	ctx.assert('remembered volume retained while muted', player.snapshot().volume, 0.25)
	await ctx.waitFor(() => player.snapshot().state === 'waiting', { timeout: 15000, interval: 50 })
	ctx.assert('second item advanced', player.snapshot().track?.id, 'two')
	await player.updateQueue([first, second, third], { complete: true })
	await ctx.waitFor(
		() => player.snapshot().track?.id === 'three' && player.snapshot().state === 'playing',
		{ timeout: 15000, interval: 50 },
	)
	ctx.assert('append resumes waiting player', player.snapshot().track?.id, 'three')
	await player.pause()
	await ctx.waitFor(() => player.snapshot().state === 'paused', { timeout: 5000, interval: 50 })
	ctx.assert('explicit pause', player.snapshot().state, 'paused')
	await player.setMuted(false)
	ctx.assert('unmute retains gain', player.snapshot().volume, 0.25)
	await player.play()
	await ctx.waitFor(() => player.snapshot().state === 'ended', { timeout: 15000, interval: 50 })
	ctx.assert('complete queue ends', player.snapshot().queueComplete, true)
	ctx.record(
		'output evidence',
		'Silent source and no output observation; foreground progression only',
	)
}
