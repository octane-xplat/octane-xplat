import { prepareFullScreenPage } from './full-screen-page'
import { prepareNavigationPage } from './prepare-navigation-page'
import {
	attachNativeBackGesture,
	isNativeFrameDescendant,
	prepareNativeBackGesture,
} from './native-back-gesture'

// oxlint-disable-next-line xplat/no-nativescript-import -- Native-only host selected by the default native router leaf.
import { Frame, GridLayout, Page } from '@nativescript/core'
import { createClientRouteEntry, type ClientRouteEntry } from './client-route-entry'
import { prepareHistoryEntry } from './prepare-history-entry'
// oxlint-disable-next-line xplat/no-ts-imports-tsrx -- Compiled component value for owned roots; no hooks run here.
import { ClientRouteView } from './ClientRouteView.tsrx'
import { createRouterRenderScope } from './router-render-scope'
import { bindRouterFlow } from './router-instance'
import { isNativeActivityBackEvent, registerNativeBackHandler } from './native-back-dispatcher'
import { resolveNativePageTransition } from './native-route-transition'
import type { ContentOwner, ContentRoot } from './owned-content'
import type {
	RouterHost,
	RouterHostChange,
	RouterHostCommand,
	RouterHostResult,
	RouterInstance,
	RouteTransitionResult,
} from './props'

type OwnerEventKind =
	| 'owner-close'
	| 'owner-return'
	| 'owner-returned'
	| 'owner-error'
	| 'owner-timeout'

type OwnerEvent = {
	kind: OwnerEventKind
	base?: string
	current?: string
	sameBase: boolean
	frameLoaded: boolean
	baseLoaded: boolean
	waiting: boolean
	error?: string
}

type PageContent = {
	entry: ClientRouteEntry
	root: ContentRoot
	phase: 'staged' | 'navigating' | 'committed'
	motion?: RouteTransitionResult
}

type Pending = {
	target: Page
	done: Promise<RouterHostResult>
	settle(result: RouterHostResult): void
	fail(error: unknown): void
}

type Flow = {
	name: string
	frame: Frame
	owner: ContentOwner
	base: Page
	pages: Map<Page, PageContent>
	pending?: Pending
	closed: boolean
	closing?: Promise<void>
	detach(): void
}

const frameOwners = new WeakMap<Frame, object>()

/** Frame integration, deliberately separate from swap-pane and modal hosts.
 * getFrame is supplied by the app/window adapter; this factory never finds a
 * globally active stack or changes a process-global current router. */
export function createNativeRouterHost(options: {
	getFrame(flow: string): Frame | undefined
	/** Shell selection for OS Back; required for named or multiple mounted Frames. */
	isFlowActive?(flow: string): boolean
	navigationTimeoutMs?: number
	onOwnerEvent?(event: OwnerEvent): void
}) {
	const timeoutMs = options.navigationTimeoutMs ?? 15000
	if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
		throw new TypeError('Expected a positive native navigation timeout')
	}
	const token = {}
	const flows = new Map<string, Flow>()
	const closingFrames = new Set<Frame>()
	const owners = new Map<string, ContentOwner>()
	const pendingReady = new Set<() => void>()
	const readiness = new Map<string, Promise<void>>()
	const listeners = new Set<(change?: RouterHostChange) => void>()
	let instance: RouterInstance<any> | undefined
	let sequence = 0
	let disposed = false
	let detachBack = () => {}
	const notify = (change?: RouterHostChange) => {
		// Lifecycle callbacks can change this collection during iteration.
		// oxlint-disable-next-line unicorn/no-useless-spread
		for (const listener of [...listeners]) {
			listener(change)
		}
	}
	const release = (flow: Flow, page: Page) => {
		const content = flow.pages.get(page)
		if (!content) {
			return
		}
		flow.pages.delete(page)
		content.entry.cancel()
		content.root.unmount()
	}
	const reconcile = (flow: Flow) => {
		const live = new Set([
			flow.frame.currentPage,
			...flow.frame.backStack.map((entry) => entry.resolvedPage),
		])
		for (const [page, content] of flow.pages) {
			if (page === flow.frame.currentPage) {
				content.phase = 'committed'
			}

			if (content.phase === 'committed' && !live.has(page)) {
				release(flow, page)
			}
		}
	}
	const finish = (flow: Flow, result: RouterHostResult) => {
		const pending = flow.pending
		flow.pending = undefined
		pending?.settle(result)
	}
	const close = (flow: Flow): Promise<void> => {
		if (flow.closing) {
			return flow.closing
		}
		let returned!: () => void
		let failed!: (error: unknown) => void
		flow.closing = new Promise<void>((resolve, reject) => {
			returned = resolve
			failed = reject
		})
		void flow.closing.catch(() => {})
		const waitingForAccepted =
			!!flow.pending ||
			[...flow.pages].some(
				([page, content]) => content.phase === 'navigating' && page !== flow.frame.currentPage,
			)
		const trace = (kind: OwnerEventKind, error?: unknown) => {
			if (options.onOwnerEvent) {
				try {
					options.onOwnerEvent({
						kind,
						base: flow.base.id,
						current: flow.frame.currentPage?.id,
						sameBase: flow.frame.currentPage === flow.base,
						frameLoaded: flow.frame.isLoaded,
						baseLoaded: flow.base.isLoaded,
						waiting: waitingForAccepted,
						...(error ? { error: String(error) } : {}),
					})
				} catch {
					console.warn('[octane-xplat] Native routing owner observer threw')
				}
			} else if (kind === 'owner-error' || kind === 'owner-timeout') {
				console.warn('[octane-xplat] Native routing owner restoration failed')
			}
		}
		trace('owner-close')
		flow.closed = true
		finish(flow, { status: 'cancelled', reason: 'disposed' })
		flow.detach()
		// Lifecycle callbacks can change this collection during iteration.
		// oxlint-disable-next-line unicorn/no-useless-spread
		for (const page of [...flow.pages.keys()]) {
			release(flow, page)
		}
		flows.delete(flow.name)
		closingFrames.add(flow.frame)
		let returning = false
		let timer: ReturnType<typeof setTimeout>
		const cleanup = (error?: unknown) => {
			clearTimeout(timer)
			flow.frame.off('navigatedTo', returnToBase)
			closingFrames.delete(flow.frame)
			if (frameOwners.get(flow.frame) === token) {
				frameOwners.delete(flow.frame)
			}
			notify({ flow: flow.name })
			if (error) {
				failed(error)
			} else {
				returned()
			}
		}
		const returnToBase = () => {
			if (flow.frame.currentPage === flow.base) {
				trace('owner-returned')
				cleanup()
				return
			}
			if (returning) {
				return
			}
			returning = true
			trace('owner-return')
			try {
				if (!flow.frame.isLoaded) {
					flow.frame.callLoaded()
				}

				const baseEntry = flow.frame.backStack.find((entry) => entry.resolvedPage === flow.base)
				if (baseEntry) {
					flow.frame.goBack(baseEntry)
				} else {
					prepareNavigationPage(flow.base)
					flow.frame.navigate({ create: () => flow.base, clearHistory: true, animated: false })
				}
			} catch (error) {
				trace('owner-error', error)
				cleanup(error)
			}
		}
		flow.frame.on('navigatedTo', returnToBase)
		timer = setTimeout(() => {
			trace('owner-timeout')
			cleanup(new Error('Native Frame owner restoration did not complete'))
		}, timeoutMs)
		;(timer as any).unref?.()
		if (!waitingForAccepted) {
			returnToBase()
		}
		return flow.closing
	}

	const ensure = (name: string): Flow | undefined => {
		const found = flows.get(name)
		if (found) {
			return found
		}
		const owner = owners.get(name)
		const frame = options.getFrame(name)
		if (!owner || owner.disposed || !frame?.currentPage) {
			return undefined
		}
		if (closingFrames.has(frame)) {
			return undefined
		}
		if (frameOwners.has(frame)) {
			throw new Error('Native Frame already belongs to a routing flow')
		}
		frameOwners.set(frame, token)
		const declaringPage = owner.host?.page as Page | undefined
		const flow: Flow = {
			name,
			frame,
			owner,
			base:
				declaringPage && (!declaringPage.frame || declaringPage.frame === frame)
					? declaringPage
					: frame.currentPage,
			pages: new Map(),
			closed: false,
			detach: () => {},
		}
		const navigating = (event: any) => {
			if (flow.closed) {
				return
			}
			if (event.entry?.resolvedPage !== flow.pending?.target) {
				notify({ external: true, flow: name })
				if (flow.pending) {
					finish(flow, { status: 'cancelled', reason: 'aborted' })
				}
			}
		}
		const navigated = () => {
			if (flow.closed) {
				return
			}
			reconcile(flow)
			notify({ flow: name })
			if (flow.pending?.target === frame.currentPage) {
				finish(flow, {
					status: 'committed',
					route: flow.pages.get(frame.currentPage)?.entry.route ?? null,
					finished: Promise.resolve({ status: 'completed' }),
				})
			}
		}
		frame.on('navigatingTo', navigating)
		frame.on('navigatedTo', navigated)
		const detachGesture = attachNativeBackGesture(frame, {
			canBegin: () => {
				return !!(
					!disposed &&
					!flow.closed &&
					!owner.disposed &&
					instance &&
					frameOwners.get(frame) === token &&
					!flow.pending &&
					frame.currentPage?.isLoaded &&
					host.getSnapshot(name).canGoBack &&
					(options.isFlowActive ? options.isFlowActive(name) : name === 'root') &&
					![...flows.values()].some(
						(child) =>
							child !== flow &&
							!child.closed &&
							!child.owner.disposed &&
							child.frame.currentPage?.isLoaded &&
							host.getSnapshot(child.name).canGoBack &&
							(options.isFlowActive ? options.isFlowActive(child.name) : child.name === 'root') &&
							isNativeFrameDescendant(child.frame, frame),
					) &&
					bindRouterFlow(instance, name).getSnapshot().navigation.status !== 'pending'
				)
			},
			back: () => bindRouterFlow(instance!, name).back(),
		})
		flow.detach = () => {
			detachGesture()
			frame.off('navigatingTo', navigating)
			frame.off('navigatedTo', navigated)
		}
		flows.set(name, flow)
		return flow
	}
	const beginFrameOperation = (
		flow: Flow,
		target: Page,
		operation: () => void,
	): Promise<RouterHostResult> => {
		let settle!: Pending['settle']
		let fail!: Pending['fail']
		let timer: ReturnType<typeof setTimeout>
		const done = new Promise<RouterHostResult>((resolve, reject) => {
			settle = (result) => {
				clearTimeout(timer)
				resolve(result)
			}
			fail = (error) => {
				clearTimeout(timer)
				reject(error)
			}
		})
		const pending = { target, done, settle, fail }
		flow.pending = pending
		timer = setTimeout(() => {
			if (flow.pending === pending) {
				flow.pending = undefined
			}
			fail(new Error('Native Frame navigation did not complete'))
		}, timeoutMs)
		try {
			// NativeScript may unload a retained Frame while its Page changes.
			// Match the qualified legacy adapter's public loaded re-arm.
			if (!flow.frame.isLoaded) {
				flow.frame.callLoaded()
			}

			operation()
		} catch (error) {
			flow.pending = undefined
			fail(error)
		}
		return done
	}
	const host: RouterHost = {
		history: 'independent',
		canReset: true,
		getSnapshot(name) {
			const flow = flows.get(name)
			const frame = flow?.frame ?? options.getFrame(name)
			const previous = frame?.backStack.at(-1)?.resolvedPage
			return {
				route: frame?.currentPage
					? (flow?.pages.get(frame.currentPage)?.entry.route ?? null)
					: null,
				canGoBack: !!(
					flow &&
					frame?.currentPage &&
					flow.pages.has(frame.currentPage) &&
					previous &&
					(previous === flow.base || flow.pages.has(previous))
				),
				modal: false,
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
			if (command.action === 'dismiss' || command.route?.presentation === 'modal') {
				return { status: 'unsupported', operation: 'modal' }
			}
			const waiting = readiness.get(command.flow)
			if (waiting) {
				let timer: ReturnType<typeof setTimeout> | undefined
				try {
					const waits: Promise<void | RouterHostResult>[] = [waiting]
					if (command.cancellation) {
						waits.push(command.cancellation)
					}

					waits.push(
						new Promise((_resolve, reject) => {
							timer = setTimeout(
								() => reject(new Error('Native Frame did not become ready')),
								timeoutMs,
							)
						}),
					)

					const cancelled = await Promise.race(waits)
					if (cancelled) {
						return cancelled
					}
				} finally {
					if (timer !== undefined) {
						clearTimeout(timer)
					}
				}

				if (disposed) {
					return { status: 'cancelled', reason: 'disposed' }
				}

				if (!command.isCurrent()) {
					return { status: 'cancelled', reason: 'superseded' }
				}
			}
			const flow = ensure(command.flow)
			if (!flow || !instance) {
				return {
					status: 'blocked',
					reason: owners.has(command.flow) ? 'host-not-ready' : 'missing-outlet',
				}
			}
			if (flow.pending) {
				await flow.pending.done.catch(() => {})
			}
			if (flow.closed || flow.owner.disposed) {
				return { status: 'cancelled', reason: 'disposed' }
			}
			if (!command.isCurrent()) {
				return { status: 'cancelled', reason: 'superseded' }
			}
			if (command.action === 'back') {
				const target = flow.frame.backStack.at(-1)
				if (!target) {
					return { status: 'blocked', reason: 'at-base' }
				}

				const retained = flow.pages.get(target.resolvedPage)
				let prepared: Awaited<ReturnType<typeof prepareHistoryEntry>> | undefined
				if (retained) {
					prepared = await prepareHistoryEntry(instance, command, retained.entry)
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

					if (prepared.redirected && prepared.route.presentation === 'modal') {
						return {
							status: 'handoff',
							prepared,
							action: 'push',
							beforeMutation: command.beforeMutation,
						}
					}
				}

				const previous = retained?.entry
				const entry =
					prepared?.status === 'ready'
						? createClientRouteEntry(
								instance,
								command.flow,
								prepared.redirected ? 'native:' + ++sequence : previous!.id,
								prepared.route,
								prepared.content,
							)
						: undefined

				let candidate: { root: ContentRoot; container: GridLayout } | undefined
				let updatingRetained = false
				let engineStarted = false
				try {
					if (entry && prepared?.status === 'ready' && prepared.redirected) {
						const container = new GridLayout()
						const root = flow.owner.createRoot(container, () => entry.cancel())
						candidate = { root, container }
						root.render(ClientRouteView, { entry })
						const rendered = await entry.committed
						if (rendered.status !== 'committed') {
							return rendered
						}
					}

					if (disposed || flow.closed || flow.owner.disposed) {
						return { status: 'cancelled', reason: 'disposed' }
					}

					if (!command.beginCommit()) {
						return { status: 'cancelled', reason: 'superseded' }
					}

					if (retained && entry && !candidate) {
						updatingRetained = true
						retained.entry = entry
						retained.root.render(ClientRouteView, { entry })
						const rendered = await entry.committed
						if (rendered.status !== 'committed') {
							return rendered
						}
					}

					if (command.beforeMutation) {
						await command.beforeMutation()
					}

					if (disposed || flow.closed || flow.owner.disposed || !command.isCurrent()) {
						return {
							status: 'cancelled',
							reason: disposed || flow.closed || flow.owner.disposed ? 'disposed' : 'superseded',
						}
					}

					if (retained && entry && candidate) {
						const previousRoot = retained.root
						target.resolvedPage.content = candidate.container
						retained.root = candidate.root
						retained.entry = entry
						candidate = undefined
						previousRoot.unmount()
					}

					if (prepared?.status === 'ready' && prepared.content.head?.title !== undefined) {
						target.resolvedPage.actionBar.title = prepared.content.head.title
					}

					const animated = flow.frame.currentEntry?.animated ?? flow.frame.animated ?? true
					const transition = flow.pages.get(flow.frame.currentPage)?.entry.route.transition
					const motion = flow.pages.get(flow.frame.currentPage)?.motion
					engineStarted = true
					const result = await beginFrameOperation(flow, target.resolvedPage, () =>
						flow.frame.goBack(target),
					)

					if (result.status === 'committed' && !animated) {
						return {
							...result,
							finished: Promise.resolve(
								motion ?? {
									status: 'skipped',
									reason:
										transition && !['none', 'default', 'fade'].includes(transition)
											? 'unsupported'
											: 'disabled',
								},
							),
						}
					}

					return result
				} catch (error) {
					if (
						updatingRetained &&
						!engineStarted &&
						retained &&
						previous &&
						!flow.closed &&
						!flow.owner.disposed
					) {
						retained.entry = previous
						retained.root.render(ClientRouteView, { entry: previous })
					}

					throw error
				} finally {
					candidate?.root.unmount()
				}
			}
			if (!command.route || !command.content) {
				throw new Error('Native commit requires prepared render content')
			}
			if (command.action === 'refresh') {
				const current = flow.pages.get(flow.frame.currentPage)
				if (!current) {
					return { status: 'unsupported', operation: 'refresh-unowned-page' }
				}

				if (!command.beginCommit()) {
					return { status: 'cancelled', reason: 'superseded' }
				}

				const previous = current.entry
				const entry = createClientRouteEntry(
					instance,
					command.flow,
					previous.id,
					command.route,
					command.content,
				)

				current.entry = entry
				try {
					current.root.render(ClientRouteView, { entry })
					const result = await entry.committed
					if (result.status !== 'committed') {
						return result
					}

					if (disposed || flow.closed || flow.owner.disposed || !command.isCurrent()) {
						return { status: 'cancelled', reason: 'disposed' }
					}

					await command.beforeMutation?.()
					if (disposed || flow.closed || flow.owner.disposed || !command.isCurrent()) {
						return { status: 'cancelled', reason: 'disposed' }
					}

					if (command.content.head?.title !== undefined) {
						flow.frame.currentPage.actionBar.title = command.content.head.title
					}

					notify({ flow: command.flow })
					return result
				} catch (error) {
					if (!flow.closed && !flow.owner.disposed) {
						current.entry = previous
						current.root.render(ClientRouteView, { entry: previous })
					}

					throw error
				}
			}
			const page = prepareFullScreenPage(new Page())
			page.actionBarHidden = true
			prepareNativeBackGesture(page)
			if (command.content.head?.title !== undefined) {
				page.actionBar.title = command.content.head.title
			}
			page.id = 'refined-page-' + sequence
			const container = new GridLayout()
			page.content = container
			const entry = createClientRouteEntry(
				instance,
				command.flow,
				'native:' + ++sequence,
				command.route,
				command.content,
			)
			const root = flow.owner.createRoot(container, () => {
				entry.cancel()
			})
			flow.pages.set(page, { entry, root, phase: 'staged' })
			try {
				root.render(ClientRouteView, { entry })
				const rendered = await entry.committed
				if (rendered.status !== 'committed') {
					release(flow, page)
					return rendered
				}

				if (!command.beginCommit()) {
					release(flow, page)
					return { status: 'cancelled', reason: 'superseded' }
				}

				if (command.beforeMutation) {
					await command.beforeMutation()
					if (disposed || flow.closed || flow.owner.disposed || !command.isCurrent()) {
						release(flow, page)
						return {
							status: 'cancelled',
							reason: disposed || flow.closed || flow.owner.disposed ? 'disposed' : 'superseded',
						}
					}
				}

				const motion = resolveNativePageTransition(command.route.transition, command.transition, {
					action: command.action,
					from: flow.pages.get(flow.frame.currentPage)?.entry.route ?? null,
					to: entry.route,
				})

				// Application factories can synchronously dispose or reconfigure routing.
				if (disposed || flow.closed || flow.owner.disposed || !command.isCurrent()) {
					release(flow, page)
					return {
						status: 'cancelled',
						reason: disposed || flow.closed || flow.owner.disposed ? 'disposed' : 'superseded',
					}
				}

				const nativeEntry = {
					create: () => page,
					clearHistory: command.action === 'reset',
					animated: motion.animated,
					transition: motion.transition,
				}

				flow.pages.get(page)!.motion = motion.result
				flow.pages.get(page)!.phase = 'navigating'
				const result = await beginFrameOperation(flow, page, () => {
					if (command.action === 'replace') {
						flow.frame.replacePage(nativeEntry)
					} else {
						flow.frame.navigate(nativeEntry)
					}
				})

				if (result.status === 'committed' && !nativeEntry.animated) {
					return {
						...result,
						finished: Promise.resolve(
							motion.result ?? {
								status: 'skipped',
								reason: command.route.transition === 'none' ? 'disabled' : 'unsupported',
							},
						),
					}
				}

				return result
			} catch (error) {
				if (flow.pages.get(page)?.phase === 'staged') {
					release(flow, page)
				}

				throw error
			}
		},
		dispose() {
			if (disposed) {
				return
			}
			disposed = true
			detachBack()
			// Lifecycle callbacks can change this collection during iteration.
			// oxlint-disable-next-line unicorn/no-useless-spread
			for (const flow of [...flows.values()]) {
				close(flow)
			}
			// Lifecycle callbacks can change this collection during iteration.
			// oxlint-disable-next-line unicorn/no-useless-spread
			for (const detach of [...pendingReady]) {
				detach()
			}
			owners.clear()
			listeners.clear()
			instance = undefined
		},
	}
	return {
		host,
		attach(router: RouterInstance<any>) {
			if (instance || disposed) {
				throw new Error('Native host cannot be attached')
			}
			instance = router
			detachBack = registerNativeBackHandler(token, {
				priority: 0,
				handle(event) {
					if (disposed || !event.activity || !isNativeActivityBackEvent(event)) {
						return false
					}
					const candidates = [...flows.values()].sort(
						(a, b) => Number(b.name === 'root') - Number(a.name === 'root'),
					)
					for (const flow of candidates) {
						if (
							flow.closed ||
							!flow.frame.isLoaded ||
							flow.frame.android?.activity !== event.activity
						) {
							continue
						}

						if (options.isFlowActive ? !options.isFlowActive(flow.name) : flow.name !== 'root') {
							continue
						}

						if (flow.pending) {
							return true
						}

						if (!host.getSnapshot(flow.name).canGoBack) {
							continue
						}

						void bindRouterFlow(router, flow.name)
							.back()
							.catch(() => {
								console.warn('[octane-xplat] Routed Frame Back failed')
							})

						return true
					}
					return false
				},
			})
		},
		scope(flow: string) {
			if (!instance) {
				throw new Error('Native host is not attached')
			}
			return createRouterRenderScope(instance, flow)
		},
		mount(flow: string, owner: ContentOwner) {
			if (disposed) {
				throw new Error('Native host is disposed')
			}
			if (owners.has(flow)) {
				throw new Error('A native flow already has a mounted outlet')
			}
			owners.set(flow, owner)
			// Bind the declaring base as soon as this Frame is ready. Waiting until
			// the first push can capture an unrelated later page as the owner base.
			const frame = options.getFrame(flow)
			let releaseReady!: () => void
			const waiting = new Promise<void>((resolve) => {
				releaseReady = resolve
			})
			readiness.set(flow, waiting)
			const detachReady = () => {
				frame?.off('navigatedTo', ready)
				pendingReady.delete(detachReady)
				if (readiness.get(flow) === waiting) {
					readiness.delete(flow)
				}
				releaseReady()
			}
			const ready = () => {
				if (disposed || owners.get(flow) !== owner) {
					detachReady()
					return
				}
				if (!frame?.currentPage || closingFrames.has(frame)) {
					return
				}
				detachReady()
				ensure(flow)
			}
			pendingReady.add(detachReady)
			// A remount may see the previous routed Page while its owner returns
			// the Frame to its base. Retain the wait until that restoration ends.
			frame?.on('navigatedTo', ready)
			ready()
			return () => {
				detachReady()
				owners.delete(flow)
				notify({ ownerDisposed: true, flow })
				const state = flows.get(flow)
				return state ? close(state) : Promise.resolve()
			}
		},
	}
}

export type NativeRouterHost = ReturnType<typeof createNativeRouterHost>
