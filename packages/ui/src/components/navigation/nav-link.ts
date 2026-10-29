import { parseRouteLocation } from '@octane-xplat/lib/route-pattern'
import type {
	NavLinkOptions,
	RouteDestinationInput,
	ValidatedDestination,
	RouterInstance,
	RouteContract,
	MenuActionData,
	MenuLinkData,
	MenuSectionData,
	MenuSeparatorData,
	MenuCheckboxData,
	MenuRadioGroupData,
	MenuSubMenuData,
} from '../../props'

export type NavLinkContracts = Record<
	string,
	RouteContract<
		Record<string, string | undefined>,
		Record<string, unknown>,
		Record<string, unknown>,
		unknown,
		object
	>
>

/** Internal implementation shape; the public component accepts NavLinkProps. */
export type NavLinkInput = Omit<RouteDestinationInput, 'to' | 'transition'> &
	NavLinkOptions & {
		to: string | ValidatedDestination
		transition?: string
		router?: RouterInstance<NavLinkContracts, string, string>
	}

/** Erased component implementation shape. Public props preserve each route's
 * correlated path and search fields through NavigationTargetProps. */
export type NavigationItemInput = Omit<NavLinkInput, 'to'> & {
	to?: NavLinkInput['to']
	href?: string
	isSelected?: boolean
	isDisabled?: boolean
	onClick?: NavLinkOptions['onPress']
}

export type NavigationItemImplementation<Props> = Omit<
	Props,
	keyof RouteDestinationInput | 'router'
> &
	NavigationItemInput

export type NavigationItemsImplementation<Props, Item> = Omit<Props, 'items'> & {
	items: readonly NavigationItemImplementation<Item>[]
}

/** Menu renderers carry navigation input, never caller-selected loader data. */
export type MenuOptionImplementation =
	| MenuActionData
	| NavigationItemImplementation<MenuLinkData>
	| (Omit<MenuSectionData, 'items'> & { items: readonly MenuOptionImplementation[] })
	| MenuSeparatorData
	| MenuCheckboxData
	| MenuRadioGroupData
	| (Omit<MenuSubMenuData, 'items'> & { items: readonly MenuOptionImplementation[] })

export type NavigationMenuImplementation<Props> = Omit<Props, 'items'> & {
	items?: readonly MenuOptionImplementation[]
}

export function navLinkDestination(
	props: NavLinkInput,
): RouteDestinationInput | ValidatedDestination {
	if (typeof props.to !== 'string') {
		return props.to
	}
	return {
		to: props.to,
		params: props.params,
		search: props.search,
		...(props.stack === undefined ? {} : { stack: props.stack }),
		hash: props.hash,
		presentation: props.presentation,
		transition: props.transition,
		replace: props.replace,
	}
}

export function navLinkIsActive(
	current: string | undefined,
	href: string,
	options: NavLinkOptions,
): boolean {
	if (!current) {
		return false
	}
	const route = parseRouteLocation(current)
	const link = parseRouteLocation(href)
	if (options.match !== 'prefix' && route.segments.length !== link.segments.length) {
		return false
	}
	if (!link.segments.every((part, index) => route.segments[index] === part)) {
		return false
	}
	if (options.matchHash && route.hash !== link.hash) {
		return false
	}
	const fields =
		options.matchSearch === true
			? new Set([...Object.keys(route.search), ...Object.keys(link.search)])
			: options.matchSearch || []
	for (const field of fields) {
		if (JSON.stringify(route.search[field]) !== JSON.stringify(link.search[field])) {
			return false
		}
	}
	return true
}

export function navLinkActivation() {
	return {
		defaultPrevented: false,
		preventDefault() {
			this.defaultPrevented = true
		},
	}
}
