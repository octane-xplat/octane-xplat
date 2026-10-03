/** @jsxImportSource @octane-xplat/macos-renderer */
import { Lottie } from '@octane-xplat/lottie'
import { useRef, useState } from 'octane'
import type { LottieHandle } from '@octane-xplat/lottie'
import type { ProbeContext } from '../../scripts/probe/context'

const animation = {
	v: '5.7.0',
	fr: 30,
	ip: 0,
	op: 30,
	w: 100,
	h: 100,
	nm: 'AppKit probe',
	ddd: 0,
	assets: [],
	layers: [
		{
			ddd: 0,
			ind: 1,
			ty: 1,
			nm: 'moving solid',
			sr: 1,
			ks: {
				o: { a: 0, k: 100 },
				r: { a: 0, k: 0 },
				p: {
					a: 1,
					k: [
						{ t: 0, s: [0, 50, 0], e: [100, 50, 0], o: { x: 0.33, y: 0.33 }, i: { x: 0.67, y: 0.67 } },
						{ t: 30, s: [100, 50, 0] },
					],
				},
				a: { a: 0, k: [0, 0, 0] },
				s: { a: 0, k: [100, 100, 100] },
			},
			sw: 20,
			sh: 20,
			sc: '#ff0000',
			ip: 0,
			op: 30,
			st: 0,
			bm: 0,
		},
	],
}

let loadedDuration = 0
let loadedCount = 0
let endedCount = 0
let errorMessage: string | undefined
let handle: { current: LottieHandle | null }
let setBadSource: (value: boolean) => void
let setRawSource: (value: boolean) => void
let setLoop: (value: boolean) => void
let setMounted: (value: boolean) => void

export default function AppKitLottieProbe() {
	const [badSource, updateBadSource] = useState(false)
	const [rawSource, updateRawSource] = useState(false)
	const [loop, updateLoop] = useState(false)
	const [mounted, updateMounted] = useState(true)
	setBadSource = updateBadSource
	setRawSource = updateRawSource
	setLoop = updateLoop
	setMounted = updateMounted
	handle = useRef<LottieHandle | null>(null)

	return <flexboxlayout style={{ width: 160, height: 160 }}>
		{mounted ? <Lottie
			id="appkit-lottie"
			style={{ width: 120, height: 120 }}
			data={badSource || rawSource ? undefined : animation}
			src={badSource ? '{bad' : rawSource ? JSON.stringify(animation) : undefined}
			autoPlay={false}
			loop={loop}
			speed={1.5}
			fit="contain"
			accessibilityLabel="moving red square"
			ref={handle}
			onLoaded={(event) => {
				loadedCount++
				loadedDuration = event.duration ?? 0
			}}
			onEnded={() => endedCount++}
			onError={(event) => { errorMessage = event.message }}
		/> : <label id="appkit-lottie-unmounted">unmounted</label>}
	</flexboxlayout>
}

export async function run(ctx: ProbeContext) {
	errorMessage = undefined
	loadedDuration = 0
	loadedCount = 0
	endedCount = 0
	await ctx.waitFor(() => loadedCount === 1, { timeout: 5000 })
	ctx.assert('loaded duration in milliseconds', loadedDuration, 1000)
	ctx.assert('imperative ref exposed', handle.current !== null, true)

	const player = handle.current!
	const nativeView = player.native
	ctx.assert('ref exposes a real AppKit view', nativeView instanceof NSView, true)
	ctx.assert('engine view is mounted in AppKit hierarchy', nativeView.superview instanceof NSView, true)
	ctx.assert('engine view belongs to the probe window', nativeView.window instanceof NSWindow, true)

	player.seekTo(0.4)
	ctx.assert('normalized seek', Math.abs(player.progress() - 0.4) < 0.02, true)
	player.setSpeed(2)
	player.play()
	await ctx.waitFor(() => player.isPlaying() && player.progress() > 0.45, { timeout: 3000 })
	const progressBeforePause = player.progress()
	player.pause()
	await new Promise((resolve) => setTimeout(resolve, 100))
	ctx.assert('pause stops playback', player.isPlaying(), false)
	ctx.assert('pause holds the playhead', Math.abs(player.progress() - progressBeforePause) < 0.02, true)
	ctx.assert('duration is available on the handle', player.duration(), 1000)

	player.setSpeed(4)
	player.seekTo(0)
	const speedStartedAt = Date.now()
	player.play()
	await ctx.waitFor(() => endedCount === 1 && !player.isPlaying(), { timeout: 3000 })
	ctx.assert('finite playback reports ended once', endedCount, 1)
	ctx.assert('imperative speed changes playback time', Date.now() - speedStartedAt < 800, true)

	setLoop(true)
	await new Promise((resolve) => setTimeout(resolve, 30))
	player.seekTo(0)
	player.play()
	await new Promise((resolve) => setTimeout(resolve, 1200))
	ctx.assert('loop keeps playing after a full duration', player.isPlaying(), true)
	ctx.assert('loop does not report a finite end', endedCount, 1)
	player.pause()

	setRawSource(true)
	await ctx.waitFor(() => loadedCount === 2, { timeout: 3000 })
	ctx.assert('raw JSON src reports loaded', loadedCount, 2)
	ctx.assert('raw JSON src exposes duration', player.duration(), 1000)

	setBadSource(true)
	await ctx.waitFor(() => errorMessage !== undefined, { timeout: 3000 })
	ctx.assert('malformed source reports an error', errorMessage !== '', true)
	ctx.assert('failed replacement does not report loaded', loadedCount, 2)

	setMounted(false)
	await ctx.waitFor(() => nativeView.superview === null, { timeout: 3000 })
	ctx.assert('unmount removes the native view', nativeView.superview, null)
	ctx.assert('unmount stops playback', player.isPlaying(), false)
	ctx.assert('unmount releases animation data', player.duration(), 0)
}
