export type AppKitStickyColumns = {
	sync: () => void
	bind(view: Host | null): void
	cell(edge: 'start' | 'end'): (view: Host | null) => void
	dispose(): void
}

interface Geometry {
	x: number
	width: number
	rowX: number
	rowWidth: number
}

interface Lease {
	read(document: object): Geometry | undefined
	update(offset: number, priority: number): void
	release(): void
}

type Host = Record<string, any>
export function appKitStickyOffset(
	cell: Geometry,
	left: number,
	width: number,
	edge: 'start' | 'end',
	direction: 'ltr' | 'rtl',
): number {
	if (
		![cell.x, cell.width, cell.rowX, cell.rowWidth, left, width].every(Number.isFinite) ||
		width <= 0 ||
		cell.width < 0 ||
		cell.rowWidth < cell.width
	) {
		return 0
	}
	const rightEdge = (edge === 'start') === (direction === 'rtl')
	const offset = rightEdge ? cell.rowX + cell.rowWidth - cell.x - cell.width : cell.x - cell.rowX
	const proposed = rightEdge
		? Math.min(cell.x, left + width - offset - cell.width)
		: Math.max(cell.x, left + offset)
	const next = Math.max(cell.rowX, Math.min(cell.rowX + cell.rowWidth - cell.width, proposed))
	return next - cell.x
}

/** Own native placement leases and coalesced geometry observations for one Table. */
export function createAppKitStickyColumns(
	options: {
		direction(): 'ltr' | 'rtl'
		retain(view: object): Lease | undefined
	},
	native: () => Host = () => globalThis,
): AppKitStickyColumns {
	type Cell = { view: Host; edge: 'start' | 'end'; lease?: Lease }
	let viewport: Host | null = null,
		observed: { clip: Host; document: Host; window: object | undefined } | undefined
	let generation = 0,
		queued = false,
		disposed = false,
		syncing = false
	let releases: (() => void)[] = []
	const cells = new Set<Cell>()
	const release = (cell: Cell) => {
		const lease = cell.lease
		cell.lease = undefined
		try {
			lease?.release()
		} catch {
			console.warn('[macos-table] sticky placement cleanup failed')
		}
	}
	const clearObservers = () => {
		observed = undefined
		for (const stop of releases.splice(0)) {
			try {
				stop()
			} catch {
				console.warn('[macos-table] sticky observation cleanup failed')
			}
		}
	}
	const hidden = (view: Host) =>
		['hidden', 'hiddenOrHasHiddenAncestor'].some((key) =>
			Boolean(typeof view[key] === 'function' ? view[key]() : view[key]),
		)
	const schedule = () => {
		if (queued || disposed) {
			return
		}
		queued = true
		const own = generation
		void Promise.resolve().then(() => {
			if (own !== generation) {
				return
			}
			queued = false
			synchronize()
		})
	}
	const observe = (clip: Host, document: Host, window: object | undefined) => {
		if (observed?.clip === clip && observed.document === document && observed.window === window) {
			return true
		}
		clearObservers()
		const host = native(),
			center = host.NSNotificationCenter?.defaultCenter,
			owner = viewport,
			own = generation
		if (!center?.addObserverForNameObjectQueueUsingBlock || !center.removeObserver) {
			return false
		}
		try {
			clip.postsBoundsChangedNotifications = true
			document.postsFrameChangedNotifications = true
			for (const [name, object] of [
				['NSViewBoundsDidChangeNotification', clip],
				['NSViewFrameDidChangeNotification', document],
				['NSViewFrameDidChangeNotification', owner],
				['NSWindowDidUpdateNotification', null],
			] as const) {
				const token = center.addObserverForNameObjectQueueUsingBlock(
					host[name] ?? name,
					object,
					null,
					(note: { object: unknown }) => {
						if (generation !== own || viewport !== owner || disposed) {
							return
						}
						if (
							object
								? note.object === object
								: note.object === window || note.object === viewport?.window
						) {
							schedule()
						}
					},
				)

				if (token == null) {
					throw Error('AppKit sticky-column observation unavailable')
				}

				releases.push(() => center.removeObserver(token))
			}

			observed = { clip, document, window }
			return true
		} catch {
			clearObservers()
			return false
		}
	}
	const synchronize = () => {
		if (syncing || disposed) {
			return
		}
		syncing = true
		try {
			if (!cells.size) {
				clearObservers()
				return
			}

			const view = viewport,
				clip = view?.contentView,
				document = view?.documentView,
				window = view?.window

			if (
				!view ||
				!clip ||
				!document ||
				!observe(clip, document, window) ||
				!window ||
				hidden(view)
			) {
				for (const cell of cells) {
					release(cell)
				}

				return
			}

			const left = Number(clip.bounds?.origin.x),
				width = Number(clip.bounds?.size.width)

			if (![left, width].every(Number.isFinite) || width <= 0) {
				for (const cell of cells) {
					release(cell)
				}

				return
			}

			for (const cell of cells) {
				if (
					cell.view.window !== window ||
					hidden(cell.view) ||
					!cell.view.isDescendantOf?.(document)
				) {
					release(cell)
					continue
				}

				cell.lease ??= options.retain(cell.view)
				const geometry = cell.lease?.read(document)
				if (!geometry) {
					cell.lease?.update(0, 0)
					continue
				}

				const offset = appKitStickyOffset(geometry, left, width, cell.edge, options.direction())
				cell.lease?.update(offset, Math.abs(offset) > 0.01 ? (cell.edge === 'start' ? 2 : 1) : 0)
			}
		} catch {
			for (const cell of cells) {
				release(cell)
			}

			console.warn('[macos-table] sticky synchronization unavailable')
		} finally {
			syncing = false
		}
	}
	return {
		sync: schedule,
		bind(view: Host | null): void {
			if (disposed || viewport === view) {
				schedule()
				return
			}
			generation++
			queued = false
			clearObservers()
			for (const cell of cells) {
				release(cell)
			}
			viewport = view
			schedule()
		},
		cell(edge: 'start' | 'end') {
			let current: Cell | undefined
			return (view: Host | null): void => {
				if (current?.view === view) {
					return
				}
				if (current) {
					cells.delete(current)
					release(current)
					current = undefined
				}
				if (view && !disposed) {
					current = { view, edge }
					cells.add(current)
					schedule()
				}
			}
		},
		dispose(): void {
			if (disposed) {
				return
			}
			disposed = true
			generation++
			queued = false
			viewport = null
			clearObservers()
			for (const cell of cells) {
				release(cell)
			}
			cells.clear()
		},
	}
}
