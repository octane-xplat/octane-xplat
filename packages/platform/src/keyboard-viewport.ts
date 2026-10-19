/** @internal SDK-free seam. Observation never acquires a viewport policy. */
export interface KeyboardViewportLease {
	readonly supported: boolean
	update(): void
	release(): void
}

export type KeyboardViewportAdapter = (host: object) => KeyboardViewportLease
const adapters: { adapter: KeyboardViewportAdapter }[] = []
const readers = new Set<() => void>()
const selected = () => adapters.at(-1)?.adapter
const notify = () => {
	const errors: unknown[] = []
	// Snapshot: a callback may attach/release another viewport reader.
	const pending = Array.from(readers)
	for (const read of pending) {
		try {
			if (readers.has(read)) {
				read()
			}
		} catch (error) {
			errors.push(error)
		}
	}
	if (errors.length) {
		throw new AggregateError(errors, 'Keyboard viewport adapter failed')
	}
}

export function installKeyboardViewportAdapter(adapter: KeyboardViewportAdapter): () => void {
	const before = selected()
	const activation = { adapter }
	adapters.push(activation)
	try {
		if (before !== selected()) {
			notify()
		}
	} catch (error) {
		adapters.splice(adapters.indexOf(activation), 1)
		try {
			notify()
		} catch (rollback) {
			throw new AggregateError([error, rollback], 'Keyboard viewport rollback failed')
		}

		throw error
	}
	let active = true
	return () => {
		if (!active) {
			return
		}
		active = false
		const before = selected()
		adapters.splice(adapters.indexOf(activation), 1)
		if (before !== selected()) {
			notify()
		}
	}
}

/** Follow adapter replacement without transferring ownership to the source. */
export function observeKeyboardViewport(host: object): KeyboardViewportLease {
	const view = host as {
		isLoaded?: boolean
		on?(name: string, listener: () => void): void
		off?(name: string, listener: () => void): void
	}
	let adapter: KeyboardViewportAdapter | undefined
	let lease: KeyboardViewportLease | undefined
	let active = true
	let attached = view.isLoaded !== false
	const refresh = (force = false) => {
		if (!active || !attached || (!force && adapter === selected())) {
			return
		}
		lease?.release()
		lease = undefined
		adapter = selected()
		lease = adapter?.(host)
	}
	const loaded = () => {
		attached = true
		refresh(true)
	}
	const unloaded = () => {
		attached = false
		const release = lease
		lease = undefined
		adapter = undefined
		release?.release()
	}
	readers.add(refresh)
	try {
		refresh()
		view.on?.('loaded', loaded)
		view.on?.('unloaded', unloaded)
	} catch (error) {
		readers.delete(refresh)
		view.off?.('loaded', loaded)
		view.off?.('unloaded', unloaded)
		lease?.release()
		throw error
	}
	return {
		get supported() {
			return lease?.supported ?? false
		},
		update: () => {
			if (active) {
				lease?.update()
			}
		},
		release() {
			if (!active) {
				return
			}
			active = false
			readers.delete(refresh)
			view.off?.('loaded', loaded)
			view.off?.('unloaded', unloaded)
			lease?.release()
		},
	}
}
