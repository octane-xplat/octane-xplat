import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import type { GtkView } from './index.js'

interface MotionStyle {
	read(property: string): unknown
	write(property: string, value: number): void
}
type MotionResult = { status: 'finished' | 'cancelled' }

/** Docking motion used by native-style UI controllers. Only the implemented
 * definition is accepted; this is not a NativeScript animation facade. */
export function bindMotion(view: GtkView, style: MotionStyle) {
	let disposed = false
	let sampling = false
	let pending: { source: number; settle: (result: MotionResult) => void } | null = null
	const cancel = () => {
		if (!pending) {
			return
		}
		GLib.source_remove(pending.source)
		pending.settle({ status: 'cancelled' })
		pending = null
	}
	view.animate = (definition: {
		translate: { x: number; y: number }
		duration?: number
	}): Promise<MotionResult> => {
		if (
			!definition ||
			Object.keys(definition).some((key) => key !== 'translate' && key !== 'duration')
		) {
			throw new Error('linux-gtk ref: unsupported animation definition')
		}
		const { x, y } = definition.translate ?? {}
		const duration = definition.duration ?? 300
		if (![x, y, duration].every(Number.isFinite) || duration < 0) {
			throw new Error(
				'linux-gtk ref: translate animation requires finite coordinates and a nonnegative duration',
			)
		}
		const fromX = Number(style.read('translateX'))
		const fromY = Number(style.read('translateY'))
		if (!Number.isFinite(fromX) || !Number.isFinite(fromY)) {
			throw new Error('linux-gtk ref: translate animation requires numeric starting values')
		}
		cancel()
		if (disposed) {
			return Promise.resolve({ status: 'cancelled' })
		}
		const sample = (progress: number) => {
			sampling = true
			try {
				style.write('translateX', fromX + (x - fromX) * progress)
				style.write('translateY', fromY + (y - fromY) * progress)
			} finally {
				sampling = false
			}
		}
		if (duration === 0 || (Gtk as any).Settings.get_default()?.gtk_enable_animations === false) {
			sample(1)
			return Promise.resolve({ status: 'finished' })
		}
		return new Promise((resolve) => {
			const start = GLib.get_monotonic_time() / 1000
			const run = { source: 0, settle: resolve }
			run.source = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 16, () => {
				if (pending !== run || disposed) {
					return false
				}
				const progress = Math.min(1, (GLib.get_monotonic_time() / 1000 - start) / duration)
				sample(progress)
				if (pending !== run) {
					return false
				}
				if (progress < 1) {
					return true
				}
				pending = null
				resolve({ status: 'finished' })
				return false
			})
			pending = run
		})
	}
	return {
		beforeWrite(property: string) {
			if (!sampling && (property === 'translateX' || property === 'translateY')) {
				cancel()
			}
		},
		dispose() {
			disposed = true
			cancel()
		},
	}
}
