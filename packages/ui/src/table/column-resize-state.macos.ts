import type { UseTableColumnResizeConfig } from './use-table-column-resize.tsrx'
export interface AppKitResizeScope {
	key: string
	view: object
	width: number
	direction: 'ltr' | 'rtl'
	valid(): boolean
}

const ownWidth = (widths: Record<string, number> | undefined, key: string) =>
	widths && Object.prototype.hasOwnProperty.call(widths, key) ? widths[key] : undefined

/** Gesture previews belong to their current native handle; commits belong to the caller. */
export function createAppKitColumnResizeState(options: {
	config(): UseTableColumnResizeConfig
	changed(): void
}) {
	type Drag = {
		scope: AppKitResizeScope
		start: number
		width: number
		source: number | undefined
		controlled: boolean
		min: number
		max: number
	}
	let internal: Record<string, number> = {},
		drag: Drag | undefined,
		disposed = false
	const limits = () => {
		const config = options.config()
		const min = Number.isFinite(config.minWidth) ? Math.max(0, config.minWidth!) : 50
		const max = Number.isFinite(config.maxWidth) ? Math.max(min, config.maxWidth!) : Infinity
		return { min, max }
	}
	const publish = () => {
		if (!disposed) {
			options.changed()
		}
	}
	const base = () => options.config().columnWidths ?? internal
	const current = (key: string, measured: number) => {
		const value = ownWidth(base(), key)
		return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : measured
	}
	const validate = () => {
		if (!drag) {
			return false
		}
		const config = options.config(),
			next = limits(),
			source = ownWidth(config.columnWidths, drag.scope.key)
		if (
			!drag.scope.valid() ||
			(config.columnWidths !== undefined) !== drag.controlled ||
			next.min !== drag.min ||
			next.max !== drag.max ||
			(source !== drag.source && source !== drag.width)
		) {
			drag = undefined
			return true
		}
		drag.source = source
		return false
	}
	const clamp = (value: number) => {
		const { min, max } = limits()
		return Math.max(min, Math.min(max, value))
	}
	const commit = (scope: AppKitResizeScope, value: number) => {
		if (disposed || !scope.valid() || !Number.isFinite(value)) {
			return false
		}
		const previousDrag = drag
		validate()
		if (drag?.scope.view === scope.view) {
			return false
		}
		drag = undefined
		const width = clamp(value),
			previous = current(scope.key, scope.width)
		if (width === previous) {
			if (previousDrag) {
				publish()
			}

			return false
		}
		const config = options.config(),
			result = { ...base(), [scope.key]: width }
		if (config.columnWidths === undefined) {
			internal = { ...result }
		}
		try {
			config.onColumnResizeEnd?.(result)
		} finally {
			publish()
		}
		return true
	}
	return {
		limits,
		widths() {
			validate()
			return drag ? { ...base(), [drag.scope.key]: drag.width } : base()
		},
		active(key: string) {
			return drag?.scope.key === key
		},
		synchronize() {
			if (!disposed && validate()) {
				publish()
			}
		},
		begin(scope: AppKitResizeScope) {
			if (disposed || !scope.valid() || !Number.isFinite(scope.width) || scope.width < 0) {
				return false
			}
			const config = options.config(),
				range = limits(),
				width = current(scope.key, scope.width)
			drag = {
				scope,
				start: width,
				width,
				source: ownWidth(config.columnWidths, scope.key),
				controlled: config.columnWidths !== undefined,
				...range,
			}
			publish()
			return true
		},
		move(scope: AppKitResizeScope, delta: number) {
			const owner = drag
			validate()
			if (drag !== owner) {
				publish()
				return false
			}
			if (
				disposed ||
				!owner ||
				owner.scope.view !== scope.view ||
				owner.scope.key !== scope.key ||
				!scope.valid() ||
				!Number.isFinite(delta)
			) {
				return false
			}
			const width = clamp(owner.start + delta * (owner.scope.direction === 'rtl' ? -1 : 1))
			if (width !== owner.width) {
				owner.width = width
				publish()
			}
			return true
		},
		end(scope: AppKitResizeScope, delta: number) {
			const owner = drag
			if (!owner) {
				return false
			}
			if (!Number.isFinite(delta)) {
				this.cancel(scope.view)
				return false
			}
			if (!this.move(scope, delta) || drag !== owner) {
				return false
			}
			validate()
			if (drag !== owner) {
				publish()
				return false
			}
			drag = undefined // Retire before callbacks can start another gesture or unmount.
			const config = options.config(),
				result = { ...base(), [scope.key]: owner.width }
			if (!owner.controlled && owner.width !== owner.start) {
				internal = { ...result }
			}
			try {
				if (owner.width !== owner.start) {
					config.onColumnResizeEnd?.(result)
				}
			} finally {
				publish()
			}
			return true
		},
		cancel(view?: object) {
			if (drag && (!view || drag.scope.view === view)) {
				drag = undefined
				publish()
				return true
			}
			return false
		},
		step(scope: AppKitResizeScope, amount: number) {
			return commit(scope, current(scope.key, scope.width) + amount)
		},
		key(scope: AppKitResizeScope, key: string) {
			if (key === 'Escape') {
				return this.cancel(scope.view)
			}
			if (key === 'ArrowLeft' || key === 'ArrowRight') {
				return this.step(
					scope,
					(key === 'ArrowRight' ? 10 : -10) * (scope.direction === 'rtl' ? -1 : 1),
				)
			}
			if (key === 'Home') {
				return commit(scope, limits().min)
			}
			if (key === 'End' && Number.isFinite(limits().max)) {
				return commit(scope, limits().max)
			}
			return false
		},
		dispose() {
			disposed = true
			drag = undefined
		},
	}
}

export type AppKitColumnResizeState = ReturnType<typeof createAppKitColumnResizeState>
