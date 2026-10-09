import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'octane'
import type { RollingTextProps } from './props'
import { segmentUnits } from './segment'
import { initialCells, planCells, settleCells, snapCells, type CellState } from './plan'
import { playRoll } from './tween'
import { clipRow, viewHeight, writeCell } from './host'
import { observeReducedMotion, readReducedMotion } from './reduced-motion'

/** Grace period after the last cell tween should land, before a 'latest' run
 *  drains its pending value. */
const RUN_BUFFER_MS = 60

/** Hard bound on cells per label — a pathological label degrades to one
 *  whole-label unit instead of unbounded views. */
const MAX_UNITS = 256

function useLiveReducedMotion(active: boolean): boolean {
	const [reduced, setReduced] = useState(() => (active ? readReducedMotion() : false))
	useEffect(() => {
		if (!active) {
			setReduced(false)
			return
		}

		const update = () => setReduced(readReducedMotion())
		const off = observeReducedMotion(update)
		update()
		return off
	}, [active])

	return reduced
}

export interface RollingTextHandle {
	cells: CellState[]
	/** Accessible name for the label — the current `value` or the caller's
	 *  `accessibilityLabel`. Tracks the latest prop, even while playback is
	 *  queued or reduced. */
	label: string
	/** Ref for the clipped row view; also applies the native clip. */
	attachRow: (view: any) => void
	/** Ref factory for a cell view — writes the enter offset before paint. */
	attachCell: (id: number) => (view: any) => void
}

/**
 * Orchestration shared by both leaves: owns the committed value, the cell
 * plan, the update-policy queue, reduced-motion handling, and every cell
 * tween. The leaf only renders `cells` and attaches the row/cell refs.
 */
export function useRollingText(props: RollingTextProps): RollingTextHandle {
	const rollBy = props.rollBy ?? 'grapheme'
	const direction = props.direction ?? 'up'
	const policy = props.updatePolicy ?? 'interrupt'
	const mode = props.reducedMotion ?? 'user'
	const durationMs = Math.max(0, (props.transition?.duration ?? 0.3) * 1000)
	const delayMs = Math.max(0, (props.transition?.delay ?? 0) * 1000)

	const systemReduced = useLiveReducedMotion(mode === 'user')
	const reduced = mode === 'always' || (mode === 'user' && systemReduced)

	const nextId = useRef(0)
	const alloc = () => ++nextId.current

	const latest = useRef({ rollBy, direction, policy, reduced, durationMs, delayMs })
	latest.current = { rollBy, direction, policy, reduced, durationMs, delayMs }

	// Mount snaps to the initial value — all cells start settled.
	const [cells, setCells] = useState<CellState[]>(() =>
		initialCells(unitsFor(props.value), alloc),
	)
	const cellsRef = useRef(cells)
	const committedRef = useRef(props.value)
	const pendingRef = useRef<string | null>(null)
	const runningRef = useRef(false)
	const runTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const rowRef = useRef<any>(null)
	const distanceRef = useRef(0)
	const viewsRef = useRef(new Map<number, any>())
	const attachFns = useRef(new Map<number, (view: any) => void>())
	const tweens = useRef(new Map<number, { phase: 'enter' | 'exit'; cancel: () => void }>())
	const settled = useRef(new Set<number>())

	function unitsFor(value: string): string[] {
		const units = segmentUnits(value, latest.current.rollBy)
		return units.length > MAX_UNITS ? [value] : units
	}

	function setCellsSync(next: CellState[]) {
		cellsRef.current = next
		setCells(next)
	}

	function removeCell(id: number) {
		const next = cellsRef.current.filter((cell) => cell.id !== id)
		if (next.length !== cellsRef.current.length) {
			setCellsSync(next)
		}
	}

	function finishRun() {
		runningRef.current = false
		runTimerRef.current = null
		const pending = pendingRef.current
		pendingRef.current = null
		if (pending !== null && pending !== committedRef.current) {
			startRun(pending)
		}
	}

	/** Snap the committed target: exits drop, entering cells settle. The cell
	 *  effect writes the resting transform on the next commit. */
	function settleNow() {
		if (runTimerRef.current !== null) {
			clearTimeout(runTimerRef.current)
			runTimerRef.current = null
		}

		runningRef.current = false
		pendingRef.current = null
		setCellsSync(snapCells(cellsRef.current))
	}

	/** Reduced-motion commit — the new value appears whole, no roll. */
	function commitNow(next: string) {
		if (runTimerRef.current !== null) {
			clearTimeout(runTimerRef.current)
			runTimerRef.current = null
		}

		runningRef.current = false
		pendingRef.current = null
		committedRef.current = next
		setCellsSync(settleCells(cellsRef.current, unitsFor(next), alloc))
	}

	function startRun(next: string) {
		// The row's current height is the roll distance: one line of cells.
		// Before first layout it is 0 and cells fall back to their own height
		// (or a fade when nothing has been laid out yet).
		distanceRef.current = rowRef.current ? viewHeight(rowRef.current) : 0
		committedRef.current = next
		setCellsSync(planCells(cellsRef.current, unitsFor(next), alloc))
		runningRef.current = true
		if (runTimerRef.current !== null) {
			clearTimeout(runTimerRef.current)
		}

		runTimerRef.current = setTimeout(
			finishRun,
			latest.current.delayMs + latest.current.durationMs + RUN_BUFFER_MS,
		)
	}

	function requestValue(next: string) {
		if (next === committedRef.current) {
			// Equal values do nothing — and 'latest' drops a pending target that
			// now matches the running destination.
			pendingRef.current = null
			return
		}

		if (latest.current.reduced) {
			commitNow(next)
			return
		}

		if (runningRef.current) {
			if (latest.current.policy === 'latest') {
				pendingRef.current = next
				return
			}

			settleNow()
		}

		startRun(next)
	}

	// Value changes — the semantic label tracks `value` immediately; playback
	// follows the update policy.
	useLayoutEffect(() => {
		requestValue(props.value)
	}, [props.value])

	// Unit-mode changes re-segment the committed text without a roll.
	useLayoutEffect(() => {
		const units = unitsFor(committedRef.current)
		const current = cellsRef.current.filter((cell) => cell.phase !== 'exit')
		if (
			units.length === current.length &&
			units.every((unit, index) => unit === current[index].unit)
		) {
			return
		}

		setCellsSync(settleCells(cellsRef.current, units, alloc))
	}, [rollBy])

	// The system preference flipping mid-roll settles instantly and clears
	// pending playback.
	useEffect(() => {
		if (reduced) {
			settleNow()
		}
	}, [reduced])

	// Central playback: reconcile running tweens with the committed cell plan.
	// An 'enter' cell whose tween completed keeps phase 'enter' in state until
	// the next plan — `settled` is what stops it from re-rolling.
	useLayoutEffect(() => {
		const alive = new Set<number>()
		for (const cell of cells) {
			alive.add(cell.id)
			const view = viewsRef.current.get(cell.id)
			const tween = tweens.current.get(cell.id)
			if (cell.phase === 'stable') {
				if (tween) {
					tween.cancel()
					tweens.current.delete(cell.id)
				}

				if (view && !settled.current.has(cell.id)) {
					writeCell(view, 0, 1)
					settled.current.add(cell.id)
				}

				continue
			}

			if (!view) {
				continue
			}

			if (tween) {
				// A wrong-phase tween belongs to a superseded plan — restart it.
				if (tween.phase === cell.phase) {
					continue
				}

				tween.cancel()
				tweens.current.delete(cell.id)
			} else if (cell.phase === 'enter' && settled.current.has(cell.id)) {
				// A completed enter stays 'enter' until the next plan — don't
				// re-roll it just because a sibling finished exiting.
				continue
			}

			settled.current.delete(cell.id)
			const sign = latest.current.direction === 'up' ? 1 : -1
			const distance = distanceRef.current || viewHeight(view)
			if (cell.phase === 'enter') {
				const id = cell.id
				tweens.current.set(id, {
					phase: 'enter',
					cancel: playRoll(view, {
						fromY: sign * distance,
						toY: 0,
						fromOpacity: 0,
						toOpacity: 1,
						durationMs: latest.current.durationMs,
						delayMs: latest.current.delayMs,
						onDone: () => {
							tweens.current.delete(id)
							settled.current.add(id)
						},
					}),
				})
			} else {
				const id = cell.id
				tweens.current.set(id, {
					phase: 'exit',
					cancel: playRoll(view, {
						fromY: 0,
						toY: -sign * distance,
						fromOpacity: 1,
						toOpacity: 0,
						durationMs: latest.current.durationMs,
						delayMs: latest.current.delayMs,
						onDone: () => {
							tweens.current.delete(id)
							removeCell(id)
						},
					}),
				})
			}
		}

		// Cells dropped by the plan (interrupt settle, instant commit) still own
		// tweens — cancel them so no frame work outlives the cell.
		for (const [id, tween] of [...tweens.current]) {
			if (!alive.has(id)) {
				tween.cancel()
				tweens.current.delete(id)
			}
		}
	}, [cells])

	// Disposal: cancel the run timer, pending destinations and every live
	// tween; no timers or retained cells survive unmount.
	useEffect(
		() => () => {
			if (runTimerRef.current !== null) {
				clearTimeout(runTimerRef.current)
			}

			for (const tween of tweens.current.values()) {
				tween.cancel()
			}

			tweens.current.clear()
			viewsRef.current.clear()
			attachFns.current.clear()
		},
		[],
	)

	const attachRow = useCallback((view: any) => {
		rowRef.current = view
		if (view) {
			clipRow(view)
		}
	}, [])

	const attachCell = useCallback(
		(id: number) => {
			let fn = attachFns.current.get(id)
			if (!fn) {
				fn = (view: any) => {
					if (!view) {
						viewsRef.current.delete(id)
						return
					}

					viewsRef.current.set(id, view)
					const cell = cellsRef.current.find((entry) => entry.id === id)
					if (cell?.phase === 'enter') {
						// Park the incoming face outside the clip before the first
						// paint; the layout effect starts the roll on this commit.
						const sign = latest.current.direction === 'up' ? 1 : -1
						writeCell(view, sign * distanceRef.current, 0)
					}
				}
				attachFns.current.set(id, fn)
			}

			return fn
		},
		[],
	)

	return {
		cells,
		label: props.accessibilityLabel ?? props.value,
		attachRow,
		attachCell,
	}
}
