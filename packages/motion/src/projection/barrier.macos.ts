import { observeLayoutCommits } from '@octane-xplat/macos-renderer'
import type { LayoutBarrier } from './types'

export const layoutSupported = true
const hosts = new Set<any>()

export const barrier: LayoutBarrier = {
	schedule(pass) {
		queueMicrotask(() => {
			const pending = [...hosts]
			hosts.clear()
			for (const host of pending) {
				host.layoutSubtreeIfNeeded()
			}
			pass()
		})
	},
	observe(root) {
		const stop = observeLayoutCommits(({ hostView }) => {
			hosts.add(hostView)
			root.invalidate('mutation')
		})
		const center = (globalThis as any).NSNotificationCenter.defaultCenter
		const token = center.addObserverForNameObjectQueueUsingBlock(
			'NSWindowDidResizeNotification',
			null,
			null,
			() => root.invalidate('resize'),
		)
		return () => {
			stop()
			hosts.clear()
			center.removeObserver(token)
		}
	},
}
