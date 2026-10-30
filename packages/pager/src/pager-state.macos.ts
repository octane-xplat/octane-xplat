export interface AppKitPagerFrame {
	view: object
	window: object
	width: number
	height: number
	position: number
	ready: boolean
}

interface Source {
	count: number
	page?: number
	defaultPage?: number
	direction: 'ltr' | 'rtl'
}

interface Placement {
	frame: AppKitPagerFrame
	count: number
	direction: 'ltr' | 'rtl'
	page: number
}

const index = (value: number | undefined, count: number) =>
	Math.min(Math.max(0, count - 1), Number.isFinite(value) ? Math.max(0, Math.trunc(value!)) : 0)

const sameFrame = (a: AppKitPagerFrame, b: AppKitPagerFrame) =>
	a.view === b.view && a.window === b.window && a.width === b.width && a.height === b.height

/** Page ownership/settlement only. The leaf supplies measured native geometry and scrolling. */
export function createAppKitPagerState(options: {
	source(): Source
	frame(): AppKitPagerFrame | null
	busy(): boolean
	write(offset: number, animated: boolean): void
	beforeWrite(): void
	report(page: number): void
}): {
	selected: () => number
	detach(): void
	interacted(): void
	synchronize(): void
	settle(): void
} {
	let source = options.source(),
		current = Number.isFinite(source.page ?? source.defaultPage)
			? Math.max(0, Math.trunc((source.page ?? source.defaultPage)!))
			: 0
	let applied: Placement | null = null,
		pending: Placement | null = null,
		version = 0
	const cancel = () => {
		version++
		pending = null
	}
	const placement = (frame: AppKitPagerFrame, page: number): Placement => ({
		frame,
		count: source.count,
		direction: source.direction,
		page,
	})
	const write = (target: Placement, animated: boolean) => {
		applied = target
		if (Math.abs(target.frame.position - target.page * target.frame.width) <= 1) {
			return
		}
		options.beforeWrite()
		try {
			options.write(target.page * target.frame.width, animated)
		} catch (error) {
			if (applied === target) {
				applied = null
			}

			throw error
		}
	}
	const complete = () => {
		const target = pending,
			frame = options.frame()
		if (
			!target ||
			!frame?.ready ||
			!sameFrame(target.frame, frame) ||
			Math.abs(frame.position - target.page * frame.width) > 1
		) {
			return
		}
		pending = null // Claim before application callbacks can render or reenter.
		const changed = current !== target.page
		current = target.page
		applied = placement(frame, current)
		if (changed) {
			options.report(current)
		}
	}
	return {
		selected: () => index(current, options.source().count),
		detach() {
			cancel()
			applied = null
		},
		interacted(): void {
			cancel()
			const frame = options.frame()
			if (frame?.ready) {
				applied = placement(frame, index(current, source.count))
			}
		},
		synchronize(): void {
			const next = options.source()
			const changed =
				next.count !== source.count ||
				next.direction !== source.direction ||
				!Object.is(next.page, source.page)
			if (changed) {
				cancel()
				options.beforeWrite()
			}
			source = next
			if (!source.count) {
				cancel()
				applied = null
				return
			}
			const frame = options.frame()
			if (!frame?.ready) {
				if (pending && (!frame || !sameFrame(pending.frame, frame))) {
					cancel()
				}

				return
			}
			if (pending) {
				if (!changed && sameFrame(pending.frame, frame)) {
					complete()
					return
				}

				cancel()
				options.beforeWrite()
			}
			const desired =
				source.page === undefined ? index(current, source.count) : index(source.page, source.count)
			const previous = applied
			if (!previous && options.busy() && !changed) {
				return
			}
			current = desired
			if (
				previous &&
				sameFrame(previous.frame, frame) &&
				previous.count === source.count &&
				previous.direction === source.direction &&
				previous.page === desired
			) {
				return
			}
			write(placement(frame, desired), Boolean(previous && sameFrame(previous.frame, frame)))
		},
		settle(): void {
			const frame = options.frame(),
				latest = options.source()
			if (
				!frame?.ready ||
				!latest.count ||
				latest.count !== source.count ||
				latest.direction !== source.direction ||
				!Object.is(latest.page, source.page)
			) {
				return
			}
			cancel()
			const target = placement(
					frame,
					index(Math.round(frame.position / frame.width), latest.count),
				),
				request = version
			pending = target
			try {
				write(target, true)
			} catch (error) {
				if (pending === target) {
					pending = null
				}

				throw error
			}
			if (version === request && pending === target) {
				complete()
			}
		},
	}
}
