/** @jsxImportSource @octane-xplat/macos-renderer */
import { createMacOSRoot } from '@octane-xplat/macos-renderer'
import { useState } from 'octane'
import { ImageCrop } from '@octane-xplat/image-crop'
import type { Crop, PixelCrop } from '../src/props'
import type { ProbeContext } from '../../../scripts/probe/context'

const src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aH1sAAAAASUVORK5CYII='
let latest: PixelCrop | null = null
let completed = 0
let reset: (options?: { disabled?: boolean; width?: number; aspect?: number }) => void
function Fixture() @{
	const [crop, setCrop] = useState<Crop>({ unit: 'px', x: 60, y: 60, width: 120, height: 120 })
	const [options, setOptions] = useState({ disabled: false, width: 320, aspect: 1 })
	reset = (next = {}) => {
		setCrop({ unit: 'px', x: 60, y: 60, width: 120, height: 120 })
		setOptions({ disabled: false, width: 320, aspect: 1, ...next })
		latest = null
	}

	<ImageCrop id="crop" src={src} imageWidth={1} imageHeight={1} width={options.width} height={240}
		crop={crop} aspect={options.aspect} minWidth={40} maxWidth={180} disabled={options.disabled} ruleOfThirds
		onChange={(pixel) => { latest = pixel; setCrop(pixel) }} onComplete={() => { completed++ }} />
}

/** Maintained AppKit integration test. Dispatch exercises the renderer event scope;
 * it does not establish physical mouse delivery. Run with pnpm probe. */
export async function run(ctx: ProbeContext) {
	const host = ctx.host as any
	const root = createMacOSRoot(host.contentView) as any
	ctx.onCleanup(() => root.unmount())
	root.render(Fixture, {})
	const flush = async () => { await new Promise(resolve => setTimeout(resolve, 30)); host.contentView.layoutSubtreeIfNeeded() }
	await flush()
	const find = (handle: string) => root.__macosDebug.findId('crop-' + handle)
	const pan = async (handle: string, state: number, dx = 0, dy = 0) => {
		root.__macosDebug.panView(find(handle), { state, deltaX: dx, deltaY: dy, velocityX: 0, velocityY: 0 })
		await flush()
	}

	for (const handle of ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']) {
		reset(); await flush()
		const dx = handle.includes('w') ? -20 : handle.includes('e') ? 20 : 0
		const dy = handle.includes('n') ? -20 : handle.includes('s') ? 20 : 0
		const before = completed
		await pan(handle, 1); await pan(handle, 2, dx, dy); await pan(handle, 3, dx, dy)
		ctx.assert(handle + ' width', latest?.width, 140)
		ctx.assert(handle + ' aspect', latest?.height, 140)
		ctx.assert(handle + ' completion', completed - before, 1)
	}

	reset(); await flush()
	await pan('move', 1); await pan('move', 2, 1000, -1000); await pan('move', 3, 1000, -1000)
	ctx.assert('move clamps x', latest?.x, 120)
	ctx.assert('move clamps y', latest?.y, 0)
	reset(); await flush()
	await pan('se', 1); await pan('se', 2, -1000, -1000); await pan('se', 3, -1000, -1000)
	ctx.assert('minimum', latest?.width, 40)
	reset(); await flush()
	await pan('nw', 1); await pan('nw', 2, -1000, -1000); await pan('nw', 3, -1000, -1000)
	ctx.assert('maximum', latest?.width, 180)
	reset(); await flush()
	const before = completed
	await pan('move', 1); await pan('move', 2, 10, 10); await pan('move', 0); await pan('move', 3, 20, 20)
	ctx.assert('cancel skips completion', completed, before)
	ctx.assert('cancel retains last selection', latest?.x, 70)
	reset(); await flush()
	await pan('move', 1)
	reset({ width: 200 }); await flush()
	await pan('move', 3, 20, 20)
	ctx.assert('resize cancels active gesture', latest, null)
	reset({ disabled: true }); await flush()
	let rejected = false
	try { await pan('move', 1) } catch { rejected = true }
	ctx.assert('disabled removes pan callback', rejected, true)
	ctx.assert('disabled has no changes', latest, null)
	reset(); await flush()
	const move = find('move'), absolute = move.superview
	const image = absolute.subviews.objectAtIndex(0)
	ctx.assert('contain-fit scales up', Number(image.imageScaling), 3)
	ctx.assert('image loaded', !!image.image, true)
	ctx.assert('image passes input through', image.hitTest({ x: 100, y: 100 }) == null, true)
	const guide = absolute.subviews.objectAtIndex(2)
	ctx.assert('guide passes input through', guide.hitTest({ x: 1, y: 1 }) == null, true)
	ctx.assert('interior is hit-testable', absolute.hitTest(move.convertPointToView({ x: 30, y: 30 }, absolute.superview)) === move, true)
	const windowSize = host.window.frame.size
	host.window.setContentSize({ width: 800, height: 600 }); await flush()
	ctx.assert('window resize preserves viewport selection', Number(find('move').frame.size.width), 120)
	ctx.record('windowBefore', { width: Number(windowSize.width), height: Number(windowSize.height) })
}
