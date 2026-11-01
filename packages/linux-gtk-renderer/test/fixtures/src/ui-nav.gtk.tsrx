/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import {
	Screen,
	Tabs,
	TabList,
	Tab,
	TabMenu,
	NavigationMenu,
	NavLink,
	NavIcon,
	RouteOutlet,
	Pressable,
	Text,
} from '@octane-xplat/ui'
import {
	configureRouter,
	router,
	RouterProvider,
	defineRoute,
	defineRoutes,
	useRouterState,
} from '@octane-xplat/ui/routing'

export const events: string[] = []
export const state: Record<string, any> = { route: null, tab: 'a', strip: 'a', paneACount: 0 }

function HomeRoute() {
	return <Text id="route-home">HOME ROUTE</Text>
}
function DocsRoute() {
	return <Text id="route-docs">DOCS ROUTE</Text>
}

const home = defineRoute({ path: '/', transition: 'none' }).screen(HomeRoute)
const docs = defineRoute({ path: '/docs', transition: 'none' }).screen(DocsRoute)

configureRouter({ catalog: defineRoutes([home, docs]) })

/** Navigate to '/' — invoked by the driver AFTER the outlet mounts so the
 *  commit lands on a live subscription (same path as click-driven nav). */
export const seedRoute = () => router.navigateUrl('/')

// Typed destinations for `to=` props — validateDestination produces the
// opaque instance-bound value the contract requires. It must run with the
// GLib main loop ticking, so the driver awaits initNav() before render.
let homeDest: any
let docsDest: any
export async function initNav() {
	const homeCheck = await router.validateDestination({ to: '/' })
	const docsCheck = await router.validateDestination({ to: '/docs' })
	if (homeCheck.status !== 'valid' || docsCheck.status !== 'valid') {
		throw new Error('fixture routes did not validate')
	}
	homeDest = homeCheck.destination
	docsDest = docsCheck.destination
}

/** Stateful pane — switch away and back; an unmounted pane would reset. */
function PaneA() {
	const [count, setCount] = useState(0)
	state.paneACount = count
	return (
		<masonview style={{ display: 'flex', flexDirection: 'column' }}>
			<Text>PANE A</Text>
			<Pressable
				id="paneA-inc"
				onPress={() => {
					setCount(count + 1)
					state.paneACount = count + 1
				}}
			>
				<Text>{'INC ' + count}</Text>
			</Pressable>
		</masonview>
	)
}

function RouteView() {
	const s = useRouterState()
	state.route = s.route?.href ?? null
	return <Text id="route-href">{s.route?.href ?? 'none'}</Text>
}

export function NavProbe() @{
	const [strip, setStrip] = useState('a')
	state.strip = strip
	const [tab, setTab] = useState('a')
	state.tab = tab
	<Screen id="screen">
		<masonview style={{ display: 'flex', flexDirection: 'column' }}>
			<RouterProvider router={router}>
				<RouteView />
				<NavigationMenu
					id="navmenu"
					items={[
						{ key: 'home', label: 'Home', to: homeDest, icon: 'xplat-check' },
						{ key: 'docs', label: 'Docs', to: docsDest },
						{ key: 'ext', label: 'External', href: 'https://example.com/x' },
					]}
				/>
				<NavLink id="nlto" to={docsDest} activeClassName="nl-active">
					<Text>NAVLINK DOCS</Text>
				</NavLink>
			</RouterProvider>
			<NavIcon id="navicon" icon="xplat-check" />
			<TabList
				id="tl"
				value={strip}
				layout="fill"
				onChange={(v: string) => {
					setStrip(v)
					events.push('strip:' + v)
				}}
				hasDivider
			>
				<Tab id="tab-a" value="a" label="Alpha" />
				<Tab id="tab-b" value="b" label="Beta" />
				<TabMenu
					id="tabmenu"
					label="More tabs"
					options={[
						{ value: 'c', label: 'Gamma' },
						{ value: 'd', label: 'Delta' },
					]}
				/>
			</TabList>
			<Tabs
				id="tabs"
				tabs={[
					{ key: 'a', title: 'First', render: () => <PaneA /> },
					{ key: 'b', title: 'Second', render: () => <Text>SECOND PANE</Text> },
				]}
				onSelectionChange={(k: string) => {
					events.push('tabsel:' + k)
					setTab(k)
				}}
			/>
			<RouteOutlet />
		</masonview>
	</Screen>
}
