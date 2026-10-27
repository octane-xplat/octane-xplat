import type { LayoutBarrier } from './types'

export const layoutSupported = false

export const barrier: LayoutBarrier = {
	schedule(pass) {
		pass()
	},
	observe() {
		return () => {}
	},
}
