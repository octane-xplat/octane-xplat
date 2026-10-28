/** @jsxImportSource @octane-xplat/jsx */
import { createContext, useContext, useLayoutEffect, useState, useSyncExternalStore } from 'octane'
import { createStore } from '../../../packages/ui/src/store'
import type { Frame } from '@nativescript/core'
import { getStack } from '@octane-xplat/ui/routing'
import { sealGeneratedRouteCatalog } from '../../../packages/ui/src/route-contract-scope'
import { defineTransitions } from '../../../packages/ui/src/route-transitions'
import { defineNativeTransition } from '../../../packages/ui/src/native-route-transition'
import { createFixtureTransition } from './navigation-transition'
import { nativeMotion } from './navigation-motion'
import { createNativeModalRouterHost } from '../../../packages/ui/src/native-modal-router-host'
import type {
	ContractsOf,
	NavigationBlockerState,
	FileRouteContract,
	RouteDefinitionArgs,
	RouterNavigator,
	RouteSearchUpdater,
	NavigationResult,
	ValidatedDestination,
} from '../../../packages/ui/src/props'

import { ClientRouteOutlet } from '../../../packages/ui/src/ClientRouteOutlet.tsrx'
import { createRenderRouterHost } from '../../../packages/ui/src/render-router-host'
import { RenderRouteOutlet } from '../../../packages/ui/src/RenderRouteOutlet.tsrx'
import { createRouter } from '../../../packages/ui/src/router-instance'
import { RouteForbidden, DestinationRedirect } from '../../../packages/ui/src/routing-core'
import { defineRoute } from '../../../packages/ui/src/define-route'
import {
	defineRoutes,
	deriveRouteManifest,
	mergeRouteManifests,
} from '../../../packages/ui/src/route-table'

import {
	getRouteApi,
	useRouter,
	useRouterState,
	useNavigationBlocker,
} from '../../../packages/ui/src/router-hooks.tsrx'

import { RouteOutlet } from '../../../packages/ui/src/RouteOutlet.tsrx'
import { Tabs } from '../../../packages/ui/src/Tabs.tsrx'
import { defaultRouterRuntime } from '../../../packages/ui/src/default-router'
import {
	defineRoute as defineClientRoute,
	defineRoutes as defineClientRoutes,
	router as defaultRouter,
	useRouter as useClientRouter,
	useRouterState as useClientRouterState,
} from '@octane-xplat/ui/routing'

import type { RouterNavigator as ClientNavigator } from '@octane-xplat/ui/routing'
import {
	NavigationShell,
	navigationRoutes,
	bindNavigationInstance,
} from './navigation-fixture.mobile.tsrx'

import {
	NavigationChrome,
	navigationChromeKinds,
} from '../../../packages/ui/tests/navigation-item-cases.tsrx'

const Name = createContext('missing')
const NameProvider: any = Name

let paneNavigation: ReturnType<typeof createRefinedNavigation>['panes']
let navigation: ReturnType<typeof createRefinedNavigation>['navigation']
const dirtyEntry = createStore<string | null>(null)
export const refinedObservations = {
	setDirtyEntry: (id: string | null) => dirtyEntry.set(id),
	blockers: new Map<string, NavigationBlockerState>(),
	dirtyEntries: new Map<string, boolean>(),
	increment: () => {},
	changeProvider: (_name: string) => {},
	closeOwner: () => {},
	remountOwner: () => {},
	remountResult: null as NavigationResult<ContractsOf<typeof refinedCatalog>> | null,
	showPanes: (_value: boolean) => {},
	paneEntries: new Map<
		string,
		{ title: string; count: number; provider: string; increment(): void }
	>(),
	navigators: new Map<string, RouterNavigator<ContractsOf<typeof refinedCatalog>>>(),
	increments: new Map<string, () => void>(),
	loads: new Map<string, number>(),
	mounts: new Map<string, number>(),
	ownerPresent: true,
	ownerEvents: [] as unknown[],
	entries: new Map<
		string,
		{ id: string; title: string; count: number; checked: boolean; provider: string }
	>(),
	searchUpdates: new Map<
		string,
		RouteSearchUpdater<ContractsOf<typeof refinedCatalog>, '/search/:id'>
	>(),
}

function ChromeItem(props: { params: { id: string } }): any {
	const owner = useRouter(navigation)
	const kind = navigationChromeKinds.find((kind) => kind === props.params.id)
	const [destination, setDestination] = useState<ValidatedDestination | null>(null)
	useLayoutEffect(() => {
		let active = true
		void owner
			.validateDestination({
				to: '/refined/:id',
				params: { id: 'chrome-' + props.params.id },
				transition: 'none',
			})
			.then((result) => {
				if (active && result.status === 'valid') {
					setDestination(result.destination)
				}
			})

		return () => {
			active = false
		}
	}, [owner, props.params.id])

	if (!kind) {
		throw new Error('Unknown navigation chrome case')
	}

	return destination ? (
		<NavigationChrome router={navigation} destination={destination} kind={kind} inherit />
	) : (
		<label text="Checking destination" />
	)
}

const chromeCatalog = defineRoutes([defineRoute({ path: '/chrome/:id' }).screen(ChromeItem)])

function SearchItem(): any {
	const api = getRouteApi('/search/:id', navigation)
	const id = api.useParams().id
	const search = api.useSearch()
	refinedObservations.searchUpdates.set(id, api.useUpdateSearch())
	return (
		<masonview>
			<label text={'search:' + id + ':' + search.tab} />
			<label text={api.useLoaderData()} />
		</masonview>
	)
}

const searchCatalog = defineRoutes([
	defineRoute({
		path: '/search/:id',
		validateSearch: (raw: { tab?: unknown }) => {
			const tab = raw.tab ?? 'details'
			if (tab !== 'details' && tab !== 'activity') {
				throw new Error('Invalid search')
			}

			return { tab }
		},
		loader: ({ search }) => 'search-data:' + search.tab,
	}).screen(SearchItem),
])

function RefinedItem(props: { params: { id: string }; data: { title: string } }): any {
	const dirty = useSyncExternalStore(
		dirtyEntry.subscribe,
		dirtyEntry.getSnapshot,
		dirtyEntry.getSnapshot,
	)

	const blocker = useNavigationBlocker({ when: dirty === props.params.id })
	refinedObservations.blockers.set(props.params.id, blocker)
	refinedObservations.dirtyEntries.set(props.params.id, dirty === props.params.id)
	const [count, setCount] = useState(0)
	useLayoutEffect(() => {
		refinedObservations.mounts.set(
			props.params.id,
			(refinedObservations.mounts.get(props.params.id) ?? 0) + 1,
		)
	}, [])

	const item = getRouteApi('/refined/:id', navigation)
	const params = item.useParams()
	const data = item.useLoaderData()
	const context = item.useContext()
	const provider = useContext(Name)
	useRouterState(navigation)
	refinedObservations.navigators.set(props.params.id, useRouter(navigation))
	refinedObservations.increments.set(props.params.id, () => setCount((value) => value + 1))
	refinedObservations.entries.set(props.params.id, {
		id: params.id,
		title: data.title,
		count,
		checked: context.checked,
		provider,
	})

	refinedObservations.increment = () => setCount(count + 1)
	return (
		<masonview>
			<label text={'refined:' + params.id} />
			<label text={'confirmation:' + blocker.status} />
			<label text={data.title} />
			<label text={'count:' + count} />
		</masonview>
	)
}

function PaneItem(): any {
	const item = getRouteApi('/pane/:id', paneNavigation)
	const id = item.useParams().id
	const title = item.useLoaderData().title
	const provider = useContext(Name)
	const [count, setCount] = useState(0)
	refinedObservations.paneEntries.set(id, {
		title,
		count,
		provider,
		increment: () => setCount((value) => value + 1),
	})

	return (
		<masonview>
			<label text={'pane:' + id} />
			<label text={title} />
			<label text={'pane-count:' + count} />
		</masonview>
	)
}

function RefinedRenderFailure(): any {
	throw new Error('Expected routing fixture render failure')
}

const failedRenderCatalog = defineRoutes([
	defineRoute
		.withContext<{ account: { id: string } }>()({
			path: '/render-failure/:id',
			beforeLoad: () => ({ checked: true }),
			loader: ({ params, context }) => ({ title: context.account.id + ':' + params.id }),
		})
		.screen(RefinedRenderFailure),
])

const validateFileSearch = (raw: { tab?: unknown }) => {
	const tab = raw.tab ?? 'details'
	if (tab !== 'details') {
		throw new Error('Invalid tab')
	}

	return { tab } as const
}

type Account = {
	account: { id: string }
	historyAdmitted: boolean
	historyRedirect: 'none' | 'record' | 'failure' | 'other' | 'modal'
}

const refinedFile = {
	validateSearch: validateFileSearch,
	beforeLoad({
		search,
		context,
		params,
	}: RouteDefinitionArgs<'/refined/:id', typeof validateFileSearch, Account>) {
		if (!context.historyAdmitted) {
			throw new RouteForbidden()
		}

		if (params.id === 'coat' && context.historyRedirect !== 'none') {
			throw new DestinationRedirect({
				to: context.historyRedirect === 'failure' ? '/render-failure/:id' : '/refined/:id',
				params: {
					id:
						context.historyRedirect === 'other'
							? 'history-other'
							: context.historyRedirect === 'modal'
								? 'history-modal'
								: 'history-cap',
				},
				...(context.historyRedirect === 'other' ? { stack: 'detail-pane' } : {}),
				...(context.historyRedirect === 'modal' ? { presentation: 'modal' as const } : {}),
			})
		}

		if (search.tab !== 'details') {
			throw new Error('File search was not validated')
		}

		return { checked: true }
	},
	loader({
		params,
		context,
	}: RouteDefinitionArgs<
		'/refined/:id',
		typeof validateFileSearch,
		Account & { checked: boolean }
	>) {
		if (!context.checked) {
			throw new Error('File loader did not receive guard context')
		}

		refinedObservations.loads.set(params.id, (refinedObservations.loads.get(params.id) ?? 0) + 1)
		return { title: context.account.id + ':' + params.id }
	},
	screen: RefinedItem,
}

// Mirrors the generator's type-only contract assembly for a globbed file.
const refinedFileCatalog = sealGeneratedRouteCatalog<{
	'/refined/:id': FileRouteContract<'/refined/:id', typeof refinedFile, Account>
}>(deriveRouteManifest({ './app/refined/[id].mobile.tsrx': refinedFile }, ['mobile']))

const refinedCatalog = mergeRouteManifests(
	refinedFileCatalog,
	navigationRoutes,
	failedRenderCatalog,
	searchCatalog,
	chromeCatalog,
)

const nativeTransitions = defineTransitions({
	'native-detail': defineNativeTransition({
		reducedMotion: 'allow',
		page: () => {
			nativeMotion.factories++
			return { instance: createFixtureTransition() }
		},
	}),
	'native-view': defineNativeTransition({
		reducedMotion: 'allow',
		view: {
			from({ direction, action }) {
				nativeMotion.directions.push(direction + ':' + action)
				return { opacity: 0, translateX: direction === 'back' ? -24 : 24 }
			},
			// Long enough that fixture polling always samples intermediate
			// values and dismissal lands mid-flight.
			duration: 1200,
			curve: 'easeOut',
		},
	}),
})

export function createRefinedNavigation(frame: Frame) {
	let historyAdmitted = true
	let historyRedirect: Account['historyRedirect'] = 'none'
	let accountId = 'account-a'
	const platform = createNativeModalRouterHost({
		getFrame: (flow) => (flow === 'root' ? frame : getStack(flow)),
		frameFlows: ['root', 'ios-first', 'ios-second'],
		onOwnerEvent: (event) => refinedObservations.ownerEvents.push(event),
	})

	const router = createRouter({
		catalog: refinedCatalog,
		transitions: nativeTransitions,
		allowedSchemes: ['xplatnav'],
		host: platform.host,
		stacks: ['detail-pane', 'first', 'second', 'ios-first', 'ios-second'],
		context: () => ({ account: { id: accountId }, historyAdmitted, historyRedirect }),
	})

	platform.attach(router)
	const panePlatform = createRenderRouterHost()
	let paneLoads = 0
	let paneAdmitted = true
	const paneCatalog = defineRoutes([
		defineRoute({
			path: '/pane/:id',
			beforeLoad() {
				if (!paneAdmitted) {
					throw new RouteForbidden()
				}
			},
			loader: ({ params }) => ({ title: params.id + ':' + ++paneLoads }),
		}).screen(PaneItem),
	])

	const panes = createRouter({
		catalog: paneCatalog,
		host: panePlatform.host,
		stacks: ['other'],
		transitions: nativeTransitions,
	})

	panePlatform.attach(panes)
	paneNavigation = panes
	navigation = router
	bindNavigationInstance(router)
	return {
		platform,
		setAccount: (id: string) => {
			accountId = id
		},
		setFrameAdmission: (value: boolean) => {
			historyAdmitted = value
		},
		setFrameRedirect: (value: Account['historyRedirect']) => {
			historyRedirect = value
		},
		navigation: router,
		detailPane: router.forStack('detail-pane'),
		panePlatform,
		setPaneAdmission(value: boolean) {
			paneAdmitted = value
		},
		panes,
	}
}

function RemountedOwnerEntry(props: { version: number }): any {
	const owner = useRouter(navigation)
	useLayoutEffect(() => {
		if (props.version > 0) {
			void owner
				.replace({
					to: '/refined/:id',
					params: { id: 'remounted-' + props.version },
					transition: 'none',
				})
				.then((result) => {
					refinedObservations.remountResult = result
				})
		}
	}, [])

	return null
}

export function RefinedNavigationShell(props: {
	fixture: ReturnType<typeof createRefinedNavigation>
}): any {
	const [owned, setOwned] = useState(true)
	const [ownerVersion, setOwnerVersion] = useState(0)
	const [name, setName] = useState('Avery')
	const [paneMode, setPaneMode] = useState(false)
	refinedObservations.showPanes = setPaneMode
	refinedObservations.changeProvider = setName
	refinedObservations.ownerPresent = owned
	refinedObservations.closeOwner = () => setOwned(false)
	refinedObservations.remountOwner = () => {
		refinedObservations.remountResult = null
		setOwnerVersion((value) => value + 1)
	}

	return (
		<NameProvider value={name}>
			{paneMode ? (
				<masonview style={{ flexGrow: 1 }}>
					<RenderRouteOutlet host={props.fixture.panePlatform}>
						<label text="pane-base" />
					</RenderRouteOutlet>
					<RenderRouteOutlet host={props.fixture.panePlatform} flow="other">
						<label text="other-pane-base" />
					</RenderRouteOutlet>
				</masonview>
			) : owned ? (
				<ClientRouteOutlet key={ownerVersion} host={props.fixture.platform}>
					<RemountedOwnerEntry version={ownerVersion} />
					<NavigationShell />
					<ClientRouteOutlet host={props.fixture.platform} flow="detail-pane">
						<label text="integrated-pane-base" />
					</ClientRouteOutlet>
				</ClientRouteOutlet>
			) : (
				<NavigationShell routed={false} />
			)}
		</NameProvider>
	)
}

export const defaultClientObservations = {
	ready: false,
	selectedTab: 'left',
	selectTab: (_key: string) => {},
	bases: new Map<string, { count: number; increment(): void }>(),
	entries: new Map<
		string,
		{
			title: string
			provider: string
			guarded: boolean
			count: number
			routeId: unknown
			modal: boolean
			back: boolean
			increment(): void
			navigator: ClientNavigator
		}
	>(),
}

function DefaultClientItem(props: {
	params: { id: string }
	data: { title: string }
	context: { guarded: boolean }
}): any {
	const provider = useContext(Name)
	const navigator = useClientRouter()
	const state = useClientRouterState()
	const match = state.route
	const routeId =
		match?.contract === 'declared' &&
		(match.to === '/client/:id' || match.to === '/client-modal/:id')
			? match.params.id
			: undefined

	const modal = state.modal
	const back = state.canGoBack
	const [count, setCount] = useState(0)
	defaultClientObservations.entries.set(props.params.id, {
		title: props.data.title,
		provider,
		guarded: props.context.guarded,
		count,
		routeId,
		modal,
		back,
		increment: () => setCount((value) => value + 1),
		navigator,
	})

	return (
		<RouteOutlet>
			<masonview id={'client-' + props.params.id}>
				<label text={'client:' + props.params.id} />
				<label text={props.data.title} />
				<label text={'client-count:' + count} />
			</masonview>
		</RouteOutlet>
	)
}

function DefaultClientBase(props: { name: string }): any {
	useClientRouter()
	const [count, setCount] = useState(0)
	defaultClientObservations.bases.set(props.name, {
		count,
		increment: () => setCount((value) => value + 1),
	})

	useLayoutEffect(() => {
		defaultClientObservations.ready = true
	}, [])

	return (
		<label
			id={'default-base-' + props.name}
			text={'default-client-base:' + props.name + ':' + count}
		/>
	)
}

function DefaultLeftBase() {
	return <DefaultClientBase name="left" />
}

function DefaultRightBase() {
	return <DefaultClientBase name="right" />
}

const defaultTabs = [
	{ key: 'left', title: 'Left', stack: 'left', render: DefaultLeftBase },
	{ key: 'right', title: 'Right', stack: 'right', render: DefaultRightBase },
]

export function DefaultClientShell(): any {
	const configured = useSyncExternalStore(
		defaultRouterRuntime.configured.subscribe,
		defaultRouterRuntime.configured.getSnapshot,
		defaultRouterRuntime.configured.getSnapshot,
	)

	const [selected, setSelected] = useState('left')
	defaultClientObservations.selectedTab = selected
	defaultClientObservations.selectTab = setSelected
	return (
		<NameProvider value="Default owner">
			{configured ? (
				<RouteOutlet>
					<Tabs tabs={defaultTabs} selectedKey={selected} onSelectionChange={setSelected} />
				</RouteOutlet>
			) : (
				<label text="default-client-base" />
			)}
		</NameProvider>
	)
}

const defaultClientRoute = defineClientRoute.withContext<{ account: string }>()
const defaultClientGuard = () => ({ guarded: true })
const defaultClientLoader = ({
	params,
	context,
}: {
	params: { id: string }
	context: { account: string; guarded: boolean }
}) => {
	if (!context.guarded) {
		throw new Error('Default loader did not receive guard context')
	}

	return { title: context.account + ':' + params.id }
}

export const defaultClientCatalog = defineClientRoutes([
	defaultClientRoute({
		path: '/client/:id',
		beforeLoad: defaultClientGuard,
		loader: defaultClientLoader,
	}).screen(DefaultClientItem),
	defaultClientRoute({
		path: '/client-modal/:id',
		presentation: 'modal',
		beforeLoad: defaultClientGuard,
		loader: defaultClientLoader,
	}).screen(DefaultClientItem),
])

export const defaultClientContext = { account: 'default-account' }
export function configureDefaultClient() {
	return import('../navigation-project/src/default-routes.gen').then(() => ({
		navigation: defaultRouter,
		platform: defaultRouterRuntime.getClient().platform,
		catalog: defaultClientCatalog,
	}))
}
