import type {
	ResizableConfig,
	ResizableDirection,
	ResizableRegion,
	ResizableProps,
	UseResizableSingleConfig,
} from './props'

import { clampSize, toPixels } from './resize-math'
import { loadResizableState, persistResizableState } from './resize-persist'

export const DEFAULT_COLLAPSED_SIZE = 40

/** Platform seam the machine needs: measure the % basis and observe it for
 *  changes. Each leaf supplies these so the state machine stays platform-free. */
export interface ResizableBasisSource {
	/** Current basis in px/dips for the axis (container size, or the
	 *  viewport/screen when no container is supplied). */
	measure: (containerRef: { current: any } | undefined, direction: ResizableDirection) => number | null
	/** Subscribe to basis changes; returns an unsubscribe. */
	observe: (containerRef: { current: any } | undefined, direction: ResizableDirection, cb: () => void) => () => void
	/** Storage key prefix — `astryx-resizable:` upstream. */
	storagePrefix: string
}

/** One resizable region's machine — plain object so multi-region use and
 *  per-platform hooks stay thin. Re-entrant gesture handlers mirror the
 *  upstream hook exactly. */
export interface ResizableMachine {
	region: ResizableRegion
	/** Recompute bounds when the measured basis changed. */
	remeasure: () => void
	/** Push new config (props changed between renders). */
	update: (config: UseResizableSingleConfig) => void
	subscribe: (cb: () => void) => () => void
	/** Snapshot for getSnapshot — a fresh object only when size/collapsed change. */
	getSnapshot: () => { size: number; isCollapsed: boolean }
}

const warned = new Set<string>()
function devWarn(what: string, msg: string) {
	const k = what + ':' + msg
	if (warned.has(k)) {return}
	warned.add(k)
	console.warn(`[octane-xplat] ${what}: ${msg}`)
}

/** Build a single resizable region. `storageKey` defaults to autoSaveId;
 *  multi-region callers pass `${autoSaveId}:${key}`. */
export function createResizableRegion(
	config: UseResizableSingleConfig,
	basis: ResizableBasisSource,
	storageKey?: string,
): ResizableMachine {
	const direction: ResizableDirection = config.direction ?? 'horizontal'
	const containerRef = config.containerRef
	const persistKey = storageKey ?? config.autoSaveId
	const persisted = persistKey ? loadResizableState(persistKey.startsWith(basis.storagePrefix) ? persistKey : basis.storagePrefix + persistKey) : null

	let listeners = new Set<() => void>()
	let gestureBasis: number | null = null
	let dragStartSize = 0
	let didWarnInverted = false
	let snapshot = { size: 0, isCollapsed: false }

	const emit = () => {
		listeners.forEach((cb) => cb())
	}

	let cfg = config
	let basisValue: number | null = basis.measure(containerRef, direction)
	const isBasisMeasured = () => basisValue != null

	const resolvedMin = () => {
		const v = toPixels(cfg.minSize, basisValue ?? 0)
		return v ?? 0
	}

	const resolvedMax = () => {
		const v = toPixels(cfg.maxSize, basisValue ?? Infinity)
		return v ?? Infinity
	}

	const snaps = () => cfg.snaps ?? []

	const initialSize = () => {
		if (persisted?.size != null) {return persisted.size}
		const d = toPixels(cfg.defaultSize, basisValue ?? 0)
		return d ?? 0
	}

	let chosenSize = initialSize()
	let uncontrolledCollapsed = persisted?.isCollapsed ?? cfg.defaultIsCollapsed ?? false

	const isControlled = () => cfg.isCollapsed !== undefined
	const isCollapsed = () => (cfg.collapsible ? (isControlled() ? cfg.isCollapsed! : uncontrolledCollapsed) : false)

	const recomputeSnapshot = () => {
		const size = isCollapsed() ? 0 : chosenSize
		if (snapshot.size !== size || snapshot.isCollapsed !== isCollapsed()) {
			snapshot = { size, isCollapsed: isCollapsed() }
		}
	}

	recomputeSnapshot()

	const setCollapsed = (value: boolean) => {
		if (!isControlled()) {uncontrolledCollapsed = value}
	}

	const notify = () => {
		if (resolvedMin() > resolvedMax() && !didWarnInverted) {
			didWarnInverted = true
			devWarn('useResizable', `the resolved minimum (${resolvedMin()}px) is above the resolved maximum (${resolvedMax()}px). The maximum wins.`)
		}

		if (persistKey && isBasisMeasured()) {
			persistResizableState(
				persistKey.startsWith(basis.storagePrefix) ? persistKey : basis.storagePrefix + persistKey,
				{ size: chosenSize, isCollapsed: isCollapsed() },
			)
		}

		recomputeSnapshot()
		emit()
	}

	const collapse = () => {
		if (!cfg.collapsible || isCollapsed()) {return}
		setCollapsed(true)
		cfg.onCollapseChange?.(true)
		cfg.onSizeChange?.(0)
		notify()
	}

	const expand = () => {
		const wasCollapsed = isCollapsed()
		setCollapsed(false)
		if (wasCollapsed) {cfg.onCollapseChange?.(false)}
		cfg.onSizeChange?.(chosenSize)
		notify()
	}

	const resize = (newSize: number) => {
		if (!Number.isFinite(newSize) || newSize < 0) {
			devWarn('useResizable', `resize(${String(newSize)}) is not a pixel size. Keeping the current size. Percentages configure the hook; they are not a programmatic input.`)
			return
		}

		const clamped = clampSize(newSize, resolvedMin(), resolvedMax(), snaps())
		const wasCollapsed = isCollapsed()
		chosenSize = clamped
		setCollapsed(false)
		if (wasCollapsed) {cfg.onCollapseChange?.(false)}
		cfg.onSizeChange?.(clamped)
		notify()
	}

	const onResizeStart = () => {
		gestureBasis = basisValue
		dragStartSize = isCollapsed() ? 0 : chosenSize
	}

	const onResizeMove = (delta: number) => {
		const raw = dragStartSize + delta
		const collapsedSize = cfg.collapsedSize ?? DEFAULT_COLLAPSED_SIZE
		if (cfg.collapsible && raw < collapsedSize) {
			if (!isCollapsed()) {
				setCollapsed(true)
				cfg.onCollapseChange?.(true)
				cfg.onSizeChange?.(0)
				notify()
			}

			return
		}

		if (isCollapsed() && raw >= collapsedSize) {
			setCollapsed(false)
			cfg.onCollapseChange?.(false)
		}

		const clamped = clampSize(raw, resolvedMin(), resolvedMax(), snaps())
		chosenSize = clamped
		cfg.onSizeChange?.(clamped)
		notify()
	}

	const releaseGestureBasis = () => {
		gestureBasis = null
	}

	const onResizeEnd = () => {
		releaseGestureBasis()
	}

	const props: ResizableProps = {
		_size: 0,
		_isCollapsed: false,
		_onResizeStart: onResizeStart,
		_onResizeMove: onResizeMove,
		_onResizeEnd: onResizeEnd,
		_onResizeCancel: releaseGestureBasis,
		_minSizePx: 0,
		_maxSizePx: 0,
		_snaps: [],
		_collapsedSize: 0,
		_collapsible: false,
		_direction: direction,
		_isResizableProps: true,
	}

	const syncProps = () => {
		props._size = isCollapsed() ? 0 : chosenSize
		props._isCollapsed = isCollapsed()
		props._minSizePx = resolvedMin()
		props._maxSizePx = resolvedMax()
		props._snaps = snaps()
		props._collapsedSize = cfg.collapsedSize ?? DEFAULT_COLLAPSED_SIZE
		props._collapsible = cfg.collapsible ?? false
	}

	syncProps()

	const machine: ResizableMachine = {
		region: { size: snapshot.size, isCollapsed: snapshot.isCollapsed, collapse, expand, resize, props },
		subscribe: (cb) => {
			listeners.add(cb)
			return () => listeners.delete(cb)
		},
		getSnapshot: () => {
			recomputeSnapshot()
			syncProps()
			// Keep the public region object in step with the snapshot.
			machine.region.size = snapshot.size
			machine.region.isCollapsed = snapshot.isCollapsed
			return snapshot
		},
		remeasure: () => {
			if (gestureBasis != null) {return} // frozen mid-gesture
			const next = basis.measure(containerRef, direction)
			if (next == null || next === basisValue) {return}
			basisValue = next
			// Re-resolve the selection against the new basis.
			chosenSize = clampSize(chosenSize, resolvedMin(), resolvedMax(), snaps())
			notify()
		},
		update: (next: UseResizableSingleConfig) => {
			// Silent config swap — emitting here would re-render the component
			// every frame (update is called during render, notifying subscribers
			// loops). Config reads happen lazily via cfg.* at gesture time.
			cfg = next
		},
	}

	// First layout resolution — the basis may arrive after mount.
	if (!isBasisMeasured()) {
		// The caller's observe() path calls remeasure once the element reports.
	} else {
		notify()
	}

	return machine
}

/** Map a component's simplified `resizable` config (e.g. SideNav) to the
 *  full single-region config. */
export function regionConfigFrom(resizable: true | ResizableConfig | undefined): UseResizableSingleConfig | null {
	if (!resizable) {return null}
	if (resizable === true) {
		return { defaultSize: 260, minSize: 180, maxSize: 480 }
	}

	return {
		defaultSize: resizable.defaultWidth ?? 260,
		minSize: resizable.minWidth ?? 180,
		maxSize: resizable.maxWidth ?? 480,
		autoSaveId: resizable.autoSaveId,
		defaultIsCollapsed: resizable.defaultIsCollapsed,
		isCollapsed: resizable.isCollapsed,
		onSizeChange: resizable.onWidthChange,
		onCollapseChange: resizable.onCollapseChange,
	}
}
