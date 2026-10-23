import { flushSync } from 'octane'
import { createStore } from './store'
import { createClientRouteEntry, type ClientRouteEntry } from './client-route-entry'
import { createRouterRenderScope } from './router-render-scope'
import { runRouterHostNavigation } from './router-instance'
import { createBrowserRouteEffects } from './browser-route-effects.web'
import { createBrowserRouteTransitions } from './browser-route-transitions.web'
import type {
	RouterHost,
	RouterHostChange,
	RouterHostCommand,
	RouterHostResult,
	RouterInstance,
	PreparedRouteMatch,
	RouterHostContent,
	TransitionDefinition,
} from './props'

type Modal = { flow: string; startDepth: number; entry: ClientRouteEntry }
export type BrowserRouteSnapshot = {
	main: ClientRouteEntry | null
	modals: readonly Modal[]
	staged?: readonly { entry: ClientRouteEntry; modal: boolean }[]
}

const empty = (): BrowserRouteSnapshot => ({ main: null, modals: [] })
const owners = new WeakMap<object, object>()

/** One real browser history per document. Definitions and prepared data remain
 * instance-local; history.state contains only an opaque identity and depth. */
export function createBrowserRouterHost() {
	if (typeof window === 'undefined') {
		throw new Error('A browser router host requires a browser')
	}
	const browser = window
	const history = browser.history
	const effects = createBrowserRouteEffects(browser)
	const motion = createBrowserRouteTransitions(browser)
	const definitions = new WeakMap<object, TransitionDefinition>()
	let viewVersion = 0
	let activeKey: string | undefined
	let scrollRestoration: ScrollRestoration | undefined
	const token = {}
	const prefix = 'xplat:' + Math.random().toString(36).slice(2)
	const views = createStore<BrowserRouteSnapshot>(empty())
	const listeners = new Set<(change?: RouterHostChange) => void>()
	const outlets = new Map<string, object>()
	const entryElements = new Map<string, HTMLElement>()
	const saved = new Map<string, BrowserRouteSnapshot>()
	const depthKeys = new Map<number, string>()
	const preparingModals = new Set<string>()
	let instance: RouterInstance<any> | undefined
	let current = empty()
	let depth = 0
	let baseDepth = 0
	let historyOwner = prefix
	let committedHref = browser.location.href
	let correction: { key: string; resolve(): void; timer: ReturnType<typeof setTimeout> } | undefined
	let sequence = 0
	let disposed = false
	let stamped = false
	let traversal:
		| {
				resolve(result: RouterHostResult): void
				reject(error: unknown): void
				timer: ReturnType<typeof setTimeout>
				next: BrowserRouteSnapshot
				key: string
		  }
		| undefined
	const notify = (change?: RouterHostChange) => {
		// Cleanup observers can replace their subscriptions during notification.
		// oxlint-disable-next-line unicorn/no-useless-spread
		for (const listener of [...listeners]) {
			listener(change)
		}
	}
	const top = (snapshot = current) => snapshot.modals.at(-1)?.entry ?? snapshot.main
	const stamp = (
		snapshot: BrowserRouteSnapshot,
		replace: boolean,
		href?: string,
		atDepth = depth,
	) => {
		const key = prefix + ':' + ++sequence
		const state = {
			...history.state,
			__octaneXplatRouter: { owner: historyOwner, key, depth: atDepth },
		}
		if (replace) {
			history.replaceState(state, '', href)
		} else {
			history.pushState(state, '', href)
		}
		// Browser rejection must not advance the router's history bookkeeping.
		for (const [at, oldKey] of depthKeys) {
			if (at >= atDepth) {
				saved.delete(oldKey)
				effects.forget(oldKey)
				depthKeys.delete(at)
			}
		}
		saved.set(key, snapshot)
		depthKeys.set(atDepth, key)
		activeKey = key
		committedHref = browser.location.href
	}

	const publish = (snapshot: BrowserRouteSnapshot, external = false) => {
		for (const { entry } of views.getSnapshot().staged ?? []) {
			if (entry !== snapshot.main && !snapshot.modals.some((modal) => modal.entry === entry)) {
				entry.cancel()
			}
		}
		current = snapshot
		flushSync(() => {
			views.set(snapshot)
			notify({ external })
		})
	}
	const prepareSnapshot = async (
		snapshot: BrowserRouteSnapshot,
		command: RouterHostCommand,
	): Promise<
		| { status: 'ready'; snapshot: BrowserRouteSnapshot }
		| Exclude<RouterHostResult, { status: 'committed' }>
	> => {
		if (!command.prepare || !instance) {
			return { status: 'unsupported', operation: 'history-preparation' }
		}
		const entries = [snapshot.main, ...snapshot.modals.map((modal) => modal.entry)]
		const prepared: ClientRouteEntry[] = []
		for (const entry of entries) {
			if (!entry) {
				continue
			}

			const resolved = instance.resolveUrl(entry.route.href)
			if (resolved.status !== 'matched') {
				return resolved
			}

			const result = await command.prepare(
				{
					...resolved.destination,
					stack: entry.route.stack,
					presentation: entry.route.presentation,
					transition: entry.route.transition,
				},
				entry.flow,
			)

			if (result.status !== 'ready') {
				return result
			}

			if (
				result.redirected &&
				result.route.presentation === 'modal' &&
				!snapshot.modals.some((modal) => modal.flow === entry.flow)
			) {
				return {
					status: 'handoff',
					prepared: result,
					action: 'push',
					beforeMutation: command.beforeMutation,
				}
			}

			const replacement = createClientRouteEntry(
				instance,
				result.flow,
				result.redirected ? prefix + ':view:' + ++sequence : entry.id,
				result.route,
				result.content,
			)

			if (result.transition) {
				definitions.set(result.route, result.transition)
			}

			if (result.flow !== entry.flow) {
				return { status: 'ready', snapshot: { main: replacement, modals: [] } }
			}

			prepared.push(replacement)
			if (result.redirected) {
				break
			}
		}
		let index = 0
		return {
			status: 'ready',
			snapshot: {
				main: snapshot.main ? (prepared[index++] ?? null) : null,
				modals: snapshot.modals
					.slice(0, prepared.length - index)
					.map((modal) => ({ ...modal, entry: prepared[index++] })),
			},
		}
	}
	const stageSnapshot = async (
		snapshot: BrowserRouteSnapshot,
		command: RouterHostCommand,
	): Promise<RouterHostResult> => {
		const existing = new Set([current.main?.id, ...current.modals.map((modal) => modal.entry.id)])
		const candidates = [
			...(snapshot.main ? [{ entry: snapshot.main, modal: false }] : []),
			...snapshot.modals.map((modal) => ({ entry: modal.entry, modal: true })),
		]
		if (candidates.some((stage) => !outlets.has(stage.modal ? 'root' : stage.entry.flow))) {
			return { status: 'unsupported', operation: 'missing-outlet' }
		}
		const pending = candidates.filter((stage) => !existing.has(stage.entry.id))
		if (!pending.length) {
			return { status: 'committed', route: top(snapshot)?.route ?? null }
		}
		flushSync(() => views.set({ ...current, staged: pending }))
		try {
			const rendered = Promise.all(pending.map((stage) => stage.entry.committed))
			const results = await Promise.race([
				rendered,
				command.cancellation ?? new Promise<never>(() => {}),
			])

			const result = Array.isArray(results)
				? results.find((result) => result.status !== 'committed')
				: results

			if (result || !command.isCurrent()) {
				flushSync(() => views.set(current))
				for (const stage of candidates) {
					stage.entry.cancel()
				}

				return result ?? { status: 'cancelled', reason: 'superseded' }
			}

			return { status: 'committed', route: top(snapshot)?.route ?? null }
		} catch (error) {
			flushSync(() => views.set(current))
			for (const stage of candidates) {
				stage.entry.cancel()
			}

			throw error
		}
	}
	const rebaseHistory = (snapshot: BrowserRouteSnapshot, href: string) => {
		historyOwner = prefix + ':epoch:' + ++sequence
		for (const oldKey of saved.keys()) {
			effects.forget(oldKey)
		}
		saved.clear()
		depthKeys.clear()
		depth = baseDepth = 0
		stamp(snapshot, true, href)
		stamped = true
	}
	const correctHistory = async (targetDepth: number | undefined, previousHref: string) => {
		if (disposed) {
			return
		}
		if (targetDepth !== undefined && activeKey && targetDepth !== depth) {
			try {
				await new Promise<void>((resolve, reject) => {
					const key = activeKey!
					const timer = setTimeout(() => {
						correction = undefined
						reject(new Error('Browser history correction did not complete'))
					}, 5000)
					correction = { key, resolve, timer }
					history.go(depth - targetDepth)
				})

				return
			} catch {
				if (correction) {
					clearTimeout(correction.timer)
					correction = undefined
				}

				if (disposed) {
					return
				}
			}
		}
		// Missing coordinates or an unacknowledged correction cannot leave a
		// denied URL attached to the admitted view. Older entries stay external.
		rebaseHistory(current, previousHref)
	}
	const restore = async (
		next: BrowserRouteSnapshot,
		key: string | undefined,
		targetDepth: number,
		version: number,
		command?: RouterHostCommand,
	): Promise<RouterHostResult> => {
		const previousDepth = depth
		const previousRoute = top()?.route ?? null
		const previousMain = current.main?.id
		const target = top(next)
		const back = targetDepth < previousDepth
		const source = back ? previousRoute : target?.route
		return motion.run(
			{
				direction: back ? 'back' : 'forward',
				action: back ? 'back' : 'forward',
				from: previousRoute,
				to: target?.route ?? null,
			},
			source?.transition,
			source ? definitions.get(source) : undefined,
			async () => {
				if (disposed || version !== viewVersion || (command && !command.beginCommit())) {
					return { status: 'cancelled', reason: disposed ? 'disposed' : 'superseded' }
				}
				if (target && !outlets.has(target.flow) && !(next.modals.length && outlets.has('root'))) {
					return { status: 'unsupported', operation: 'missing-outlet' }
				}
				activeKey = key
				depth = targetDepth
				baseDepth = Math.min(baseDepth, depth)
				if (key) {
					saved.set(key, next)
					depthKeys.set(depth, key)
				} else {
					rebaseHistory(next, target?.route.href ?? browser.location.href)
				}
				// A redirect replaces the traversed entry, never adds another one.
				if (
					target &&
					target.route.href !==
						browser.location.pathname + browser.location.search + browser.location.hash
				) {
					history.replaceState(history.state, '', target.route.href)
				}
				committedHref = browser.location.href
				publish(next)
				const result = await (target?.committed ??
					Promise.resolve<RouterHostResult>({ status: 'committed', route: null }))
				if (result.status === 'committed' && !disposed && current === next) {
					effects.head(target?.content.head)
					if (next.main?.id !== previousMain) {
						effects.restore(activeKey, {
							hash: target?.route.hash,
							root: entryElements.get(next.main?.id ?? 'base:root'),
							focus: !next.modals.length,
						})
					}
				}
				return result
			},
			command?.cancellation,
		)
	}
	const onPop = async () => {
		if (disposed) {
			return
		}
		const owned = history.state?.__octaneXplatRouter
		if (correction && owned?.owner === historyOwner && owned.key === correction.key) {
			const pending = correction
			correction = undefined
			clearTimeout(pending.timer)
			pending.resolve()
			return
		}
		if (correction) {
			clearTimeout(correction.timer)
			correction.resolve()
			correction = undefined
		}
		const version = ++viewVersion
		const targetHref = browser.location.pathname + browser.location.search + browser.location.hash
		const previousHref = committedHref
		effects.save(activeKey)
		const sameOwner = owned?.owner === historyOwner && Number.isInteger(owned.depth)
		const targetDepth = sameOwner ? (owned.depth as number) : undefined
		const key = sameOwner ? (owned.key as string) : undefined
		const snapshot = key ? saved.get(key) : undefined
		const pending = traversal
		traversal = undefined
		if (pending) {
			clearTimeout(pending.timer)
		}
		try {
			if (pending && pending.key === key) {
				pending.resolve(await restore(pending.next, key, targetDepth ?? 0, version))
				return
			}

			pending?.resolve({ status: 'cancelled', reason: 'aborted' })

			notify({ external: true })
			if (!instance) {
				return
			}

			await runRouterHostNavigation(
				instance,
				top()?.flow ?? 'root',
				(command) =>
					enqueue(async () => {
						if (!command.isCurrent() || version !== viewVersion) {
							if (!disposed && version === viewVersion) {
								await correctHistory(targetDepth, previousHref)
							}

							return { status: 'cancelled', reason: 'superseded' }
						}
						let prepared: Awaited<ReturnType<typeof prepareSnapshot>>
						if (snapshot) {
							prepared = await prepareSnapshot(snapshot, command)
						} else {
							const result = await command.prepare!(targetHref, 'root')
							if (result.status === 'ready' && result.transition) {
								definitions.set(result.route, result.transition)
							}

							prepared =
								result.status === 'ready'
									? {
											status: 'ready',
											snapshot: {
												main: createClientRouteEntry(
													instance!,
													result.flow,
													prefix + ':view:' + ++sequence,
													result.route,
													result.content,
												),
												modals: [],
											},
										}
									: result
						}
						if (!command.isCurrent() || version !== viewVersion) {
							if (!disposed && version === viewVersion) {
								await correctHistory(targetDepth, previousHref)
							}

							return { status: 'cancelled', reason: 'superseded' }
						}
						if (prepared.status !== 'ready') {
							await correctHistory(targetDepth, previousHref)
							return prepared
						}
						try {
							const staged = await stageSnapshot(prepared.snapshot, command)
							if (staged.status !== 'committed') {
								if (command.isCurrent() && version === viewVersion) {
									await correctHistory(targetDepth, previousHref)
								}

								return staged
							}

							if (
								key &&
								history.state?.__octaneXplatRouter?.key !== key &&
								targetDepth !== undefined
							) {
								if (!command.beginCommit()) {
									return { status: 'cancelled', reason: 'superseded' }
								}

								return await traverse(targetDepth - depth, prepared.snapshot, key)
							}

							return await restore(prepared.snapshot, key, targetDepth ?? 0, version, command)
						} catch (error) {
							if (command.isCurrent() && version === viewVersion) {
								await correctHistory(targetDepth, previousHref)
							}

							return { status: 'failed', phase: 'commit', error }
						}
					}),
				targetDepth !== undefined && targetDepth > depth ? 'forward' : 'back',
			)
		} catch (error) {
			if (pending) {
				pending.reject(error)
			} else {
				console.warn('[octane-xplat] Browser history restoration failed', error)
			}
		}
	}
	const traverse = (
		delta: number,
		next: BrowserRouteSnapshot,
		key: string,
	): Promise<RouterHostResult> =>
		new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				traversal = undefined
				reject(new Error('Browser history traversal did not complete'))
			}, 5000)
			traversal = { resolve, reject, timer, next, key }
			history.go(delta)
		})
	const host: RouterHost = {
		history: 'linear',
		canReset: false,
		getSnapshot(flow) {
			const modal = current.modals.find((value) => value.flow === flow)
			const entry = modal?.entry ?? (current.main?.flow === flow ? current.main : null)
			return {
				route: entry?.route ?? null,
				canGoBack: depth > baseDepth && (flow === 'root' || top()?.flow === flow),
				modal: !!modal,
				disposed:
					flow.startsWith(prefix + ':modal:') &&
					!modal &&
					!preparingModals.has(flow) &&
					![...saved.values()].some((snapshot) =>
						snapshot.modals.some((value) => value.flow === flow),
					),
			}
		},
		subscribe(listener) {
			listeners.add(listener)
			return () => {
				listeners.delete(listener)
			}
		},
		async commit(command: RouterHostCommand): Promise<RouterHostResult> {
			if (disposed) {
				return { status: 'cancelled', reason: 'disposed' }
			}
			if (traversal) {
				return { status: 'blocked' }
			}
			const modal = current.modals.find((value) => value.flow === command.flow)
			const visible = top()
			const owner = outlets.get(command.flow)
			const rootOwner = outlets.get('root')
			const isMounted = () =>
				owner
					? outlets.get(command.flow) === owner
					: !!rootOwner && outlets.get('root') === rootOwner && current.modals.includes(modal!)
			if (!owner && (!modal || !rootOwner)) {
				return { status: 'blocked' }
			}
			if (command.action === 'back' || command.action === 'dismiss') {
				if (command.flow !== 'root' && visible?.flow !== command.flow) {
					return { status: 'unsupported', operation: 'inactive-flow-history' }
				}

				if (command.action === 'dismiss' && !modal) {
					return { status: 'unsupported', operation: 'dismiss-non-modal' }
				}

				if (depth <= baseDepth) {
					return { status: 'blocked' }
				}

				const delta = command.action === 'dismiss' ? -(depth - modal!.startDepth + 1) : -1
				if (-delta > depth - baseDepth) {
					return { status: 'unsupported', operation: 'dismiss-without-presenter-history' }
				}

				const targetKey = depthKeys.get(depth + delta)
				const target = targetKey ? saved.get(targetKey) : undefined
				if (!target) {
					return { status: 'unsupported', operation: 'unknown-history-entry' }
				}

				const prepared = await prepareSnapshot(target, command)
				if (prepared.status !== 'ready') {
					return prepared
				}

				const staged = await stageSnapshot(prepared.snapshot, command)
				if (staged.status !== 'committed') {
					return staged
				}

				if (!command.beginCommit()) {
					return { status: 'cancelled', reason: 'superseded' }
				}

				if (command.beforeMutation) {
					await command.beforeMutation()
					if (disposed || !isMounted()) {
						return { status: 'cancelled', reason: 'disposed' }
					}

					if (!command.isCurrent()) {
						return { status: 'cancelled', reason: 'superseded' }
					}
				}

				return traverse(delta, prepared.snapshot, targetKey!)
			}
			if (command.action === 'reset') {
				return { status: 'unsupported', operation: 'reset' }
			}
			if (!command.route || !command.content || !instance) {
				throw new Error('Browser commit requires prepared render content')
			}
			if (modal && modal !== current.modals.at(-1)) {
				return { status: 'unsupported', operation: 'inactive-modal' }
			}
			if (command.route.presentation === 'modal' && !outlets.has('root')) {
				return { status: 'blocked' }
			}
			if (!command.isCurrent()) {
				return { status: 'cancelled', reason: 'superseded' }
			}
			const replace = command.action === 'replace' || command.action === 'refresh'
			const nextDepth = depth + (replace ? 0 : 1)
			const opensModal = command.route.presentation === 'modal' && command.action !== 'refresh'
			const flow = opensModal ? prefix + ':modal:' + ++sequence : command.flow
			const previous = modal?.entry ?? current.main
			const id =
				command.action === 'refresh' && previous ? previous.id : prefix + ':view:' + ++sequence
			if (opensModal) {
				preparingModals.add(flow)
			}
			const entry = createClientRouteEntry(instance, flow, id, command.route, command.content)
			let next: BrowserRouteSnapshot
			if (opensModal) {
				next = { ...current, modals: [...current.modals, { flow, startDepth: nextDepth, entry }] }
			} else if (modal) {
				next = {
					...current,
					modals: current.modals.map((value) => (value === modal ? { ...value, entry } : value)),
				}
			} else {
				next = { main: entry, modals: [] }
			}
			const clearStage = () => {
				if (views.getSnapshot().staged?.some((stage) => stage.entry === entry)) {
					flushSync(() => views.set(current))
				}
				entry.cancel()
				if (opensModal && !current.modals.some((modal) => modal.flow === flow)) {
					preparingModals.delete(flow)
					notify({ ownerDisposed: true, flowDisposed: true, flow })
				}
			}
			try {
				if (command.action !== 'refresh') {
					flushSync(() =>
						views.set({ ...current, staged: [{ entry, modal: opensModal || !!modal }] }),
					)

					const rendered = await entry.committed
					if (rendered.status !== 'committed') {
						clearStage()
						return rendered
					}
				}

				if (disposed || !isMounted()) {
					clearStage()
					return { status: 'cancelled', reason: 'disposed' }
				}

				const version = ++viewVersion
				const result = await motion.run(
					{
						direction: 'forward',
						action: command.action,
						from: visible?.route ?? null,
						to: entry.route,
					},
					command.route.transition,
					command.transition,
					async () => {
						if (disposed || !isMounted()) {
							clearStage()
							return { status: 'cancelled', reason: 'disposed' }
						}
						if (version !== viewVersion || !command.beginCommit()) {
							clearStage()
							return { status: 'cancelled', reason: 'superseded' }
						}
						if (command.beforeMutation) {
							await command.beforeMutation()
						}
						if (disposed || !isMounted()) {
							clearStage()
							return { status: 'cancelled', reason: 'disposed' }
						}
						if (!command.isCurrent()) {
							clearStage()
							return { status: 'cancelled', reason: 'superseded' }
						}
						if (!stamped) {
							stamp(current, true)
							stamped = true
						}
						effects.save(activeKey)
						const changesDocument = next.main?.id !== current.main?.id
						stamp(next, replace, entry.route.href, nextDepth)
						depth = nextDepth
						publish(next)
						if (command.transition) {
							definitions.set(entry.route, command.transition)
						}
						const result = await entry.committed
						if (result.status === 'committed' && !disposed && current === next) {
							effects.head(top(next)?.content.head)
							if (changesDocument && command.action !== 'refresh') {
								effects.restore(undefined, {
									hash: entry.route.hash,
									root: entryElements.get(entry.id),
									focus: !next.modals.length,
								})
							}
						}
						return result
					},
					command.cancellation,
				)

				if (result.status !== 'committed') {
					clearStage()
				}

				return result
			} catch (error) {
				clearStage()
				throw error
			} finally {
				if (opensModal) {
					preparingModals.delete(flow)
				}
			}
		},
		dispose() {
			if (disposed) {
				return
			}
			disposed = true
			motion.interrupt()
			if (correction) {
				clearTimeout(correction.timer)
				correction.resolve()
				correction = undefined
			}
			browser.removeEventListener('popstate', onPop)
			if (owners.get(browser) === token) {
				owners.delete(browser)
			}
			if (scrollRestoration !== undefined) {
				history.scrollRestoration = scrollRestoration
			}
			effects.dispose()
			if (traversal) {
				clearTimeout(traversal.timer)
				traversal.resolve({ status: 'cancelled', reason: 'disposed' })
				traversal = undefined
			}
			for (const snapshot of saved.values()) {
				snapshot.main?.cancel()
				for (const modal of snapshot.modals) {
					modal.entry.cancel()
				}
			}
			views.getSnapshot().staged?.forEach((stage) => stage.entry.cancel())
			saved.clear()
			depthKeys.clear()
			preparingModals.clear()
			outlets.clear()
			entryElements.clear()
			listeners.clear()
			current = empty()
			flushSync(() => views.set(current))
			instance = undefined
		},
	}
	// A browser document has one linear commit order, including async barriers.
	const commit = host.commit
	let commits: Promise<unknown> = Promise.resolve()
	const enqueue = (work: () => RouterHostResult | Promise<RouterHostResult>) => {
		const result = commits.catch(() => {}).then(work)
		commits = result
		return result
	}
	host.commit = (command) => {
		if (disposed) {
			return Promise.resolve({ status: 'cancelled', reason: 'disposed' })
		}
		return enqueue(() => commit(command))
	}
	return {
		host,
		views,
		/** @internal One-time adoption of a server-prepared document. Never a
		 * navigation API: subsequent entries must pass the preparation pipeline. */
		initialize(route: PreparedRouteMatch, content: RouterHostContent) {
			if (!instance || disposed || stamped || outlets.size || current.main) {
				throw new Error('Initial route must be installed before mounting the browser host')
			}
			const entry = createClientRouteEntry(instance, route.stack, 'initial', route, content)
			void entry.committed.catch(() => {})
			current = { main: entry, modals: [] }
			stamp(current, true)
			stamped = true
			views.set(current)
			notify()
		},
		entryElement(id: string, element: HTMLElement | null) {
			if (element && !disposed) {
				entryElements.set(id, element)
			} else {
				entryElements.delete(id)
			}
		},
		attach(router: RouterInstance<any>) {
			if (instance || disposed) {
				throw new Error('Browser router host cannot be attached')
			}
			instance = router
		},
		scope(flow: string) {
			if (!instance) {
				throw new Error('Browser router host is not attached')
			}
			return createRouterRenderScope(instance, flow)
		},
		mount(flow: string) {
			if (disposed) {
				throw new Error('Browser router host is disposed')
			}
			if (outlets.has(flow)) {
				throw new Error('A route flow already has a mounted outlet')
			}
			const owner = owners.get(browser)
			if (owner && owner !== token) {
				throw new Error('This document already has a browser router host')
			}
			owners.set(browser, token)
			if (!outlets.size) {
				browser.addEventListener('popstate', onPop)
				if ('scrollRestoration' in history) {
					scrollRestoration = history.scrollRestoration
					history.scrollRestoration = 'manual'
				}
			}
			const lifetime = {}
			outlets.set(flow, lifetime)
			return () => {
				if (outlets.get(flow) !== lifetime) {
					return
				}
				outlets.delete(flow)
				notify({ ownerDisposed: true, flow })
				if (flow === 'root') {
					for (const modal of current.modals) {
						notify({ ownerDisposed: true, flow: modal.flow })
					}
				}
				const staged = views.getSnapshot().staged ?? []
				if (staged.some((stage) => stage.entry.flow === flow || flow === 'root')) {
					for (const stage of staged) {
						stage.entry.cancel()
					}

					views.set(current)
				}
				for (const entry of [current.main, ...current.modals.map((value) => value.entry)]) {
					if (entry && (entry.flow === flow || flow === 'root')) {
						entry.cancel()
					}
				}
				if (flow === 'root') {
					++viewVersion
					motion.interrupt()
					if (correction) {
						clearTimeout(correction.timer)
						correction.resolve()
						correction = undefined
					}

					const endedModals = new Set<string>()
					for (const [key, snapshot] of saved) {
						snapshot.main?.cancel()
						for (const modal of snapshot.modals) {
							modal.entry.cancel()
							endedModals.add(modal.flow)
						}

						effects.forget(key)
					}

					saved.clear()
					depthKeys.clear()
					preparingModals.clear()
					activeKey = undefined
					baseDepth = depth
					stamped = false
					current = empty()
					effects.clearFocus()
					effects.head()
					views.set(current)
					for (const modalFlow of endedModals) {
						notify({ ownerDisposed: true, flowDisposed: true, flow: modalFlow })
					}

					notify({ flow })
				}
				if (!outlets.size) {
					if (traversal) {
						clearTimeout(traversal.timer)
						traversal.resolve({ status: 'cancelled', reason: 'aborted' })
						traversal = undefined
					}

					browser.removeEventListener('popstate', onPop)
					if (scrollRestoration !== undefined) {
						history.scrollRestoration = scrollRestoration
					}

					scrollRestoration = undefined
					if (owners.get(browser) === token) {
						owners.delete(browser)
					}
				}
			}
		},
	}
}

export type BrowserRouterHost = ReturnType<typeof createBrowserRouterHost>
