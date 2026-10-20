import { NavLink } from '../src/NavLink'
import { Text } from '../src/Text'
import { NavigationMenu } from '../src/NavigationMenu'
import { RouterProvider } from '../src/router-hooks.tsrx'
import { SideNavItem } from '../src/SideNav'
import { TopNavItem, TopNavMegaMenuItem, TopNavMenu, TopNavMegaMenu } from '../src/TopNav'
import { Breadcrumb } from '../src/Breadcrumb'
import { DropdownMenu } from '../src/DropdownMenu'
import { ContextMenu } from '../src/ContextMenu'
import { NavHeadingMenuItem } from '../src/NavMenu'
import { Tab, TabList } from '../src/TabList'
import { MenuData } from '../src/MenuParts'
import { MenuSurface } from '../src/MenuSurface'
import type { RouterInstance, ValidatedDestination, NavigationActivationEvent } from '../src/props'

export const navigationChromeKinds = [
	'link',
	'strip',
	'side',
	'top',
	'mega',
	'breadcrumb',
	'dropdown',
	'context',
	'top-menu',
	'mega-menu',
	'overflow',
	'heading',
	'tab',
	'menu-surface',
] as const

export type NavigationChromeKind = (typeof navigationChromeKinds)[number]
export function NavigationChrome(props: {
	router: RouterInstance<any, string, string>
	destination: ValidatedDestination
	kind: NavigationChromeKind
	disabled?: boolean
	cancel?: boolean
	stack?: string
	inherit?: boolean
	implicit?: boolean
}) {
	const navigation = props.implicit ? undefined : props.router
	const select = (event: NavigationActivationEvent) => {
		if (props.cancel) {
			event.preventDefault()
		}
	}

	let content
	if (props.kind === 'link') {
		content = (
			<NavLink
				className="fixture-navlink"
				to={props.destination}
				disabled={props.disabled}
				onPress={select}
			>
				<Text>Open target</Text>
			</NavLink>
		)
	} else if (props.kind === 'strip') {
		content = (
			<NavigationMenu
				items={[
					{
						key: 'target',
						onSelect: select,
						label: 'Open target',
						router: navigation,
						to: props.destination,
						disabled: props.disabled,
					},
				]}
			/>
		)
	} else if (props.kind === 'side') {
		content = (
			<SideNavItem
				router={navigation}
				label="Open target"
				to={props.destination}
				isDisabled={props.disabled}
				onClick={(event) => {
					if (props.cancel) {
						event.preventDefault()
					}
				}}
			/>
		)
	} else if (props.kind === 'heading') {
		content = (
			<NavHeadingMenuItem
				router={navigation}
				label="Open target"
				to={props.destination}
				isDisabled={props.disabled}
			/>
		)
	} else if (props.kind === 'tab') {
		content = (
			<TabList value="initial" onChange={() => {}}>
				<Tab
					value="target"
					router={navigation}
					label="Open target"
					to={props.destination}
					isDisabled={props.disabled}
				/>
			</TabList>
		)
	} else if (props.kind === 'top') {
		content = (
			<TopNavItem
				router={navigation}
				label="Open target"
				to={props.destination}
				isDisabled={props.disabled}
				onClick={(event) => {
					if (props.cancel) {
						event.preventDefault()
					}
				}}
			/>
		)
	} else if (props.kind === 'mega') {
		content = (
			<TopNavMegaMenuItem
				router={navigation}
				title="Open target"
				to={props.destination}
				isDisabled={props.disabled}
				onClick={(event) => {
					if (props.cancel) {
						event.preventDefault()
					}
				}}
			/>
		)
	} else if (props.kind === 'breadcrumb' || props.kind === 'overflow') {
		content = (
			<Breadcrumb
				maxVisibleItems={props.kind === 'overflow' ? 2 : undefined}
				items={[
					{ label: 'Home' },
					{
						label: 'Open target',
						router: navigation,
						to: props.destination,
						isDisabled: props.disabled,
					},
					{ label: 'Current' },
				]}
			/>
		)
	} else if (props.kind === 'top-menu') {
		content = (
			<TopNavMenu
				label="Actions"
				items={[
					{
						title: 'Open target',
						router: navigation,
						to: props.destination,
						isDisabled: props.disabled,
					},
				]}
			/>
		)
	} else if (props.kind === 'mega-menu') {
		content = (
			<TopNavMegaMenu
				label="Actions"
				items={
					<TopNavMegaMenuItem
						title="Open target"
						router={navigation}
						to={props.destination}
						isDisabled={props.disabled}
					/>
				}
			/>
		)
	} else if (props.kind === 'context') {
		content = (
			<ContextMenu
				trigger="Actions"
				defaultOpen
				items={[
					{
						type: 'link',
						key: 'target',
						onSelect: select,
						label: 'Open target',
						router: navigation,
						to: props.destination,
						isDisabled: props.disabled,
					},
				]}
			>
				Target
			</ContextMenu>
		)
	} else if (props.kind === 'menu-surface') {
		content = (
			<MenuSurface closeMenu={() => {}}>
				<MenuData
					items={[
						{
							type: 'link',
							key: 'target',
							onSelect: select,
							label: 'Open target',
							router: navigation,
							to: props.destination,
							isDisabled: props.disabled,
						},
					]}
				/>
			</MenuSurface>
		)
	} else {
		content = (
			<DropdownMenu
				trigger="Actions"
				defaultOpen
				items={[
					{
						type: 'link',
						key: 'target',
						onSelect: select,
						label: 'Open target',
						router: navigation,
						to: props.destination,
						isDisabled: props.disabled,
					},
				]}
			/>
		)
	}

	return props.inherit ? (
		<>{content}</>
	) : (
		<RouterProvider router={props.router} stack={props.stack ?? 'library'}>
			{content}
		</RouterProvider>
	)
}
