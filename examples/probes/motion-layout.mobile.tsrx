/** @jsxImportSource @octane-xplat/jsx */
import './intl-shim'
import { useState } from 'octane'
import { motion } from '@octane-xplat/motion'
import { observeBatches } from '@nativescript-community/octane'
import { Application, Trace } from '@nativescript/core'
import type { ProbeContext } from '../../scripts/probe/context'

// Native layout projection runtime probe: commit-timing (no flash), a
// mid-animation nested check, keyed reorder of unchanged children, settle
// values, and the reorder command ops. All geometry in DIP.

const views: Record<string, any> = {}
let setWide: (v: boolean) => void = () => {}
let setOrder: (v: string[]) => void = () => {}

function onScreen(view: any, target: 'ios' | 'android' | string) {
	const nv = view?.nativeViewProtected ?? view?.nativeView
	if (!nv) {
		return null
	}

	const d = target === 'ios' ? 1 : (nv.getResources?.()?.getDisplayMetrics?.()?.density ?? 1)
	if (target === 'ios') {
		const win = nv.convertRectToView?.(nv.bounds, null)
		return win
			? { x: win.origin.x / d, y: win.origin.y / d, w: win.size.width / d, h: win.size.height / d }
			: null
	}

	const loc = Array.create('int', 2)
	nv.getLocationInWindow(loc)
	// Fold the whole ancestor scale chain: projection writes counter-scaling
	// onto children's own scaleX, so multiplying by it alone overstates the
	// rendered size.
	let sx = 1
	let sy = 1
	let p: any = nv
	while (p && typeof p.getScaleX === 'function') {
		sx *= p.getScaleX()
		sy *= p.getScaleY()
		p = p.getParent?.()
	}

	return {
		x: loc[0] / d,
		y: loc[1] / d,
		w: (nv.getWidth() * sx) / d,
		h: (nv.getHeight() * sy) / d,
	}
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Untransformed layout box (proves the commit's layout actually applied). */
function rawLayout(v: any, target: string) {
	const nv = v?.nativeView ?? v?.nativeViewProtected
	if (!nv) {
		return null
	}

	if (target === 'ios') {
		const c = nv.center
		const b = nv.bounds
		const w = b?.size?.width
		const h = b?.size?.height
		return { cx: c?.x, cy: c?.y, x: c?.x - w / 2, y: c?.y - h / 2, w, h }
	}

	const d = nv.getResources?.()?.getDisplayMetrics?.()?.density ?? 1
	let x = 0
	let y = 0
	let n: any = nv
	while (n && typeof n.getLeft === 'function') {
		x += n.getLeft()
		y += n.getTop()
		n = n.getParent?.()
	}

	return { x: x / d, y: y / d, w: nv.getWidth() / d, h: nv.getHeight() / d }
}

/**
 * Resolves with the boxes measured inside the first onDraw after this call
 * (Android). On iOS resolves on the next turn, after the commit's pass.
 */
function captureFirstFrame(target: string, read: () => unknown): Promise<unknown> {
	if (target !== 'android') {
		return sleep(0).then(read)
	}

	const activity =
		(globalThis as any).Application?.android?.foregroundActivity ??
		(globalThis as any).Application?.android?.startActivity

	const decor = activity?.getWindow?.()?.getDecorView?.()
	if (!decor) {
		return sleep(0).then(read)
	}

	const captured = new Promise<unknown>((resolve) => {
		const vto = decor.getViewTreeObserver()
		const listener = new (globalThis as any).android.view.ViewTreeObserver.OnDrawListener({
			onDraw() {
				const nv = (views as any).parent?.nativeViewProtected ?? (views as any).parent?.nativeView
				console.log(
					`PROBE dbg draw parentScaleX=${nv?.getScaleX?.()} parentTx=${nv?.getTranslationX?.()} t=${Date.now()}`,
				)

				const data = read()
				decor.post(
					new (globalThis as any).java.lang.Runnable({
						run: () => vto.removeOnDrawListener(listener),
					}),
				)

				resolve(data)
			},
		})

		vto.addOnDrawListener(listener)
	})

	// If no draw fires (e.g. listener added mid-traversal), don't hang the run.
	return Promise.race([
		captured,
		sleep(1500).then(() => ({ drawMissed: true, ...((read() as any) ?? {}) })),
	])
}

function transforms(view: any) {
	return {
		x: view?.translateX ?? null,
		y: view?.translateY ?? null,
		scaleX: view?.scaleX ?? null,
		scaleY: view?.scaleY ?? null,
		rotate: view?.rotate ?? null,
	}
}

export default function MotionLayoutProbe() @{
	const [wide, w] = useState(false)
	const [order, o] = useState(['a', 'b', 'c'])
	setWide = w
	setOrder = o
	return (
		<masonview style={{ padding: 40 }}>
			<motion.View
				id="ml-parent"
				ref={(v: any) => (views.parent = v)}
				layout
				transition={{ duration: 0.4, ease: 'linear' }}
				style={{ width: wide ? 200 : 100, height: 80 }}
			>
				<motion.View
					id="ml-child"
					ref={(v: any) => (views.child = v)}
					layout="position"
					transition={{ duration: 0.4, ease: 'linear' }}
					style={{ width: 50, height: 30 }}
				/>
			</motion.View>
			{order.map((k) => (
				<motion.View
					key={k}
					id={`ml-${k}`}
					ref={(v: any) => (views[`row${k}`] = v)}
					layout
					transition={{ duration: 0.3, ease: 'linear' }}
					style={{ width: 100, height: 20 }}
				>
					<label text={k} />
				</motion.View>
			))}
		</masonview>
	)
}

export async function run(ctx: ProbeContext) {
	const log = (id: string, data: Record<string, unknown>) => {
		console.log(`PROBE ${id} ${JSON.stringify(data)}`)
		ctx.record(id, data)
	}

	const target = ctx.target
	const screen = (v: any) => onScreen(v, target)
	Trace.enable()
	Trace.addCategories(Trace.categories.Error)
	Trace.addWriter({
		write(message: string) {
			console.log(`PROBE trace ${message.slice(0, 400)}`)
		},
	} as any)

	const t0 = Date.now()
	const step = (name: string) => console.log(`PROBE step ${name} t=${Date.now() - t0}`)
	const uncaught: string[] = []
	Application.on?.('uncaughtError', (a: any) => uncaught.push(String(a?.error ?? a)))
	const batchUnsub = observeBatches({
		didApply(container, commands) {
			const host =
				(container as any)?.hostView?.constructor?.name ?? (container as any)?.constructor?.name

			console.log(
				`PROBE batch t=${Date.now() - t0} host=${host} ops=${(commands as any[]).map((c) => c?.type).join(',')}`,
			)
		},
	})

	Application.on?.('discardedError', (a: any) => uncaught.push(`discarded:${a?.error ?? a}`))
	views.parent = views.parent ?? ctx.find('ml-parent')
	views.child = views.child ?? ctx.find('ml-child')
	for (const k of ['a', 'b', 'c']) {
		views[`row${k}`] = views[`row${k}`] ?? ctx.find(`ml-${k}`)
	}

	await ctx.waitFor(() => views.parent?.isLoaded, { timeout: 15000, interval: 50 })
	await sleep(100)

	try {
		const before = screen(views.parent)
		const beforeChild = screen(views.child)
		// First frame after the commit must still show the before-box, while
		// the raw layout already shows the new size.
		const drawPromise = captureFirstFrame(target, () => ({
			parent: screen(views.parent),
			child: screen(views.child),
			parentRaw: rawLayout(views.parent, target),
		}))

		step('setWide')
		setWide(true)
		const first = (await drawPromise) as any
		const firstFrame = first.parent
		const firstChild = first.child
		const layoutApplied = Math.abs((first.parentRaw?.w ?? 0) - 200) <= 1
		const noFlash =
			layoutApplied &&
			Math.abs((firstFrame?.w ?? 0) - (before?.w ?? 0)) <= 0.5 &&
			Math.abs((firstFrame?.x ?? 0) - (before?.x ?? 0)) <= 0.5

		const pl =
			target === 'ios'
				? await (async () => {
						await sleep(20)
						const l = (views.parent as any)?.ios?.layer?.presentationLayer?.()
						const f = l?.frame
						return f ? { x: f.origin.x, y: f.origin.y, w: f.size.width, h: f.size.height } : null
					})()
				: undefined

		log('flash', {
			before,
			firstFrame,
			firstChild,
			parentRaw: first.parentRaw,
			layoutApplied,
			noFlash,
			presentationLayer: pl,
		})

		step('mid-start')
		// Mid-animation: parent between 120 and 180 wide, child stays 50.
		await sleep(200)
		const mid = screen(views.parent)
		const midChild = screen(views.child)
		const midOk =
			(mid?.w ?? 0) > 120 && (mid?.w ?? 0) < 180 && Math.abs((midChild?.w ?? 0) - 50) <= 0.5

		log('mid', { mid, midChild, midOk })

		step('settle-start')
		// Settle: transforms back to channel values, parent at its new size.
		await sleep(700)
		const settled = screen(views.parent)
		const settledTransforms = transforms(views.parent)
		log('settle', { settled, settledTransforms })
	} catch (error) {
		log('flash', { error: String(error) })
	}

	try {
		const before = ['a', 'b', 'c'].map((k) => screen(views[`row${k}`]))
		const ops = new Set<string>()
		const stop = observeBatches({
			didApply(_container, commands) {
				for (const c of commands) {
					ops.add(c.op)
				}
			},
		})

		step('reorder-start')
		const drawPromise = captureFirstFrame(target, () => ({
			on: ['a', 'b', 'c'].map((k) => screen(views[`row${k}`])),
			raw: ['a', 'b', 'c'].map((k) => rawLayout(views[`row${k}`], target)),
		}))

		setOrder(['c', 'b', 'a'])
		const first = (await drawPromise) as any
		stop()
		const firstFrame = first.on
		const rawAfter = first.raw
		const rawSwapped =
			Math.abs((rawAfter[0]?.y ?? 0) - 160) <= 1 && Math.abs((rawAfter[2]?.y ?? 0) - 120) <= 1

		const startsAtBefore =
			rawSwapped && before.every((b, i) => Math.abs((firstFrame[i]?.y ?? 0) - (b?.y ?? 0)) <= 0.5)

		await sleep(600)
		const after = ['a', 'b', 'c'].map((k) => screen(views[`row${k}`]))
		const endsMoved = Math.abs((after[0]?.y ?? 0) - (before[2]?.y ?? 0)) <= 0.5
		const settledTransforms = ['a', 'b', 'c'].map((k) => transforms(views[`row${k}`]))
		log('reorder', {
			before,
			firstFrame,
			rawAfter,
			rawSwapped,
			startsAtBefore,
			after,
			endsMoved,
			settledTransforms,
			ops: [...ops],
		})
	} catch (error) {
		log('reorder', { error: String(error) })
	}

	log('dbg', { uncaught })
	ctx.record('done', true)
}
