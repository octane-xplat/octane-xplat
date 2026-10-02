import type { Controller } from './controller'
import type { HostAdapter } from './host-types'
import type { DragInfo, MotionProps } from './types'
import type { MotionValue } from './value'

export function validateDrag(props: MotionProps) {
	if (props.drag !== undefined && ![true, false, 'x', 'y'].includes(props.drag)) {
		throw new Error('motion: drag must be boolean, x, or y')
	}

	const bounds = props.dragConstraints ?? {}
	for (const [key, value] of Object.entries(bounds)) {
		if (!['left', 'right', 'top', 'bottom'].includes(key) || !Number.isFinite(value)) {
			throw new Error('motion: dragConstraints requires finite numeric edges; refs are deferred')
		}
	}

	if (
		(bounds.left ?? -Infinity) > (bounds.right ?? Infinity) ||
		(bounds.top ?? -Infinity) > (bounds.bottom ?? Infinity)
	) {
		throw new Error('motion: dragConstraints edges are reversed')
	}

	if (
		typeof props.dragElastic !== 'boolean' &&
		props.dragElastic !== undefined &&
		(!Number.isFinite(props.dragElastic) || props.dragElastic < 0 || props.dragElastic > 1)
	) {
		throw new Error('motion: dragElastic must be boolean or a number from 0 to 1')
	}

	if (props.drag) {
		for (const axis of ['x', 'y'] as const) {
			if (props.drag !== true && props.drag !== axis) {
				continue
			}

			for (const target of [props.animate, props.whileTap, props.whileFocus]) {
				if (
					target &&
					typeof target === 'object' &&
					!Array.isArray(target) &&
					target[axis] !== undefined
				) {
					throw new Error(`motion: drag and animation both own ${axis}`)
				}
			}
		}
	}
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Gesture writes and release springs bypass host delegation. */
export function attachDrag(
	adapter: HostAdapter,
	controller: Controller,
	props: MotionProps,
	valueFor: (axis: 'x' | 'y') => MotionValue,
	reduced: () => boolean,
	callbacks: () => MotionProps,
) {
	if (!props.drag) {
		return () => {}
	}

	if (!adapter.pan) {
		throw new Error('motion: this host does not support drag')
	}

	const axes = (['x', 'y'] as const).filter((axis) => props.drag === true || props.drag === axis)
	const values = new Map(axes.map((axis) => [axis, valueFor(axis)]))
	const value = (axis: 'x' | 'y') => values.get(axis)!
	const bounds = props.dragConstraints ?? {}
	const elastic =
		typeof props.dragElastic === 'number'
			? props.dragElastic
			: props.dragElastic === false
				? 0
				: 0.35

	const origin = { x: 0, y: 0 }
	let active = false
	const limits = (axis: 'x' | 'y') =>
		axis === 'x'
			? [bounds.left ?? -Infinity, bounds.right ?? Infinity]
			: [bounds.top ?? -Infinity, bounds.bottom ?? Infinity]

	const move = (info: DragInfo) => {
		for (const axis of axes) {
			const [min, max] = limits(axis)
			const next = origin[axis] + info.offset[axis]
			const bounded = clamp(next, min, max)
			value(axis).jump(bounded + (next - bounded) * elastic)
		}
	}

	const off = adapter.pan(props.drag, {
		start(event, info) {
			controller.stop()
			active = true
			for (const axis of axes) {
				const channel = value(axis)
				channel.stop()
				origin[axis] = channel.get()
			}

			callbacks().onDragStart?.(event, info)
		},
		move(event, info) {
			if (!active) {
				return
			}

			move(info)
			callbacks().onDrag?.(event, info)
		},
		end(event, info) {
			if (!active) {
				return
			}

			active = false
			move(info)
			for (const axis of axes) {
				const channel = value(axis)
				const velocity = info.cancelled || props.dragMomentum === false ? 0 : info.velocity[axis]
				const [min, max] = limits(axis)
				const target = clamp(channel.get() + velocity * 0.2, min, max)
				if (elastic === 0) {
					channel.jump(clamp(channel.get(), min, max))
				}

				if (reduced()) {
					channel.jump(target)
				} else if (target !== channel.get() || velocity !== 0) {
					channel.animate(
						target,
						{ type: 'spring', stiffness: 200, damping: 30, velocity },
						elastic === 0 ? (next) => clamp(next, min, max) : undefined,
					)
				}
			}

			callbacks().onDragEnd?.(event, info)
		},
	})

	return () => {
		active = false
		off()
		for (const channel of values.values()) {
			channel.stop()
		}
	}
}
