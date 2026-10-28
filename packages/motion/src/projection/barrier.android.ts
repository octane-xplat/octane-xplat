import { Application } from '@nativescript/core'
import { observeBatches } from '@nativescript-community/octane'
import type { LayoutBarrier } from './types'

export const layoutSupported = true

const pendingContainers = new Set<unknown>()

function rootViewOf(container: any): any {
	const host = container?.host
	const nv = host?.nativeView ?? host ?? null
	return nv?.getRootView?.() ?? null
}

function decorView(): any {
	const activity =
		(Application as any).android?.foregroundActivity ?? (Application as any).foregroundActivity
	return activity?.getWindow?.()?.getDecorView?.() ?? null
}

export const barrier: LayoutBarrier = {
	schedule(pass) {
		const VTO = (globalThis as any).android?.view?.ViewTreeObserver
		const observers = new Map<any, { global: any; pre: any }>()

		const views = new Map<any, any>()
		for (const container of pendingContainers) {
			const view = rootViewOf(container)
			if (view) {
				views.set(view.getViewTreeObserver(), view)
			}
		}
		pendingContainers.clear()
		const decor = decorView()
		if (decor) {
			views.set(decor.getViewTreeObserver(), decor)
		}

		if (!views.size) {
			// No window to traverse (headless/tests): never leave a pass pending.
			queueMicrotask(pass)
			return
		}

		let ran = false
		const cleanupAll = () => {
			for (const [vto, pair] of observers) {
				if (vto.isAlive?.() === false) {
					continue
				}

				if (pair.global) {
					vto.removeOnGlobalLayoutListener?.(pair.global)
				}

				if (pair.pre) {
					vto.removeOnPreDrawListener?.(pair.pre)
				}
			}
			observers.clear()
		}
		const run = () => {
			if (ran) {
				return
			}
			ran = true
			cleanupAll()
			pass()
		}

		for (const [vto] of views) {
			if (!vto || !VTO) {
				continue
			}

			const pair: { global: any; pre: any } = { global: null, pre: null }
			pair.global = new VTO.OnGlobalLayoutListener({
				onGlobalLayout: () => run(),
			})

			pair.pre = new VTO.OnPreDrawListener({
				onPreDraw: () => {
					run()
					return true
				},
			})

			observers.set(vto, pair)
			vto.addOnGlobalLayoutListener(pair.global)
			vto.addOnPreDrawListener(pair.pre)
		}

		// Force a draw traversal on the next vsync so onPreDraw fires even when
		// the commit caused no layout change; the pass always lands before the
		// traversal's draw.
		const anchor = decor ?? views.values().next().value
		if (anchor?.postInvalidateOnAnimation) {
			anchor.postInvalidateOnAnimation()
		} else {
			anchor?.postInvalidate?.()
		}
	},
	observe(root) {
		const stop = observeBatches({
			didApply(container) {
				if (container) {
					pendingContainers.add(container)
				}
				root.invalidate('mutation')
			},
		})
		const onOrientation = () => root.invalidate('resize')
		Application.on?.('orientationChanged', onOrientation)
		return () => {
			stop()
			Application.off?.('orientationChanged', onOrientation)
		}
	},
}
