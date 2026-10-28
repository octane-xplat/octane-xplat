import { Application } from '@nativescript/core'
import { observeBatches } from '@nativescript-community/octane'
import type { LayoutBarrier } from './types'

export const layoutSupported = true

function appWindows(): any[] {
	const app = (globalThis as any).UIApplication?.sharedApplication
	if (!app) {
		return []
	}
	const out: any[] = []
	const scenes = app.connectedScenes?.allObjects
	if (scenes) {
		for (const scene of scenes) {
			const windows = scene.windows
			if (windows) {
				for (let i = 0; i < windows.count; i++) {
					out.push(windows.objectAtIndex(i))
				}
			}
		}
	}
	if (!out.length) {
		const windows = app.windows
		if (windows) {
			for (let i = 0; i < windows.count; i++) {
				out.push(windows.objectAtIndex(i))
			}
		}
	}
	return out
}

export const barrier: LayoutBarrier = {
	schedule(pass) {
		queueMicrotask(() => {
			// Mason computes layout lazily; force it so the pass reads the new
			// boxes and the inverse transforms land in the same CATransaction.
			for (const window of appWindows()) {
				window.layoutIfNeeded?.()
			}
			pass()
		})
	},
	observe(root) {
		const stop = observeBatches({
			didApply() {
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
