import { prepareHistoryEntry } from './prepare-history-entry'
// oxlint-disable-next-line xplat/no-ts-imports-tsrx -- Compiled component value for owned roots; no hooks run here.
import { ClientRouteOutlet } from './ClientRouteOutlet.tsrx'
import { createRenderRouterHost } from './render-router-host'
import { createRouterRenderScope } from './router-render-scope'
import { createStore } from './store'
import type { ContentOwner, ContentRoot } from './owned-content'
import type {
	ClientRouterHost,
	RouterHost,
	RouterHostChange,
	RouterHostCommand,
	RouterHostResult,
	RouterInstance,
	PreparedRouteMatch,
	RouteTransitionResult,
	RouteTransitionContext,
	TransitionDefinition,
} from './props'

/** Native/window surface owns transport; the shared host owns routed history. */
export interface RouterModalSurface {
	readonly native: unknown
	readonly root: ContentRoot
	show(): Promise<
		{ status: 'shown'; finished?: Promise<RouteTransitionResult> } | { status: 'closed' }
	>
	close(): Promise<void>
	dispose(): void
}

export interface RouterModalSurfaceRequest {
	owner: ContentOwner
	route: PreparedRouteMatch
	transition?: TransitionDefinition
	context: RouteTransitionContext
	flow: string
	presenterFlow: string
	presenter?: RouterModalSurface
	onClosed(): void
	onOwnerDisposed(): void
}

type Modal = {
	flow: string
	presenterFlow: string
	surface: RouterModalSurface
	phase: 'staged' | 'showing' | 'shown' | 'closing'
	cancelled: Promise<void>
	cancel(): void
	ready: Promise<'shown' | 'closed'>
	setReady(value: 'shown' | 'closed'): void
	closing?: Promise<void>
}

/** Decorate one window's independent host with owner-preserving modal flows.
 * A modal has no invented base entry: Back at its first screen is at-base;
 * dismissal closes the surface and all its descendants, retaining the presenter. */
export function createModalRouterHost(options: {
	base: ClientRouterHost
	createSurface(request: RouterModalSurfaceRequest): RouterModalSurface | undefined
	onCleanupError?(error: unknown): void
}) {
	const base = options.base
	if (base.host.history !== 'independent') {
		throw new TypeError('Modal surfaces require independent presentation histories')
	}
	const panes = createRenderRouterHost()
	const owners = new Map<string, ContentOwner>()
	const ownerReady = new Map<string, Promise<() => void | Promise<void>>>()
	const lifetimes = new Map<string, Promise<void>>()
	const records = new Map<string, Modal>()
	const modals = createStore<readonly { flow: string; presenterFlow: string }[]>([])
	const listeners = new Set<(change?: RouterHostChange) => void>()
	const commits = new Map<string | symbol, Promise<unknown>>()
	const surfaceQueue = Symbol('window surface operations')
	const prefix = 'modal:' + Math.random().toString(36).slice(2) + ':'
	let instance: RouterInstance<any> | undefined
	let sequence = 0
	let disposed = false
	const notify = (change?: RouterHostChange) => {
		// Cleanup observers can replace subscriptions while notification is in progress.
		// oxlint-disable-next-line unicorn/no-useless-spread
		for (const listener of [...listeners]) {
			listener(change)
		}
	}
	const report = (error: unknown) => {
		if (options.onCleanupError) {
			try {
				options.onCleanupError(error)
			} catch {
				console.warn('[octane-xplat] Modal cleanup observer threw')
			}
		} else {
			console.warn('[octane-xplat] Routed modal cleanup failed')
		}
	}
	const publish = () =>
		modals.set(
			[...records.values()]
				.filter((record) => record.phase !== 'staged')
				.map(({ flow, presenterFlow }) => ({ flow, presenterFlow })),
		)
	const finish = (record: Modal, external: boolean) => {
		if (records.get(record.flow) !== record) {
			return
		}
		if (external) {
			void closeChildren(record.flow).catch(report)
		}
		records.delete(record.flow)
		record.cancel()
		record.setReady('closed')
		record.surface.dispose()
		publish()
		notify({
			ownerDisposed: true,
			flowDisposed: true,
			...(external ? { external: true } : {}),
			flow: record.flow,
		})
	}
	const isDescendant = (record: Modal, flow: string) => {
		let parent = record.presenterFlow
		while (true) {
			if (parent === flow) {
				return true
			}

			const ancestor = records.get(parent)
			if (!ancestor) {
				return false
			}

			parent = ancestor.presenterFlow
		}
	}
	const close = (record: Modal): Promise<void> => {
		if (record.closing) {
			return record.closing
		}
		const staged = record.phase === 'staged'
		record.phase = 'closing'
		record.cancel()
		notify({ ownerDisposed: true, flowDisposed: true, flow: record.flow })
		record.closing = (async () => {
			try {
				await closeChildren(record.flow)
				if (!staged) {
					await record.surface.close()
				}
			} finally {
				finish(record, false)
			}
		})()
		return record.closing
	}
	const closeChildren = async (flow: string, except?: Modal, wholeWindow = false) => {
		const errors: unknown[] = []
		for (const record of [...records.values()].reverse()) {
			if (record !== except && (wholeWindow || isDescendant(record, flow))) {
				try {
					await close(record)
				} catch (error) {
					errors.push(error)
				}
			}
		}
		if (errors.length) {
			throw new AggregateError(errors, 'Routed modal cleanup failed')
		}
	}
	const family = (flow: string) => {
		let current = flow
		while (records.has(current)) {
			current = records.get(current)!.presenterFlow
		}
		return current
	}
	const detachBase = base.host.subscribe((change) => {
		// This layer already reports owner disposal before asynchronous cleanup.
		// A delayed base detach belongs to that old lifetime; forwarding it as
		// another disposal would cancel work started by a newly mounted owner.
		notify(
			change?.ownerDisposed && change.flow && lifetimes.has(change.flow)
				? { ...change, ownerDisposed: false }
				: change,
		)
		if (change?.external && change.flow) {
			void closeChildren(change.flow, undefined, change.flow === 'root').catch(report)
		}
	})
	const detachPanes = panes.host.subscribe(notify)
	const open = async (command: RouterHostCommand): Promise<RouterHostResult> => {
		const owner = owners.get(command.flow)
		if (!owner || owner.disposed || !instance) {
			return { status: 'blocked' }
		}
		const parent = records.get(command.flow)
		if (parent && parent.phase !== 'shown') {
			return { status: 'blocked' }
		}
		const flow = prefix + ++sequence
		let record: Modal | undefined
		const surface = options.createSurface({
			owner,
			route: command.route!,
			transition: command.transition,
			context: {
				direction: 'forward',
				action: command.action,
				from: host.getSnapshot(command.flow).route,
				to: command.route!,
			},
			flow,
			presenterFlow: command.flow,
			presenter: parent?.surface,
			onClosed() {
				if (record) {
					finish(record, !record.closing)
				}
			},
			onOwnerDisposed() {
				if (record) {
					void close(record).catch(report)
				}
			},
		})
		if (!surface) {
			return { status: 'blocked' }
		}
		let setReady!: Modal['setReady']
		const ready = new Promise<'shown' | 'closed'>((resolve) => {
			setReady = resolve
		})
		let cancel!: () => void
		const cancelled = new Promise<void>((resolve) => {
			cancel = resolve
		})
		record = {
			flow,
			presenterFlow: command.flow,
			surface,
			phase: 'staged',
			ready,
			setReady,
			cancelled,
			cancel,
		}
		records.set(flow, record)
		try {
			surface.root.render(ClientRouteOutlet, { host: bindings, flow })
			// Wait for the owned outlet before publishing its first prepared entry.
			await Promise.race([
				new Promise<void>((resolve) => surface.root.whenCommitted(resolve)),
				record.ready.then(() => {}),
			])

			if (
				!command.isCurrent() ||
				owners.get(command.flow) !== owner ||
				owner.disposed ||
				!records.has(flow)
			) {
				await close(record)
				return { status: 'cancelled', reason: disposed ? 'disposed' : 'superseded' }
			}

			const rendered = await panes.host.commit({
				...command,
				flow,
				action: 'push',
				beginCommit: () => command.isCurrent(),
			})

			if (rendered.status !== 'committed') {
				await close(record)
				return rendered
			}

			if (!command.beginCommit()) {
				await close(record)
				return { status: 'cancelled', reason: 'superseded' }
			}

			await command.beforeMutation?.()
			if (
				disposed ||
				owner.disposed ||
				owners.get(command.flow) !== owner ||
				!command.isCurrent() ||
				!records.has(flow)
			) {
				await close(record)
				return { status: 'cancelled', reason: 'disposed' }
			}

			// Native presentation is serialized across the owning window.
			await closeChildren(command.flow, record, !parent)
			if (!records.has(flow)) {
				return { status: 'cancelled', reason: 'disposed' }
			}

			record.phase = 'showing'
			publish()
			const result = await Promise.race([
				surface.show(),
				record.cancelled.then(() => ({ status: 'closed' as const })),
			])

			record.setReady(result.status)
			if (result.status === 'closed') {
				if (!record.closing) {
					finish(record, true)
				}

				return {
					status: 'cancelled',
					reason:
						disposed || owner.disposed || owners.get(command.flow) !== owner
							? 'disposed'
							: 'aborted',
				}
			}

			if (records.has(flow)) {
				record.phase = 'shown'
			}

			notify({ flow })
			return { status: 'committed', route: command.route!, finished: result.finished }
		} catch (error) {
			try {
				await close(record)
			} catch (cleanupError) {
				report(cleanupError)
			}

			throw error
		}
	}
	const commit = async (command: RouterHostCommand): Promise<RouterHostResult> => {
		if (disposed) {
			return { status: 'cancelled', reason: 'disposed' }
		}
		if (!command.isCurrent()) {
			return { status: 'cancelled', reason: 'superseded' }
		}
		const record = records.get(command.flow)
		if (!record) {
			await ownerReady.get(command.flow)
			if (disposed) {
				return { status: 'cancelled', reason: 'disposed' }
			}

			if (!command.isCurrent()) {
				return { status: 'cancelled', reason: 'superseded' }
			}
		}
		if (!record && command.flow.startsWith(prefix)) {
			return { status: 'cancelled', reason: 'disposed' }
		}
		if (record && record.phase !== 'shown') {
			return { status: 'cancelled', reason: 'disposed' }
		}
		if (command.action === 'dismiss') {
			if (!record) {
				return { status: 'unsupported', operation: 'dismiss-non-modal' }
			}

			const presenter = host.getSnapshot(record.presenterFlow)
			if (presenter.route && instance) {
				const prepared = await prepareHistoryEntry(instance, command, {
					flow: record.presenterFlow,
					route: presenter.route,
				})

				if (prepared.status !== 'ready') {
					return prepared
				}

				const opensModal =
					prepared.route.presentation === 'modal' &&
					(prepared.flow !== record.presenterFlow || !presenter.modal)

				return {
					status: 'handoff',
					prepared,
					action: opensModal ? 'push' : prepared.redirected ? 'replace' : 'refresh',
					async beforeMutation() {
						await command.beforeMutation?.()
						await close(record)
					},
				}
			}

			if (!command.beginCommit()) {
				return { status: 'cancelled', reason: 'superseded' }
			}

			await command.beforeMutation?.()
			if (!command.isCurrent()) {
				return { status: 'cancelled', reason: 'disposed' }
			}

			await close(record)
			return { status: 'committed', route: host.getSnapshot(record.presenterFlow).route }
		}
		if (
			!command.restore &&
			command.route?.presentation === 'modal' &&
			command.action !== 'refresh'
		) {
			return open(command)
		}
		if (!record) {
			if (!owners.has(command.flow)) {
				return { status: 'blocked' }
			}

			if (
				command.action !== 'refresh' &&
				[...records.values()].some(
					(value) => command.flow === 'root' || isDescendant(value, command.flow),
				)
			) {
				return base.host.commit({
					...command,
					async beforeMutation() {
						await command.beforeMutation?.()
						await closeChildren(command.flow, undefined, command.flow === 'root')
					},
				})
			}

			return base.host.commit(command)
		}
		return panes.host.commit(
			command.action === 'refresh'
				? command
				: {
						...command,
						async beforeMutation() {
							await command.beforeMutation?.()
							await closeChildren(record.flow)
						},
					},
		)
	}
	const host: RouterHost = {
		history: base.host.history,
		canReset: base.host.canReset,
		getSnapshot(flow) {
			const record = records.get(flow)
			if (record) {
				if (record.phase !== 'shown') {
					return {
						route: null,
						canGoBack: false,
						modal: true,
						disposed: record.phase === 'closing',
					}
				}

				return { ...panes.host.getSnapshot(flow), modal: true }
			}
			return flow.startsWith(prefix)
				? { route: null, canGoBack: false, modal: false, disposed: true }
				: base.host.getSnapshot(flow)
		},
		subscribe(listener) {
			listeners.add(listener)
			return () => {
				listeners.delete(listener)
			}
		},
		commit(command) {
			// SDK presentation is window-wide; ordinary independent pane commits
			// must still complete without waiting for another pane's rendering.
			const surfaceOperation =
				command.flow === 'root' ||
				command.action === 'dismiss' ||
				(command.route?.presentation === 'modal' && command.action !== 'refresh') ||
				[...records.values()].some((record) => isDescendant(record, command.flow))
			const key = surfaceOperation ? surfaceQueue : family(command.flow)
			const previous = commits.get(key) ?? Promise.resolve()
			const result = previous.catch(() => {}).then(() => commit(command))
			commits.set(key, result)
			return result.finally(() => {
				if (commits.get(key) === result) {
					commits.delete(key)
				}
			})
		},
		dispose() {
			if (disposed) {
				return
			}
			disposed = true
			owners.clear()
			ownerReady.clear()
			void (async () => {
				try {
					for (const record of [...records.values()].reverse()) {
						try {
							await close(record)
						} catch (error) {
							report(error)
						}
					}
				} catch (error) {
					report(error)
				} finally {
					detachBase()
					detachPanes()
					panes.host.dispose?.()
					base.host.dispose?.()
					listeners.clear()
				}
			})()
		},
	}
	const bindings: ClientRouterHost & {
		modals: typeof modals
		getSurface(flow: string): RouterModalSurface | undefined
	} = {
		host,
		modals,
		getSurface(flow) {
			return records.get(flow)?.surface
		},
		attach(router) {
			if (instance || disposed) {
				throw new Error('Modal host cannot be attached')
			}
			base.attach(router)
			panes.attach(router)
			instance = router
		},
		scope(flow) {
			if (!instance) {
				throw new Error('Modal host is not attached')
			}
			return createRouterRenderScope(instance, flow)
		},
		getRenderHost(flow) {
			return records.has(flow) ? panes : base.getRenderHost?.(flow)
		},
		isModalFlow(flow) {
			return records.has(flow)
		},
		mount(flow, owner) {
			if (disposed) {
				throw new Error('Modal host is disposed')
			}
			if (owners.has(flow)) {
				throw new Error('A routing flow already has a mounted outlet')
			}
			owners.set(flow, owner)
			const modal = records.has(flow)
			const pending = lifetimes.get(flow)
			const mountBase = () =>
				disposed || owners.get(flow) !== owner || owner.disposed || modal
					? () => {}
					: base.mount(flow, owner)
			let ready: Promise<() => void | Promise<void>>
			try {
				ready = pending ? pending.then(mountBase) : Promise.resolve(mountBase())
			} catch (error) {
				owners.delete(flow)
				throw error
			}
			ownerReady.set(flow, ready)
			void ready.catch(report)
			return () => {
				if (owners.get(flow) !== owner) {
					return
				}
				owners.delete(flow)
				if (ownerReady.get(flow) === ready) {
					ownerReady.delete(flow)
				}
				notify({ ownerDisposed: true, flow })
				const cleanup = (async () => {
					try {
						const record = modal ? records.get(flow) : undefined
						if (record) {
							await close(record)
						} else {
							await closeChildren(flow, undefined, flow === 'root')
						}
					} finally {
						await (
							await ready
						)()
					}
				})()
				lifetimes.set(flow, cleanup)
				void cleanup.catch(report).finally(() => {
					if (lifetimes.get(flow) === cleanup) {
						lifetimes.delete(flow)
					}
				})
				return cleanup
			}
		},
	}
	return bindings
}
