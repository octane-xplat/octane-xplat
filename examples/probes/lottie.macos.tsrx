/** @jsxImportSource @octane-xplat/macos-renderer */
import { Lottie } from '@octane-xplat/lottie'
import { useRef } from 'octane'
import type { LottieHandle } from '@octane-xplat/lottie'
import type { ProbeContext } from '../../scripts/probe/context'

let error: string | undefined
let loaded = false
let ended = false
let handle: { current: LottieHandle | null }

export default function UnsupportedLottie() {
	error = undefined
	loaded = false
	ended = false
	handle = useRef<LottieHandle | null>(null)
	return <Lottie
		id="unsupported-lottie"
		data={{}}
		ref={handle}
		onError={(event) => { error = event.message }}
		onLoaded={() => { loaded = true }}
		onEnded={() => { ended = true }}
	/>
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => error !== undefined)
	ctx.assert('unsupported placeholder', ctx.inspect('unsupported-lottie').text,
		'Lottie animations are unsupported by the AppKit host')

	ctx.assert('unsupported error', error, 'Lottie animations are unsupported by the AppKit host')
	ctx.assert('no playback handle', handle.current, null)
	ctx.assert('no loaded event', loaded, false)
	ctx.assert('no ended event', ended, false)
}
