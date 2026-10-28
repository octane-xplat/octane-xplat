/** @jsxImportSource @octane-xplat/jsx */
import { createContext, useContext, useState, useLayoutEffect, useSyncExternalStore } from 'octane'
import type { UniversalComponent } from 'octane/universal'
import { createMacOSRoot } from '@octane-xplat/macos-renderer'
import { NSApplication, NSView, NSWindow } from '@octane-xplat/platform/macos'
import { qualifyAppKitRouteTransitions } from './route-transition-fixture.macos'
import { qualifyNativeAuthentication } from '../../../packages/ui/tests/authentication-native-example.tsrx'
import { createAppKitRouterHost } from '../../../packages/ui/src/appkit-router-host.macos'
import { qualifyRouteRetention } from '../../../packages/ui/tests/route-retention-example.tsrx'
import { scrollableAreaMetrics } from '../../../packages/ui/src/scrollable-area-metrics'
import { qualifyPaneRouterExample } from '../../../packages/ui/tests/pane-router-example.tsrx'
import { Text, View } from '@octane-xplat/ui'
import { defineAppKitTransition } from '@octane-xplat/ui/macos'
import { createPaneRouterHost } from '../../../packages/ui/src/pane-router-host'
import { ClientRouteOutlet } from '../../../packages/ui/src/ClientRouteOutlet.tsrx'
import { createStore } from '../../../packages/ui/src/store'
import { createRouter } from '../../../packages/ui/src/router-instance'
import { defineRoute } from '../../../packages/ui/src/define-route'
import {
	defineRoutes,
	deriveRouteManifest,
	mergeRouteManifests,
} from '../../../packages/ui/src/route-table'

import { sealGeneratedRouteCatalog } from '../../../packages/ui/src/route-contract-scope'
import type {
	FileRouteContract,
	RouteDefinitionArgs,
	NavigationBlockerState,
} from '../../../packages/ui/src/props'

import { RouteOutlet } from '../../../packages/ui/src/RouteOutlet.macos.tsrx'
import { Tabs } from '../../../packages/ui/src/Tabs.macos.tsrx'
import { defaultRouterRuntime } from '../../../packages/ui/src/default-router.macos'
import {
	defineRoute as defineClientRoute,
	defineRoutes as defineClientRoutes,
	router as defaultRouter,
	configureRouter,
	useRouter as useClientRouter,
	useRouterState as useClientRouterState,
} from '@octane-xplat/ui/routing'

import type { RouterNavigator as ClientNavigator } from '@octane-xplat/ui/routing'
import {
	NavigationChrome,
	type NavigationChromeKind,
} from '../../../packages/ui/tests/navigation-item-cases.tsrx'

import type { ValidatedDestination } from '../../../packages/ui/src/props'
import {
	getRouteApi,
	useNavigation,
	useNavigationBlocker,
} from '../../../packages/ui/src/router-hooks.tsrx'

import { RouteForbidden, DestinationRedirect } from '../../../packages/ui/src/routing-core'

declare const __xplatStopHost: () => void

const dirtyEntry = createStore<string | null>(null)
const blockers = new Map<string, NavigationBlockerState>()
const dirtyEntries = new Map<string, boolean>()
const Person = createContext('missing')
const PersonProvider: any = Person
const entries = new Map<
	string,
	{
		title: string
		count: number
		person: string
		tab: string
		updateSearch(
			search: { tab?: 'details' | 'activity' },
			options?: { replace?: boolean },
		): Promise<{ status: string }>
		increment(): void
	}
>()

let navigation: ReturnType<typeof createFixtureRouter>['navigation']
let changePerson = (_value: string) => {}
let showChrome = (
	_value: { kind: NavigationChromeKind; destination: ValidatedDestination } | null,
) => {}

let removeOwner = () => {}
let remountOwner = () => {}
function Detail(): any {
	const item = getRouteApi('/items/:id', navigation)
	const id = item.useParams().id
	const dirty = useSyncExternalStore(
		dirtyEntry.subscribe,
		dirtyEntry.getSnapshot,
		dirtyEntry.getSnapshot,
	)
	const blocker = useNavigationBlocker({ when: dirty === id })
	blockers.set(id, blocker)
	dirtyEntries.set(id, dirty === id)
	const title = item.useLoaderData().title
	const person = useContext(Person)
	const feedback = useNavigation()
	const [count, setCount] = useState(0)
	entries.set(id, {
		title,
		count,
		person,
		tab: item.useSearch().tab,
		updateSearch: item.useUpdateSearch(),
		increment: () => setCount((value) => value + 1),
	})
	return (
		<View id={'pane-' + id}>
			<Text id={'feedback-' + id}>{feedback.status}</Text>
			<Text id={'confirmation-' + id}>{blocker.status}</Text>
			<Text id={'title-' + id}>{title + ':' + count + ':' + person}</Text>
		</View>
	)
}

function Broken(): any {
	throw new Error('Expected pane staging failure')
}

function createFixtureRouter() {
	let loads = 0
	let admitted = true
	let historyRedirect = false
	const routeLoads = new Map<string, number>()
	const platform = createPaneRouterHost()
	const validateSearch = (raw: { tab?: unknown }) => {
		const tab = raw.tab ?? 'details'
		if (tab !== 'details' && tab !== 'activity') {
			throw new Error('Invalid tab')
		}
		return { tab } as const
	}
	const fileModule = {
		validateSearch,
		beforeLoad: ({ params }: RouteDefinitionArgs<'/items/:id', typeof validateSearch, {}>) => {
			if (!admitted) {
				throw new RouteForbidden()
			}
			if (historyRedirect && params.id === 'coat') {
				throw new DestinationRedirect({
					to: '/items/:id',
					params: { id: 'history-other' },
					stack: 'other',
				})
			}
			return { checked: true }
		},
		loader({
			params,
			search,
			context,
		}: RouteDefinitionArgs<'/items/:id', typeof validateSearch, { checked: boolean }>) {
			if (!context.checked || (search.tab !== 'details' && search.tab !== 'activity')) {
				throw new Error('File contract was not prepared')
			}
			routeLoads.set(params.id, (routeLoads.get(params.id) ?? 0) + 1)
			return { title: params.id + ':' + ++loads }
		},
		screen: Detail,
	}
	// Mirrors generated catalog branding; contracts are inferred from the module.
	const fileCatalog = sealGeneratedRouteCatalog<{
		'/items/:id': FileRouteContract<'/items/:id', typeof fileModule>
	}>(deriveRouteManifest({ './app/items/[id].macos.tsx': fileModule }, ['macos']))
	const catalog = mergeRouteManifests(
		fileCatalog,
		defineRoutes([defineRoute({ path: '/failed-items/:id' }).screen(Broken)]),
	)
	const router = createRouter({ catalog, host: platform.host, stacks: ['other'] })
	platform.attach(router)
	return {
		platform,
		navigation: router,
		routeLoads,
		setHistoryRedirect(value: boolean) {
			historyRedirect = value
		},
		setAdmission(value: boolean) {
			admitted = value
		},
	}
}

function App(props: { platform: ReturnType<typeof createPaneRouterHost> }): any {
	const [person, setPerson] = useState('Avery')
	const [owned, setOwned] = useState(true)
	const [ownerVersion, setOwnerVersion] = useState(0)
	const [chrome, setChrome] = useState<{
		kind: NavigationChromeKind
		destination: ValidatedDestination
	} | null>(null)
	showChrome = setChrome
	changePerson = setPerson
	removeOwner = () => setOwned(false)
	remountOwner = () => setOwnerVersion((value) => value + 1)
	return (
		<PersonProvider value={person}>
			<View key={ownerVersion} style={{ width: 640, height: 480 }}>
				{chrome ? (
					<View id="chrome-control">
						<NavigationChrome
							router={navigation}
							stack="root"
							kind={chrome.kind}
							destination={chrome.destination}
						/>
					</View>
				) : null}
				{owned ? (
					<ClientRouteOutlet host={props.platform}>
						<Text id="base">Base</Text>
					</ClientRouteOutlet>
				) : (
					<Text>Outside</Text>
				)}
				<ClientRouteOutlet host={props.platform} flow="other">
					<Text>Other base</Text>
				</ClientRouteOutlet>
			</View>
		</PersonProvider>
	)
}

const defaultEntries = new Map<
	string,
	{
		title: string
		person: string
		count: number
		routeId: unknown
		back: boolean
		increment(): void
		navigator: ClientNavigator
	}
>()

let defaultReady = false
let selectDefaultTab = (_key: string) => {}
const defaultBases = new Map<string, { count: number; increment(): void }>()
function DefaultDetail(props: { params: { id: string }; data: { title: string } }): any {
	const [count, setCount] = useState(0)
	const person = useContext(Person)
	const navigator = useClientRouter()
	const state = useClientRouterState()
	const match = state.route
	const routeId =
		match?.contract === 'declared' &&
		(match.to === '/client/:id' || match.to === '/client-modal/:id')
			? match.params.id
			: undefined
	const back = state.canGoBack
	const dirty = useSyncExternalStore(
		dirtyEntry.subscribe,
		dirtyEntry.getSnapshot,
		dirtyEntry.getSnapshot,
	)
	const blocker = useNavigationBlocker({ when: dirty === props.params.id })
	blockers.set(props.params.id, blocker)
	dirtyEntries.set(props.params.id, dirty === props.params.id)
	defaultEntries.set(props.params.id, {
		title: props.data.title,
		person,
		count,
		routeId,
		back,
		increment: () => setCount((value) => value + 1),
		navigator,
	})
	return (
		<RouteOutlet>
			<View id={'client-' + props.params.id}>
				<Text>{props.data.title + ':' + count + ':' + person}</Text>
			</View>
		</RouteOutlet>
	)
}

function DefaultBase(props: { name: string }): any {
	useClientRouter()
	const [count, setCount] = useState(0)
	defaultBases.set(props.name, { count, increment: () => setCount((value) => value + 1) })
	useLayoutEffect(() => {
		defaultReady = true
	}, [])
	return <Text id={'default-base-' + props.name}>{props.name + ':' + count}</Text>
}

function DefaultLeftBase() {
	return <DefaultBase name="left" />
}

function DefaultRightBase() {
	return <DefaultBase name="right" />
}

const defaultTabs = [
	{ key: 'left', title: 'Left', stack: 'left', render: DefaultLeftBase },
	{ key: 'right', title: 'Right', stack: 'right', render: DefaultRightBase },
]

function DefaultShell(): any {
	const configured = useSyncExternalStore(
		defaultRouterRuntime.configured.subscribe,
		defaultRouterRuntime.configured.getSnapshot,
		defaultRouterRuntime.configured.getSnapshot,
	)
	const [selected, setSelected] = useState('left')
	selectDefaultTab = setSelected
	return (
		<PersonProvider value="Default owner">
			{configured ? (
				<RouteOutlet>
					<Tabs tabs={defaultTabs} selectedKey={selected} onSelectionChange={setSelected} />
				</RouteOutlet>
			) : (
				<Text id="default-base">Default base</Text>
			)}
		</PersonProvider>
	)
}

const defaultClientRoute = defineClientRoute.withContext<{ account: string }>()
let defaultAdmitted = true
const defaultLoads = new Map<string, number>()
const defaultClientLoader = ({
	params,
	context,
}: {
	params: { id: string }
	context: { account: string }
}) => {
	defaultLoads.set(params.id, (defaultLoads.get(params.id) ?? 0) + 1)
	return { title: context.account + ':' + params.id }
}

function defaultGuard() {
	if (!defaultAdmitted) {
		throw new RouteForbidden()
	}
}

export const defaultClientCatalog = defineClientRoutes([
	defaultClientRoute({
		path: '/client/:id',
		beforeLoad: defaultGuard,
		loader: defaultClientLoader,
	}).screen(DefaultDetail),
	defaultClientRoute({
		path: '/client-modal/:id',
		presentation: 'modal',
		beforeLoad: defaultGuard,
		loader: defaultClientLoader,
	}).screen(DefaultDetail),
])

export const defaultClientContext = { account: 'default-account' }
function configureDefaultClient() {
	return import('./default-routes.gen.macos').then(async () => {
		const { routes } = await import('./default-routes.gen.catalog.macos')
		configureRouter({
			catalog: routes,
			context: defaultClientContext,
			stacks: ['left', 'right'],
			allowedSchemes: ['xplat'],
			transitions: {
				motion: defineAppKitTransition({
					from: { opacity: 0, translateY: 24 },
					duration: 160,
					reducedMotion: 'allow',
				}),
			},
		})
		return defaultClientCatalog
	})
}

export async function runRoutingFixture() {
	const app = NSApplication.sharedApplication
	app.setActivationPolicy(0)
	const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
		{ origin: { x: 0, y: 0 }, size: { width: 640, height: 480 } },
		15,
		2,
		false,
	)
	window.releasedWhenClosed = false
	const nativeHost = NSView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 640, height: 480 },
	})
	window.contentView = nativeHost
	app.finishLaunching()
	window.makeKeyAndOrderFront(null)
	const root = createMacOSRoot(nativeHost)
	let publicPaneRoot: ReturnType<typeof createMacOSRoot> | undefined
	const bridge = (globalThis as any).__xplatAppKit
	const present = bridge.presentSurface
	const surfaces: any[] = []
	bridge.presentSurface = (options: any) => {
		const responder = window.firstResponder
		const surface = present(options)
		surfaces.push({
			surface,
			options,
			stagedHidden: surface.layer.hidden,
			keptFocus: window.firstResponder === responder || window.firstResponder?.isEqual?.(responder),
		})
		return surface
	}
	const fixture = createFixtureRouter()
	const paneViews = fixture.platform.getRenderHost('root')!.views
	navigation = fixture.navigation
	let checks = 0
	const check = (value: unknown, message: string) => {
		if (!value) {
			throw new Error(message)
		}
		checks++
	}
	const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 10))
	const until = async (condition: () => boolean, message: string) => {
		const deadline = Date.now() + 3000
		while (!condition() && Date.now() < deadline) {
			await pause()
		}
		check(condition(), message)
	}
	const debug = (root as typeof root & { __macosDebug: { findId(id: string): any } }).__macosDebug
	const view = (id: string): any => debug.findId(id)

	const containsText = (candidate: any, text: string): boolean => {
		if (String(candidate.stringValue ?? '') === text) {
			return true
		}
		for (let index = 0; index < Number(candidate.subviews?.count ?? 0); index++) {
			if (containsText(candidate.subviews.objectAtIndex(index), text)) {
				return true
			}
		}
		return false
	}

	const hidden = (candidate: any): boolean => {
		for (let current = candidate; current; current = current.superview) {
			if (current.hidden) {
				return true
			}
		}
		return false
	}
	try {
		root.render(App as unknown as UniversalComponent, { platform: fixture.platform })
		await until(() => paneViews.getSnapshot().has('root'), 'outlet mount')
		check(
			(await navigation.push({ to: '/items/:id', params: { id: 'coat' } })).status === 'committed',
			'push',
		)

		const coat = view('pane-coat')
		check(
			!!coat && String(view('title-coat').stringValue) === 'coat:1:0:Avery',
			'rendered before result',
		)

		entries.get('coat')!.increment()
		await until(() => entries.get('coat')?.count === 1, 'local state')
		check(
			(await navigation.push({ to: '/items/:id', params: { id: 'hat' } })).status === 'committed',
			'second push',
		)

		check(view('pane-coat') === coat, 'retained native view')
		check(hidden(coat) && !hidden(view('pane-hat')), 'only current entry is visible to AppKit')
		changePerson('Jordan')
		await until(
			() => entries.get('coat')?.person === 'Jordan' && entries.get('hat')?.person === 'Jordan',
			'retained provider update',
		)

		fixture.setAdmission(false)
		check((await navigation.back()).status === 'forbidden', 'guarded pane Back refuses access')
		check(hidden(coat) && !hidden(view('pane-hat')), 'denied pane remains hidden')
		fixture.setAdmission(true)
		check((await navigation.retry()).status === 'committed', 'Back retry')
		check(
			view('pane-coat') === coat && !hidden(coat) && entries.get('coat')?.count === 1,
			'Back identity/state/visibility',
		)

		check(entries.get('coat')?.title === 'coat:3', 'Back loads fresh pane data')

		check((await navigation.refresh()).status === 'committed', 'refresh')
		check(
			view('pane-coat') === coat &&
				entries.get('coat')?.title === 'coat:4' &&
				entries.get('coat')?.count === 1,
			'refresh identity/data/state',
		)

		check(
			(await navigation.forStack('other').push({ to: '/items/:id', params: { id: 'other' } }))
				.status === 'committed',
			'other pane push',
		)

		check(navigation.getSnapshot().route?.params.id === 'coat', 'independent histories')
		check(
			(await navigation.push({ to: '/items/:id', params: { id: 'history-source' } })).status ===
				'committed',
			'history handoff source',
		)

		const handoffView = view('pane-history-source')
		const handoffDepth = paneViews.getSnapshot().get('root')!.entries.length
		fixture.setHistoryRedirect(true)
		const redirectedBack = await navigation.back()
		check(
			redirectedBack.status === 'committed' && redirectedBack.redirected,
			'Back redirects into another pane',
		)

		check(
			navigation.getSnapshot().route?.params.id === 'history-source' &&
				paneViews.getSnapshot().get('root')!.entries.length === handoffDepth &&
				view('pane-history-source') === handoffView &&
				!hidden(handoffView),
			'cross-pane history redirect retains the visible source and its history',
		)

		check(
			navigation.forStack('other').getSnapshot().route?.params.id === 'history-other' &&
				!!view('pane-history-other') &&
				!view('pane-other') &&
				fixture.routeLoads.get('history-other') === 1,
			'cross-pane history redirect replaces the receiver with one prepared result',
		)

		fixture.setHistoryRedirect(false)
		check(
			(await navigation.back()).status === 'committed' &&
				view('pane-coat') === coat &&
				entries.get('coat')?.count === 1,
			'Back chain survives a cross-pane redirect',
		)

		await navigation.forStack('other').replace({ to: '/items/:id', params: { id: 'other' } })

		check(
			(await navigation.replace({ to: '/items/:id', params: { id: 'cap' } })).status ===
				'committed',
			'replace',
		)

		check(
			paneViews.getSnapshot().get('root')?.entries.length === 2 && !view('pane-coat'),
			'replace disposes current only',
		)

		check(
			(await navigation.reset({ to: '/items/:id', params: { id: 'glove' } })).status ===
				'committed',
			'reset',
		)

		check(
			!navigation.getSnapshot().canGoBack &&
				paneViews.getSnapshot().get('root')?.entries.length === 1,
			'new base after reset',
		)

		const originalSearchUpdate = entries.get('glove')!.updateSearch
		check(
			(await originalSearchUpdate({ tab: 'activity' })).status === 'committed',
			'search update commits',
		)

		check(
			entries.get('glove')?.tab === 'activity' &&
				paneViews.getSnapshot().get('root')?.entries.length === 1,
			'search replacement validates output and keeps history depth',
		)

		const activityUpdate = entries.get('glove')!.updateSearch
		check(
			(await activityUpdate({}, { replace: false })).status === 'committed',
			'search push commits',
		)

		check(
			entries.get('glove')?.tab === 'details' &&
				paneViews.getSnapshot().get('root')?.entries.length === 2,
			'search omission removes input and applies defaults',
		)

		await navigation.back()
		check(entries.get('glove')?.tab === 'activity', 'search Back restores prior entry')

		check(
			(await originalSearchUpdate({})).status === 'cancelled',
			'stale search entry cannot write',
		)

		await activityUpdate({})
		const glove = view('pane-glove')
		{
			for (const action of ['push', 'replace', 'reset'] as const) {
				const failed = await navigation[action]({
					to: '/failed-items/:id',
					params: { id: 'broken' },
				})

				check(failed.status === 'failed' && failed.phase === 'commit', action + ' render failure')
				await until(
					() => String(view('feedback-glove').stringValue) === 'failed',
					action + ' native failure feedback',
				)

				check(
					navigation.getSnapshot().navigation.status === 'failed',
					action + ' reactive failure state',
				)
			}

			check(
				view('pane-glove') === glove && !hidden(glove),
				'failed staging retains native view and visibility',
			)

			check(
				navigation.getSnapshot().route?.params.id === 'glove' &&
					!paneViews.getSnapshot().get('root')?.staged,
				'failed staging restores current match and removes candidate',
			)
		}

		const press = (candidate: any): boolean => {
			if (
				typeof candidate.accessibilityPerformPress === 'function' &&
				candidate.accessibilityPerformPress()
			) {
				return true
			}
			for (let index = 0; index < Number(candidate.subviews?.count ?? 0); index++) {
				if (press(candidate.subviews.objectAtIndex(index))) {
					return true
				}
			}
			return false
		}

		for (const kind of [
			'link',
			'strip',
			'side',
			'top',
			'mega',
			'breadcrumb',
			'heading',
			'tab',
			'menu-surface',
		] as const) {
			const checked = await navigation.validateDestination({
				to: '/items/:id',
				params: { id: 'chrome-' + kind },
				transition: 'none',
			})

			if (checked.status !== 'valid') {
				throw new Error('Cannot validate chrome fixture')
			}

			showChrome({ kind, destination: checked.destination })
			await until(() => !!view('chrome-control'), kind + ' control mounts')
			check(press(view('chrome-control')), kind + ' AppKit accessibility action accepts')
			await until(
				() => navigation.getSnapshot().route?.params.id === 'chrome-' + kind,
				kind + ' control commits',
			)

			check(!!view('pane-chrome-' + kind), kind + ' renders prepared screen')
			showChrome(null)
			await until(() => !view('chrome-control'), kind + ' control disposes')
			await navigation.back()
		}

		const beforeRemount = view('pane-glove')
		const otherBeforeRemount = view('pane-other')
		entries.get('glove')!.increment()
		await until(() => entries.get('glove')?.count === 1, 'local state before keyed remount')
		remountOwner()
		await until(
			() =>
				navigation.getSnapshot().route === null &&
				navigation.forStack('other').getSnapshot().route === null,
			'keyed common owner releases every pane',
		)

		check(!view('pane-glove') && !view('pane-other'), 'keyed owner removes retained native views')
		check(
			(await navigation.replace({ to: '/items/:id', params: { id: 'glove' } })).status ===
				'committed',
			'new keyed owner accepts navigation',
		)

		check(
			view('pane-glove') !== beforeRemount &&
				entries.get('glove')?.count === 0 &&
				!navigation.getSnapshot().canGoBack &&
				otherBeforeRemount.superview === null,
			'keyed remount creates fresh local state and owned history',
		)

		const confirm = (id: string) => {
			const state = blockers.get(id)
			if (!state || state.status !== 'blocked') {
				throw new Error('Expected confirmation for ' + id)
			}
			return state
		}

		await navigation.push({ to: '/items/:id', params: { id: 'confirm-target' } })
		const confirmationTarget = view('pane-confirm-target')
		entries.get('confirm-target')!.increment()
		await until(() => entries.get('confirm-target')?.count === 1, 'confirmation target state')
		await navigation.push({ to: '/items/:id', params: { id: 'confirm-source' } })
		const confirmationSource = view('pane-confirm-source')
		dirtyEntry.set('confirm-target')
		await until(
			() => dirtyEntries.get('confirm-target') === true,
			'hidden entry dirty subscription',
		)

		check(
			(await navigation.push({ to: '/items/:id', params: { id: 'confirm-transient' } })).status ===
				'committed',
			'hidden retained AppKit entry does not block current navigation',
		)

		await navigation.back()
		dirtyEntry.set('confirm-source')
		entries.get('confirm-source')!.increment()
		await until(
			() =>
				dirtyEntries.get('confirm-source') === true && entries.get('confirm-source')?.count === 1,
			'visible entry dirty subscription',
		)

		const held = navigation.push({ to: '/items/:id', params: { id: 'confirm-other' } })
		await until(
			() =>
				blockers.get('confirm-source')?.status === 'blocked' &&
				String(view('confirmation-confirm-source')?.stringValue) === 'blocked',
			'AppKit confirmation renders',
		)

		check(
			!view('pane-confirm-other') &&
				view('pane-confirm-source') === confirmationSource &&
				!hidden(confirmationSource),
			'confirmation holds before candidate rendering',
		)

		confirm('confirm-source').reset()
		check(
			(await held).status === 'cancelled' &&
				entries.get('confirm-source')?.count === 1 &&
				navigation.getSnapshot().navigation.status === 'idle',
			'AppKit refusal retains source state without failure feedback',
		)

		const oldRequest = navigation.push({ to: '/items/:id', params: { id: 'confirm-obsolete' } })
		await until(() => {
			const state = blockers.get('confirm-source')
			return state?.status === 'blocked' && state.destination?.params?.id === 'confirm-obsolete'
		}, 'old AppKit confirmation')

		const oldControls = confirm('confirm-source')
		const newer = navigation.push({ to: '/items/:id', params: { id: 'confirm-other' } })
		await until(() => {
			const state = blockers.get('confirm-source')
			return state?.status === 'blocked' && state.destination?.params?.id === 'confirm-other'
		}, 'new AppKit confirmation')

		oldControls.proceed()
		check(
			(await oldRequest).status === 'cancelled' && !view('pane-confirm-other'),
			'obsolete AppKit controls cannot approve a new request',
		)

		confirm('confirm-source').reset()
		await newer
		const beforeTargetLoads = fixture.routeLoads.get('confirm-target')!
		const back = navigation.back()
		await until(
			() => blockers.get('confirm-source')?.status === 'blocked',
			'AppKit Back confirmation',
		)

		check(
			fixture.routeLoads.get('confirm-target') === beforeTargetLoads && hidden(confirmationTarget),
			'Back confirmation holds before retained target preparation',
		)

		confirm('confirm-source').proceed()
		check(
			(await back).status === 'committed' &&
				view('pane-confirm-target') === confirmationTarget &&
				!hidden(confirmationTarget) &&
				entries.get('confirm-target')?.count === 1 &&
				fixture.routeLoads.get('confirm-target') === beforeTargetLoads + 1,
			'AppKit approval refreshes the retained target once without losing state',
		)

		dirtyEntry.set(null)
		await navigation.back()
		dirtyEntry.set('glove')
		await until(() => dirtyEntries.get('glove') === true, 'owner dirty subscription')
		const ownerHeld = navigation.push({ to: '/items/:id', params: { id: 'confirm-owner' } })
		await until(() => blockers.get('glove')?.status === 'blocked', 'owner teardown confirmation')
		const disposedControls = confirm('glove')
		removeOwner()
		check(
			(await ownerHeld).status === 'cancelled',
			'forced owner teardown releases a held confirmation',
		)

		disposedControls.proceed()
		dirtyEntry.set(null)
		await until(() => !paneViews.getSnapshot().has('root'), 'owner cleanup')
		check(!view('pane-glove'), 'owned content removed')
		root.render(DefaultShell as unknown as UniversalComponent, {})
		await until(() => !!view('default-base'), 'default shell replaces previous owners')
		await configureDefaultClient()
		await until(() => defaultReady, 'default outlet mounts')

		const baked = await defaultRouter.validateDestination({ to: '/baked', transition: 'none' })
		check(baked.status === 'valid', 'platform-only baked route validates for the AppKit instance')
		if (baked.status !== 'valid') {
			throw new Error('Expected a validated AppKit baked route')
		}

		check(
			(await defaultRouter.push(baked.destination)).status === 'committed',
			'generated baked route commits',
		)

		check(
			String(view('baked-route-title')?.stringValue) === 'Baked routing:2',
			'generated baked data renders',
		)

		check((await defaultRouter.back()).status === 'committed', 'baked Back returns declaring pane')
		check(
			(await defaultRouter.push({ to: '/baked-help', transition: 'none' })).status === 'committed',
			'generated Markdown route commits',
		)

		check(
			containsText(nativeHost, 'Baked route help'),
			'generated Markdown content renders before commit',
		)

		check(
			(await defaultRouter.back()).status === 'committed',
			'Markdown Back returns declaring pane',
		)

		const leftBase = view('default-base-left')
		defaultBases.get('left')!.increment()
		await until(() => defaultBases.get('left')?.count === 1, 'tab base local state')
		check(
			(await defaultRouter.push({ to: '/client/:id', params: { id: 'tab-coat' }, stack: 'left' }))
				.status === 'committed',
			'default named tab commit',
		)

		const tabCoat = view('client-tab-coat')
		check(
			!!tabCoat && !hidden(tabCoat) && defaultEntries.get('tab-coat')?.person === 'Default owner',
			'default tab visible with source provider',
		)

		defaultEntries.get('tab-coat')!.increment()
		await until(() => defaultEntries.get('tab-coat')?.count === 1, 'tab route local state')
		selectDefaultTab('right')
		await until(
			() => hidden(tabCoat) && !hidden(view('default-base-right')),
			'tab selection controls native visibility',
		)

		check(
			view('client-tab-coat') === tabCoat && defaultEntries.get('tab-coat')?.count === 1,
			'inactive tab retains native identity and state',
		)

		selectDefaultTab('left')
		await until(() => !hidden(tabCoat), 'tab selection restores native visibility')
		check(
			(await defaultEntries.get('tab-coat')!.navigator.back()).status === 'committed',
			'tab owner-bound Back',
		)

		check(
			view('default-base-left') === leftBase &&
				!hidden(leftBase) &&
				defaultBases.get('left')?.count === 1,
			'tab Back retains base identity and state',
		)

		check(
			(await defaultRouter.navigateUrl('/client/coat')).status === 'committed',
			'default incoming URL commit',
		)

		const clientCoat = view('client-coat')
		check(
			defaultEntries.get('coat')?.title === 'default-account:coat' &&
				defaultEntries.get('coat')?.person === 'Default owner',
			'default provider and loader data',
		)

		defaultEntries.get('coat')!.increment()
		await until(() => defaultEntries.get('coat')?.count === 1, 'default local state')
		check(
			(await defaultRouter.navigateUrl('/client/hat')).status === 'committed',
			'default second commit',
		)

		check(
			(await defaultEntries.get('hat')!.navigator.back()).status === 'committed',
			'default owner-bound Back',
		)

		check(
			view('client-coat') === clientCoat &&
				!hidden(clientCoat) &&
				defaultEntries.get('coat')?.count === 1,
			'default retained native view and state',
		)

		const modalResult = await defaultRouter.navigateUrl('/client-modal/modal-base')
		check(modalResult.status === 'committed', 'AppKit routed modal commits')
		const modal = surfaces.at(-1)!
		const modalBase = defaultEntries.get('modal-base')!
		check(
			modal.stagedHidden && modal.keptFocus,
			'staging keeps the live window focus and hides the pending surface',
		)

		check(
			modal.surface.layer.window === window || modal.surface.layer.window?.isEqual?.(window),
			'modal stays in the declaring window',
		)

		check(!modal.surface.layer.hidden && !modal.surface.closed, 'prepared modal is visible')
		check(
			modalBase.person === 'Default owner' && modalBase.title === 'default-account:modal-base',
			'modal retains declaring provider and prepared data',
		)

		check(
			modalResult.status === 'committed' && (await modalResult.finished).status === 'skipped',
			'AppKit modal without a transition reports motion disabled',
		)

		check(
			(await modalBase.navigator.back()).status === 'at-base',
			'modal base Back stays distinct from dismiss',
		)

		modalBase.increment()
		await until(() => defaultEntries.get('modal-base')?.count === 1, 'modal local state')
		check(
			(await modalBase.navigator.push({ to: '/client/:id', params: { id: 'modal-step' } }))
				.status === 'committed',
			'modal owns its second step',
		)

		check(
			(await defaultEntries.get('modal-step')!.navigator.back()).status === 'committed',
			'modal Back restores its first step',
		)

		check(
			defaultEntries.get('modal-base')?.count === 1 && !modal.surface.closed,
			'modal Back retains state without dismissing',
		)

		defaultAdmitted = false
		const presenterLoads = defaultLoads.get('coat')
		check(modal.options.canDismiss('escape') === false, 'Escape delegates to canonical dismiss')
		await until(
			() => modalBase.navigator.getSnapshot().navigation.status !== 'pending',
			'denied Escape settles',
		)

		check(
			!modal.surface.closed && defaultLoads.get('coat') === presenterLoads,
			'denied Escape retains surface without loading presenter',
		)

		defaultAdmitted = true
		dirtyEntry.set('modal-base')
		await until(() => dirtyEntries.get('modal-base') === true, 'modal edits become dirty')
		const heldDismiss = modalBase.navigator.dismiss()
		await until(
			() => blockers.get('modal-base')?.status === 'blocked',
			'modal dismissal asks its own entry',
		)

		const refusal = blockers.get('modal-base')!
		if (refusal.status === 'blocked') {
			refusal.reset()
		}

		check(
			(await heldDismiss).status === 'cancelled' && !modal.surface.closed,
			'modal confirmation refusal preserves the surface',
		)

		dirtyEntry.set(null)
		await until(() => dirtyEntries.get('modal-base') === false, 'modal edits clear')
		check(
			(await modalBase.navigator.push({ to: '/client-modal/:id', params: { id: 'nested-modal' } }))
				.status === 'committed',
			'nested AppKit modal commits',
		)

		const nested = surfaces.at(-1)!
		check(!nested.surface.closed && !modal.surface.closed, 'nested modal retains presenter')
		check(
			(await defaultEntries.get('nested-modal')!.navigator.dismiss()).status === 'committed',
			'nested dismissal restores parent modal',
		)

		check(
			nested.surface.closed && !modal.surface.closed,
			'nested dismissal closes only its own surface',
		)

		check(
			(await modalBase.navigator.dismiss()).status === 'committed',
			'AppKit modal dismisses canonically',
		)

		check(
			modal.surface.closed &&
				view('client-coat') === clientCoat &&
				!hidden(clientCoat) &&
				defaultEntries.get('coat')?.count === 1,
			'dismiss retains presenter native view and state',
		)

		const motionDestination = await defaultRouter.validateDestination({
			to: '/client-modal/:id',
			params: { id: 'modal-motion' },
			transition: 'motion' as 'none',
		})

		check(motionDestination.status === 'valid', 'configured modal transition validates')
		if (motionDestination.status !== 'valid') {
			throw new Error('Expected a validated modal transition')
		}

		const motionModal = await defaultRouter.push(motionDestination.destination)
		check(motionModal.status === 'committed', 'AppKit modal with custom motion commits')
		if (motionModal.status !== 'committed') {
			throw new Error('Expected a committed motion modal')
		}

		const motionSurface = surfaces.at(-1)!
		check(
			Number(motionSurface.surface.panel.alphaValue) < 1,
			'AppKit modal content starts at its custom values',
		)

		check(
			(await motionModal.finished).status === 'completed',
			'AppKit modal content motion completes',
		)

		check(
			Number(motionSurface.surface.panel.alphaValue) === 1,
			'AppKit modal motion restores neutral content values',
		)

		check(
			(await defaultEntries.get('modal-motion')!.navigator.dismiss()).status === 'committed',
			'completed modal dismisses canonically',
		)

		const interruptedDestination = await defaultRouter.validateDestination({
			to: '/client-modal/:id',
			params: { id: 'modal-interrupted' },
			transition: 'motion' as 'none',
		})

		check(interruptedDestination.status === 'valid', 'second configured modal transition validates')
		if (interruptedDestination.status !== 'valid') {
			throw new Error('Expected a validated modal transition')
		}

		const interrupted = await defaultRouter.push(interruptedDestination.destination)
		check(interrupted.status === 'committed', 'AppKit modal interrupt fixture commits')
		if (interrupted.status !== 'committed') {
			throw new Error('Expected a committed interrupted modal')
		}

		const interruptedSurface = surfaces.at(-1)!
		const interruptDismiss = defaultEntries.get('modal-interrupted')!.navigator.dismiss()
		check(
			(await interrupted.finished).status === 'skipped',
			'AppKit modal dismissal interrupts content motion',
		)

		check(
			Number(interruptedSurface.surface.panel.alphaValue) === 1,
			'AppKit modal interrupt restores neutral content values',
		)

		check((await interruptDismiss).status === 'committed', 'interrupted modal dismisses')

		check(
			(await defaultRouter.push({ to: '/client/:id', params: { id: 'typed' } })).status ===
				'committed',
			'typed default push commits',
		)

		await until(
			() => defaultEntries.get('typed')?.routeId === 'typed',
			'default hook observes its own entry',
		)

		check(
			defaultEntries.get('typed')?.title === 'default-account:typed' &&
				defaultEntries.get('typed')?.back === true,
			'default hook retains prepared data and Back state',
		)

		await defaultRouter.back()
		await until(
			() => view('client-coat') === clientCoat && !hidden(clientCoat),
			'default Back restores retained pane',
		)

		check(defaultEntries.get('coat')?.count === 1, 'default Back retains local state')
		check(
			(await defaultRouter.navigateUrl('xplat://client/deep')).status === 'committed',
			'incoming URL commits configured pane',
		)

		check(
			(await defaultRouter.navigateUrl('/client-modal/forced-close')).status === 'committed',
			'modal before raw host closure',
		)

		const forced = surfaces.at(-1)!
		const forcedNavigation = defaultEntries.get('forced-close')!.navigator
		forced.surface.close('owner')
		await until(
			() => forcedNavigation.getSnapshot().route === null,
			'raw closure retires the modal flow',
		)

		check(
			defaultRouter.getSnapshot().route?.to === '/client/:id' &&
				defaultEntries.get('deep')?.routeId === 'deep',
			'raw closure retains the root route',
		)

		check(
			(await defaultRouter.navigateUrl('/client-modal/owned-close')).status === 'committed',
			'modal before owner removal',
		)

		const owned = surfaces.at(-1)!
		const ownedNavigation = defaultEntries.get('owned-close')!.navigator
		check(
			(await ownedNavigation.push({ to: '/client-modal/:id', params: { id: 'owned-child' } }))
				.status === 'committed',
			'nested modal before owner removal',
		)

		const ownedChild = surfaces.at(-1)!
		root.unmount()
		await until(
			() => owned.surface.closed && ownedChild.surface.closed,
			'owner removal closes the modal family',
		)

		check(
			(await ownedNavigation.back()).status === 'cancelled',
			'owner removal disposes modal navigation',
		)

		defaultRouter.dispose()

		await qualifyPaneRouterExample({
			mount(Component, props) {
				const paneHost = NSView.alloc().initWithFrame({
					origin: { x: 0, y: 0 },
					size: { width: 640, height: 480 },
				})
				window.contentView = paneHost
				publicPaneRoot = createMacOSRoot(paneHost)
				publicPaneRoot.render(Component as unknown as UniversalComponent, props)
				return () => {
					publicPaneRoot?.unmount()
					publicPaneRoot = undefined
				}
			},
			find(id) {
				return (
					publicPaneRoot as typeof root & { __macosDebug: { findId(id: string): unknown } }
				)?.__macosDebug.findId(id)
			},
			check: (name, pass) => check(pass, name),
			wait: (name, predicate) => until(predicate, name),
		})

		await qualifyAppKitRouteTransitions(window, check, until)

		const authentication = createAppKitRouterHost()
		await qualifyNativeAuthentication({
			host: authentication,
			mount(Component, props) {
				const authHost = NSView.alloc().initWithFrame({
					origin: { x: 0, y: 0 },
					size: { width: 640, height: 480 },
				})
				window.contentView = authHost
				publicPaneRoot = createMacOSRoot(authHost)
				publicPaneRoot.render(Component as unknown as UniversalComponent, props)
				return () => {
					publicPaneRoot?.unmount()
					publicPaneRoot = undefined
				}
			},
			modals: () => authentication.modals.getSnapshot().length,
			check: (name, pass) => check(pass, name),
			wait: (name, predicate) => until(predicate, name),
			settled: () =>
				until(
					() => authentication.modals.getSnapshot().length === 0,
					'authentication modal cleanup',
				),
		})

		const retention = createAppKitRouterHost()
		await qualifyRouteRetention({
			host: retention,
			mount(Component, props) {
				const retentionHost = NSView.alloc().initWithFrame({
					origin: { x: 0, y: 0 },
					size: { width: 640, height: 480 },
				})
				window.contentView = retentionHost
				publicPaneRoot = createMacOSRoot(retentionHost)
				publicPaneRoot.render(Component as unknown as UniversalComponent, props)
				return () => {
					publicPaneRoot?.unmount()
					publicPaneRoot = undefined
				}
			},
			offset: (scroll) => scrollableAreaMetrics(scroll.native).y,
			range: (scroll) => scrollableAreaMetrics(scroll.native).maxY,
			focused: (input) => (input.native as any).currentEditor() != null,
			check: (name, pass) => check(pass, name),
			wait: (name, predicate) => until(predicate, name),
			settled: () =>
				until(() => retention.modals.getSnapshot().length === 0, 'retention modal cleanup'),
		})

		console.log('ROUTING_FIXTURE_OK checks=' + checks)
	} catch (error) {
		console.error('ROUTING_FIXTURE_FAIL ' + String(error))
	} finally {
		bridge.presentSurface = present
		publicPaneRoot?.unmount()
		root.unmount()
		defaultRouter.dispose()
		navigation.dispose()
		window.close()
		__xplatStopHost()
	}
}
