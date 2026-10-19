/** A synchronous keyboard observer for one opaque native or browser window.
 * @internal Sources must release their own resources if attachment throws. */
export type KeyboardWindowSource<State> = (
	windowKey: object,
	publish: (state: State) => void,
) => () => void

/** @internal A fallback preserves compatibility when no controller is active. */
export type KeyboardSourcePriority = 'fallback' | 'controller'

/** Window-scoped subscription and source ownership for framework adapters.
 * @internal Installing a source does not observe windows without readers. */
export interface KeyboardWindowRegistry<State> {
	/** Deliver current state and subsequent changes; release is idempotent. */
	subscribe(window: object, listener: (state: State) => void): () => void
	/** Read available state without starting observation. */
	getSnapshot(window: object): State
	/** Activate a source until release; controllers take precedence over fallbacks.
	 * @default priority 'controller' */
	install(source: KeyboardWindowSource<State>, priority?: KeyboardSourcePriority): () => void
}

/** Create an isolated, synchronous window registry without renderer or SDK imports.
 * Active readers share one source per window. Source replacement rejects stale
 * callbacks, and the final reader releases the window. Identical source
 * activations share ownership without restarting observers.
 * @internal Framework adapters own the singleton and state contract. */
export function createKeyboardWindowRegistry<State>(
	initial: () => State,
): KeyboardWindowRegistry<State> {
	type Reader = { notify: (state: State) => void; revision: number }
	type Entry = {
		window: object
		state: State
		revision: number
		generation: number
		readers: Set<Reader>
		source?: KeyboardWindowSource<State>
		stop?: () => void
	}
	type Activation = { source: KeyboardWindowSource<State>; priority: KeyboardSourcePriority }
	const windows = new Map<object, Entry>()
	const emptyStates = new WeakMap<object, State>()
	const activations: Activation[] = []
	const emptyState = (key: object): State => {
		if (!emptyStates.has(key)) {
			emptyStates.set(key, initial())
		}

		return emptyStates.get(key) as State
	}
	const selected = () =>
		activations.findLast((entry) => entry.priority === 'controller')?.source ??
		activations.findLast((entry) => entry.priority === 'fallback')?.source

	const notify = (entry: Entry) => {
		const errors: unknown[] = []
		// Callbacks may attach or release readers during this notification.
		const readers = [...entry.readers]
		for (const reader of readers) {
			if (!entry.readers.has(reader) || reader.revision === entry.revision) {
				continue
			}

			reader.revision = entry.revision
			try {
				reader.notify(entry.state)
			} catch (error) {
				errors.push(error)
			}
		}

		if (errors.length) {
			throw new AggregateError(errors, 'Keyboard subscriber failed')
		}
	}

	const stop = (entry: Entry) => {
		entry.generation++
		entry.source = undefined
		const release = entry.stop
		entry.stop = undefined
		release?.()
	}

	const start = (entry: Entry) => {
		const source = selected()
		if (entry.source === source) {
			return
		}

		stop(entry)
		if (!source) {
			entry.state = emptyState(entry.window)
			entry.revision++
			notify(entry)
			return
		}

		const generation = entry.generation
		const previous = { state: entry.state, revision: entry.revision }
		entry.source = source
		let attaching = true
		try {
			const release = source(entry.window, (state) => {
				if (
					entry.generation !== generation ||
					windows.get(entry.window) !== entry ||
					Object.is(entry.state, state)
				) {
					return
				}

				entry.state = state
				entry.revision++
				if (!attaching) {
					notify(entry)
				}
			})

			attaching = false
			if (entry.generation !== generation || windows.get(entry.window) !== entry) {
				release()
				return
			}

			entry.stop = release
		} catch (error) {
			if (entry.generation === generation) {
				entry.generation++
				entry.source = undefined
				entry.state = previous.state
				entry.revision = previous.revision
			}

			throw error
		}

		notify(entry)
	}

	const refresh = () => {
		const errors: unknown[] = []
		// A subscriber can unmount or open another root during replacement.
		const entries = [...windows.values()]
		for (const entry of entries) {
			if (windows.get(entry.window) !== entry) {
				continue
			}

			try {
				start(entry)
			} catch (error) {
				errors.push(error)
			}
		}

		if (errors.length) {
			throw new AggregateError(errors, 'Keyboard source activation failed')
		}
	}

	return {
		getSnapshot: (window) => {
			const entry = windows.get(window)
			return entry ? entry.state : emptyState(window)
		},
		subscribe(window, listener) {
			let entry = windows.get(window)
			if (!entry) {
				entry = {
					window,
					state: emptyState(window),
					revision: 0,
					generation: 0,
					readers: new Set(),
				}

				windows.set(window, entry)
			}

			const owned = entry
			const reader = { notify: listener, revision: -1 }
			owned.readers.add(reader)
			let active = true
			const release = () => {
				if (!active) {
					return
				}

				active = false
				owned.readers.delete(reader)
				if (!owned.readers.size) {
					windows.delete(window)
					stop(owned)
				}
			}

			try {
				start(owned)
				notify(owned)
			} catch (error) {
				release()
				throw error
			}

			return release
		},
		install(source, priority = 'controller') {
			const activation = { source, priority }
			activations.push(activation)
			try {
				refresh()
			} catch (error) {
				activations.splice(activations.indexOf(activation), 1)
				try {
					refresh()
				} catch (rollbackError) {
					throw new AggregateError([error, rollbackError], 'Keyboard source rollback failed')
				}

				throw error
			}

			let active = true
			return () => {
				if (!active) {
					return
				}

				active = false
				activations.splice(activations.indexOf(activation), 1)
				refresh()
			}
		},
	}
}
