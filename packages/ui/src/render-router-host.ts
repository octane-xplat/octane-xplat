import { createStore } from './store'
import { createClientRouteEntry, type ClientRouteEntry } from './client-route-entry'
import { createRouterRenderScope } from './router-render-scope'
import { prepareHistoryEntry } from './prepare-history-entry'
import { createPaneRouteTransitions } from './pane-route-transitions'
import type {
	RouterHost,
	RouterHostChange,
	RouterHostCommand,
	RouterHostResult,
	RouterInstance,
	TransitionDefinition,
} from './props'

type Committed = Extract<RouterHostResult, { status: 'committed' }>
/** A snapshot owns a fresh visibility receipt, including Back to the base view. */
export interface RenderRouteFlow {
	readonly entries: readonly (ClientRouteEntry | null)[]
	/** Candidate renders hidden without replacing the currently committed tree. */
	readonly staged?: ClientRouteEntry
	readonly committed: Promise<RouterHostResult>
	rendered(): void
	cancel(): void
}

/** Retained, independent history for a rendered pane. This owns no native
 * Frame, browser history, or modal presentation; those remain host boundaries. */
export function createRenderRouterHost() {
	const views = createStore<ReadonlyMap<string, RenderRouteFlow>>(new Map())
	const mounted = new Map<string, { modal: boolean }>()
	const motions = new WeakMap<object, TransitionDefinition>()
	const effects = new Map<string, ReturnType<typeof createPaneRouteTransitions>>()
	const surfaces = new Map<string, ReadonlyMap<string, unknown>>()
	const listeners = new Set<(change?: RouterHostChange) => void>()
	let instance: RouterInstance<any> | undefined
	let sequence = 0
	let disposed = false
	const notify = (change?: RouterHostChange) => {
		// Observers may replace subscriptions during notification.
		// oxlint-disable-next-line unicorn/no-useless-spread
		for (const listener of [...listeners]) {
			listener(change)
		}
	}
	const snapshot = (
		entries: readonly (ClientRouteEntry | null)[],
		staged?: ClientRouteEntry,
	): RenderRouteFlow => {
		let settle!: (result: RouterHostResult) => void
		let settled = false
		const committed = new Promise<RouterHostResult>((resolve) => {
			settle = resolve
		})
		const finish = (result: RouterHostResult) => {
			if (settled) {
				return
			}
			settled = true
			settle(result)
		}
		return {
			entries,
			...(staged ? { staged } : {}),
			committed,
			rendered: () => finish({ status: 'committed', route: entries.at(-1)?.route ?? null }),
			cancel: () => finish({ status: 'cancelled', reason: 'disposed' }),
		}
	}
	const publish = (flow: string, next: RenderRouteFlow) => {
		const previous = views.getSnapshot().get(flow)
		previous?.cancel()
		const retained = new Set([...next.entries, next.staged])
		for (const entry of [...(previous?.entries ?? []), previous?.staged]) {
			if (entry && !retained.has(entry)) {
				entry.cancel()
			}
		}
		views.update((current) => new Map([...current, [flow, next]]))
		notify({ flow })
	}
	const remove = (flow: string) => {
		effects.get(flow)?.interrupt()
		effects.delete(flow)
		surfaces.delete(flow)
		const previous = views.getSnapshot().get(flow)
		previous?.cancel()
		for (const entry of previous?.entries ?? []) {
			entry?.cancel()
		}
		previous?.staged?.cancel()
		views.update((current) => {
			const next = new Map(current)
			next.delete(flow)
			return next
		})
		notify({ ownerDisposed: true, flow })
	}
	const commits = new Map<string, Promise<unknown>>()
	const commit = async (command: RouterHostCommand): Promise<RouterHostResult> => {
		if (disposed) {
			return { status: 'cancelled', reason: 'disposed' }
		}
		if (!command.isCurrent()) {
			return { status: 'cancelled', reason: 'superseded' }
		}
		const owner = mounted.get(command.flow)
		if (!owner || !instance) {
			return { status: 'blocked' }
		}
		const effect = effects.get(command.flow)!
		effect.interrupt()
		if (
			command.action === 'dismiss' ||
			(command.route?.presentation === 'modal' && !mounted.get(command.flow)?.modal)
		) {
			return { status: 'unsupported', operation: 'modal' }
		}
		const previous = views.getSnapshot().get(command.flow)!
		let entries = [...previous.entries]
		let entry: ClientRouteEntry | null
		if (command.action === 'back') {
			if (entries.length < 2) {
				return { status: 'blocked' }
			}

			entries.pop()
			const retained = entries.at(-1)!
			entry = null
			if (retained) {
				const prepared = await prepareHistoryEntry(instance, command, retained)
				if (prepared.status !== 'ready') {
					return prepared
				}

				if (prepared.flow !== command.flow) {
					return {
						status: 'handoff',
						prepared,
						action: prepared.route.presentation === 'modal' ? 'push' : 'replace',
						beforeMutation: command.beforeMutation,
					}
				}

				if (prepared.redirected && prepared.route.presentation === 'modal' && !owner.modal) {
					return {
						status: 'handoff',
						prepared,
						action: 'push',
						beforeMutation: command.beforeMutation,
					}
				}

				entry = createClientRouteEntry(
					instance,
					command.flow,
					prepared.redirected ? 'render:' + ++sequence : retained.id,
					prepared.route,
					prepared.content,
				)

				if (prepared.transition) {
					motions.set(prepared.route, prepared.transition)
				}
			}

			entries[entries.length - 1] = entry
		} else {
			if (!command.route || !command.content) {
				throw new Error('Render commit requires prepared content')
			}

			const current = entries.at(-1)
			if (command.action === 'refresh' && !current) {
				return { status: 'unsupported', operation: 'refresh-unowned-pane' }
			}

			entry = createClientRouteEntry(
				instance,
				command.flow,
				command.action === 'refresh' ? current!.id : 'render:' + ++sequence,
				command.route,
				command.content,
			)

			if (command.action === 'reset') {
				entries = [entry]
			} else if (command.action === 'replace' || command.action === 'refresh') {
				entries[entries.length - 1] = entry
			} else {
				entries.push(entry)
			}
		}
		let staged: RenderRouteFlow | undefined
		if (entry && command.transition && command.action !== 'back') {
			motions.set(entry.route, command.transition)
		}
		const motionSource = command.action === 'back' ? previous.entries.at(-1) : entry
		const restore = () => {
			if (
				staged &&
				!disposed &&
				mounted.has(command.flow) &&
				views.getSnapshot().get(command.flow) === staged
			) {
				publish(command.flow, snapshot(previous.entries))
			} else {
				entry?.cancel()
			}
		}
		try {
			if (
				entry &&
				command.action !== 'refresh' &&
				(command.action !== 'back' ||
					!previous.entries.some((retained) => retained?.id === entry?.id))
			) {
				staged = snapshot(previous.entries, entry)
				publish(command.flow, staged)
				const rendered = await entry.committed
				if (rendered.status !== 'committed') {
					restore()
					return rendered
				}
			}

			if (disposed || mounted.get(command.flow) !== owner) {
				restore()
				return { status: 'cancelled', reason: 'disposed' }
			}

			if (!command.beginCommit()) {
				restore()
				return { status: 'cancelled', reason: 'superseded' }
			}

			if (command.action === 'refresh' && entry && command.beforeMutation) {
				staged = snapshot(entries)
				publish(command.flow, staged)
				const [visible, rendered] = await Promise.all([staged.committed, entry.committed])
				if (visible.status !== 'committed' || rendered.status !== 'committed') {
					restore()
					return visible.status !== 'committed' ? visible : rendered
				}
			}

			if (disposed || mounted.get(command.flow) !== owner || !command.isCurrent()) {
				restore()
				return { status: 'cancelled', reason: 'disposed' }
			}

			if (command.beforeMutation) {
				await command.beforeMutation()
			}

			if (disposed || mounted.get(command.flow) !== owner || !command.isCurrent()) {
				restore()
				return {
					status: 'cancelled',
					reason: disposed || mounted.get(command.flow) !== owner ? 'disposed' : 'superseded',
				}
			}

			const next = snapshot(entries)
			publish(command.flow, next)
			const [visible, rendered] = await Promise.all([
				next.committed,
				entry?.committed ?? next.committed,
			])

			if (visible.status !== 'committed') {
				return visible
			}

			if (rendered.status !== 'committed') {
				return rendered
			}

			const result: Committed = {
				status: 'committed',
				route: entry?.route ?? null,
				// Surface opening/closing belongs to the modal adapter, rather than
				// animating a hidden first pane before its panel becomes visible.
				finished: owner.modal
					? Promise.resolve({
							status: 'skipped',
							reason:
								command.action === 'refresh' ||
								!motionSource?.route.transition ||
								motionSource.route.transition === 'none' ||
								motions.get(motionSource.route)?.kind === 'skip'
									? 'disabled'
									: 'unsupported',
						})
					: effect.run(
							{
								direction: command.action === 'back' ? 'back' : 'forward',
								action: command.action,
								from: previous.entries.at(-1)?.route ?? null,
								to: entry?.route ?? null,
							},
							motionSource?.route.transition,
							motionSource ? motions.get(motionSource.route) : undefined,
							surfaces.get(command.flow)?.get(entry?.id ?? 'base'),
						),
			}

			return result
		} catch (error) {
			restore()
			throw error
		}
	}
	const host: RouterHost = {
		history: 'independent',
		canReset: true,
		getSnapshot(flow) {
			const entries = views.getSnapshot().get(flow)?.entries
			return {
				route: entries?.at(-1)?.route ?? null,
				canGoBack: (entries?.length ?? 0) > 1,
				modal: mounted.get(flow)?.modal ?? false,
			}
		},
		subscribe(listener) {
			listeners.add(listener)
			return () => {
				listeners.delete(listener)
			}
		},
		commit(command) {
			// Accepted work finishes its renderer receipt before another commit
			// in that pane can replace it. Other panes remain independent.
			const previous = commits.get(command.flow) ?? Promise.resolve()
			const result = previous.catch(() => {}).then(() => commit(command))
			commits.set(command.flow, result)
			return result.finally(() => {
				if (commits.get(command.flow) === result) {
					commits.delete(command.flow)
				}
			})
		},
		dispose() {
			if (disposed) {
				return
			}
			disposed = true
			// Removing a flow can synchronously unmount another outlet.
			// oxlint-disable-next-line unicorn/no-useless-spread
			for (const flow of [...mounted.keys()]) {
				remove(flow)
			}
			mounted.clear()
			listeners.clear()
			instance = undefined
		},
	}
	return {
		host,
		views,
		attach(router: RouterInstance<any>) {
			if (instance || disposed) {
				throw new Error('Render host cannot be attached')
			}
			instance = router
		},
		scope(flow: string) {
			if (!instance) {
				throw new Error('Render host is not attached')
			}
			return createRouterRenderScope(instance, flow)
		},
		mount(flow: string, options: { modal?: boolean; views?: ReadonlyMap<string, unknown> } = {}) {
			if (disposed) {
				throw new Error('Render host is disposed')
			}
			if (mounted.has(flow)) {
				throw new Error('A render flow already has a mounted outlet')
			}
			mounted.set(flow, { modal: options.modal ?? false })
			effects.set(flow, createPaneRouteTransitions())
			surfaces.set(flow, options.views ?? new Map())
			publish(flow, snapshot(options.modal ? [] : [null]))
			let closed = false
			return () => {
				if (closed) {
					return
				}
				closed = true
				mounted.delete(flow)
				remove(flow)
			}
		},
	}
}

export type RenderRouterHost = ReturnType<typeof createRenderRouterHost>
