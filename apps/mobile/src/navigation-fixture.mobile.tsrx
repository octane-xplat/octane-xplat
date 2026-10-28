/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Pressable, Screen, Tabs, Text, View } from '@octane-xplat/ui'
import { defineRoute } from '../../../packages/ui/src/define-route'
import { defineRoutes } from '../../../packages/ui/src/route-table'
import { DestinationRedirect } from '../../../packages/ui/src/routing-core'
import {
	useRouter,
	useRouterState,
	useNavigation,
} from '../../../packages/ui/src/router-hooks.tsrx'

import type {
	RouterInstance,
	RouterNavigator,
	ValidatedDestination,
} from '../../../packages/ui/src/props'

import { NavLink } from '../../../packages/ui/src/NavLink.tsrx'
import { NavigationTabs } from './navigation-tabs'
import type { TabSpec } from '@octane-xplat/ui'

let fixtureNavigation: RouterInstance<any>
export function bindNavigationInstance(instance: RouterInstance<any>) {
	fixtureNavigation = instance
}

let brokenGate: Promise<void> | undefined
let releaseBroken: (() => void) | undefined
export const loaderFailureControl = {
	hold() {
		brokenGate = new Promise<void>((resolve) => {
			releaseBroken = resolve
		})
	},
	release() {
		const release = releaseBroken
		brokenGate = undefined
		releaseBroken = undefined
		release?.()
	},
}

export const checkedLinkControl = { set: (_destination: ValidatedDestination | null) => {} }
export const screenNavigators = new Map<
	string,
	Pick<RouterNavigator<any>, 'back' | 'dismiss' | 'getSnapshot'>
>()

export function NavigationScreen(props: {
	params: { id?: string }
	data?: unknown
	context?: { guarded?: boolean }
}) @{
	const navigation = useRouter(fixtureNavigation)
	const state = useRouterState(fixtureNavigation)
	const feedback = useNavigation()
	screenNavigators.set(props.params.id ?? '', navigation)

	<View id="nav-screen">
		<Text>
			{'navigation:' +
				feedback.status +
				(feedback.status === 'failed' && feedback.result.status === 'failed'
					? ':' + feedback.result.phase
					: '')}
		</Text>
		<Text>{'route:' + (props.params.id ?? 'base')}</Text>
		<Text>{'data:' + String(props.data ?? '')}</Text>
		<Text>{'guard:' + String(props.context?.guarded === true)}</Text>
		@if (state.modal) {
			<Pressable id="nav-modal-close" onPress={() => navigation.dismiss()}>
				<Text>Close</Text>
			</Pressable>
		}
	</View>
}

export function NavigationLayout(props: { children?: any }) @{
	<View>
		<Text>navigation layout</Text>
		{props.children}
	</View>
}

const first = () => <Text>first base</Text>
const second = () => <Text>second base</Text>
const tabs: TabSpec[] = [
	{ key: 'first', title: 'First', stack: 'first', render: first },
	{ key: 'second', title: 'Second', stack: 'second', render: second },
]

export function NavigationShell(props: { routed?: boolean }) @{
	const [selected, setSelected] = useState('first')
	const [checkedLink, setCheckedLink] = useState<ValidatedDestination | null>(null)
	checkedLinkControl.set = setCheckedLink

	<Screen>
		@if (checkedLink) {
			<NavLink router={fixtureNavigation} to={checkedLink}>
				<Text>Open checked runtime</Text>
			</NavLink>
		}
		<Tabs
			id="nav-tabs"
			tabs={props.routed === false ? tabs.map((tab) => ({ ...tab, stack: undefined })) : tabs}
			selectedKey={selected}
			onSelectionChange={setSelected}
		/>
	</Screen>
}

export const runtimeRoutes = defineRoutes([
	defineRoute({
		path: '/runtime/:id',
		loader: ({ params }) => 'runtime-' + params.id,
	}).screen(NavigationScreen),
])

export const redirectedRoutes = defineRoutes([
	defineRoute({
		path: '/redirected',
		beforeLoad: () => {
			throw new DestinationRedirect({ to: '/nav/:id', stack: 'first', params: { id: 'redirect' } })
		},
	}).screen(NavigationScreen),
])

export const iosTabsRoutes = defineRoutes([
	defineRoute({ path: '/ios-tabs' }).screen(NavigationTabs),
])

export const navigationRoutes = defineRoutes({
	routes: [
		defineRoute({ path: '/nav/:id' }).screen(NavigationScreen),
		defineRoute({
			path: '/loaded/:id',
			beforeLoad: () => ({ guarded: true }),
			loader: ({ params }) => 'loaded-' + params.id,
		}).screen(NavigationScreen),
		defineRoute({
			path: '/broken/:id',
			loader: async () => {
				await brokenGate
				throw new Error('expected loader failure')
			},
		}).screen(NavigationScreen),
		defineRoute({
			path: '/blocked',
			beforeLoad: () => {
				throw new Error('expected guard rejection')
			},
		}).screen(NavigationScreen),
		defineRoute({ path: '/modal/:id', presentation: 'modal' }).screen(NavigationScreen),
	],
	layouts: { nav: NavigationLayout },
})
