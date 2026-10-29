import { createStore } from '../../data/store'

export interface ContentRoot {
	render(component: any, props?: any): void
	unmount(): void
	whenCommitted(callback: () => void): void
}

export interface ContentEntry {
	id: number
	target: unknown
	component: any
	props: any
	committed(): void
}

/** Hook-free ownership for content rendered by an outlet in the source tree. */
export function createContentOwner() {
	const entries = createStore<ContentEntry[]>([])
	const roots = new Set<{ dispose(): void }>()
	let nextId = 0
	let disposed = false
	return {
		entries,
		get disposed() {
			return disposed
		},
		/** The mounted outlet supplies its host view (NS View on native — the modal/page walkers read `.page`/`.parent`). */
		host: null as { page?: any; parent?: any; window?: any } | null,
		createRoot(target: unknown, onOwnerDispose: () => void = () => {}): ContentRoot {
			if (disposed) {
				throw new Error('The content outlet has been removed')
			}

			const id = nextId++
			let closed = false
			let committed = false
			const pending = new Set<() => void>()
			const root = {
				render(component: any, props: any = {}) {
					if (closed) {
						return
					}

					committed = false
					const entry: ContentEntry = {
						id,
						target,
						component,
						props,
						committed() {
							if (closed) {
								return
							}

							committed = true
							const callbacks = [...pending]
							pending.clear()
							for (const callback of callbacks) {
								callback()
							}
						},
					}

					entries.update((current) => [...current.filter((entry) => entry.id !== id), entry])
				},
				whenCommitted(callback: () => void) {
					if (closed) {
						return
					}

					if (committed) {
						callback()
					} else {
						pending.add(callback)
					}
				},
				unmount() {
					if (closed) {
						return
					}

					closed = true
					pending.clear()
					roots.delete(root)
					entries.update((current) => current.filter((entry) => entry.id !== id))
				},
				dispose() {
					if (closed) {
						return
					}

					try {
						root.unmount()
					} finally {
						onOwnerDispose()
					}
				},
			}

			roots.add(root)
			return root
		},
		dispose() {
			if (disposed) {
				return
			}

			disposed = true
			const errors: unknown[] = []
			for (const root of [...roots]) {
				try {
					root.dispose()
				} catch (error) {
					errors.push(error)
				}
			}

			if (errors.length) {
				throw new AggregateError(errors, 'Content owner cleanup failed')
			}
		},
	}
}

export type ContentOwner = ReturnType<typeof createContentOwner>

/** Standalone roots commit synchronously; owner outlets signal after portal commit. */
export function afterContentCommit(
	root: { unmount(): void; whenCommitted?: (callback: () => void) => void },
	callback: () => void,
) {
	if (root.whenCommitted) {
		root.whenCommitted(callback)
	} else {
		callback()
	}
}
