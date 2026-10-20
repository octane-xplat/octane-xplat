import { DropdownMenu } from './DropdownMenu.web.tsrx'
import { MenuData } from './MenuParts.web.tsrx'
import type { BreadcrumbProps, BreadcrumbItem, RegisteredRouteContracts, AppRouteStacks, RouteTransitionName } from './props'
import type { NavigationItemImplementation, NavigationItemsImplementation, MenuOptionImplementation } from './nav-link'
import { useNavigationItem } from './use-navigation-item.shared.tsrx'
import { applyEscapeProps } from './escape-props'

function BreadcrumbEntry(props: { item: NavigationItemImplementation<BreadcrumbItem>; current: boolean }) @{
	const link = useNavigationItem({ ...props.item, onClick: () => props.item.onSelect?.() })
	@if (link.href != null) {
		<a className="vx-breadcrumb-link" href={link.href} target={props.item.target} rel={props.item.rel} download={props.item.download} aria-current={link.selected ? 'page' : undefined}
			aria-disabled={link.disabled || undefined} tabIndex={link.disabled ? -1 : undefined}
			onClick={link.activateWeb}>{props.item.label}</a>
	} @else if (props.item.onSelect) {
		<button type="button" className="vx-breadcrumb-link" disabled={link.disabled} onClick={link.activateWeb}>{props.item.label}</button>
	} @else {
		<span className="vx-breadcrumb-text" aria-current={props.current ? 'page' : undefined}>{props.item.label}</span>
	}
}

/** Ancestor links share typed destinations with the owning route flow. */
export function Breadcrumb<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
>(props: BreadcrumbProps<Contracts, Stacks, Transitions>): any

export function Breadcrumb(props: NavigationItemsImplementation<BreadcrumbProps, BreadcrumbItem>) @{
	const sep = props.separator ?? '/'
	const limit = Math.max(2, props.maxVisibleItems ?? props.items.length)
	const overflow = props.items.length > limit ? props.items.slice(1, props.items.length - limit + 1) : []
	const visible = overflow.length ? [props.items[0], ...props.items.slice(props.items.length - limit + 1)] : props.items
	const overflowItems: readonly MenuOptionImplementation[] = overflow.map((item, index) => (
		item.to !== undefined || item.href !== undefined
			? { ...item, type: 'link', key: 'ancestor-' + index }
			: { type: 'action', key: 'ancestor-' + index, label: item.label, onSelect: item.onSelect, isDisabled: item.isDisabled || !item.onSelect }
	))

	<nav ref={(element: any) => applyEscapeProps(element, props)} id={props.id}
		className={['vx-breadcrumb', props.className]} style={props.style} aria-label={props.accessibilityLabel ?? 'Breadcrumb'}>
		@for (const item of visible; index index; key index) {
			<span className="vx-breadcrumb-item">
				{index === 1 && (overflow.length > 0 || props.overflowMenu) && <DropdownMenu trigger="…" accessibilityLabel={props.overflowLabel ?? 'More ancestors'}>
					<MenuData items={overflowItems} />{props.overflowMenu}
				</DropdownMenu>}
				{index > 0 ? <span className="vx-breadcrumb-sep" aria-hidden="true">{sep}</span> : null}
				<BreadcrumbEntry item={item} current={index === visible.length - 1} />
			</span>
		}
	</nav>
}
