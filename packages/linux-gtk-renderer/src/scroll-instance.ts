import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import type { GtkView } from './index.js'

type Axis = 'inline' | 'block'
type Notify = (event: 'scroll' | 'layoutChanged', detail?: Record<string, number>) => void

/** GtkAdjustment owns viewport extent, document extent and clamped offsets.
 * Keep user input, imperative writes and animated offsets on that same surface. */
export function bindScrolling(view: GtkView, notify: Notify): () => void {
	if (!(view instanceof Gtk.ScrolledWindow)) return () => {}
	const axes = {
		inline: view.get_hadjustment(),
		block: view.get_vadjustment(),
	}
	let disposed = false
	const writing = new Set<Axis>()
	const playback = new Map<Axis, { source: number }>()
	const maximum = (axis: Axis) =>
		Math.max(0, axes[axis].get_upper() - axes[axis].get_lower() - axes[axis].get_page_size())
	const offset = (axis: Axis) => (disposed ? 0 : axes[axis].get_value() - axes[axis].get_lower())
	const detail = () => ({ scrollX: offset('inline'), scrollY: offset('block') })
	const stop = (axis: Axis) => {
		const run = playback.get(axis)
		if (run) GLib.source_remove(run.source)
		playback.delete(axis)
	}
	const write = (axis: Axis, value: number) => {
		writing.add(axis)
		try {
			axes[axis].set_value(axes[axis].get_lower() + Math.max(0, Math.min(maximum(axis), value)))
		} finally {
			writing.delete(axis)
		}
	}
	const scroll = (axis: Axis, value: number, animated = false) => {
		if (disposed || !Number.isFinite(value)) return
		stop(axis)
		const target = Math.max(0, Math.min(maximum(axis), value))
		if (!animated || (Gtk as any).Settings.get_default()?.gtk_enable_animations === false) {
			write(axis, target)
			return
		}
		const from = offset(axis)
		if (target === from) return
		const start = GLib.get_monotonic_time() / 1000
		const run = { source: 0 }
		run.source = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 16, () => {
			if (disposed || playback.get(axis) !== run) return false
			const progress = Math.min(1, (GLib.get_monotonic_time() / 1000 - start) / 250)
			write(axis, from + (target - from) * (1 - (1 - progress) ** 3))
			if (playback.get(axis) !== run) return false
			if (progress < 1) return true
			playback.delete(axis)
			return false
		})
		playback.set(axis, run)
	}
	const connections: { adjustment: any; id: number }[] = []
	for (const axis of ['inline', 'block'] as const) {
		const adjustment = axes[axis]
		connections.push({
			adjustment,
			id: adjustment.connect('value-changed', () => {
				if (!writing.has(axis)) stop(axis)
				notify('scroll', detail())
			}),
		})
		connections.push({
			adjustment,
			id: adjustment.connect('changed', () => notify('layoutChanged')),
		})
	}
	for (const [name, axis, dimension] of [
		['scrollWidth', 'inline', 'extent'],
		['scrollHeight', 'block', 'extent'],
		['clientWidth', 'inline', 'viewport'],
		['clientHeight', 'block', 'viewport'],
	] as const) {
		Object.defineProperty(view, name, {
			configurable: true,
			get: () =>
				disposed
					? 0
					: dimension === 'extent'
						? axes[axis].get_upper() - axes[axis].get_lower()
						: axes[axis].get_page_size(),
		})
	}
	for (const [name, axis] of [
		['scrollLeft', 'inline'],
		['scrollTop', 'block'],
	] as const) {
		Object.defineProperty(view, name, {
			configurable: true,
			get: () => offset(axis),
			set: (value) => scroll(axis, Number(value)),
		})
	}
	view.scrollToVerticalOffset = (value: number, animated = false) =>
		scroll('block', value, animated)
	view.scrollToHorizontalOffset = (value: number, animated = false) =>
		scroll('inline', value, animated)
	return () => {
		disposed = true
		stop('inline')
		stop('block')
		for (const { adjustment, id } of connections) adjustment.disconnect(id)
	}
}
