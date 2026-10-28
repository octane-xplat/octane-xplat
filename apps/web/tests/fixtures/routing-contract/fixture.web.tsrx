/** @jsxImportSource @octane-xplat/jsx/dom */
import './focus.web.css'
import { useState, useSyncExternalStore, flushSync, createRoot } from 'octane'
import { qualifyPaneRouterExample } from '../../../../../packages/ui/tests/pane-router-example.tsrx'
import {
	NavLink,
	RouteOutlet,
	Tabs,
	NavigationMenu,
	SideNavItem,
	TopNavItem,
	TopNavMegaMenuItem,
	TopNavMenu,
	TopNavMegaMenu,
	Breadcrumbs,
	DropdownMenu,
	ContextMenu,
	NavHeadingMenuItem,
	TabList,
	Tab,
} from '@octane-xplat/ui'

import {
	router,
	defineRoute,
	defineRoutes,
	deriveRouteManifest,
	mergeRouteManifests,
	useRouter,
	useRouterState,
	useNavigation,
	useNavigationBlocker,
	getRouteApi,
} from '@octane-xplat/ui/routing'

import type {
	FileRouteContract,
	RouteDefinitionArgs,
	RouterNavigator,
	ValidatedDestination,
	RouteRegistration,
} from '@octane-xplat/ui/routing'

import type {} from './routes.gen.types'
import {
	defineRuntimeRoutes,
	sealGeneratedRouteCatalog,
	DestinationRedirect,
	RouteForbidden,
} from '@octane-xplat/ui/routing/core'

import { createStore } from '../../../../../packages/ui/src/store'
import { lastMotionContext } from './transitions.web'
// Assertion access only; application code never constructs this platform host.
import { defaultRouterRuntime } from '../../../../../packages/ui/src/default-router.web'

const dirtyEntry = createStore<string | null>(null)
let confirmationResult: Promise<string> | undefined

let currentNavigator: RouterNavigator
let loads = 0
let historyAllowed = true
let historyModalRedirect = false
let historyModalLoads = 0
let runtimeLoads = 0
let feedbackLoads = 0
let feedbackAllowed = false
let feedbackGate: Promise<void> | undefined
let releaseFeedback: (() => void) | undefined
let failedFeedbackRequest: Promise<unknown> | undefined
let runtimeRegistration: RouteRegistration | undefined
const checkedDestination = createStore<ValidatedDestination | null>(null)
const chromeKind = createStore<string | null>(null)
const itemApi = getRouteApi('/items/:id')
// Compiled against both installed declarations and platform-suffixed sources.
export function checkHookTypes() {
	// @ts-expect-error A platform forwarding leaf must preserve DTO checking.
	itemApi.useLoaderData().invented
	// @ts-expect-error Owner-bound hooks retain the application's route union.
	useRouter().push({ to: '/invented' })
	// @ts-expect-error Search updater input remains inferred under web suffixes.
	itemApi.useUpdateSearch()({ tab: 'invented' })
}

let currentSearchUpdate: ReturnType<typeof itemApi.useUpdateSearch>
let retainedSearchUpdate: ReturnType<typeof itemApi.useUpdateSearch>
function FilteredItem(props: {
	params: { id: string }
	data: { title: string }
}): import('@octane-xplat/ui').Renderable {
	const updateSearch = itemApi.useUpdateSearch()
	currentSearchUpdate = updateSearch
	const changeFilter = () =>
		updateSearch((previous) => ({ tab: previous.tab === 'details' ? 'activity' : 'details' }))

	return (
		<div>
			<Item {...props} />
			<button id="search-activity" onClick={changeFilter}>
				Change filter
			</button>
			<button id="search-clear" onClick={() => updateSearch({})}>
				Clear filter
			</button>
			<button
				id="search-push"
				onClick={() => updateSearch({ tab: 'activity' }, { replace: false })}
			>
				Push filter
			</button>
		</div>
	)
}

function NavigationFeedback() {
	const state = useNavigation()
	const navigator = useRouter()
	return (
		<div id="navigation-feedback">
			<span id="feedback-status">
				{state.status +
					(state.status === 'failed' && state.result.status === 'failed'
						? ':' + state.result.phase
						: '')}
			</span>
			{state.status === 'failed' ? (
				<button id="feedback-retry" onClick={() => navigator.retry()}>
					Retry navigation
				</button>
			) : null}
		</div>
	)
}

function NavigationWidgets() {
	const kind = useSyncExternalStore(
		chromeKind.subscribe,
		chromeKind.getSnapshot,
		chromeKind.getSnapshot,
	)

	if (!kind) {
		return null
	}

	const destination = {
		to: '/items/:id',
		params: { id: 'chrome-' + kind },
		search: { tab: 'activity' },
		transition: 'none',
	} as const

	let content
	if (kind === 'strip') {
		content = <NavigationMenu items={[{ key: 'target', label: 'Open target', ...destination }]} />
	} else if (kind === 'side') {
		content = <SideNavItem label="Open target" {...destination} />
	} else if (kind === 'top') {
		content = <TopNavItem label="Open target" {...destination} />
	} else if (kind === 'mega') {
		content = <TopNavMegaMenuItem title="Open target" {...destination} />
	} else if (kind === 'heading') {
		content = <NavHeadingMenuItem label="Open target" {...destination} />
	} else if (kind === 'tab') {
		content = (
			<TabList value="initial" onChange={() => {}}>
				<Tab value="target" label="Open target" {...destination} />
			</TabList>
		)
	} else if (kind === 'breadcrumb' || kind === 'overflow') {
		content = (
			<Breadcrumbs
				maxVisibleItems={kind === 'overflow' ? 2 : undefined}
				items={[{ label: 'Home' }, { label: 'Open target', ...destination }, { label: 'Current' }]}
			/>
		)
	} else if (kind === 'top-menu') {
		content = <TopNavMenu label="Actions" items={[{ title: 'Open target', ...destination }]} />
	} else if (kind === 'mega-menu') {
		content = (
			<TopNavMegaMenu
				label="Actions"
				items={<TopNavMegaMenuItem title="Open target" {...destination} />}
			/>
		)
	} else if (kind === 'context') {
		content = (
			<ContextMenu
				trigger="Actions"
				items={[{ type: 'link', key: 'target', label: 'Open target', ...destination }]}
			>
				Context target
			</ContextMenu>
		)
	} else {
		content = (
			<DropdownMenu
				button={{ label: 'Actions' }}
				items={[{ type: 'link', key: 'target', label: 'Open target', ...destination }]}
			/>
		)
	}

	return <div id="navigation-widgets">{content}</div>
}

function NavigationConfirmation(props: { id: string }) {
	const dirty = useSyncExternalStore(
		dirtyEntry.subscribe,
		dirtyEntry.getSnapshot,
		dirtyEntry.getSnapshot,
	)

	const blocker = useNavigationBlocker({ when: dirty === props.id })
	return (
		<div>
			<output id="confirmation-status">{blocker.status}</output>
			{blocker.status === 'blocked' ? (
				<div role="dialog" aria-label="Unsaved changes">
					<p id="confirmation-action">{blocker.action}</p>
					<button onClick={blocker.proceed}>Leave screen</button>
					<button
						onClick={() => {
							blocker.proceed()
							dirtyEntry.set(null)
						}}
					>
						Approve and clear edits
					</button>
					<button onClick={blocker.reset}>Keep editing</button>
				</div>
			) : null}
		</div>
	)
}

function Item(props: { params: { id: string }; data: { title: string } }) {
	const [count, setCount] = useState(0)
	currentNavigator = useRouter(navigation)
	const checked = useSyncExternalStore(
		checkedDestination.subscribe,
		checkedDestination.getSnapshot,
		checkedDestination.getSnapshot,
	)

	return (
		<div>
			<NavigationFeedback />
			<NavigationConfirmation id={props.params.id} />
			<NavigationWidgets />
			<button id="item" aria-label="Increment" onClick={() => setCount(count + 1)}>
				{props.params.id}:{props.data.title}:{count}
			</button>
			{checked ? (
				<NavLink router={navigation} to={checked}>
					Open checked runtime
				</NavLink>
			) : null}
		</div>
	)
}

function FocusPage(props: { data: { title: string } }) {
	return (
		<main id="focus-page">
			<h1 id="focus-heading">{props.data.title}</h1>
			<button id="focus-control">Continue</button>
			<div className="routing-focus-spacer" />
			<h2 id="part one">A section</h2>
			<button id="focus-bottom-control">Return target</button>
			<div className="routing-focus-spacer" />
		</main>
	)
}

function Settings() {
	currentNavigator = useRouter(navigation)
	return (
		<RouteOutlet>
			<p id="settings">Settings</p>
		</RouteOutlet>
	)
}

function HistoryLogin() {
	currentNavigator = useRouter(navigation)
	return <p id="history-login">Sign in</p>
}

function Broken(): never {
	throw new Error('Expected browser candidate failure')
}

const failingCatalog = defineRoutes([
	defineRoute({ path: '/failed-items/:id', loader: () => ({ title: 'unused' }) }).screen(Broken),
	defineRoute({ path: '/failed-settings' }).screen(Broken),
])

const validateSearch = (raw: { tab?: unknown }) => {
	const tab = raw.tab ?? 'details'
	if (tab !== 'details' && tab !== 'activity') {
		throw new Error('Invalid tab')
	}

	return { tab } as const
}

type Account = { account: string }
const fileModule = {
	validateSearch,
	beforeLoad({ context }: RouteDefinitionArgs<'/items/:id', typeof validateSearch, Account>) {
		if (!historyAllowed) {
			throw new RouteForbidden()
		}

		if (historyModalRedirect) {
			throw new DestinationRedirect({
				to: '/history-login',
				presentation: 'modal',
				transition: 'none',
			})
		}

		return { owner: context.account }
	},
	loader({
		params,
		search,
		context,
	}: RouteDefinitionArgs<'/items/:id', typeof validateSearch, Account & { owner: string }>) {
		if (context.owner !== context.account || !search.tab) {
			throw new Error('File preparation contract failed')
		}

		return { title: params.id + ++loads }
	},
	screen: FilteredItem,
}

// The same type-only branding is emitted by the route generator.
const fileCatalog = sealGeneratedRouteCatalog<{
	'/items/:id': FileRouteContract<'/items/:id', typeof fileModule, Account>
}>(deriveRouteManifest({ './app/items/[id].web.tsrx': fileModule }, ['web']))

export const catalog = mergeRouteManifests(
	fileCatalog,
	defineRoutes([
		defineRoute({
			path: '/focus/:id',
			loader: ({ params }) => ({ title: 'Focus ' + params.id }),
			head: ({ params: { id } }) => ({ title: 'Focus ' + id, meta: { description: 'Page ' + id } }),
		}).screen(FocusPage),
		defineRoute({ path: '/settings' }).screen(Settings),
		defineRoute({
			path: '/history-login',
			loader: () => ++historyModalLoads,
		}).screen(HistoryLogin),
		defineRoute({
			path: '/feedback/:id',
			loader: async ({ params }) => {
				feedbackLoads++
				await feedbackGate
				if (!feedbackAllowed) {
					throw new Error('Expected recoverable loader failure')
				}

				return { title: 'feedback-' + params.id }
			},
		}).screen(Item),
		defineRoute({
			path: '/moved',
			loader: () => {
				throw new DestinationRedirect({
					to: '/items/:id',
					params: { id: 'coat' },
					search: { tab: 'activity' },
				})
			},
		}).screen(Broken),
	]),
	failingCatalog,
)

const initialHistoryLength = history.length
let contextReads = 0
let currentAccount = 'account-a'
const rootOwnerVisible = createStore(true)
export function routingContext() {
	contextReads++
	return { account: currentAccount }
}

const navigation = router
function LeftBase() {
	return <p id="base">Base</p>
}

function RightBase() {
	const [count, setCount] = useState(0)
	return (
		<button id="tab-count" aria-label="Increment tab" onClick={() => setCount(count + 1)}>
			Tab count {count}
		</button>
	)
}

const clientTabs = [
	{ key: 'left', title: 'Left', stack: 'left', render: LeftBase },
	{ key: 'right', title: 'Right', stack: 'right', render: RightBase },
]

let observed: { id: unknown; back: boolean; sameRoute: boolean }
function RootWatcher() {
	const state = useRouterState()
	observed = {
		id: state.route?.to === '/items/:id' ? state.route.params.id : undefined,
		back: state.canGoBack,
		sameRoute: state.route === navigation.getSnapshot().route,
	}

	return null
}

export function App() {
	const visible = useSyncExternalStore(
		rootOwnerVisible.subscribe,
		rootOwnerVisible.getSnapshot,
		rootOwnerVisible.getSnapshot,
	)

	if (!visible) {
		return <p id="root-owner-ended">Owner ended</p>
	}

	return (
		<RouteOutlet>
			<RootWatcher />
			<NavigationFeedback />
			<NavLink id="canonical-link" to="/items/:id" params={{ id: 'linked' }}>
				Open linked item
			</NavLink>
			<Tabs tabs={clientTabs} />
		</RouteOutlet>
	)
}

let retainedButton: Element | null = null
let lastMotion: Promise<unknown> | undefined

;(window as any).__routing = {
	async qualifyPanes() {
		const container = document.createElement('div')
		document.body.append(container)
		const url = location.href
		const length = history.length
		const checks: string[] = []
		try {
			await qualifyPaneRouterExample({
				mount(Component, props) {
					const root = createRoot(container)
					root.render(Component, props)
					return () => root.unmount()
				},
				find: (id) => container.querySelector('#' + id),
				check(name, pass) {
					if (!pass) {
						throw new Error(name)
					}

					checks.push(name)
				},
				async wait(name, predicate) {
					const deadline = Date.now() + 10000
					while (!predicate()) {
						if (Date.now() > deadline) {
							throw new Error(name)
						}

						await new Promise((resolve) => setTimeout(resolve, 10))
					}
				},
			})

			return {
				checks,
				urlUnchanged: location.href === url,
				historyUnchanged: history.length === length,
			}
		} finally {
			container.remove()
		}
	},
	setDirtyEntry(id: string | null) {
		flushSync(() => dirtyEntry.set(id))
	},
	beginConfirmedNavigation(id: string) {
		confirmationResult = navigation
			.push({ to: '/items/:id', params: { id }, transition: 'none' })
			.then((result) => result.status)
	},
	clearFailure() {
		navigation.clearFailure()
	},
	confirmationResult() {
		return confirmationResult
	},
	async settings() {
		return (await navigation.push({ to: '/settings', transition: 'none' })).status
	},
	setHistoryModalRedirect(value: boolean) {
		historyModalRedirect = value
	},
	get historyModalState() {
		const state = defaultRouterRuntime.getClient().platform.views.getSnapshot()
		return { loads: historyModalLoads, main: state.main?.route.to, modals: state.modals.length }
	},
	async retryHistory() {
		return (await navigation.retry()).status
	},
	setHistoryAccess(allowed: boolean, account: string) {
		historyAllowed = allowed
		currentAccount = account
	},
	endRootOwner() {
		flushSync(() => rootOwnerVisible.set(false))
		return { route: navigation.getSnapshot().route, back: navigation.getSnapshot().canGoBack }
	},
	startRootOwner() {
		currentAccount = 'account-b'
		flushSync(() => rootOwnerVisible.set(true))
	},
	beginFeedback() {
		feedbackGate = new Promise<void>((resolve) => {
			releaseFeedback = resolve
		})

		failedFeedbackRequest = navigation.push({
			to: '/feedback/:id',
			params: { id: 'recover' },
			transition: 'none',
		})
	},
	async releaseFeedback() {
		const release = releaseFeedback
		feedbackGate = undefined
		releaseFeedback = undefined
		release?.()
		return ((await failedFeedbackRequest) as { status: string }).status
	},
	allowFeedback() {
		feedbackAllowed = true
	},
	get feedbackLoads() {
		return feedbackLoads
	},
	get navigationFeedback() {
		return navigation.getSnapshot().navigation
	},
	async showChrome(kind: string) {
		chromeKind.set(null)
		await navigation.push({
			to: '/items/:id',
			params: { id: 'chrome-presenter' },
			transition: 'none',
		})

		chromeKind.set(kind)
	},
	async installChecked() {
		runtimeRegistration?.dispose()
		runtimeRegistration = navigation.addRoutes(
			defineRuntimeRoutes([
				defineRoute({
					path: '/checked/:id',
					validateSearch,
					loader: ({ params }) => {
						runtimeLoads++
						return { title: 'runtime-' + params.id }
					},
				}).screen(Item),
			]),
			{ id: 'checked-content' },
		)

		const before = { contextReads, runtimeLoads, route: navigation.getSnapshot().route }
		const result = await navigation.validateDestination({
			to: '/checked/:id',
			params: { id: 'opaque' },
			search: { tab: 'activity' },
			transition: 'none',
		})

		if (result.status !== 'valid') {
			return { status: result.status }
		}

		checkedDestination.set(result.destination)
		return {
			status: result.status,
			href: result.href,
			unchanged:
				contextReads === before.contextReads &&
				runtimeLoads === before.runtimeLoads &&
				navigation.getSnapshot().route === before.route,
		}
	},
	async invalidChecked() {
		const result = await navigation.validateDestination({
			to: '/checked/:id',
			params: { id: 'opaque' },
			search: { tab: 'wrong' },
		})

		return {
			status: result.status,
			path: result.status === 'invalid-input' ? result.path : null,
			runtimeLoads,
		}
	},
	removeChecked() {
		runtimeRegistration?.dispose()
	},
	captureSearchUpdate() {
		retainedSearchUpdate = currentSearchUpdate
	},
	async staleSearchUpdate() {
		return (await retainedSearchUpdate({ tab: 'activity' })).status
	},
	get searchState() {
		const search = navigation.getSnapshot().route?.search
		return {
			href: location.pathname + location.search,
			length: history.length,
			loads,
			tab: search && 'tab' in search ? search.tab : undefined,
		}
	},
	get checkedState() {
		return {
			contract: navigation.getSnapshot().route?.contract,
			runtimeLoads,
			path: location.pathname,
			search: location.search,
			text: document.getElementById('item')?.textContent,
		}
	},

	async motion(id: string, transition: 'fade' | 'detail' | 'none', modal = false) {
		const result = await navigation.push({
			to: '/items/:id',
			params: { id },
			transition,
			...(modal ? { presentation: 'modal' } : {}),
		})

		if (result.status !== 'committed') {
			return { status: result.status }
		}

		let finished = false
		lastMotion = result.finished.then((value) => {
			finished = true
			return value
		})

		await Promise.resolve()
		return {
			status: result.status,
			finished,
			text: document.querySelectorAll('#item').item(document.querySelectorAll('#item').length - 1)
				?.textContent,
			path: location.pathname,
		}
	},
	motionFinished() {
		return lastMotion
	},
	get motionContext() {
		return lastMotionContext
	},
	async push(id: string, modal = false) {
		return (
			await navigation.push({
				to: '/items/:id',
				params: { id },
				...(modal ? { presentation: 'modal' } : {}),
			})
		).status
	},
	async incoming(url: string) {
		return (await navigation.navigateUrl(url)).status
	},
	get observed() {
		return observed
	},
	get modalId() {
		const state = currentNavigator.getSnapshot()
		return state.modal && state.route?.to === '/items/:id' ? state.route.params.id : undefined
	},
	async replace(id: string) {
		return (await navigation.replace({ to: '/items/:id', params: { id } })).status
	},
	async refresh() {
		return (await navigation.refresh()).status
	},
	async focusPage(id: string, hash?: string) {
		return (await navigation.push({ to: '/focus/:id', params: { id }, hash })).status
	},
	async back() {
		return (await navigation.back()).status
	},
	async ownedBack() {
		return (await currentNavigator.back()).status
	},
	async named(id: string) {
		return (await navigation.forStack('right').push({ to: '/items/:id', params: { id } })).status
	},
	get currentStack() {
		return currentNavigator.getSnapshot().route?.stack
	},
	async modal() {
		return (await navigation.push({ to: '/settings', presentation: 'modal' })).status
	},
	async modalPush() {
		return (await currentNavigator.push({ to: '/items/:id', params: { id: 'glove' } })).status
	},
	async dismiss() {
		return (await currentNavigator.dismiss()).status
	},
	async reset() {
		return (await navigation.reset({ to: '/settings' })).status
	},
	get loads() {
		return loads
	},
	get contextReads() {
		return contextReads
	},
	initialHistoryLength,
	get fileContract() {
		const match = navigation.getSnapshot().route
		return match?.to === '/items/:id' ? { search: match.search, context: match.context } : null
	},
	async fail(action: 'push' | 'replace' | 'modal') {
		const result =
			action === 'modal'
				? await navigation.push({ to: '/failed-settings', presentation: 'modal' })
				: await navigation[action]({ to: '/failed-items/:id', params: { id: 'broken' } })

		return { status: result.status, phase: result.status === 'failed' ? result.phase : null }
	},
	retainButton() {
		retainedButton = document.getElementById('item')
	},
	get sameButton() {
		return retainedButton === document.getElementById('item')
	},
	get modalCount() {
		return defaultRouterRuntime.getClient().platform.views.getSnapshot().modals.length
	},
}
